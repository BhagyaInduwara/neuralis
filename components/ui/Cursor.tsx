"use client";

import { useEffect, useRef } from "react";
import { useIsTouch } from "@/hooks/useIsTouch";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { damp } from "@/lib/utils";

export default function Cursor() {
  const isTouch = useIsTouch();
  const reduced = useReducedMotion();
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const active = !isTouch && !reduced;

  useEffect(() => {
    if (!active) return;

    const pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const target = { ...pos };
    const ringScale = { current: 1, target: 1 };
    let raf = 0;
    let last = performance.now();

    const onMove = (e: PointerEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
    };

    const onOver = (e: PointerEvent) => {
      const el = (e.target as HTMLElement)?.closest(
        "a, button, [data-cursor-hover]"
      );
      ringScale.target = el ? 1.9 : 1;
    };

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      pos.x = damp(pos.x, target.x, 22, dt);
      pos.y = damp(pos.y, target.y, 22, dt);
      ringScale.current = damp(ringScale.current, ringScale.target, 10, dt);

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${target.x}px, ${target.y}px, 0) translate(-50%, -50%)`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%) scale(${ringScale.current})`;
      }

      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerover", onOver, { passive: true });
    raf = requestAnimationFrame(tick);
    document.documentElement.classList.add("cursor-none");

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerover", onOver);
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove("cursor-none");
    };
  }, [active]);

  if (!active) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[90]" aria-hidden="true">
      <div
        ref={dotRef}
        className="fixed left-0 top-0 h-1 w-1 rounded-full bg-[#ff8a3d]"
      />
      <div
        ref={ringRef}
        className="fixed left-0 top-0 h-7 w-7 rounded-full border border-[#ff8a3d]/50 transition-[border-color] duration-300"
      />
    </div>
  );
}
