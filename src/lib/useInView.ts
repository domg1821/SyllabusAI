"use client";
import { useEffect, useRef, useState } from "react";

export function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let observer: IntersectionObserver | null = null;

    // Small delay to avoid firing on elements that are already partially visible
    // at page-load before content has settled.
    const timer = setTimeout(() => {
      observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setInView(true);
            observer?.disconnect();
          }
        },
        { threshold }
      );
      if (ref.current) observer.observe(ref.current);
    }, 100);

    return () => {
      clearTimeout(timer);
      observer?.disconnect();
    };
  }, [threshold]);

  return { ref, inView };
}
