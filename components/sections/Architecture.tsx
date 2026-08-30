"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ARCHITECTURE_NODES } from "@/lib/constants";
import { architectureState, interactionState } from "@/lib/sceneState";
import { prefersReducedMotion } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);

const RADIUS = 38;

export default function Architecture() {
  const rootRef = useRef<HTMLElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [activeNode, setActiveNode] = useState<string | null>(null);

  const nodes = useMemo(
    () =>
      ARCHITECTURE_NODES.map((node) => {
        const rad = (node.angle * Math.PI) / 180;
        return {
          ...node,
          x: 50 + Math.cos(rad) * RADIUS,
          y: 50 + Math.sin(rad) * RADIUS,
        };
      }),
    []
  );

  useEffect(() => {
    const reduced = prefersReducedMotion();
    const ctx = gsap.context(() => {
      gsap.from(".arch-heading", {
        opacity: 0,
        y: reduced ? 0 : 20,
        duration: reduced ? 0.3 : 0.7,
        ease: "power3.out",
        clearProps: "opacity,transform",
        scrollTrigger: { trigger: ".arch-heading", start: "top 85%" },
      });

      const lines = svgRef.current?.querySelectorAll<SVGLineElement>(
        "line[data-arch-line]"
      );
      lines?.forEach((line) => {
        const length = line.getTotalLength();
        gsap.set(line, { strokeDasharray: length, strokeDashoffset: length });
        gsap.to(line, {
          strokeDashoffset: 0,
          duration: reduced ? 0.4 : 1.1,
          ease: "power2.inOut",
          scrollTrigger: { trigger: ".arch-diagram", start: "top 78%" },
        });
      });

      gsap.from(".arch-node", {
        opacity: 0,
        scale: reduced ? 1 : 0.6,
        duration: reduced ? 0.3 : 0.6,
        stagger: reduced ? 0 : 0.08,
        ease: "back.out(1.7)",
        clearProps: "opacity,transform",
        scrollTrigger: { trigger: ".arch-diagram", start: "top 75%" },
      });
    }, rootRef);

    return () => ctx.revert();
  }, []);

  const setHover = (id: string | null) => {
    setActiveNode(id);
    architectureState.hoveredNode = id;
    interactionState.pulseTarget = id ? 1 : 0;
  };

  return (
    <section
      id="architecture"
      ref={rootRef}
      className="relative px-6 py-32 md:px-10 lg:px-16"
    >
      <div className="max-w-2xl">
        <p className="mb-5 font-mono text-[11px] tracking-[0.3em] text-[#ff8a3d]">
          SYSTEM 04 / ARCHITECTURE
        </p>
        <h2 className="arch-heading text-4xl font-semibold leading-tight tracking-tight text-[#f5f5f2] md:text-5xl">
          ONE CORE, FIVE SUBSYSTEMS,
          <br />
          ZERO BOTTLENECKS.
        </h2>
      </div>

      <div className="arch-diagram relative mx-auto mt-20 aspect-square w-full max-w-[560px]">
        <svg
          ref={svgRef}
          viewBox="0 0 100 100"
          className="absolute inset-0 h-full w-full overflow-visible"
          aria-hidden="true"
        >
          {nodes.map((node) => (
            <line
              key={node.id}
              data-arch-line
              x1={50}
              y1={50}
              x2={node.x}
              y2={node.y}
              stroke={activeNode === node.id ? "#ff8a3d" : "#3c3f48"}
              strokeWidth={activeNode === node.id ? 0.5 : 0.25}
              className="transition-[stroke,stroke-width] duration-300"
            />
          ))}
          <circle cx={50} cy={50} r={6.5} fill="#0a0a0c" stroke="#ff8a3d" strokeWidth={0.3} />
        </svg>

        <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
          <span className="font-mono text-[9px] tracking-[0.2em] text-[#ff8a3d]">
            CORE
          </span>
        </div>

        {nodes.map((node) => (
          <button
            key={node.id}
            data-cursor-hover
            style={{ left: `${node.x}%`, top: `${node.y}%` }}
            className="arch-node group absolute -translate-x-1/2 -translate-y-1/2"
            onMouseEnter={() => setHover(node.id)}
            onMouseLeave={() => setHover(null)}
            onFocus={() => setHover(node.id)}
            onBlur={() => setHover(null)}
            aria-describedby={`${node.id}-tooltip`}
          >
            <span
              className={`block h-3 w-3 rounded-full border transition-all duration-300 ${
                activeNode === node.id
                  ? "scale-125 border-[#ff8a3d] bg-[#ff8a3d] shadow-[0_0_18px_4px_rgba(255,138,61,0.5)]"
                  : "border-white/40 bg-[#0a0a0c] group-hover:border-[#ff8a3d]/70"
              }`}
            />
            <span className="absolute top-5 left-1/2 w-max -translate-x-1/2 font-mono text-[9px] tracking-[0.18em] text-[#8a8a8f] group-hover:text-[#f5f5f2]">
              {node.label}
            </span>
            <span
              id={`${node.id}-tooltip`}
              role="tooltip"
              className={`pointer-events-none absolute left-1/2 top-9 w-44 -translate-x-1/2 rounded-sm border border-white/10 bg-[#08080a] p-3 text-[11px] leading-relaxed text-[#a3a3aa] shadow-xl transition-all duration-300 ${
                activeNode === node.id
                  ? "translate-y-0 opacity-100"
                  : "pointer-events-none -translate-y-1 opacity-0"
              }`}
            >
              {node.description}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
