"use client";

import { useEffect, useRef } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { scrollState } from "@/lib/sceneState";
import { prefersReducedMotion } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);

export default function SmoothScrollProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const reduced = prefersReducedMotion();

    let lenis: Lenis | null = null;
    let raf: ((time: number) => void) | null = null;
    if (!reduced) {
      lenis = new Lenis({
        duration: 1.15,
        easing: (t) => 1 - Math.pow(1 - t, 3),
        smoothWheel: true,
        touchMultiplier: 1.4,
      });
      lenisRef.current = lenis;

      lenis.on("scroll", ScrollTrigger.update);

      raf = (time: number) => {
        // gsap.ticker reports elapsed time in seconds; Lenis expects a
        // millisecond rAF-style timestamp to compute its internal delta.
        // Without this conversion Lenis's internal clock advances ~1000x
        // too slowly and scrolling appears to almost completely stall.
        lenis?.raf(time * 1000);
      };
      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0);

      // expose for anchor-link navigation elsewhere in the app
      (window as unknown as { __lenis?: Lenis }).__lenis = lenis;
    }

    const progressTrigger = ScrollTrigger.create({
      trigger: document.body,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        scrollState.progress = self.progress;
        scrollState.velocity = self.getVelocity() / 2500;
      },
    });

    const refreshId = window.setTimeout(() => ScrollTrigger.refresh(), 200);

    return () => {
      window.clearTimeout(refreshId);
      progressTrigger.kill();
      if (lenis && raf) {
        gsap.ticker.remove(raf);
        lenis.destroy();
      }
      lenisRef.current = null;
    };
  }, []);

  return <>{children}</>;
}
