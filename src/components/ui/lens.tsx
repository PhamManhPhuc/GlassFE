"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion, useMotionTemplate } from "motion/react";

interface Position {
  x: number;
  y: number;
}

interface LensProps {
  children: React.ReactNode;
  zoomFactor?: number;
  lensSize?: number;
  position?: Position;
  defaultPosition?: Position;
  isStatic?: boolean;
  duration?: number;
  lensColor?: string;
  ariaLabel?: string;
  lensBorderColor?: string;
  hideBaseOnHover?: boolean;
}

export function Lens({
  children,
  zoomFactor = 1.3,
  lensSize = 170,
  isStatic = false,
  position = { x: 0, y: 0 },
  defaultPosition,
  duration = 0.1,
  lensColor = "black",
  ariaLabel = "Zoom Area",
  lensBorderColor = "border-primary",
  hideBaseOnHover = false,
}: LensProps) {
  if (zoomFactor < 1) {
    throw new Error("zoomFactor must be greater than 1");
  }
  if (lensSize < 0) {
    throw new Error("lensSize must be greater than 0");
  }

  const [isHovering, setIsHovering] = useState(false);
  const [mousePosition, setMousePosition] = useState<Position>(position);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentPosition = useMemo(() => {
    if (isStatic) return position;
    if (defaultPosition && !isHovering) return defaultPosition;
    return mousePosition;
  }, [isStatic, position, defaultPosition, isHovering, mousePosition]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") setIsHovering(false);
  }, []);

  const maskImage = useMotionTemplate`radial-gradient(circle ${
    lensSize / 2
  }px at ${currentPosition.x}px ${
    currentPosition.y
  }px, ${lensColor} 100%, transparent 100%)`;

  const { x, y } = currentPosition;

  const LensContent = useMemo(() => {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.58 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration }}
        className="absolute inset-0 overflow-hidden"
        style={{
          maskImage,
          WebkitMaskImage: maskImage,
          transformOrigin: `${x}px ${y}px`,
          zIndex: 50,
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            transform: `scale(${zoomFactor})`,
            transformOrigin: `${x}px ${y}px`,
          }}
        >
          {children}
        </div>
      </motion.div>
    );
  }, [currentPosition, lensSize, lensColor, zoomFactor, children, duration]);

  const LensBorder = useMemo(() => {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.58 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration }}
        className={cn(
          "absolute z-[51] rounded-full border-2 bg-transparent pointer-events-none",
          lensBorderColor
        )}
        style={{
          width: lensSize,
          height: lensSize,
          left: currentPosition.x - lensSize / 2,
          top: currentPosition.y - lensSize / 2,
          transformOrigin: "center center",
        }}
      />
    );
  }, [currentPosition, lensSize, duration, lensBorderColor]);

  return (
    <div
      ref={containerRef}
      className="relative z-20 flex h-full w-full items-center justify-center overflow-hidden rounded-xl"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onMouseMove={handleMouseMove}
      onKeyDown={handleKeyDown}
      role="region"
      aria-label={ariaLabel}
      tabIndex={0}
    >
      <div className={hideBaseOnHover && isHovering ? "invisible" : undefined}>
        {children}
      </div>
      {isStatic || defaultPosition ? (
        // CHANGE: Replace Fragment with div
        <div>
          {LensContent}
          {LensBorder}
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          {isHovering && (
            // CHANGE: Replace Fragment with div
            <div>
              {LensContent}
              {LensBorder}
            </div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
