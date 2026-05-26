"use client";

import React, { useEffect, useRef, useState } from "react";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { classifyFaceShape, FaceShape } from "@/utils/faceShapeClassifier";
import { drawFaceMeshOverlay } from "@/utils/faceMeshOverlay";
import { Loader2, Sparkles } from "lucide-react";
import { productApi } from "@/lib/api";
import type { Product } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import AIRecommendationGroups from "@/components/AIRecommendationGroups";

interface FaceShapeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FaceShapeModalFixed({
  isOpen,
  onClose,
}: FaceShapeModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isModelLoading, setIsModelLoading] = useState(true);
  const [faceLandmarker, setFaceLandmarker] = useState<FaceLandmarker | null>(
    null,
  );
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const [detectedShape, setDetectedShape] = useState<FaceShape | null>(null);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [isFetchingProducts, setIsFetchingProducts] = useState(false);

  const [isScanning, setIsScanning] = useState(false);
  const requestRef = useRef<number>();
  const lastVideoTimeRef = useRef<number>(-1);

  useEffect(() => {
    let active = true;
    const setupModel = async () => {
      try {
        setIsModelLoading(true);
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm",
        );
        const landmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
            delegate: "GPU",
          },
          outputFaceBlendshapes: false,
          runningMode: "VIDEO",
          numFaces: 1,
        });
        if (active) {
          setFaceLandmarker(landmarker);
          setIsModelLoading(false);
        }
      } catch (err) {
        console.error("Error loading MediaPipe model:", err);
      }
    };

    if (isOpen) setupModel();

    return () => {
      active = false;
      if (faceLandmarker) faceLandmarker.close();
    };
  }, [isOpen]);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play();
        }
      } catch (err) {
        setCameraError("Cannot access camera.");
      }
    };

    if (isOpen && faceLandmarker && !isModelLoading) startCamera();
    return () => stopCamera();
  }, [isOpen, faceLandmarker, isModelLoading]);

  const stopCamera = () => {
    if (stream) stream.getTracks().forEach((track) => track.stop());
    setStream(null);
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
  };

  const fetchProducts = async (shape: FaceShape) => {
    setIsFetchingProducts(true);
    try {
      const res = await productApi.getAllProducts({ face_suitable: shape });
      setRecommendedProducts(res.products || []);
    } catch (err) {
      console.error("Error fetching products:", err);
    } finally {
      setIsFetchingProducts(false);
    }
  };

  const predictWebcam = () => {
    if (!videoRef.current || !faceLandmarker || !canvasRef.current || !stream)
      return;

    const video = videoRef.current;
    if (video.readyState < 2 || video.currentTime === lastVideoTimeRef.current)
      return;

    lastVideoTimeRef.current = video.currentTime;
    const results = faceLandmarker.detectForVideo(video, performance.now());
    const canvasCtx = canvasRef.current.getContext("2d");

    if (canvasCtx && results.faceLandmarks && results.faceLandmarks.length > 0) {
      canvasRef.current.width = video.videoWidth;
      canvasRef.current.height = video.videoHeight;
      drawFaceMeshOverlay(
        canvasCtx,
        results.faceLandmarks[0],
        canvasRef.current.width,
        canvasRef.current.height,
        {
          mirrorX: false,
          sampleStep: 1,
          pointRadius: 1,
          color: "#3b82f6",
        },
      );
    }

    requestRef.current = requestAnimationFrame(predictWebcam);
  };

  useEffect(() => {
    if (isOpen && faceLandmarker && stream) {
      requestRef.current = requestAnimationFrame(predictWebcam);
    }

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, faceLandmarker, stream]);

  const handleManualScan = async () => {
    if (!videoRef.current || !faceLandmarker) return;
    setIsScanning(true);

    const results = faceLandmarker.detectForVideo(
      videoRef.current,
      performance.now(),
    );

    if (results.faceLandmarks && results.faceLandmarks.length > 0) {
      const shape = classifyFaceShape(results.faceLandmarks[0]);
      if (shape !== "Không xác định") {
        setDetectedShape(shape);
        await fetchProducts(shape);
      }
    }

    setIsScanning(false);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="flex h-[90vh] w-[98vw] max-w-[calc(80rem+3cm)] flex-col overflow-hidden border border-white/20 ring-1 ring-white/10 bg-[linear-gradient(180deg,#000_0%,#050000_40%,#000_100%),radial-gradient(circle_at_top,rgba(255,155,83,0.06),transparent_24%)] p-0 text-white shadow-[0_48px_120px_-10px_rgba(0,0,0,0.85)] drop-shadow-2xl backdrop-blur-sm">
        <DialogHeader className="px-4 py-1 sm:px-5 sm:py-1">
          <DialogTitle className="flex items-center gap-2 font-body text-base font-semibold tracking-normal text-white/60">
            <Sparkles className="h-4 w-4 text-[#ff9b53]" />
            AI gợi ý sản phẩm
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          <div className="flex w-full flex-col items-center bg-transparent px-4 py-4 md:w-[53%] md:px-5">
            <h3 className="mb-2 self-start text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-white">
              BƯỚC 1: PHÂN TÍCH KHUÔN MẶT
            </h3>

            <div className="relative w-full aspect-[3/4] overflow-hidden rounded-[1.15rem] bg-black shadow-2xl">
              <div className="absolute left-0 right-0 bottom-0 z-10 px-4 pb-4">
                <div className="w-full rounded-[1rem] bg-black/55 px-4 py-3 text-center backdrop-blur border border-white/10 shadow-[0_20px_45px_-25px_rgba(255,155,83,0.25)]">
                  <div className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-[#ffd4af]/68">
                    KẾT QUẢ PHÂN TÍCH
                  </div>
                  <div className="mt-1 text-base font-semibold tracking-normal text-[#ffb56d]">
                    {detectedShape ?? ""}
                  </div>
                </div>
              </div>

              {isModelLoading ? (
                <div className="flex flex-col items-center justify-center h-full text-white gap-2">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span>Loading AI Engine...</span>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover -scale-x-100"
                  />
                  <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full object-cover -scale-x-100 pointer-events-none"
                  />
                </>
              )}
            </div>

            <Button
              onClick={handleManualScan}
              disabled={isScanning || isModelLoading}
              className="mt-2.5 h-10 w-full rounded-lg border-0 bg-[linear-gradient(135deg,#ff7a18,#ff5a00)] px-3 text-[0.82rem] font-semibold normal-case tracking-normal text-white shadow-[0_18px_34px_-20px_rgba(255,106,0,0.72)] hover:bg-[linear-gradient(135deg,#ff8a2a,#ff6400)]"
            >
              {isScanning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                "Quét khuôn mặt"
              )}
            </Button>

            {cameraError ? (
              <div className="mt-3 text-sm text-red-300">{cameraError}</div>
            ) : null}
          </div>

          <div className="flex w-full flex-col bg-transparent md:w-[47%]">
            <div className="px-4 py-3 sm:px-5 sm:py-4">
              <h3 className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-white">
                BƯỚC 2: SẢN PHẨM PHÙ HỢP
              </h3>
            </div>

            <ScrollArea className="flex-1 px-4 pb-4 sm:px-5 sm:pb-5">
              <div
                className={
                  recommendedProducts.length > 0
                    ? "min-h-full flex w-full flex-col items-stretch"
                    : "min-h-full flex flex-col items-center justify-center"
                }
              >
                {!detectedShape ? (
                  <div className="flex flex-col items-center justify-center text-center space-y-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]">
                      <Loader2 className="h-8 w-8 animate-pulse text-white/30" />
                    </div>
                    <p className="max-w-[250px] text-white/40">
                      Please position your face in the camera to see personalized
                      recommendations.
                    </p>
                  </div>
                ) : isFetchingProducts ? (
                  <div className="flex flex-col items-center justify-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-[#ff9b53]" />
                    <span className="text-sm font-medium text-white/80">
                      Finding the perfect frames for {detectedShape}...
                    </span>
                  </div>
                ) : recommendedProducts.length > 0 ? (
                  <AIRecommendationGroups products={recommendedProducts} />
                ) : (
                  <div className="text-center text-white/40">
                    No matching products found for{" "}
                    <span className="font-bold text-[#ffb56d]">{detectedShape}</span>{" "}
                    shape yet.
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

