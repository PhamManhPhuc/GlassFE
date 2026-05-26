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
type ArCalibrationState = {
  offsetX: number;
  offsetY: number;
  offsetZ: number;
  rotX: number;
  rotY: number;
  rotZ: number;
  scaleMultiplier: number;
  smoothing: number;
};
type DebugInfoState = {
  eyeDistance: number;
  modelPosition: { x: number; y: number; z: number };
  modelRotation: { x: number; y: number; z: number };
  modelScale: number;
  appliedOffset: { x: number; y: number; z: number };
  trackingPoints: {
    leftEye: { x: number; y: number };
    rightEye: { x: number; y: number };
    nose: { x: number; y: number };
    forehead: { x: number; y: number };
    chin: { x: number; y: number };
  };
};

const LEFT_EYE_OUTER = 33;
const RIGHT_EYE_OUTER = 263;
const NOSE_BRIDGE = 168;
const FOREHEAD = 10;
const CHIN = 152;

const DEFAULT_FIT: Required<ArModelFitMetadata> = {
  offset: { x: 0, y: 0, z: 0 },
  rotation: { x: 0.08, y: 0, z: 0 },
  scaleMultiplier: 1,
};

const MODEL_FIT_PRESETS: Record<string, ArModelFitMetadata> = {
  "aviator.glb": {
    offset: { y: 2, z: 4 },
    rotation: { x: 0.1 },
    scaleMultiplier: 1.04,
  },
  "round.glb": {
    offset: { y: 1 },
    rotation: { x: 0.07 },
    scaleMultiplier: 0.98,
  },
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const clampAbsDelta = (next: number, prev: number, maxDelta: number) => {
  const delta = clamp(next - prev, -maxDelta, maxDelta);
  return prev + delta;
};

const getFileName = (url: string) => {
  const sanitized = url.split("?")[0];
  const parts = sanitized.split("/");
  return (parts[parts.length - 1] || "").toLowerCase();
};

const defaultCalibrationState: ArCalibrationState = {
  offsetX: 0,
  offsetY: -6.5,
  offsetZ: -100,
  rotX: 2.8,
  rotY: 0,
  rotZ: 0,
  scaleMultiplier: 1.23,
  smoothing: 0.28,
};

export default function ArTryOnViewer({ modelUrl, fitMetadata }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const debugCanvasRef = useRef<HTMLCanvasElement>(null);
  const rendererMountRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number>();
  const lastVideoTimeRef = useRef(-1);
  const calibrationRef = useRef<ArCalibrationState>(defaultCalibrationState);
  const debugFrameCounterRef = useRef(0);
  const showTrackingDebugRef = useRef(false);
  const showOccluderDebugRef = useRef(false);

  const [isLoading, setIsLoading] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showCalibrationPanel, setShowCalibrationPanel] = useState(false);
  const [showTrackingDebug, setShowTrackingDebug] = useState(false);
  const [showOccluderDebug, setShowOccluderDebug] = useState(false);
  const [calibration, setCalibration] = useState<ArCalibrationState>(
    defaultCalibrationState,
  );
  const [debugInfo, setDebugInfo] = useState<DebugInfoState | null>(null);

  useEffect(() => {
    const key = `ar-fit:${getFileName(modelUrl)}`;
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<ArCalibrationState>;
        const hydrated: ArCalibrationState = {
          ...defaultCalibrationState,
          ...parsed,
        };
        calibrationRef.current = hydrated;
        setCalibration(hydrated);
      } else {
        calibrationRef.current = defaultCalibrationState;
        setCalibration(defaultCalibrationState);
      }
    } catch {
      calibrationRef.current = defaultCalibrationState;
      setCalibration(defaultCalibrationState);
    }
  }, [modelUrl]);

  const updateCalibration = (patch: Partial<ArCalibrationState>) => {
    setCalibration((prev) => {
      const next = { ...prev, ...patch };
      calibrationRef.current = next;
      const key = `ar-fit:${getFileName(modelUrl)}`;
      localStorage.setItem(key, JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => {
    let isActive = true;
    let landmarker: FaceLandmarker | null = null;
    let localStream: MediaStream | null = null;
    let renderer: THREE.WebGLRenderer | null = null;
    let scene: THREE.Scene | null = null;
    let camera: THREE.PerspectiveCamera | null = null;
    let glassesAnchor: THREE.Group | null = null;
    let loadedModel: THREE.Object3D | null = null;
    let headOccluder: THREE.Mesh | null = null;
    let resizeObserver: ResizeObserver | null = null;
    const smoothPosition = new THREE.Vector3();
    const smoothScale = new THREE.Vector3(1, 1, 1);
    const smoothQuaternion = new THREE.Quaternion();
    let smoothing = calibrationRef.current.smoothing;
    let hasPose = false;
    let baseScaleByEyeDistance = 1 / 170;
    let viewPlaneZ = 0;
    let cameraZ = 900;
    const targetPosition = new THREE.Vector3();
    const targetRotationMatrix = new THREE.Matrix4();
    const targetQuaternion = new THREE.Quaternion();
    const faceBaseQuaternion = new THREE.Quaternion();
    const eyeAxis = new THREE.Vector3();
    const upAxis = new THREE.Vector3();
    const forwardAxis = new THREE.Vector3();
    const orthogonalUpAxis = new THREE.Vector3();
    const previousEuler = new THREE.Euler();
    const nextEuler = new THREE.Euler();
    const mergedFit = {
      offset: {
        ...DEFAULT_FIT.offset,
        ...(MODEL_FIT_PRESETS[getFileName(modelUrl)]?.offset ?? {}),
        ...(fitMetadata?.offset ?? {}),
      },
      rotation: {
        ...DEFAULT_FIT.rotation,
        ...(MODEL_FIT_PRESETS[getFileName(modelUrl)]?.rotation ?? {}),
        ...(fitMetadata?.rotation ?? {}),
      },
      scaleMultiplier:
        fitMetadata?.scaleMultiplier ??
        MODEL_FIT_PRESETS[getFileName(modelUrl)]?.scaleMultiplier ??
        DEFAULT_FIT.scaleMultiplier,
    };
    const baseFitOffsetX = mergedFit.offset.x ?? 0;
    const baseFitOffsetY = mergedFit.offset.y ?? 0;
    const baseFitOffsetZ = mergedFit.offset.z ?? 0;
    const baseFitRotX = mergedFit.rotation.x ?? 0;
    const baseFitRotY = mergedFit.rotation.y ?? 0;
    const baseFitRotZ = mergedFit.rotation.z ?? 0;

    const stopEverything = () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
        localStream = null;
      }
      if (landmarker) {
        landmarker.close();
        landmarker = null;
      }
      if (resizeObserver) {
        resizeObserver.disconnect();
        resizeObserver = null;
      }
      if (scene) {
        scene.traverse((obj) => {
          const mesh = obj as THREE.Mesh;
          if (mesh.geometry) {
            mesh.geometry.dispose();
          }
          if (mesh.material) {
            const materials = Array.isArray(mesh.material)
              ? mesh.material
              : [mesh.material];
            materials.forEach((material) => material.dispose());
          }
        });
      }
      if (renderer) {
        renderer.dispose();
        const canvas = renderer.domElement;
        if (canvas.parentElement) {
          canvas.parentElement.removeChild(canvas);
        }
        renderer = null;
      }
      const debugCanvas = debugCanvasRef.current;
      if (debugCanvas) {
        const debugCtx = debugCanvas.getContext("2d");
        if (debugCtx) {
          debugCtx.clearRect(0, 0, debugCanvas.width, debugCanvas.height);
        }
      }
    };

    const drawDebugOverlay = (
      landmarks: { x: number; y: number; z: number }[] | null,
      width: number,
      height: number,
      keyPoints?: {
        leftEye: { x: number; y: number };
        rightEye: { x: number; y: number };
        nose: { x: number; y: number };
        forehead: { x: number; y: number };
        chin: { x: number; y: number };
      },
    ) => {
      const debugCanvas = debugCanvasRef.current;
      if (!debugCanvas) return;
      const debugCtx = debugCanvas.getContext("2d");
      if (!debugCtx) return;
      if (debugCanvas.width !== width || debugCanvas.height !== height) {
        debugCanvas.width = width;
        debugCanvas.height = height;
      }
      debugCtx.clearRect(0, 0, width, height);
      if (!showTrackingDebugRef.current) return;
      if (!landmarks || landmarks.length === 0) return;

      drawFaceMeshOverlay(debugCtx, landmarks, width, height, {
        mirrorX: false,
        sampleStep: 1,
        pointRadius: 1,
        color: "#3b82f6",
      });

      if (!keyPoints) return;
      const items = [
        { label: "L", p: keyPoints.leftEye, color: "#f43f5e" },
        { label: "R", p: keyPoints.rightEye, color: "#f43f5e" },
        { label: "N", p: keyPoints.nose, color: "#3b82f6" },
        { label: "F", p: keyPoints.forehead, color: "#eab308" },
        { label: "C", p: keyPoints.chin, color: "#eab308" },
      ];
      for (const item of items) {
        debugCtx.fillStyle = item.color;
        debugCtx.strokeStyle = "rgba(0,0,0,0.9)";
        debugCtx.lineWidth = 2;
        debugCtx.beginPath();
        debugCtx.arc(item.p.x, item.p.y, 5, 0, Math.PI * 2);
        debugCtx.fill();
        debugCtx.stroke();
        debugCtx.fillStyle = "#ffffff";
        debugCtx.font = "11px sans-serif";
        debugCtx.fillText(item.label, item.p.x + 7, item.p.y - 6);
      }

      debugCtx.strokeStyle = "rgba(255,255,255,0.8)";
      debugCtx.lineWidth = 1.5;
      debugCtx.beginPath();
      debugCtx.moveTo(keyPoints.leftEye.x, keyPoints.leftEye.y);
      debugCtx.lineTo(keyPoints.rightEye.x, keyPoints.rightEye.y);
      debugCtx.stroke();
      debugCtx.beginPath();
      debugCtx.moveTo(keyPoints.forehead.x, keyPoints.forehead.y);
      debugCtx.lineTo(keyPoints.chin.x, keyPoints.chin.y);
      debugCtx.stroke();
    };

    const predict = () => {
      const video = videoRef.current;
      if (
        !video ||
        !landmarker ||
        !isActive ||
        !renderer ||
        !scene ||
        !camera ||
        !glassesAnchor
      ) {
        return;
      }

      const width = video.videoWidth;
      const height = video.videoHeight;
      if (!width || !height) {
        frameRef.current = requestAnimationFrame(predict);
        return;
      }

      if (
        video.readyState >= 2 &&
        video.currentTime !== lastVideoTimeRef.current
      ) {
        const runtimeCalib = calibrationRef.current;
        smoothing = clamp(runtimeCalib.smoothing, 0.08, 0.75);
        const fitOffsetX = baseFitOffsetX + runtimeCalib.offsetX;
        const fitOffsetY = baseFitOffsetY + runtimeCalib.offsetY;
        const fitOffsetZ = baseFitOffsetZ + runtimeCalib.offsetZ;
        const fitRotX = baseFitRotX + runtimeCalib.rotX;
        const fitRotY = baseFitRotY + runtimeCalib.rotY;
        const fitRotZ = baseFitRotZ + runtimeCalib.rotZ;
        const fitScaleMultiplier =
          mergedFit.scaleMultiplier * runtimeCalib.scaleMultiplier;

        lastVideoTimeRef.current = video.currentTime;
        const results = landmarker.detectForVideo(video, performance.now());
        const landmarks = results.faceLandmarks?.[0];
        drawDebugOverlay(landmarks ?? null, width, height);

        if (landmarks) {
          const leftEye = landmarks[LEFT_EYE_OUTER];
          const rightEye = landmarks[RIGHT_EYE_OUTER];
          const nose = landmarks[NOSE_BRIDGE];
          const forehead = landmarks[FOREHEAD];
          const chin = landmarks[CHIN];

          if (leftEye && rightEye && nose && forehead && chin) {
            // Object-cover scale: map video-normalised landmarks
            // into the Three.js camera's coordinate system that
            // matches the mount element dimensions.
            const mountEl = rendererMountRef.current;
            const mw = mountEl ? mountEl.clientWidth : width;
            const mh = mountEl ? mountEl.clientHeight : height;
            const coverScale = Math.max(mw / width, mh / height);

            const toWorld = (p: { x: number; y: number; z: number }) => {
              const x = (p.x - 0.5) * width * coverScale;
              const y = (0.5 - p.y) * height * coverScale;
              const z = -p.z * width * coverScale * 1.2;
              return new THREE.Vector3(x, y, z);
            };

            const leftEyeWorld = toWorld(leftEye);
            const rightEyeWorld = toWorld(rightEye);
            const noseWorld = toWorld(nose);
            const foreheadWorld = toWorld(forehead);
            const chinWorld = toWorld(chin);

            const eyeDistance = leftEyeWorld.distanceTo(rightEyeWorld);

            // Build stable face basis from 3D mesh points.
            eyeAxis.subVectors(rightEyeWorld, leftEyeWorld).normalize();
            upAxis.subVectors(foreheadWorld, chinWorld).normalize();
            forwardAxis.crossVectors(eyeAxis, upAxis).normalize();
            // Ensure forward axis points from face to camera consistently.
            forwardAxis.negate();
            if (forwardAxis.lengthSq() < 1e-6) {
              glassesAnchor.visible = false;
              renderer.render(scene, camera);
              frameRef.current = requestAnimationFrame(predict);
              return;
            }
            orthogonalUpAxis.crossVectors(forwardAxis, eyeAxis).normalize();

            // Compose orientation matrix and convert to quaternion.
            targetRotationMatrix.makeBasis(
              eyeAxis,
              orthogonalUpAxis,
              forwardAxis,
            );
            targetQuaternion.setFromRotationMatrix(targetRotationMatrix);
            targetQuaternion.multiply(
              new THREE.Quaternion().setFromEuler(
                new THREE.Euler(fitRotX, fitRotY, fitRotZ),
              ),
            );

            // Anchor around nose bridge with forehead/chin compensation.
            const foreheadToChin = chinWorld.clone().sub(foreheadWorld);
            targetPosition.copy(noseWorld);
            targetPosition.addScaledVector(foreheadToChin, -0.08);
            targetPosition.add(
              new THREE.Vector3(fitOffsetX, fitOffsetY, fitOffsetZ),
            );
            targetPosition.z = clamp(targetPosition.z, -460, 190);

            const targetScale =
              Math.max(0.35, eyeDistance * baseScaleByEyeDistance) *
              fitScaleMultiplier;

            if (!hasPose) {
              smoothPosition.copy(targetPosition);
              smoothScale.set(targetScale, targetScale, targetScale);
              smoothQuaternion.copy(targetQuaternion);
              hasPose = true;
            } else {
              smoothPosition.set(
                clampAbsDelta(targetPosition.x, smoothPosition.x, 30),
                clampAbsDelta(targetPosition.y, smoothPosition.y, 30),
                clampAbsDelta(targetPosition.z, smoothPosition.z, 24),
              );
              smoothPosition.lerp(targetPosition, smoothing);
              smoothScale.lerp(
                new THREE.Vector3(targetScale, targetScale, targetScale),
                smoothing,
              );
              // Clamp angular jumps before smoothing to avoid spinning artifacts.
              previousEuler.setFromQuaternion(smoothQuaternion, "XYZ");
              nextEuler.setFromQuaternion(targetQuaternion, "XYZ");
              // nextEuler.x = clampAbsDelta(nextEuler.x, previousEuler.x, 0.2);
              // nextEuler.y = clampAbsDelta(nextEuler.y, previousEuler.y, 0.2);
              // nextEuler.z = clampAbsDelta(nextEuler.z, previousEuler.z, 0.2);
              targetQuaternion.setFromEuler(nextEuler);
              smoothQuaternion.slerp(targetQuaternion, smoothing);
            }

            glassesAnchor.visible = true;
            glassesAnchor.position.copy(smoothPosition);
            glassesAnchor.scale.copy(smoothScale);
            glassesAnchor.quaternion.copy(smoothQuaternion);

            // Update depth-mask head sphere each frame.
            // Position it slightly behind the nose so the sphere covers
            // the ears and the back of the head, occluding temple arms
            // that wrap around when the user turns their face.
            if (headOccluder) {
              const faceHeight = foreheadWorld.distanceTo(chinWorld);
              faceBaseQuaternion.setFromRotationMatrix(targetRotationMatrix);
              // Position center behind the nose in world Z (camera depth axis).
              // Using direct Z offset is more reliable than face-normal offset
              // because the head always occludes in the camera depth direction.
              headOccluder.position.copy(noseWorld);
              headOccluder.position.z -= faceHeight * 1.5;
              headOccluder.quaternion.copy(faceBaseQuaternion);
              // Scale = radius in world units (SphereGeometry r=1).
              // Diameter = 2 × scale, so keep values at ~half head dimension.
              headOccluder.scale.set(
                eyeDistance * 1.5, // radius ≈ 0.55 × eye_dist → diam ≈ 1.1× eye_dist
                faceHeight * 1, // radius ≈ half face height → diam ≈ face height
                eyeDistance * 1.5, // depth: front surface behind nose bridge
              );
              headOccluder.visible = true;
              // Debug: render the occluder as a green wireframe.
              const mat = headOccluder.material as THREE.MeshBasicMaterial;
              const debugOn = showOccluderDebugRef.current;
              if (mat.colorWrite !== debugOn) {
                mat.colorWrite = debugOn;
                mat.wireframe = debugOn;
                if (debugOn) mat.color.set(0x00ff00);
                mat.needsUpdate = true;
              }
            }

            const keyPoints2D = {
              leftEye: { x: leftEye.x * width, y: leftEye.y * height },
              rightEye: { x: rightEye.x * width, y: rightEye.y * height },
              nose: { x: nose.x * width, y: nose.y * height },
              forehead: { x: forehead.x * width, y: forehead.y * height },
              chin: { x: chin.x * width, y: chin.y * height },
            };
            drawDebugOverlay(landmarks, width, height, keyPoints2D);

            debugFrameCounterRef.current += 1;
            if (debugFrameCounterRef.current % 5 === 0) {
              const rot = new THREE.Euler().setFromQuaternion(
                smoothQuaternion,
                "XYZ",
              );
              setDebugInfo({
                eyeDistance,
                modelPosition: {
                  x: Number(smoothPosition.x.toFixed(2)),
                  y: Number(smoothPosition.y.toFixed(2)),
                  z: Number(smoothPosition.z.toFixed(2)),
                },
                modelRotation: {
                  x: Number(rot.x.toFixed(3)),
                  y: Number(rot.y.toFixed(3)),
                  z: Number(rot.z.toFixed(3)),
                },
                modelScale: Number(smoothScale.x.toFixed(3)),
                appliedOffset: {
                  x: Number(fitOffsetX.toFixed(2)),
                  y: Number(fitOffsetY.toFixed(2)),
                  z: Number(fitOffsetZ.toFixed(2)),
                },
                trackingPoints: keyPoints2D,
              });
            }
          } else {
            glassesAnchor.visible = false;
            if (headOccluder) headOccluder.visible = false;
          }
        } else {
          glassesAnchor.visible = false;
          if (headOccluder) headOccluder.visible = false;
          drawDebugOverlay(null, width, height);
        }
      }

      renderer.render(scene, camera);
      frameRef.current = requestAnimationFrame(predict);
    };

    const setupThree = async () => {
      const mount = rendererMountRef.current;
      if (!mount) return;

      while (mount.firstChild) {
        mount.removeChild(mount.firstChild);
      }

      const mountWidth = mount.clientWidth || 640;
      const mountHeight = mount.clientHeight || 480;
      const fov = 47;
      cameraZ =
        (mountHeight * 0.5) / Math.tan(THREE.MathUtils.degToRad(fov / 2));
      viewPlaneZ = 0;

      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(
        fov,
        mountWidth / mountHeight,
        1,
        5000,
      );
      camera.position.set(0, 0, cameraZ);
      camera.lookAt(0, 0, viewPlaneZ);

      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(mountWidth, mountHeight);
      renderer.setClearColor(0x000000, 0);
      mount.appendChild(renderer.domElement);

      // Soft sky/ground fill
      const hemi = new THREE.HemisphereLight(0xffffff, 0x8899aa, 0.8);
      scene.add(hemi);

      // Ambient fill to avoid pure-black shadows
      scene.add(new THREE.AmbientLight(0xffffff, 0.6));

      // Key light — front-top-left
      const key = new THREE.DirectionalLight(0xffffff, 1.4);
      key.position.set(-1, 2, 2);
      scene.add(key);

      // Fill light — front-right, softer
      const fill = new THREE.DirectionalLight(0xd0e8ff, 0.7);
      fill.position.set(2, 0.5, 1.5);
      scene.add(fill);

      // Rim / back light for edge definition
      const rim = new THREE.DirectionalLight(0xffffff, 0.5);
      rim.position.set(0, -1, -2);
      scene.add(rim);

      glassesAnchor = new THREE.Group();
      glassesAnchor.visible = false;
      scene.add(glassesAnchor);

      // Invisible head sphere that writes only to the depth buffer.
      // Rendered first (renderOrder -1) so temple arms depth-test against
      // the head surface and vanish when they pass behind the ears/head.
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

      const loader = new GLTFLoader();
      const gltf = await loader.loadAsync(modelUrl);
      loadedModel = gltf.scene;

      const box = new THREE.Box3().setFromObject(loadedModel);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      loadedModel.position.sub(center);

      const maxSize = Math.max(size.x, size.y, size.z);
      const baseNorm = maxSize > 0 ? 100 / maxSize : 1;
      loadedModel.scale.setScalar(baseNorm);

      glassesAnchor.add(loadedModel);
      // Ensure all glasses meshes render after the depth occluder.
      loadedModel.traverse((obj) => {
        obj.renderOrder = 1;
      });

      const modelBox = new THREE.Box3().setFromObject(loadedModel);
      const modelSize = modelBox.getSize(new THREE.Vector3());
      if (modelSize.x > 0) {
        baseScaleByEyeDistance = 1.7 / modelSize.x;
      }

      resizeObserver = new ResizeObserver(() => {
        if (!renderer || !camera || !rendererMountRef.current) return;
        const w = rendererMountRef.current.clientWidth || 640;
        const h = rendererMountRef.current.clientHeight || 480;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      });
      resizeObserver.observe(mount);
    };

    const setup = async () => {
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

        landmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numFaces: 1,
          outputFaceBlendshapes: false,
          outputFacialTransformationMatrixes: true,
        });
        console.error = origConsoleError;

        localStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });

        if (!videoRef.current || !isActive) return;

        videoRef.current.srcObject = localStream;
        await videoRef.current.play();

        if (isActive) {
          setIsLoading(false);
          frameRef.current = requestAnimationFrame(predict);
        }
      } catch (error) {
        console.error = origConsoleError;
        console.error("AR try-on init failed:", error);
        if (isActive) {
          setIsLoading(false);
          setCameraError(
            "Không thể khởi động camera AR. Vui lòng cấp quyền camera và thử lại.",
          );
        }
        stopEverything();
      }
    };

    setup();

    return () => {
      isActive = false;
      stopEverything();
    };
  }, [modelUrl, fitMetadata]);

  if (cameraError) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-black/90 p-4 text-center text-white">
        <CameraOff className="h-8 w-8 text-red-400" />
        <p className="text-sm">{cameraError}</p>
      </div>
    );
  }

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

      {/* Control buttons 
      <div className="absolute right-2 top-2 z-20 flex gap-2">
        <button
          type="button"
          onClick={() => setShowCalibrationPanel((prev) => !prev)}
          className="rounded bg-black/60 px-3 py-1 text-xs text-white hover:bg-black/75"
        >
          {showCalibrationPanel ? "Ẩn Fit" : "Fit AR"}
        </button>
        <button
          type="button"
          onClick={() => {
            setShowTrackingDebug((prev) => {
              const next = !prev;
              showTrackingDebugRef.current = next;
              return next;
            });
          }}
          className="rounded bg-black/60 px-3 py-1 text-xs text-white hover:bg-black/75"
        >
          {showTrackingDebug ? "Ẩn Mesh" : "Hiện Mesh"}
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

      <canvas
        ref={debugCanvasRef}
        className="pointer-events-none absolute inset-0 z-10 h-full w-full -scale-x-100 object-cover"
      />

      {showTrackingDebug && debugInfo && (
        <div className="absolute left-2 top-2 z-20 rounded bg-black/65 px-2 py-1 text-[10px] text-white">
          <div>
            Tracking L({debugInfo.trackingPoints.leftEye.x.toFixed(0)},
            {debugInfo.trackingPoints.leftEye.y.toFixed(0)}) R(
            {debugInfo.trackingPoints.rightEye.x.toFixed(0)},
            {debugInfo.trackingPoints.rightEye.y.toFixed(0)})
          </div>
          <div>
            N({debugInfo.trackingPoints.nose.x.toFixed(0)},
            {debugInfo.trackingPoints.nose.y.toFixed(0)}) F(
            {debugInfo.trackingPoints.forehead.x.toFixed(0)},
            {debugInfo.trackingPoints.forehead.y.toFixed(0)}) C(
            {debugInfo.trackingPoints.chin.x.toFixed(0)},
            {debugInfo.trackingPoints.chin.y.toFixed(0)})
          </div>
          <div>
            Pos[{debugInfo.modelPosition.x},{debugInfo.modelPosition.y},
            {debugInfo.modelPosition.z}] Rot[{debugInfo.modelRotation.x},
            {debugInfo.modelRotation.y},{debugInfo.modelRotation.z}] S:
            {debugInfo.modelScale}
          </div>
          <div>
            Offset[{debugInfo.appliedOffset.x},{debugInfo.appliedOffset.y},
            {debugInfo.appliedOffset.z}] EyeDist:
            {debugInfo.eyeDistance.toFixed(1)}
          </div>
        </div>
      )}

      {showCalibrationPanel && (
        <div className="absolute bottom-2 left-2 right-2 z-20 rounded-md bg-black/70 p-3 text-white backdrop-blur-sm ar-calibration-panel">
          <div className="mb-2 text-xs font-semibold">
            AR Calibration (local)
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-[11px] md:grid-cols-4">
            {[
              {
                key: "offsetX",
                label: "Offset X",
                min: -300,
                max: 100,
                step: 0.5,
                value: calibration.offsetX,
              },
              {
                key: "offsetY",
                label: "Offset Y",
                min: -800,
                max: 50,
                step: 0.5,
                value: calibration.offsetY,
              },
              {
                key: "offsetZ",
                label: "Offset Z",
                min: -800,
                max: 100,
                step: 0.5,
                value: calibration.offsetZ,
              },
              {
                key: "scaleMultiplier",
                label: "Scale",
                min: 0.5,
                max: 1.8,
                step: 0.01,
                value: calibration.scaleMultiplier,
              },
              {
                key: "rotX",
                label: "Rot X",
                min: -4,
                max: 4,
                step: 0.01,
                value: calibration.rotX,
              },
              {
                key: "rotY",
                label: "Rot Y",
                min: -4,
                max: 2,
                step: 0.01,
                value: calibration.rotY,
              },
              {
                key: "rotZ",
                label: "Rot Z",
                min: -0.8,
                max: 0.8,
                step: 0.01,
                value: calibration.rotZ,
              },
              {
                key: "smoothing",
                label: "Smooth",
                min: 0.08,
                max: 0.75,
                step: 0.01,
                value: calibration.smoothing,
              },
            ].map((control) => (
              <label key={control.key} className="flex flex-col gap-1">
                <span className="text-[10px] text-white/90">
                  {control.label}: {control.value.toFixed(2)}
                </span>
                <input
                  type="range"
                  min={control.min}
                  max={control.max}
                  step={control.step}
                  value={control.value}
                  onChange={(e) =>
                    updateCalibration({
                      [control.key]: Number(e.target.value),
                    } as Partial<ArCalibrationState>)
                  }
                />
              </label>
            ))}
          </div>
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              className="rounded bg-white/10 px-2 py-1 text-[11px] hover:bg-white/20"
              onClick={() => {
                const reset = defaultCalibrationState;
                calibrationRef.current = reset;
                setCalibration(reset);
                localStorage.removeItem(`ar-fit:${getFileName(modelUrl)}`);
              }}
            >
              Reset
            </button>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-white">
          <div className="flex items-center gap-2 text-sm">
            <Loader2 className="h-5 w-5 animate-spin" />
            Đang khởi tạo AR...
          </div>
        </div>
      )}
    </div>
  );
}
