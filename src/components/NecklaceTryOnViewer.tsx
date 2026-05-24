"use client";

import React, { useEffect, useRef, useState } from "react";
import { PoseLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/Addons.js";
import { Loader2, CameraOff } from "lucide-react";
import type { ArModelFitMetadata } from "@/lib/types";

type Props = {
  modelUrl: string;
  fitMetadata?: ArModelFitMetadata;
};

// MediaPipe Pose landmark indices
const LEFT_SHOULDER = 11;
const RIGHT_SHOULDER = 12;
const LEFT_EAR = 7;
const RIGHT_EAR = 8;

type CalibState = {
  offsetX: number;
  offsetY: number;
  offsetZ: number;
  neckRise: number; // 0–100: interpolation from shoulder midpoint (0) to ear midpoint (100)
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
  neckRise: 15,
  rotX: 0,
  rotY: 0,
  rotZ: 0,
  scaleMultiplier: 0.8,
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

export default function NecklaceTryOnViewer({ modelUrl, fitMetadata }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const debugCanvasRef = useRef<HTMLCanvasElement>(null);
  const rendererMountRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number>();
  const lastVideoTimeRef = useRef(-1);
  const calibRef = useRef<CalibState>(defaultCalib);

  const [isLoading, setIsLoading] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showCalib, setShowCalib] = useState(false);
  const [showMesh, setShowMesh] = useState(true);
  const showMeshRef = useRef(true);
  const [showOccluder, setShowOccluder] = useState(false);
  const showOccluderRef = useRef(false);
  const [calib, setCalib] = useState<CalibState>(defaultCalib);

  useEffect(() => {
    const key = `ar-neck-fit:${fileName(modelUrl)}`;
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
        `ar-neck-fit:${fileName(modelUrl)}`,
        JSON.stringify(next),
      );
      return next;
    });
  };

  useEffect(() => {
    let active = true;
    let landmarker: PoseLandmarker | null = null;
    let stream: MediaStream | null = null;
    let renderer: THREE.WebGLRenderer | null = null;
    let scene: THREE.Scene | null = null;
    let cam: THREE.PerspectiveCamera | null = null;
    let necklaceAnchor: THREE.Group | null = null;
    let neckOccluder: THREE.Mesh | null = null;
    let occluderMat: THREE.MeshBasicMaterial | null = null;
    let resizeObserver: ResizeObserver | null = null;

    const smooth = {
      pos: new THREE.Vector3(),
      scale: new THREE.Vector3(1, 1, 1),
      quat: new THREE.Quaternion(),
    };
    let hasPose = false;
    let baseScaleByShoulderSpan = 0.012;
    let smoothing = 0.28;
    let predictErrorCount = 0;
    const yAxis = new THREE.Vector3(0, 1, 0);
    const neckQ = new THREE.Quaternion();

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

    const v1 = new THREE.Vector3();
    const v2 = new THREE.Vector3();
    const v3 = new THREE.Vector3();
    const m = new THREE.Matrix4();
    const prevE = new THREE.Euler();
    const nextE = new THREE.Euler();

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

    const drawDebugDot = (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      label: string,
      color: string,
    ) => {
      if (!showMeshRef.current) return;
      ctx.fillStyle = color;
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#fff";
      ctx.font = "11px sans-serif";
      ctx.fillText(label, x + 8, y - 4);
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
        !necklaceAnchor
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
          const neckRiseFraction = c.neckRise / 100;

          const res = landmarker.detectForVideo(video, performance.now());
          const lm = res.landmarks?.[0];

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
            const ls = lm[LEFT_SHOULDER];
            const rs = lm[RIGHT_SHOULDER];
            const le = lm[LEFT_EAR];
            const re = lm[RIGHT_EAR];

            if (ls && rs && le && re) {
              const mountEl = rendererMountRef.current;
              const mw = mountEl ? mountEl.clientWidth : w;
              const mh = mountEl ? mountEl.clientHeight : h;
              const coverScale = Math.max(mw / w, mh / h);

              const toW = (p: { x: number; y: number; z: number }) =>
                new THREE.Vector3(
                  (p.x - 0.5) * w * coverScale,
                  (0.5 - p.y) * h * coverScale,
                  -p.z * w * coverScale * 0.3,
                );

              const lsW = toW(ls);
              const rsW = toW(rs);
              const leW = toW(le);
              const reW = toW(re);

              const shoulderMid = lsW.clone().add(rsW).multiplyScalar(0.5);
              const earMid = leW.clone().add(reW).multiplyScalar(0.5);
              const shoulderSpan = Math.max(40, lsW.distanceTo(rsW));

              // Body basis vectors derived from pose landmarks
              const upVec = v1.subVectors(earMid, shoulderMid).normalize();
              const shoulderAxis = v2.subVectors(rsW, lsW).normalize();
              let fwd = v3.crossVectors(shoulderAxis, upVec).normalize();
              fwd.negate();

              if (fwd.lengthSq() < 1e-6) {
                necklaceAnchor.visible = false;
                renderer.render(scene, cam);
                frameRef.current = requestAnimationFrame(predict);
                return;
              }

              // Necklace anchor: lerp from shoulder midpoint toward ear midpoint
              const neckPos = shoulderMid
                .clone()
                .lerp(earMid, neckRiseFraction);

              neckPos.addScaledVector(shoulderAxis, fx);
              neckPos.addScaledVector(upVec, fy);
              neckPos.addScaledVector(fwd, fz);
              neckPos.z = clamp(neckPos.z, -260, 190);

              // Orientation aligned to shoulder/body plane
              m.makeBasis(shoulderAxis, upVec, fwd);
              const targetQ = new THREE.Quaternion().setFromRotationMatrix(m);
              targetQ.multiply(
                new THREE.Quaternion().setFromEuler(
                  new THREE.Euler(frX, frY, frZ),
                ),
              );

              const targetScale =
                Math.max(0.15, shoulderSpan * baseScaleByShoulderSpan) * scaleM;

              if (!hasPose) {
                smooth.pos.copy(neckPos);
                smooth.scale.setScalar(targetScale);
                smooth.quat.copy(targetQ);
                hasPose = true;
              } else {
                smooth.pos.set(
                  clampDelta(neckPos.x, smooth.pos.x, 35),
                  clampDelta(neckPos.y, smooth.pos.y, 35),
                  clampDelta(neckPos.z, smooth.pos.z, 28),
                );
                smooth.pos.lerp(neckPos, smoothing);
                smooth.scale.lerp(
                  new THREE.Vector3(targetScale, targetScale, targetScale),
                  smoothing,
                );

                prevE.setFromQuaternion(smooth.quat);
                nextE.setFromQuaternion(targetQ);
                nextE.x = clampDelta(nextE.x, prevE.x, 0.18);
                nextE.y = clampDelta(nextE.y, prevE.y, 0.18);
                nextE.z = clampDelta(nextE.z, prevE.z, 0.18);
                smooth.quat.slerp(
                  new THREE.Quaternion().setFromEuler(nextE),
                  smoothing,
                );
              }

              necklaceAnchor.visible = true;
              necklaceAnchor.position.copy(smooth.pos);
              necklaceAnchor.scale.copy(smooth.scale);
              necklaceAnchor.quaternion.copy(smooth.quat);

              // Position neck occluder to block necklace geometry clipping through the body.
              if (occluderMat) occluderMat.colorWrite = showOccluderRef.current;
              if (neckOccluder) {
                const neckH = Math.max(10, shoulderMid.distanceTo(earMid) * 0.5);
                const neckR = Math.max(8, shoulderSpan * 0.13);
                neckOccluder.position.lerpVectors(shoulderMid, earMid, 0.25);
                neckOccluder.scale.set(neckR, neckH, neckR);
                neckQ.setFromUnitVectors(yAxis, upVec);
                neckOccluder.quaternion.copy(neckQ);
                neckOccluder.visible = true;
              }

              if (dbg) {
                for (const [lmk, label, color] of [
                  [ls, "LS", "#22d3ee"],
                  [rs, "RS", "#22d3ee"],
                  [le, "LE", "#a78bfa"],
                  [re, "RE", "#a78bfa"],
                ] as const) {
                  drawDebugDot(dbg, lmk.x * w, lmk.y * h, label, color);
                }
                const smPx = {
                  x: ((ls.x + rs.x) / 2) * w,
                  y: ((ls.y + rs.y) / 2) * h,
                };
                const emPx = {
                  x: ((le.x + re.x) / 2) * w,
                  y: ((le.y + re.y) / 2) * h,
                };
                drawDebugDot(
                  dbg,
                  smPx.x + (emPx.x - smPx.x) * neckRiseFraction,
                  smPx.y + (emPx.y - smPx.y) * neckRiseFraction,
                  "N",
                  "#fb923c",
                );
              }
            } else {
              necklaceAnchor.visible = false;
              if (neckOccluder) neckOccluder.visible = false;
            }
          } else {
            necklaceAnchor.visible = false;
            if (neckOccluder) neckOccluder.visible = false;
          }
          predictErrorCount = 0;
        } catch (error) {
          predictErrorCount += 1;
          if (predictErrorCount === 1 || predictErrorCount % 30 === 0) {
            console.warn("AR necklace frame error:", error);
          }
          if (predictErrorCount > 120) {
            setCameraError(
              "Theo dõi tư thế bị gián đoạn. Vui lòng tải lại trang.",
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
      mount.appendChild(renderer.domElement);

      scene.add(new THREE.AmbientLight(0xffffff, 2.5));
      const dir = new THREE.DirectionalLight(0xffffff, 1.8);
      dir.position.set(0, 0, 1);
      scene.add(dir);
      const dirLeft = new THREE.DirectionalLight(0xffffff, 1.0);
      dirLeft.position.set(-1, 0.5, 0.5);
      scene.add(dirLeft);
      const dirRight = new THREE.DirectionalLight(0xffffff, 1.0);
      dirRight.position.set(1, 0.5, 0.5);
      scene.add(dirRight);
      const dirTop = new THREE.DirectionalLight(0xfffaf0, 0.7);
      dirTop.position.set(0, 1, 0.5);
      scene.add(dirTop);

      necklaceAnchor = new THREE.Group();
      necklaceAnchor.visible = false;
      scene.add(necklaceAnchor);

      // Occluder meshes: invisible but write to depth buffer so the necklace
      // cannot bleed through the user's physical neck/head.
      occluderMat = new THREE.MeshBasicMaterial({
        colorWrite: false,
        color: 0xa78bfa,
        side: THREE.FrontSide,
      });

      neckOccluder = new THREE.Mesh(
        new THREE.CylinderGeometry(1, 1, 1, 12),
        occluderMat,
      );
      neckOccluder.renderOrder = 0;
      neckOccluder.visible = false;
      scene.add(neckOccluder);

      const gltf = await new GLTFLoader().loadAsync(modelUrl);
      const root = gltf.scene;
      const box = new THREE.Box3().setFromObject(root);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      root.position.sub(center);
      const maxS = Math.max(size.x, size.y, size.z);
      const norm = maxS > 0 ? 100 / maxS : 1;
      root.scale.setScalar(norm);
      necklaceAnchor.add(root);
      root.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) obj.renderOrder = 1;
      });

      const mb = new THREE.Box3().setFromObject(root);
      const ms = mb.getSize(new THREE.Vector3());
      // necklace width ≈ 55% of shoulder span
      if (ms.x > 0) baseScaleByShoulderSpan = 0.55 / ms.x;

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
      const origConsoleError = console.error;
      try {
        setIsLoading(true);
        setCameraError(null);
        await setupThree();

        console.error = (...args: unknown[]) => {
          if (typeof args[0] === "string" && args[0].startsWith("INFO:"))
            return;
          origConsoleError(...args);
        };

        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm",
        );
        landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numPoses: 1,
          minPoseDetectionConfidence: 0.5,
          minPosePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
        console.error = origConsoleError;

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
        console.error = origConsoleError;
        console.error(e);
        setIsLoading(false);
        setCameraError("Không thể khởi động camera AR vòng cổ.");
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
            setShowOccluder((v) => {
              const next = !v;
              showOccluderRef.current = next;
              return next;
            });
          }}
          className={`rounded px-3 py-1 text-xs text-white hover:bg-black/75 ${showOccluder ? "bg-violet-600/80" : "bg-black/60"}`}
        >
          {showOccluder ? "Ẩn Occluder" : "Occluder"}
        </button>
      </div>

      {showCalib && (
        <div className="absolute bottom-2 left-2 right-2 z-20 rounded-md bg-black/70 p-3 text-white backdrop-blur-sm">
          <div className="mb-2 text-xs font-semibold">AR Vòng cổ (local)</div>
          <div className="grid grid-cols-2 gap-2 text-[11px] md:grid-cols-4">
            {(
              [
                [
                  "offsetX",
                  "Offset X (trái/phải)",
                  -150,
                  150,
                  1,
                  calib.offsetX,
                ],
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
                ["neckRise", "Vị trí cổ (%)", 0, 100, 1, calib.neckRise],
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
                localStorage.removeItem(`ar-neck-fit:${fileName(modelUrl)}`);
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
          Đang khởi tạo AR vòng cổ...
        </div>
      )}
    </div>
  );
}
