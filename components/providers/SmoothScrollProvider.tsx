"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { scrollState } from "@/lib/sceneState";
import { SECTIONS } from "@/lib/constants";
import { clamp, prefersReducedMotion } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);

/**
 * Scroll position (px) at which each section is "arrived at": centred when it
 * fits the viewport, top-aligned when it is taller (so its heading is never
 * scrolled under the header). Clamped and kept strictly increasing.
 */
function measureAnchors(maxScroll: number): number[] {
  const vh = window.innerHeight;
  let previous = -1;
  return SECTIONS.map(({ id }) => {
    const el = document.getElementById(id);
    if (!el) return previous;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const slack = Math.max(0, vh - el.offsetHeight) / 2;
    const anchor = clamp(top - slack, 0, maxScroll);
    previous = Math.max(anchor, previous + 1);
    return previous;
  });
}

function sectionAt(scroll: number, anchors: number[]): number {
  if (anchors.length === 0 || scroll <= anchors[0]) return 0;
  for (let i = 0; i < anchors.length - 1; i++) {
    if (scroll <= anchors[i + 1]) {
      return i + (scroll - anchors[i]) / (anchors[i + 1] - anchors[i]);
    }
  }
  return anchors.length - 1;
}

export default function SmoothScrollProvider({
  children,
}: {
  children: React.ReactNode;
}) {
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

    let anchorsPx: number[] = [];
    const updateSection = (scroll: number) => {
      scrollState.section = sectionAt(scroll, anchorsPx);
    };
    const remeasure = () => {
      const max = ScrollTrigger.maxScroll(window);
      anchorsPx = measureAnchors(max);
      scrollState.anchors = anchorsPx.map((a) => (max > 0 ? a / max : 0));
      updateSection(window.scrollY);
    };

    const progressTrigger = ScrollTrigger.create({
      trigger: document.body,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        scrollState.progress = self.progress;
        scrollState.velocity = self.getVelocity() / 2500;
        updateSection(self.scroll());
      },
    });

    ScrollTrigger.addEventListener("refresh", remeasure);
    remeasure();

    // Reduced motion: no camera flights, so sections hand over by fading.
    const crossfades: gsap.core.Timeline[] = [];
    if (reduced) {
      document.querySelectorAll<HTMLElement>("main > section").forEach((section) => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        });
        tl.fromTo(section, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "none" })
          .to(section, { opacity: 1, duration: 0.4 })
          .to(section, { opacity: 0, duration: 0.3, ease: "none" });
        crossfades.push(tl);
      });
    }

    const refreshId = window.setTimeout(() => ScrollTrigger.refresh(), 200);

    return () => {
      window.clearTimeout(refreshId);
      ScrollTrigger.removeEventListener("refresh", remeasure);
      progressTrigger.kill();
      crossfades.forEach((tl) => {
        tl.scrollTrigger?.kill();
        tl.kill();
      });
      if (lenis && raf) {
        gsap.ticker.remove(raf);
        lenis.destroy();
      }
    };
  }, []);

  return <>{children}</>;
}
