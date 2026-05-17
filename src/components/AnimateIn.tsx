"use client";
import { ReactNode } from "react";
import { useInView } from "@/lib/useInView";

type Direction = "up" | "left" | "right" | "fade";

const HIDDEN_TRANSFORM: Record<Direction, string> = {
  up: "translateY(24px)",
  left: "translateX(-24px)",
  right: "translateX(24px)",
  fade: "translateY(0)",
};

interface Props {
  children: ReactNode;
  delay?: number;
  direction?: Direction;
  className?: string;
}

export default function AnimateIn({
  children,
  delay = 0,
  direction = "up",
  className = "",
}: Props) {
  const { ref, inView } = useInView();

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "none" : HIDDEN_TRANSFORM[direction],
        transition: `opacity 700ms ease-out ${delay}ms, transform 700ms ease-out ${delay}ms`,
        willChange: "opacity, transform",
      }}
    >
      {children}
    </div>
  );
}
