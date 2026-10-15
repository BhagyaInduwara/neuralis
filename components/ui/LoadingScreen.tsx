"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { prefersReducedMotion } from "@/lib/utils";

interface LoadingScreenProps {
  ready: boolean;
  onExited?: () => void;
}

/**
 * Counts 0 -> 100%, holding short of the end until the 3D scene confirms a
 * painted frame, then fades out and hands off to the chip power-on.
 */
export default function LoadingScreen({ ready, onExited }: LoadingScreenProps) {
  const [visible, setVisible] = useState(true);
  const rootRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const percentRef = useRef<HTMLSpanElement>(null);
  const proxy = useRef({ value: 0 });
  const onExitedRef = useRef(onExited);

  useEffect(() => {
    onExitedRef.current = onExited;
  }, [onExited]);

  const render = () => {
    const v = Math.round(proxy.current.value);
    if (barRef.current) barRef.current.style.transform = `scaleX(${v / 100})`;
    if (percentRef.current) percentRef.current.textContent = String(v).padStart(3, "0");
  };

  useEffect(() => {
    const reduced = prefersReducedMotion();
    const tween = gsap.to(proxy.current, {
      value: 90,
      duration: reduced ? 0.2 : 1.6,
      ease: "power2.out",
      onUpdate: render,
    });
    return () => {
      tween.kill();
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const reduced = prefersReducedMotion();

    const tl = gsap.timeline({
      onComplete: () => {
        setVisible(false);
        onExitedRef.current?.();
      },
    });
    tl.to(proxy.current, {
      value: 100,
      duration: reduced ? 0.1 : 0.45,
      ease: "power1.out",
      onUpdate: render,
    })
      .to({}, { duration: reduced ? 0 : 0.15 })
      .to(rootRef.current, { opacity: 0, duration: reduced ? 0.15 : 0.55, ease: "power2.inOut" });

    return () => {
      tl.kill();
    };
  }, [ready]);

  if (!visible) return null;

  return (
    <div
      ref={rootRef}
      role="status"
      aria-live="polite"
      aria-label="Loading"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-8 bg-[#050505]"
    >
      <p className="font-mono text-sm tracking-[0.4em] text-[#f5f5f2]">NEURALIS</p>
      <div className="flex items-baseline gap-1 font-mono text-[#f5f5f2]">
        <span ref={percentRef} className="text-6xl font-light tabular-nums tracking-tight md:text-7xl">
          000
        </span>
        <span className="text-xl text-[#ff8a3d]">%</span>
      </div>
      <div className="h-px w-56 overflow-hidden bg-white/10">
        <div
          ref={barRef}
          className="h-full w-full origin-left bg-gradient-to-r from-[#ff8a3d] to-[#ffb066]"
          style={{ transform: "scaleX(0)" }}
        />
      </div>
      <div className="flex items-center gap-3 font-mono text-[10px] tracking-[0.3em] text-[#8a8a8f]">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#ff8a3d] opacity-60" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#ff8a3d]" />
        </span>
        INITIALIZING SYSTEM
      </div>
    </div>
  );
}
