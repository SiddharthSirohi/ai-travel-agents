"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import React from "react";

interface AnimatedBeamProps {
  className?: string;
  containerRef: React.RefObject<HTMLElement>;
  fromRef: React.RefObject<HTMLElement>;
  toRef: React.RefObject<HTMLElement>;
  curvature?: number;
  reverse?: boolean;
  duration?: number;
  delay?: number;
}

export const AnimatedBeam: React.FC<AnimatedBeamProps> = ({
  className,
  containerRef,
  fromRef,
  toRef,
  curvature = 0,
  reverse = false,
  duration = 2000,
  delay = 0,
}) => {
  const [pathD, setPathD] = React.useState("");
  const pathRef = React.useRef<SVGPathElement>(null);

  React.useEffect(() => {
    if (containerRef.current && fromRef.current && toRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const fromRect = fromRef.current.getBoundingClientRect();
      const toRect = toRef.current.getBoundingClientRect();

      const fromX = fromRect.left - containerRect.left + fromRect.width / 2;
      const fromY = fromRect.top - containerRect.top + fromRect.height / 2;
      const toX = toRect.left - containerRect.left + toRect.width / 2;
      const toY = toRect.top - containerRect.top + toRect.height / 2;

      const midX = (fromX + toX) / 2;
      const midY = (fromY + toY) / 2 + curvature;

      const pathData = `M ${fromX} ${fromY} Q ${midX} ${midY} ${toX} ${toY}`;
      setPathD(pathData);
    }
  }, [containerRef, fromRef, toRef, curvature]);

  return (
    <svg
      className={cn("pointer-events-none absolute inset-0 h-full w-full", className)}
      width="100%"
      height="100%"
      viewBox="0 0 100% 100%"
      style={{ zIndex: 1 }}
    >
      <path
        ref={pathRef}
        d={pathD}
        stroke="url(#gradient)"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeDasharray="5 5"
      />
      <defs>
        <motion.linearGradient
          id="gradient"
          gradientUnits="userSpaceOnUse"
          initial={{
            x1: "0%",
            x2: "0%",
            y1: "0%",
            y2: "0%",
          }}
          animate={{
            x1: reverse ? "100%" : "0%",
            x2: reverse ? "0%" : "100%",
            y1: "0%",
            y2: "0%",
          }}
          transition={{
            duration: duration / 1000,
            ease: "linear",
            repeat: Infinity,
            delay: delay / 1000,
          }}
        >
          <stop stopColor="#3b82f6" stopOpacity="0" />
          <stop stopColor="#3b82f6" />
          <stop offset="32.5%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </motion.linearGradient>
      </defs>
    </svg>
  );
}; 