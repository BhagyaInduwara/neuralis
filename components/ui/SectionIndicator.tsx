"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { SECTIONS } from "@/lib/constants";
import { scrollState } from "@/lib/sceneState";
import { scrollToSection } from "@/lib/utils";

const FALLBACK_ANCHORS = SECTIONS.map((_, i) => i / (SECTIONS.length - 1));

/**
 * Scroll progress rail with section ticks. Ticks sit at each section's real
 * scroll anchor, so the fill reaches a tick exactly as that section centres —
 * the rail and the active label can't drift apart.
 */
export default function SectionIndicator() {
  const fillRef = useRef<HTMLSpanElement>(null);
  const mobileFillRef = useRef<HTMLSpanElement>(null);
  const [active, setActive] = useState(0);
  const [anchors, setAnchors] = useState<number[]>(FALLBACK_ANCHORS);

  useEffect(() => {
    let lastAnchors: number[] | null = null;
    let lastActive = -1;
    const tick = () => {
      const progress = scrollState.progress;
      if (fillRef.current) fillRef.current.style.transform = `scaleY(${progress})`;
      if (mobileFillRef.current) mobileFillRef.current.style.transform = `scaleY(${progress})`;

      const current = Math.round(scrollState.section);
      if (current !== lastActive) {
        lastActive = current;
        setActive(current);
      }
      if (scrollState.anchors !== lastAnchors && scrollState.anchors.length === SECTIONS.length) {
        lastAnchors = scrollState.anchors;
        setAnchors(scrollState.anchors);
      }
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, []);

  return (
    <>
      <nav
        aria-label="Sections"
        className="fixed right-6 top-1/2 z-40 hidden h-[min(44svh,320px)] w-[170px] -translate-y-1/2 lg:block"
      >
        <span className="absolute bottom-0 right-[3px] top-0 w-px bg-white/10" />
        <span
          ref={fillRef}
          className="absolute bottom-0 right-[3px] top-0 w-px origin-top bg-gradient-to-b from-[#ff8a3d] to-[#ffb066]"
          style={{ transform: "scaleY(0)" }}
        />
        {SECTIONS.map((section, i) => {
          const isActive = i === active;
          return (
            <button
              key={section.id}
              onClick={() => scrollToSection(section.id)}
              aria-label={`Go to ${section.label} section`}
              aria-current={isActive ? "true" : undefined}
              className="group absolute right-0 flex -translate-y-1/2 items-center gap-3"
              style={{ top: `${anchors[i] * 100}%` }}
            >
              <span
                className={`whitespace-nowrap font-mono text-[10px] tracking-[0.2em] transition-[opacity,color,translate] duration-300 ${
                  isActive
                    ? "translate-x-0 bg-[#050506]/80 px-1.5 py-0.5 text-[#ff8a3d] opacity-100"
                    : "translate-x-1 text-[#8a8a8f] opacity-0 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:opacity-100"
                }`}
              >
                {section.index} / {section.label}
              </span>
              <span
                className={`block h-[7px] w-[7px] rotate-45 border transition-colors duration-300 ${
                  isActive
                    ? "border-[#ff8a3d] bg-[#ff8a3d]"
                    : "border-white/30 bg-[#050506] group-hover:border-white/60"
                }`}
              />
            </button>
          );
        })}
      </nav>

      <div aria-hidden="true" className="fixed bottom-0 right-0 top-[72px] z-40 w-[2px] bg-white/5 lg:hidden">
        <span
          ref={mobileFillRef}
          className="absolute inset-0 origin-top bg-[#ff8a3d]"
          style={{ transform: "scaleY(0)" }}
        />
      </div>
    </>
  );
}
