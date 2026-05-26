type Landmark = { x: number; y: number; z: number };

type DrawFaceMeshOptions = {
  mirrorX?: boolean;
  sampleStep?: number;
  pointRadius?: number;
  color?: string;
};

export const drawFaceMeshOverlay = (
  ctx: CanvasRenderingContext2D,
  landmarks: Landmark[],
  width: number,
  height: number,
  options?: DrawFaceMeshOptions,
) => {
  const mirrorX = options?.mirrorX ?? false;
  const sampleStep = Math.max(1, options?.sampleStep ?? 1);
  const pointRadius = options?.pointRadius ?? 1;
  const color = options?.color ?? "#3b82f6";

  ctx.fillStyle = color;
  for (let i = 0; i < landmarks.length; i += sampleStep) {
    const landmark = landmarks[i];
    const x = (mirrorX ? 1 - landmark.x : landmark.x) * width;
    const y = landmark.y * height;
    ctx.beginPath();
    ctx.arc(x, y, pointRadius, 0, 2 * Math.PI);
    ctx.fill();
  }
};

