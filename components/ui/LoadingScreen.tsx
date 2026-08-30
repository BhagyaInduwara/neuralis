"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { prefersReducedMotion } from "@/lib/utils";

interface LoadingScreenProps {
  ready: boolean;
  onExited?: () => void;
}

export default function LoadingScreen({ ready, onExited }: LoadingScreenProps) {
  const [visible, setVisible] = useState(true);
  const rootRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const percentRef = useRef<HTMLSpanElement>(null);
  const proxy = useRef({ value: 0 });

  useEffect(() => {
    const reduced = prefersReducedMotion();
    const tl = gsap.timeline();

    tl.to(proxy.current, {
      value: reduced ? 92 : 88,
      duration: reduced ? 0.2 : 1.3,
      ease: "power2.out",
      onUpdate: () => {
        const v = Math.round(proxy.current.value);
        if (barRef.current) barRef.current.style.width = `${v}%`;
        if (percentRef.current) percentRef.current.textContent = `${v}%`;
      },
    });

    return () => {
      tl.kill();
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const reduced = prefersReducedMotion();

    const tl = gsap.timeline({
      onComplete: () => {
        setVisible(false);
        onExited?.();
      },
    });

    tl.to(proxy.current, {
      value: 100,
      duration: reduced ? 0.1 : 0.35,
      ease: "power1.out",
      onUpdate: () => {
        const v = Math.round(proxy.current.value);
        if (barRef.current) barRef.current.style.width = `${v}%`;
        if (percentRef.current) percentRef.current.textContent = `${v}%`;
      },
    });

    tl.to(rootRef.current, {
      opacity: 0,
      duration: reduced ? 0.15 : 0.6,
      ease: "power2.inOut",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  if (!visible) return null;

  return (
    <div
      ref={rootRef}
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-[#050506]"
    >
      <p className="font-mono text-sm tracking-[0.4em] text-[#f5f5f2]">
        NEURALIS
      </p>
      <div className="flex items-center gap-3 font-mono text-[11px] tracking-[0.3em] text-[#8a8a8f]">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#ff8a3d] opacity-60" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#ff8a3d]" />
        </span>
        INITIALIZING SYSTEM
        <span ref={percentRef} className="text-[#ff8a3d]">
          0%
        </span>
      </div>
      <div className="h-px w-48 overflow-hidden bg-white/10">
        <div
          ref={barRef}
          className="h-full w-0 bg-gradient-to-r from-[#ff8a3d] to-[#ffb066]"
        />
      </div>
    </div>
  );
}
