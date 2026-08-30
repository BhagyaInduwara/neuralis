"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { PERFORMANCE_STATS } from "@/lib/constants";
import { prefersReducedMotion } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);

export default function Performance() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const reduced = prefersReducedMotion();
    const ctx = gsap.context(() => {
      gsap.from(".perf-heading", {
        opacity: 0,
        y: reduced ? 0 : 20,
        duration: reduced ? 0.3 : 0.7,
        ease: "power3.out",
        clearProps: "opacity,transform",
        scrollTrigger: { trigger: ".perf-heading", start: "top 85%" },
      });

      const stats = gsap.utils.toArray<HTMLElement>(".perf-value");
      stats.forEach((el) => {
        const target = parseFloat(el.dataset.value ?? "0");
        const decimals = parseInt(el.dataset.decimals ?? "0", 10);
        const proxy = { value: 0 };

        gsap.to(proxy, {
          value: target,
          duration: reduced ? 0.4 : 1.6,
          ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 88%", once: true },
          onUpdate: () => {
            el.textContent = proxy.value.toFixed(decimals);
          },
        });
      });
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="performance"
      ref={rootRef}
      className="relative px-6 py-32 md:px-10 lg:px-16"
    >
      <p className="mb-5 font-mono text-[11px] tracking-[0.3em] text-[#ff8a3d]">
        SYSTEM 03 / PERFORMANCE
      </p>
      <h2 className="perf-heading max-w-2xl text-4xl font-semibold leading-tight tracking-tight text-[#f5f5f2] md:text-5xl">
        BUILT TO SUSTAIN PEAK LOAD, INDEFINITELY.
      </h2>

      <div className="relative mt-20 grid grid-cols-1 gap-12 border-t border-white/10 pt-14 sm:grid-cols-3">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-x-4 -inset-y-2 bg-[#050506]/60 sm:hidden"
        />
        {PERFORMANCE_STATS.map((stat) => (
          <div key={stat.label} className="relative">
            <div className="flex items-baseline gap-2 font-mono text-[#f5f5f2]">
              <span
                className="perf-value text-5xl font-semibold tracking-tight tabular-nums md:text-6xl"
                data-value={stat.value}
                data-decimals={stat.decimals}
              >
                0
              </span>
              {stat.suffix && (
                <span className="text-2xl text-[#ff8a3d]">{stat.suffix}</span>
              )}
              {stat.unit && (
                <span className="text-xl text-[#8a8a8f]">{stat.unit}</span>
              )}
            </div>
            <p className="mt-3 font-mono text-[11px] tracking-[0.2em] text-[#86868d]">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
