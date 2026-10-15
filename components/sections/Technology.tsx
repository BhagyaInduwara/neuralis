"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { TECHNOLOGY_CARDS } from "@/lib/constants";
import { interactionState } from "@/lib/sceneState";
import { prefersReducedMotion } from "@/lib/utils";
import { RevealHeading, TypeLabel } from "@/components/ui/RevealText";

gsap.registerPlugin(ScrollTrigger);

export default function Technology() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const reduced = prefersReducedMotion();
    const ctx = gsap.context(() => {
      // Cards only transition `translate`/background on hover (not transform
      // or opacity), so this tween can't fight a CSS transition.
      gsap.from(".tech-card", {
        opacity: 0,
        y: reduced ? 0 : 48,
        duration: reduced ? 0.3 : 0.9,
        stagger: reduced ? 0 : 0.1,
        ease: "power3.out",
        clearProps: "opacity,transform",
        scrollTrigger: { trigger: ".tech-grid", start: "top 85%" },
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      id="technology"
      ref={rootRef}
      className="relative flex min-h-[100svh] flex-col justify-center px-6 pb-24 pt-[120px] md:px-10 lg:px-16 lg:pr-[220px]"
    >
      <div className="max-w-3xl">
        <TypeLabel
          text="SYSTEM 02 / TECHNOLOGY"
          className="mb-5 font-mono text-[11px] tracking-[0.3em] text-[#ff8a3d]"
        />
        <RevealHeading
          lines={["ENGINEERED FOR THE NEXT", "COMPUTE ERA."]}
          className="text-4xl font-semibold leading-tight tracking-tight text-[#f5f5f2] md:text-5xl"
        />
      </div>

      <div className="tech-grid mt-14 grid grid-cols-1 gap-px overflow-hidden rounded-sm border border-white/10 bg-white/10 md:grid-cols-3 [@media(max-height:760px)]:mt-10">
        {TECHNOLOGY_CARDS.map((card) => (
          <div
            key={card.index}
            data-cursor-hover
            onMouseEnter={() => {
              interactionState.pulseTarget = 1;
            }}
            onMouseLeave={() => {
              interactionState.pulseTarget = 0;
            }}
            className="tech-card group relative flex flex-col justify-between gap-8 bg-[#08080a]/90 p-6 backdrop-blur-sm transition-[translate,background-color] duration-500 hover:-translate-y-1.5 hover:bg-[#0c0c0f] sm:p-8 md:min-h-[min(280px,34svh)]"
          >
            <div>
              <span className="font-mono text-xs text-[#86868d] transition-colors duration-500 group-hover:text-[#ff8a3d]">
                {card.index}
              </span>
              <h3 className="mt-6 text-lg font-medium tracking-wide text-[#f5f5f2] [@media(max-height:760px)]:mt-4">
                {card.title}
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-[#8a8a8f]">
                {card.description}
              </p>
            </div>

            <div className="h-px w-8 bg-white/15 transition-[width,background-color] duration-500 ease-out group-hover:w-full group-hover:bg-[#ff8a3d]" />

            <div className="pointer-events-none absolute inset-0 opacity-0 shadow-[inset_0_0_60px_-10px_rgba(255,138,61,0.35)] transition-opacity duration-500 group-hover:opacity-100" />
          </div>
        ))}
      </div>
    </section>
  );
}
