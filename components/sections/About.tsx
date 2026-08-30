"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);

export default function About() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const reduced = prefersReducedMotion();
    const ctx = gsap.context(() => {
      gsap.from(".about-reveal", {
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
      id="about"
      ref={rootRef}
      className="relative px-6 py-32 md:px-10 lg:px-16"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 z-0 w-full sm:w-[70%] lg:w-[60%]"
        style={{
          background:
            "radial-gradient(120% 90% at 0% 45%, rgba(5,5,6,0.85) 0%, rgba(5,5,6,0.55) 50%, rgba(5,5,6,0) 88%)",
        }}
      />

      <div className="relative z-10 max-w-2xl">
        <p className="about-reveal mb-5 font-mono text-[11px] tracking-[0.3em] text-[#ff8a3d]">
          SYSTEM 05 / ABOUT
        </p>
        <h2 className="about-reveal text-4xl font-semibold leading-tight tracking-tight text-[#f5f5f2] md:text-5xl">
          WE BUILD THE INFRASTRUCTURE
          <br />
          BEHIND WHAT COMES NEXT.
        </h2>
        <p className="about-reveal mt-8 max-w-lg text-[15px] leading-relaxed text-[#a3a3aa]">
          Neuralis is a computational systems company. We design the silicon,
          the interconnects, and the software layer that let intelligent
          infrastructure run at scale — quietly, efficiently, and without
          compromise. Every core we ship is built for the workloads of the
          decade ahead, not the one behind us.
        </p>
      </div>
    </section>
  );
}
