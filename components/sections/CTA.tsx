"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SITE } from "@/lib/constants";
import { isTouchDevice, prefersReducedMotion } from "@/lib/utils";
import { RevealHeading, TypeLabel } from "@/components/ui/RevealText";

gsap.registerPlugin(ScrollTrigger);

const MAGNET_STRENGTH = 0.35;
const LABEL_STRENGTH = 0.18;

export default function CTA() {
  const rootRef = useRef<HTMLElement>(null);
  const zoneRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLAnchorElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const reduced = prefersReducedMotion();
    const ctx = gsap.context(() => {
      gsap.from(".cta-reveal", {
        opacity: 0,
        y: reduced ? 0 : 24,
        duration: reduced ? 0.3 : 0.8,
        delay: reduced ? 0 : 0.3,
        ease: "power3.out",
        clearProps: "opacity,transform",
        scrollTrigger: { trigger: rootRef.current, start: "top 70%" },
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  // Magnetic hover: the button (and, a little more, its label) lean toward
  // the cursor inside an enlarged hit zone, then spring back on leave.
  useEffect(() => {
    const zone = zoneRef.current;
    const button = buttonRef.current;
    const label = labelRef.current;
    if (!zone || !button || !label || isTouchDevice() || prefersReducedMotion()) return;

    const bx = gsap.quickTo(button, "x", { duration: 0.45, ease: "power3.out" });
    const by = gsap.quickTo(button, "y", { duration: 0.45, ease: "power3.out" });
    const lx = gsap.quickTo(label, "x", { duration: 0.45, ease: "power3.out" });
    const ly = gsap.quickTo(label, "y", { duration: 0.45, ease: "power3.out" });

    const onMove = (e: PointerEvent) => {
      const rect = button.getBoundingClientRect();
      const dx = e.clientX - (rect.left + rect.width / 2);
      const dy = e.clientY - (rect.top + rect.height / 2);
      bx(dx * MAGNET_STRENGTH);
      by(dy * MAGNET_STRENGTH);
      lx(dx * LABEL_STRENGTH);
      ly(dy * LABEL_STRENGTH);
    };
    const onLeave = () => {
      gsap.to([button, label], { x: 0, y: 0, duration: 0.9, ease: "elastic.out(1, 0.4)" });
    };

    zone.addEventListener("pointermove", onMove);
    zone.addEventListener("pointerleave", onLeave);
    return () => {
      zone.removeEventListener("pointermove", onMove);
      zone.removeEventListener("pointerleave", onLeave);
      gsap.killTweensOf([button, label]);
    };
  }, []);

  return (
    <section
      id="cta"
      ref={rootRef}
      className="relative flex min-h-[100svh] flex-col items-center justify-center px-6 pb-24 pt-[120px] text-center md:px-10"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(60% 45% at 50% 45%, rgba(5,5,6,0.82) 0%, rgba(5,5,6,0.45) 55%, rgba(5,5,6,0) 100%)",
        }}
      />

      <div className="relative z-10 flex flex-col items-center">
        <TypeLabel
          text="SYSTEM 06 / CONNECT"
          className="mb-6 font-mono text-[11px] tracking-[0.3em] text-[#ff8a3d]"
        />
        <RevealHeading
          lines={["READY TO COMPUTE", "WHAT COMES NEXT?"]}
          className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-[#f5f5f2] md:text-6xl"
        />

        <div className="cta-reveal mt-12">
          <div ref={zoneRef} className="-m-10 p-10">
            <a
              ref={buttonRef}
              href={`mailto:${SITE.contactEmail}`}
              data-cursor-hover
              className="group inline-flex items-center gap-3 border border-white/15 bg-[#050506]/60 px-7 py-4 font-mono text-xs tracking-[0.25em] text-[#f5f5f2] backdrop-blur-sm transition-[color,border-color,box-shadow,background-color] duration-300 hover:border-[#ff8a1f]/80 hover:bg-[#ff8a1f]/10 hover:text-[#ffb35c] hover:shadow-[0_0_28px_-2px_rgba(255,138,31,0.55),inset_0_0_18px_-6px_rgba(255,138,31,0.5)] focus-visible:shadow-[0_0_28px_-2px_rgba(255,138,31,0.55)]"
            >
              <span ref={labelRef} className="inline-flex items-center gap-3">
                START A CONVERSATION
                <span className="transition-[translate] duration-300 group-hover:translate-x-1.5">
                  →
                </span>
              </span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
