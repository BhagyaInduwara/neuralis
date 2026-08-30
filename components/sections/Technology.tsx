"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { TECHNOLOGY_CARDS } from "@/lib/constants";
import { interactionState } from "@/lib/sceneState";
import { prefersReducedMotion } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);

export default function Technology() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const reduced = prefersReducedMotion();
    const ctx = gsap.context(() => {
      gsap.from(".tech-heading", {
        opacity: 0,
        y: reduced ? 0 : 24,
        duration: reduced ? 0.3 : 0.8,
        ease: "power3.out",
        clearProps: "opacity,transform",
        scrollTrigger: { trigger: ".tech-heading", start: "top 85%" },
      });
      gsap.from(".tech-card", {
        opacity: 0,
        y: reduced ? 0 : 36,
        duration: reduced ? 0.3 : 0.8,
        stagger: reduced ? 0 : 0.15,
        ease: "power3.out",
        clearProps: "opacity,transform",
        scrollTrigger: { trigger: ".tech-grid", start: "top 82%" },
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      id="technology"
      ref={rootRef}
      className="relative px-6 py-32 md:px-10 lg:px-16"
    >
      <div className="max-w-3xl">
        <p className="mb-5 font-mono text-[11px] tracking-[0.3em] text-[#ff8a3d]">
          SYSTEM 02 / TECHNOLOGY
        </p>
        <h2 className="tech-heading text-4xl font-semibold leading-tight tracking-tight text-[#f5f5f2] md:text-5xl">
          ENGINEERED FOR THE NEXT
          <br />
          COMPUTE ERA.
        </h2>
      </div>

      <div className="tech-grid mt-16 grid grid-cols-1 gap-px overflow-hidden rounded-sm border border-white/10 bg-white/10 md:grid-cols-3">
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
            className="tech-card group relative flex flex-col justify-between gap-8 bg-[#08080a] p-6 transition-all duration-500 hover:-translate-y-1.5 hover:bg-[#0c0c0f] sm:min-h-[280px] sm:p-8"
          >
            <div>
              <span className="font-mono text-xs text-[#86868d] transition-colors duration-500 group-hover:text-[#ff8a3d]">
                {card.index}
              </span>
              <h3 className="mt-6 text-lg font-medium tracking-wide text-[#f5f5f2]">
                {card.title}
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-[#8a8a8f]">
                {card.description}
              </p>
            </div>

            <div className="mt-8 h-px w-8 bg-white/15 transition-all duration-500 ease-out group-hover:w-full group-hover:bg-[#ff8a3d]" />

            <div className="pointer-events-none absolute inset-0 opacity-0 shadow-[inset_0_0_60px_-10px_rgba(255,138,61,0.35)] transition-opacity duration-500 group-hover:opacity-100" />
          </div>
        ))}
      </div>
    </section>
  );
}
