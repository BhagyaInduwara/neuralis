"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SITE } from "@/lib/constants";
import { prefersReducedMotion } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);

export default function CTA() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const reduced = prefersReducedMotion();
    const ctx = gsap.context(() => {
      gsap.from(".cta-reveal", {
        opacity: 0,
        y: reduced ? 0 : 24,
        duration: reduced ? 0.3 : 0.8,
        stagger: reduced ? 0 : 0.15,
        ease: "power3.out",
        clearProps: "opacity,transform",
        scrollTrigger: { trigger: rootRef.current, start: "top 80%" },
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      id="cta"
      ref={rootRef}
      className="relative flex min-h-[70vh] flex-col items-center justify-center px-6 py-32 text-center md:px-10"
    >
      <p className="cta-reveal mb-6 font-mono text-[11px] tracking-[0.3em] text-[#ff8a3d]">
        SYSTEM 06 / CONNECT
      </p>
      <h2 className="cta-reveal max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-[#f5f5f2] md:text-6xl">
        READY TO COMPUTE
        <br />
        WHAT COMES NEXT?
      </h2>
      <a
        href={`mailto:${SITE.contactEmail}`}
        data-cursor-hover
        className="cta-reveal group mt-12 inline-flex items-center gap-3 border border-white/15 px-7 py-4 font-mono text-xs tracking-[0.25em] text-[#f5f5f2] transition-colors duration-300 hover:border-[#ff8a3d]/60 hover:text-[#ff8a3d]"
      >
        START A CONVERSATION
        <span className="transition-transform duration-300 group-hover:translate-x-1.5">
          →
        </span>
      </a>
    </section>
  );
}
