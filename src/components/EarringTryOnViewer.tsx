"use client";

import React, { useEffect, useRef, useState } from "react";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/Addons.js";
import { Loader2, CameraOff } from "lucide-react";
import type { ArModelFitMetadata } from "@/lib/types";
import { drawFaceMeshOverlay } from "@/utils/faceMeshOverlay";

type Props = {
  modelUrl: string;
  fitMetadata?: ArModelFitMetadata;
};

/** MediaPipe Face Landmarker — vùng tai (tragion / mép tai) */
const LEFT_EAR_TRAGUS = 234;
const RIGHT_EAR_TRAGUS = 454;
const NOSE_BRIDGE = 168;
const FOREHEAD = 10;
const CHIN = 152;

type CalibState = {
  offsetX: number;
  offsetY: number;
  offsetZ: number;
  outward: number;
  rotX: number;
  rotY: number;
  rotZ: number;
  scaleMultiplier: number;
  smoothing: number;
};

const defaultCalib: CalibState = {
  offsetX: 0,
  offsetY: 0,
  offsetZ: 0,
  outward: 0,
  rotX: 0,
  rotY: 0,
  rotZ: 0,
  scaleMultiplier: 1,
  smoothing: 0.28,
};

const DEFAULT_FIT: Required<ArModelFitMetadata> = {
  offset: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  scaleMultiplier: 1,
};

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const clampDelta = (n: number, p: number, m: number) => {
  const d = clamp(n - p, -m, m);
  return p + d;
};

const fileName = (url: string) => {
  const s = url.split("?")[0].split("/");
  return (s[s.length - 1] || "").toLowerCase();
};

export default function EarringTryOnViewer({ modelUrl, fitMetadata }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const debugCanvasRef = useRef<HTMLCanvasElement>(null);
  const rendererMountRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number>();
  const lastVideoTimeRef = useRef(-1);
  const calibRef = useRef<CalibState>(defaultCalib);
  const showOccluderDebugRef = useRef(false);

  const [isLoading, setIsLoading] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showCalib, setShowCalib] = useState(false);
  const [showMesh, setShowMesh] = useState(false);
  const showMeshRef = useRef(false);
  const [showOccluderDebug, setShowOccluderDebug] = useState(false);
  const [calib, setCalib] = useState<CalibState>(defaultCalib);

  useEffect(() => {
    const key = `ar-ear-fit:${fileName(modelUrl)}`;
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const p = JSON.parse(raw) as Partial<CalibState>;
        const next = { ...defaultCalib, ...p };
        calibRef.current = next;
        setCalib(next);
      } else {
        calibRef.current = defaultCalib;
        setCalib(defaultCalib);
      }
    } catch {
      calibRef.current = defaultCalib;
      setCalib(defaultCalib);
    }
  }, [modelUrl]);

  const updateCalib = (patch: Partial<CalibState>) => {
    setCalib((prev) => {
      const next = { ...prev, ...patch };
      calibRef.current = next;
      localStorage.setItem(
        `ar-ear-fit:${fileName(modelUrl)}`,
        JSON.stringify(next),
      );
      return next;
    });
  };

  useEffect(() => {
    let active = true;
    let landmarker: FaceLandmarker | null = null;
    let stream: MediaStream | null = null;
    let renderer: THREE.WebGLRenderer | null = null;
    let scene: THREE.Scene | null = null;
    let cam: THREE.PerspectiveCamera | null = null;
    let leftAnchor: THREE.Group | null = null;
    let rightAnchor: THREE.Group | null = null;
    let headOccluder: THREE.Mesh | null = null;
    let resizeObserver: ResizeObserver | null = null;

    const smoothL = {
      pos: new THREE.Vector3(),
      scale: new THREE.Vector3(1, 1, 1),
      quat: new THREE.Quaternion(),
    };
    const smoothR = {
      pos: new THREE.Vector3(),
      scale: new THREE.Vector3(1, 1, 1),
      quat: new THREE.Quaternion(),
    };
    let hasPose = false;
    let baseScaleByEarSpan = 0.02;
    let smoothing = 0.28;
    let predictErrorCount = 0;

    const merged = {
      offset: { ...DEFAULT_FIT.offset, ...(fitMetadata?.offset ?? {}) },
      rotation: { ...DEFAULT_FIT.rotation, ...(fitMetadata?.rotation ?? {}) },
      scaleMultiplier:
        fitMetadata?.scaleMultiplier ?? DEFAULT_FIT.scaleMultiplier,
    };
    const ox = merged.offset.x ?? 0;
    const oy = merged.offset.y ?? 0;
    const oz = merged.offset.z ?? 0;
    const frx = merged.rotation.x ?? 0;
    const fry = merged.rotation.y ?? 0;
    const frz = merged.rotation.z ?? 0;

    const m = new THREE.Matrix4();
    const faceBasisMat = new THREE.Matrix4();
    const faceBaseQuaternion = new THREE.Quaternion();
    const q = new THREE.Quaternion();
    const prevE = new THREE.Euler();
    const nextE = new THREE.Euler();
    const v1 = new THREE.Vector3();
    const v2 = new THREE.Vector3();
    const v3 = new THREE.Vector3();

    const stop = () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      stream?.getTracks().forEach((t) => t.stop());
      landmarker?.close();
      resizeObserver?.disconnect();
      if (scene) {
        scene.traverse((o) => {
          const mesh = o as THREE.Mesh;
          mesh.geometry?.dispose();
          const mats = mesh.material
            ? Array.isArray(mesh.material)
              ? mesh.material
              : [mesh.material]
            : [];
          mats.forEach((mat) => mat.dispose?.());
        });
      }
      if (renderer) {
        renderer.dispose();
        const el = renderer.domElement;
        el.parentElement?.removeChild(el);
      }
    };

    const drawDebug = (
      ctx: CanvasRenderingContext2D,
      landmarks: { x: number; y: number; z: number }[],
      w: number,
      h: number,
      le?: { x: number; y: number },
      re?: { x: number; y: number },
    ) => {
      if (!showMeshRef.current) return;
      drawFaceMeshOverlay(ctx, landmarks, w, h, {
        mirrorX: false,
        sampleStep: 2,
        pointRadius: 1,
        color: "#3b82f6",
      });
      if (!le || !re) return;
      for (const [label, p, color] of [
        ["LT", le, "#f472b6"],
        ["RT", re, "#f472b6"],
      ] as const) {
        ctx.fillStyle = color;
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#fff";
        ctx.font = "11px sans-serif";
        ctx.fillText(label, p.x + 8, p.y - 4);
      }
    };

    const predict = () => {
      const video = videoRef.current;
      if (
        !video ||
        !landmarker ||
        !active ||
        !renderer ||
        !scene ||
        !cam ||
        !leftAnchor ||
        !rightAnchor
      )
        return;

      const w = video.videoWidth;
      const h = video.videoHeight;
      if (!w || !h) {
        frameRef.current = requestAnimationFrame(predict);
        return;
      }

      if (
        video.readyState >= 2 &&
        video.currentTime !== lastVideoTimeRef.current
      ) {
        try {
          lastVideoTimeRef.current = video.currentTime;
          const c = calibRef.current;
          smoothing = clamp(c.smoothing, 0.08, 0.75);
          const fx = ox + c.offsetX;
          const fy = oy + c.offsetY;
          const fz = oz + c.offsetZ;
          const frX = frx + c.rotX;
          const frY = fry + c.rotY;
          const frZ = frz + c.rotZ;
          const scaleM = merged.scaleMultiplier * c.scaleMultiplier;

          const res = landmarker.detectForVideo(video, performance.now());
          const lm = res.faceLandmarks?.[0];

          const dbg = debugCanvasRef.current?.getContext("2d");
          if (dbg) {
            if (
              debugCanvasRef.current!.width !== w ||
              debugCanvasRef.current!.height !== h
            ) {
              debugCanvasRef.current!.width = w;
              debugCanvasRef.current!.height = h;
            }
            dbg.clearRect(0, 0, w, h);
          }

          if (lm) {
            const le = lm[LEFT_EAR_TRAGUS];
            const re = lm[RIGHT_EAR_TRAGUS];
            const nose = lm[NOSE_BRIDGE];
            const fore = lm[FOREHEAD];
            const chin = lm[CHIN];
            const eyeOL = lm[33];
            const eyeOR = lm[263];
            if (le && re && nose && fore && chin && eyeOL && eyeOR) {
              // --- Object-cover scale correction ---
              // The video (w×h) is displayed with CSS object-cover in
              // the mount container (mw×mh).  The Three.js camera's
              // visible area at z=0 equals mw×mh, so we must map
              // normalised landmarks through the same cover-scale
              // that CSS applies to the <video> element.
              const mountEl = rendererMountRef.current;
              const mw = mountEl ? mountEl.clientWidth : w;
              const mh = mountEl ? mountEl.clientHeight : h;
              const coverScale = Math.max(mw / w, mh / h);

              const toW = (p: { x: number; y: number; z: number }) =>
                new THREE.Vector3(
                  (p.x - 0.5) * w * coverScale,
                  (0.5 - p.y) * h * coverScale,
                  -p.z * w * coverScale * 1.2,
                );

              const leW = toW(le);
              const reW = toW(re);
              const noseW = toW(nose);
              const foreW = toW(fore);
              const chinW = toW(chin);

              const earSpan = Math.max(40, leW.distanceTo(reW));
              const faceHeight = Math.max(60, foreW.distanceTo(chinW));
              const up = v1.subVectors(foreW, chinW).normalize();
              const eyeL = toW(eyeOL);
              const eyeR = toW(eyeOR);
              const eyeAxis = v2.subVectors(eyeR, eyeL).normalize();
              let fwd = v3.crossVectors(eyeAxis, up).normalize();
              fwd.negate();

              // Direction from nose outward toward each ear
              const outL = leW.clone().sub(noseW).normalize();
              const outR = reW.clone().sub(noseW).normalize();

              // --- Earlobe position estimation ---
              // Start from tragion (at the ear), push DOWN to earlobe level
              const lobL = leW.clone();
              const lobR = reW.clone();

              // Push down to earlobe level (~15 % of face height)
              lobL.addScaledVector(up, -0.15 * faceHeight);
              lobR.addScaledVector(up, -0.15 * faceHeight);

              // Apply calibration outward push (per ear, in its own outward direction)
              const outwardAmount = c.outward;
              lobL.addScaledVector(outL, outwardAmount);
              lobR.addScaledVector(outR, outwardAmount);

              // Apply global offsets (X pushes each ear outward symmetrically)
              // Positive X = earrings move apart; Negative X = move together
              lobL.addScaledVector(eyeAxis, -fx); // left ear = negative eye axis direction
              lobR.addScaledVector(eyeAxis, fx); // right ear = positive eye axis direction
              lobL.addScaledVector(up, fy);
              lobR.addScaledVector(up, fy);
              lobL.addScaledVector(fwd, fz);
              lobR.addScaledVector(fwd, fz);

              const fitQ = new THREE.Quaternion().setFromEuler(
                new THREE.Euler(frX, frY, frZ),
              );

              // Build head orientation from face basis so earrings rotate with the head
              faceBasisMat.makeBasis(eyeAxis, up, fwd.clone().negate());
              faceBaseQuaternion.setFromRotationMatrix(faceBasisMat);

              const targetScale =
                Math.max(0.15, earSpan * baseScaleByEarSpan) * scaleM;

              lobL.z = clamp(lobL.z, -260, 190);
              lobR.z = clamp(lobR.z, -260, 190);

              const qBasisL = faceBaseQuaternion.clone().multiply(fitQ);
              const qBasisR = faceBaseQuaternion.clone().multiply(fitQ);

              if (!hasPose) {
                smoothL.pos.copy(lobL);
                smoothR.pos.copy(lobR);
                smoothL.scale.setScalar(targetScale);
                smoothR.scale.setScalar(targetScale);
                smoothL.quat.copy(qBasisL);
                smoothR.quat.copy(qBasisR);
                hasPose = true;
              } else {
                smoothL.pos.set(
                  clampDelta(lobL.x, smoothL.pos.x, 35),
                  clampDelta(lobL.y, smoothL.pos.y, 35),
                  clampDelta(lobL.z, smoothL.pos.z, 28),
                );
                smoothL.pos.lerp(lobL, smoothing);
                smoothR.pos.set(
                  clampDelta(lobR.x, smoothR.pos.x, 35),
                  clampDelta(lobR.y, smoothR.pos.y, 35),
                  clampDelta(lobR.z, smoothR.pos.z, 28),
                );
                smoothR.pos.lerp(lobR, smoothing);
                smoothL.scale.lerp(
                  new THREE.Vector3(targetScale, targetScale, targetScale),
                  smoothing,
                );
                smoothR.scale.lerp(
                  new THREE.Vector3(targetScale, targetScale, targetScale),
                  smoothing,
                );

                prevE.setFromQuaternion(smoothL.quat);
                nextE.setFromQuaternion(qBasisL);
                nextE.x = clampDelta(nextE.x, prevE.x, 0.18);
                nextE.y = clampDelta(nextE.y, prevE.y, 0.18);
                nextE.z = clampDelta(nextE.z, prevE.z, 0.18);
                const qSmoothL = new THREE.Quaternion().setFromEuler(nextE);
                smoothL.quat.slerp(qSmoothL, smoothing);

                prevE.setFromQuaternion(smoothR.quat);
                nextE.setFromQuaternion(qBasisR);
                nextE.x = clampDelta(nextE.x, prevE.x, 0.18);
                nextE.y = clampDelta(nextE.y, prevE.y, 0.18);
                nextE.z = clampDelta(nextE.z, prevE.z, 0.18);
                const qSmoothR = new THREE.Quaternion().setFromEuler(nextE);
                smoothR.quat.slerp(qSmoothR, smoothing);
              }

              leftAnchor.visible = true;
              rightAnchor.visible = true;
              leftAnchor.position.copy(smoothL.pos);
              rightAnchor.position.copy(smoothR.pos);
              leftAnchor.scale.copy(smoothL.scale);
              rightAnchor.scale.copy(smoothR.scale);
              leftAnchor.quaternion.copy(smoothL.quat);
              rightAnchor.quaternion.copy(smoothR.quat);

              // Update depth-mask head sphere.
              // fwd points toward camera; push center back in world Z so the
              // front surface sits behind the nose, occluding the far earring.
              if (headOccluder) {
                headOccluder.position.copy(noseW);
                headOccluder.position.z -= faceHeight * 0.6;
                headOccluder.quaternion.copy(faceBaseQuaternion);
                headOccluder.scale.set(
                  earSpan * 0.55,
                  faceHeight * 0.5,
                  earSpan * 0.55,
                );
                headOccluder.visible = true;
                const mat = headOccluder.material as THREE.MeshBasicMaterial;
                const debugOn = showOccluderDebugRef.current;
                if (mat.colorWrite !== debugOn) {
                  mat.colorWrite = debugOn;
                  mat.wireframe = debugOn;
                  if (debugOn) mat.color.set(0x00ff00);
                  mat.needsUpdate = true;
                }
              }

              if (dbg) {
                // Debug dots in video-pixel space (matches debug canvas)
                const le2 = { x: le.x * w, y: le.y * h };
                const re2 = { x: re.x * w, y: re.y * h };
                drawDebug(dbg, lm, w, h, le2, re2);
              }
            } else {
              leftAnchor.visible = false;
              rightAnchor.visible = false;
              if (headOccluder) headOccluder.visible = false;
              if (dbg && lm) drawDebug(dbg, lm, w, h);
            }
          } else {
            leftAnchor.visible = false;
            rightAnchor.visible = false;
            if (headOccluder) headOccluder.visible = false;
          }
          predictErrorCount = 0;
        } catch (error) {
          predictErrorCount += 1;
          if (predictErrorCount === 1 || predictErrorCount % 30 === 0) {
            console.warn("AR frame prediction failed:", error);
          }
          if (predictErrorCount > 120) {
            setCameraError(
              "Theo doi khuon mat bi gian doan. Vui long tai lai trang.",
            );
            setIsLoading(false);
            stop();
            return;
          }
        }
      }

      renderer.render(scene, cam);
      frameRef.current = requestAnimationFrame(predict);
    };

    const setupThree = async () => {
      const mount = rendererMountRef.current;
      if (!mount) return;
      while (mount.firstChild) mount.removeChild(mount.firstChild);

      const mw = mount.clientWidth || 640;
      const mh = mount.clientHeight || 480;
      const fov = 47;
      const cz = (mh * 0.5) / Math.tan(THREE.MathUtils.degToRad(fov / 2));

      scene = new THREE.Scene();
      cam = new THREE.PerspectiveCamera(fov, mw / mh, 1, 5000);
      cam.position.set(0, 0, cz);
      cam.lookAt(0, 0, 0);

      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(mw, mh);
      renderer.setClearColor(0x000000, 0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 2;
      mount.appendChild(renderer.domElement);

      scene.add(new THREE.AmbientLight(0xffffff, 5));

      const hemi = new THREE.HemisphereLight(0xffffff, 0x888899, 3);
      hemi.position.set(0, 1, 0);
      scene.add(hemi);

      const dir = new THREE.DirectionalLight(0xffffff, 5);
      dir.position.set(0, 0, 1);
      scene.add(dir);

      const dirLeft = new THREE.DirectionalLight(0xffffff, 3);
      dirLeft.position.set(-1, 0.5, 0.5);
      scene.add(dirLeft);

      const dirRight = new THREE.DirectionalLight(0xffffff, 3);
      dirRight.position.set(1, 0.5, 0.5);
      scene.add(dirRight);

      const dirTop = new THREE.DirectionalLight(0xffffff, 3);
      dirTop.position.set(0, 1, 0.5);
      scene.add(dirTop);

      const dirBottom = new THREE.DirectionalLight(0xffffff, 2);
      dirBottom.position.set(0, -1, 0.5);
      scene.add(dirBottom);

      const dirBack = new THREE.DirectionalLight(0xffffff, 2);
      dirBack.position.set(0, 0, -1);
      scene.add(dirBack);

      leftAnchor = new THREE.Group();
      rightAnchor = new THREE.Group();
      scene.add(leftAnchor, rightAnchor);

      // Invisible depth-mask sphere — renders before earrings to occlude
      // the far-ear earring when the user turns their head.
      const headOccluderGeo = new THREE.SphereGeometry(1, 24, 16);
      const headOccluderMat = new THREE.MeshBasicMaterial({
        colorWrite: false,
        depthWrite: true,
        side: THREE.FrontSide,
      });
      headOccluder = new THREE.Mesh(headOccluderGeo, headOccluderMat);
      headOccluder.renderOrder = -1;
      headOccluder.visible = false;
      scene.add(headOccluder);

      const gltf = await new GLTFLoader().loadAsync(modelUrl);
      const root = gltf.scene;
      const box = new THREE.Box3().setFromObject(root);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      root.position.sub(center);
      const maxS = Math.max(size.x, size.y, size.z);
      const norm = maxS > 0 ? 100 / maxS : 1;
      root.scale.setScalar(norm);

      const leftRoot = root.clone();
      const rightRoot = root.clone();
      rightRoot.scale.x *= -1;

      leftAnchor.add(leftRoot);
      rightAnchor.add(rightRoot);
      // Earring meshes must render after the depth occluder.
      leftRoot.traverse((obj) => {
        obj.renderOrder = 1;
      });
      rightRoot.traverse((obj) => {
        obj.renderOrder = 1;
      });

      const mb = new THREE.Box3().setFromObject(leftRoot);
      const ms = mb.getSize(new THREE.Vector3());
      if (ms.x > 0) baseScaleByEarSpan = 0.25 / ms.x;

      resizeObserver = new ResizeObserver(() => {
        if (!renderer || !cam || !rendererMountRef.current) return;
        const rw = rendererMountRef.current.clientWidth || 640;
        const rh = rendererMountRef.current.clientHeight || 480;
        renderer.setSize(rw, rh);
        cam.aspect = rw / rh;
        cam.updateProjectionMatrix();
      });
      resizeObserver.observe(mount);
    };

    const run = async () => {
      try {
        setIsLoading(true);
        setCameraError(null);
        await setupThree();
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm",
        );
        landmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numFaces: 1,
          outputFaceBlendshapes: false,
        });
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });
        if (!videoRef.current || !active) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        if (active) {
          setIsLoading(false);
          frameRef.current = requestAnimationFrame(predict);
        }
      } catch (e) {
        console.error(e);
        setIsLoading(false);
        setCameraError("Không thể khởi động camera AR tai.");
        stop();
      }
    };

    run();
    return () => {
      active = false;
      stop();
    };
  }, [modelUrl, fitMetadata]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full -scale-x-100 object-cover"
        playsInline
        muted
      />
      <div
        ref={rendererMountRef}
        className="absolute inset-0 h-full w-full -scale-x-100 object-cover"
      />
      <canvas
        ref={debugCanvasRef}
        className="pointer-events-none absolute inset-0 z-10 h-full w-full -scale-x-100 object-cover"
      />

      {/* Controls 
      <div className="absolute right-2 top-2 z-20 flex gap-2">
        <button
          type="button"
          onClick={() => setShowCalib((v) => !v)}
          className="rounded bg-black/60 px-3 py-1 text-xs text-white hover:bg-black/75"
        >
          {showCalib ? "Ẩn Fit" : "Fit AR"}
        </button>
        <button
          type="button"
          onClick={() => {
            setShowMesh((v) => {
              const next = !v;
              showMeshRef.current = next;
              return next;
            });
          }}
          className="rounded bg-black/60 px-3 py-1 text-xs text-white hover:bg-black/75"
        >
          {showMesh ? "Ẩn Mesh" : "Hiện Mesh"}
        </button>
        <button
          type="button"
          onClick={() => {
            setShowOccluderDebug((prev) => {
              const next = !prev;
              showOccluderDebugRef.current = next;
              return next;
            });
          }}
          className={`rounded px-3 py-1 text-xs text-white hover:bg-black/75 ${showOccluderDebug ? "bg-green-700/80" : "bg-black/60"}`}
        >
          {showOccluderDebug ? "Ẩn Occluder" : "Occluder"}
        </button>
      </div>
      */}

      {showCalib && (
        <div className="absolute bottom-2 left-2 right-2 z-20 rounded-md bg-black/70 p-3 text-white backdrop-blur-sm">
          <div className="mb-2 text-xs font-semibold">
            AR Khuyên tai (local)
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] md:grid-cols-4">
            {(
              [
                ["offsetX", "Offset X (ra/vào)", -150, 150, 1, calib.offsetX],
                [
                  "offsetY",
                  "Offset Y (lên/xuống)",
                  -150,
                  150,
                  1,
                  calib.offsetY,
                ],
                [
                  "offsetZ",
                  "Offset Z (trước/sau)",
                  -200,
                  200,
                  1,
                  calib.offsetZ,
                ],
                ["outward", "Đẩy ra ngoài", -50, 150, 1, calib.outward],
                [
                  "scaleMultiplier",
                  "Scale",
                  0.2,
                  3.0,
                  0.01,
                  calib.scaleMultiplier,
                ],
                ["rotX", "Rot X", -1.5, 3, 0.01, calib.rotX],
                ["rotY", "Rot Y", -1.5, 1.5, 0.01, calib.rotY],
                ["rotZ", "Rot Z", -1.5, 1.5, 0.01, calib.rotZ],
                ["smoothing", "Smooth", 0.08, 0.75, 0.01, calib.smoothing],
              ] as const
            ).map(([key, label, min, max, step, val]) => (
              <label key={key} className="flex flex-col gap-1">
                <span className="text-[10px] text-white/90">
                  {label}: {val.toFixed(2)}
                </span>
                <input
                  type="range"
                  min={min}
                  max={max}
                  step={step}
                  value={val}
                  onChange={(e) =>
                    updateCalib({
                      [key]: Number(e.target.value),
                    } as Partial<CalibState>)
                  }
                />
              </label>
            ))}
          </div>
          <div className="mt-2 flex justify-end">
            <button
              type="button"
              className="rounded bg-white/10 px-2 py-1 text-[11px] hover:bg-white/20"
              onClick={() => {
                calibRef.current = defaultCalib;
                setCalib(defaultCalib);
                localStorage.removeItem(`ar-ear-fit:${fileName(modelUrl)}`);
              }}
            >
              Reset
            </button>
          </div>
        </div>
      )}

      {cameraError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/90 p-4 text-center text-white">
          <CameraOff className="h-8 w-8 text-red-400" />
          <p className="text-sm">{cameraError}</p>
        </div>
      )}

      {isLoading && !cameraError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-white">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Đang khởi tạo AR khuyên tai...
        </div>
      )}
    </div>
  );
}
