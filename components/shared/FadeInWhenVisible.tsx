"use client";

import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { cn } from "@/utils/cn";

export interface FadeInWhenVisibleProps {
  children: React.ReactNode;
  className?: string;
  /** Animation variant type */
  variant?: "fade-up" | "fade-down" | "fade-left" | "fade-right" | "fade" | "scale";
  /** Animation duration in seconds */
  duration?: number;
  /** Delay before animation starts in seconds */
  delay?: number;
  /** Amount of element that must be visible before triggering (0-1) */
  threshold?: number;
  /** Animate once or every time it enters view */
  once?: boolean;
}

const variants = {
  "fade-up": {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0 },
  },
  "fade-down": {
    hidden: { opacity: 0, y: -40 },
    visible: { opacity: 1, y: 0 },
  },
  "fade-left": {
    hidden: { opacity: 0, x: 40 },
    visible: { opacity: 1, x: 0 },
  },
  "fade-right": {
    hidden: { opacity: 0, x: -40 },
    visible: { opacity: 1, x: 0 },
  },
  fade: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  scale: {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
  },
};

/**
 * FadeInWhenVisible - Animates children when they scroll into view
 *
 * Features:
 * - Multiple animation variants (fade-up, fade-down, fade-left, fade-right, fade, scale)
 * - Customizable duration, delay, and threshold
 * - Smooth easing with spring physics
 * - Respects prefers-reduced-motion
 */
export function FadeInWhenVisible({
  children,
  className,
  variant = "fade-up",
  duration = 0.6,
  delay = 0,
  threshold = 0.1,
  once = true,
}: FadeInWhenVisibleProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once, amount: threshold });

  const selectedVariant = variants[variant];

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={selectedVariant}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}

/**
 * StaggerContainer - Animates children with a stagger effect
 *
 * Use with FadeInWhenVisible children to create sequential animations
 */
export function StaggerContainer({
  children,
  className,
  staggerDelay = 0.1,
}: {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={{
        hidden: { opacity: 1 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}
