"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { HERO_READOUTS } from "@/lib/constants";
import { scrollToSection, prefersReducedMotion } from "@/lib/utils";

export default function Hero() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const reduced = prefersReducedMotion();
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: "power3.out" },
        delay: reduced ? 0 : 0.15,
      });

      tl.from(".hero-label", {
        opacity: 0,
        y: 10,
        duration: reduced ? 0.3 : 0.7,
      })
        .from(
          ".hero-line",
          {
            opacity: 0,
            y: reduced ? 0 : 40,
            duration: reduced ? 0.3 : 0.9,
            stagger: reduced ? 0 : 0.12,
          },
          "-=0.35"
        )
        .from(
          ".hero-sub",
          { opacity: 0, y: 14, duration: reduced ? 0.3 : 0.7 },
          "-=0.5"
        )
        .from(
          ".hero-cta",
          { opacity: 0, y: 10, duration: reduced ? 0.3 : 0.6 },
          "-=0.5"
        )
        .from(
          ".hero-readout",
          {
            opacity: 0,
            y: 8,
            duration: reduced ? 0.3 : 0.6,
            stagger: reduced ? 0 : 0.08,
          },
          "-=0.4"
        )
        .from(
          ".hero-scroll",
          { opacity: 0, duration: reduced ? 0.2 : 0.6 },
          "-=0.2"
        );
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="hero"
      ref={rootRef}
      className="relative flex min-h-[100svh] flex-col justify-center overflow-hidden px-6 pt-28 pb-16 md:px-10 lg:px-16"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 z-0 w-full sm:w-[65%] lg:w-[55%]"
        style={{
          background:
            "radial-gradient(120% 90% at 0% 45%, rgba(5,5,6,0.88) 0%, rgba(5,5,6,0.6) 50%, rgba(5,5,6,0) 88%)",
        }}
      />

      <div className="relative z-10 max-w-xl">
        <p className="hero-label mb-6 font-mono text-[11px] tracking-[0.3em] text-[#ff8a3d]">
          SYSTEM 01 / COMPUTATIONAL CORE
        </p>

        <h1 className="text-[13vw] font-semibold leading-[0.95] tracking-tight text-[#f5f5f2] sm:text-6xl md:text-7xl lg:text-[5.5rem]">
          <span className="hero-line block overflow-hidden">COMPUTING</span>
          <span className="hero-line block overflow-hidden">BEYOND</span>
          <span className="hero-line block overflow-hidden text-[#8a8a8f]">
            THE POSSIBLE.
          </span>
        </h1>

        <p className="hero-sub mt-8 max-w-md text-balance text-[15px] leading-relaxed text-[#a3a3aa]">
          Neuralis engineers high-performance computational systems designed
          for the next generation of intelligent infrastructure.
        </p>

        <button
          onClick={() => scrollToSection("technology")}
          className="hero-cta group mt-10 inline-flex items-center gap-3 font-mono text-xs tracking-[0.25em] text-[#f5f5f2]"
        >
          EXPLORE TECHNOLOGY
          <span className="transition-transform duration-300 group-hover:translate-x-1.5">
            →
          </span>
          <span className="h-px w-8 bg-[#ff8a3d] transition-all duration-300 group-hover:w-14" />
        </button>
      </div>

      <dl className="mt-16 grid grid-cols-2 gap-x-8 gap-y-5 sm:mt-20 sm:flex sm:flex-wrap sm:gap-x-12 lg:absolute lg:bottom-24 lg:right-10 lg:mt-0 lg:flex lg:max-w-[220px] lg:flex-col lg:gap-6">
        {HERO_READOUTS.map((item) => (
          <div key={item.label} className="hero-readout">
            <dt className="font-mono text-[9px] tracking-[0.2em] text-[#86868d]">
              {item.label}
            </dt>
            <dd className="mt-1 font-mono text-[13px] text-[#d8d8dc]">
              {item.value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="hero-scroll absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-3">
        <span className="font-mono text-[10px] tracking-[0.3em] text-[#86868d]">
          SCROLL TO EXPLORE
        </span>
        <span className="relative h-10 w-px overflow-hidden bg-white/10">
          <span className="scroll-line absolute inset-x-0 top-0 h-1/2 bg-[#ff8a3d]" />
        </span>
      </div>
    </section>
  );
}
