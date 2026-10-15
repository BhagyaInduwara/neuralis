"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { PERFORMANCE_STATS } from "@/lib/constants";
import { prefersReducedMotion } from "@/lib/utils";
import { RevealHeading, TypeLabel } from "@/components/ui/RevealText";

gsap.registerPlugin(ScrollTrigger);

export default function Performance() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const reduced = prefersReducedMotion();
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".perf-value").forEach((el) => {
        const target = parseFloat(el.dataset.value ?? "0");
        const decimals = parseInt(el.dataset.decimals ?? "0", 10);
        const proxy = { value: 0 };
        el.textContent = (0).toFixed(decimals);

        gsap.to(proxy, {
          value: target,
          duration: reduced ? 0.4 : 1.8,
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
      className="relative flex min-h-[100svh] flex-col justify-center px-6 pb-24 pt-[120px] md:px-10 lg:px-16 lg:pr-[220px]"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 hidden sm:block"
        style={{
          background:
            "radial-gradient(80% 70% at 15% 60%, rgba(5,5,6,0.82) 0%, rgba(5,5,6,0.5) 55%, rgba(5,5,6,0) 100%)",
        }}
      />
      <TypeLabel
        text="SYSTEM 03 / PERFORMANCE"
        className="mb-5 font-mono text-[11px] tracking-[0.3em] text-[#ff8a3d]"
      />
      <RevealHeading
        lines={["BUILT TO SUSTAIN PEAK LOAD,", "INDEFINITELY."]}
        className="relative max-w-2xl text-4xl font-semibold leading-tight tracking-tight text-[#f5f5f2] md:text-5xl"
      />

      <div className="relative mt-16 grid grid-cols-1 gap-10 border-t border-white/10 pt-12 sm:grid-cols-3 sm:gap-12 [@media(max-height:760px)]:mt-10">
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
                {stat.value.toFixed(stat.decimals)}
              </span>
              {stat.suffix && <span className="text-2xl text-[#ff8a3d]">{stat.suffix}</span>}
              {stat.unit && <span className="text-xl text-[#8a8a8f]">{stat.unit}</span>}
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
