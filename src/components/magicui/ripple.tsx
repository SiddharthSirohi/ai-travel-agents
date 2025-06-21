"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import React from "react";

interface RippleProps {
  mainCircleSize?: number;
  mainCircleOpacity?: number;
  numCircles?: number;
  className?: string;
}

export const Ripple: React.FC<RippleProps> = ({
  mainCircleSize = 210,
  mainCircleOpacity = 0.24,
  numCircles = 8,
  className,
}) => {
  return (
    <div
      className={cn(
        "absolute inset-0 bg-white/5 dark:bg-black/5 [mask-image:linear-gradient(to_bottom,white,transparent)]",
        className,
      )}
    >
      {Array.from({ length: numCircles }, (_, i) => {
        const size = mainCircleSize + i * 70;
        const opacity = mainCircleOpacity - i * 0.03;
        const animationDelay = i * 0.06;

        return (
          <motion.div
            key={i}
            className={`absolute animate-pulse rounded-full bg-foreground/25 shadow-xl border border-foreground/10`}
            style={{
              width: `${size}px`,
              height: `${size}px`,
              opacity,
              animationDelay: `${animationDelay}s`,
            }}
            initial={{
              opacity: 0,
              scale: 0,
            }}
            animate={{
              opacity: [0, opacity, 0],
              scale: [0, 1, 1],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              delay: animationDelay,
            }}
          />
        );
      })}
    </div>
  );
}; 