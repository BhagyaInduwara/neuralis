"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { HERO_READOUTS } from "@/lib/constants";
import { scrollToSection, prefersReducedMotion } from "@/lib/utils";
import { RevealHeading, TypeLabel } from "@/components/ui/RevealText";

interface HeroProps {
  /** Flips true once the preloader has finished and the chip has powered on. */
  play: boolean;
}

export default function Hero({ play }: HeroProps) {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const reduced = prefersReducedMotion();
    const ctx = gsap.context(() => {
      const fadeTargets = [".hero-sub", ".hero-cta", ".hero-hud", ".hero-readout", ".hero-scroll"];
      gsap.set(fadeTargets, { opacity: 0, y: reduced ? 0 : 14 });
      if (!play) return;

      gsap
        .timeline({ defaults: { ease: "power3.out" }, delay: reduced ? 0 : 0.45 })
        .to(".hero-sub", { opacity: 1, y: 0, duration: reduced ? 0.3 : 0.8 })
        .to(".hero-cta", { opacity: 1, y: 0, duration: reduced ? 0.3 : 0.7 }, "-=0.55")
        .to(".hero-hud", { opacity: 1, y: 0, duration: reduced ? 0.3 : 0.6 }, "-=0.5")
        .to(
          ".hero-readout",
          { opacity: 1, y: 0, duration: reduced ? 0.3 : 0.6, stagger: reduced ? 0 : 0.08 },
          "-=0.45"
        )
        .to(".hero-scroll", { opacity: 1, y: 0, duration: reduced ? 0.2 : 0.6 }, "-=0.3");
    }, rootRef);

    return () => ctx.revert();
  }, [play]);

  return (
    <section
      id="hero"
      ref={rootRef}
      className="relative flex min-h-[100svh] flex-col justify-center overflow-hidden px-6 pb-28 pt-[120px] md:px-10 lg:px-16 stacked:justify-start"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 z-0 w-full sm:w-[65%] lg:w-[55%]"
        style={{
          background:
            "radial-gradient(120% 90% at 0% 45%, rgba(5,5,6,0.88) 0%, rgba(5,5,6,0.6) 50%, rgba(5,5,6,0) 88%)",
        }}
      />

      <div className="relative z-10 max-w-[40rem]">
        <TypeLabel
          play={play}
          text="SYSTEM 01 / COMPUTATIONAL CORE"
          className="mb-6 font-mono text-[11px] tracking-[0.3em] text-[#ff8a3d]"
        />

        <RevealHeading
          as="h1"
          play={play}
          delay={0.15}
          lines={["COMPUTING", "BEYOND", { text: "THE POSSIBLE.", className: "text-[#8a8a8f]" }]}
          className="text-[clamp(2.6rem,min(13vw,11svh),5rem)] font-semibold leading-[0.95] tracking-tight text-[#f5f5f2]"
        />

        <p className="hero-sub mt-8 max-w-md text-balance text-[15px] leading-relaxed text-[#a3a3aa]">
          Neuralis engineers high-performance computational systems designed
          for the next generation of intelligent infrastructure.
        </p>

        <button
          onClick={() => scrollToSection("technology")}
          className="hero-cta group mt-10 inline-flex items-center gap-3 font-mono text-xs tracking-[0.25em] text-[#f5f5f2]"
        >
          EXPLORE TECHNOLOGY
          <span className="transition-[translate] duration-300 group-hover:translate-x-1.5">
            →
          </span>
          <span className="h-px w-8 bg-[#ff8a3d] transition-[width] duration-300 group-hover:w-14" />
        </button>
      </div>

      {/* Desktop HUD: a compact 2x2 block parked left of the section rail. */}
      <dl className="hero-hud absolute bottom-12 right-[220px] z-10 hidden grid-cols-2 gap-x-10 gap-y-5 border border-white/[0.06] bg-[#050506]/70 px-5 py-4 backdrop-blur-sm xl:grid">
        {HERO_READOUTS.map((item) => (
          <div key={item.label} className="hero-readout">
            <dt className="font-mono text-[9px] tracking-[0.2em] text-[#86868d]">
              {item.label}
            </dt>
            <dd className="mt-1 font-mono text-[13px] text-[#d8d8dc]">{item.value}</dd>
          </div>
        ))}
      </dl>

      <div className="hero-scroll absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-3 [@media(max-height:700px)]:hidden">
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
