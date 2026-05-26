// utils/faceShapeClassifier.ts
// Dựa trên chỉ số Google MediaPipe Face Landmarks

export type FaceShape = 
  | "mặt tròn" 
  | "mặt vuông" 
  | "mặt trái xoan" 
  | "mặt dài" 
  | "mặt kim cương" 
  | "Không xác định";

interface Landmark {
  x: number;
  y: number;
  z: number;
}

export function classifyFaceShape(landmarks: Landmark[]): FaceShape {
  if (!landmarks || landmarks.length < 468) return "Không xác định";

  const getDistance2D = (p1: Landmark, p2: Landmark) => {
    return Math.sqrt(
      Math.pow(p1.x - p2.x, 2) + 
      Math.pow(p1.y - p2.y, 2)
    );
  };

  const leftCheekbone = landmarks[234];
  const rightCheekbone = landmarks[454];

  const leftJawline = landmarks[132];
  const rightJawline = landmarks[361];

  const leftForehead = landmarks[54];
  const rightForehead = landmarks[284];

  // 🔥 FIX: dùng min/max Y thay vì landmark cứng
  const ys = landmarks.map(p => p.y);
  const faceLength = Math.max(...ys) - Math.min(...ys);

  const faceWidth = getDistance2D(leftCheekbone, rightCheekbone);
  const jawlineWidth = getDistance2D(leftJawline, rightJawline);
  const foreheadWidth = getDistance2D(leftForehead, rightForehead);

  const ratio = faceLength / faceWidth;

  // --- Classifier ---

  // Long
  if (ratio > 1.6) {
    return "mặt dài";
  }

  // Oval
  if (ratio > 1.35) {
    if (jawlineWidth < foreheadWidth) {
      return "mặt trái xoan";
    }
  }

  // Diamond
  if (faceWidth > foreheadWidth * 1.05 && faceWidth > jawlineWidth * 1.05) {
    return "mặt kim cương";
  }

  // Round
  if (ratio < 1.2) {
    if (jawlineWidth < faceWidth * 0.9) {
      return "mặt tròn";
    }
  }

  // Square
  return "mặt vuông";
}