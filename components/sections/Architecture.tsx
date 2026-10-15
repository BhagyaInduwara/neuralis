"use client";

import { ARCHITECTURE_NODES } from "@/lib/constants";
import { RevealHeading, TypeLabel } from "@/components/ui/RevealText";

/**
 * The diagram itself is rendered in 3D (ArchitectureModules) with labels
 * that track the modules. This section supplies the copy, plus a plain list
 * of the subsystems for screen readers — shown visibly when WebGL is off.
 */
export default function Architecture() {
  return (
    <section
      id="architecture"
      className="relative flex min-h-[100svh] flex-col justify-center px-6 pb-24 pt-[120px] md:px-10 lg:px-16 stacked:justify-start"
    >
      <div id="arch-copy" className="relative z-10 w-fit max-w-md">
        <TypeLabel
          text="SYSTEM 04 / ARCHITECTURE"
          className="mb-5 font-mono text-[11px] tracking-[0.3em] text-[#ff8a3d]"
        />
        <RevealHeading
          lines={["ONE CORE,", "FIVE SUBSYSTEMS,", "ZERO BOTTLENECKS."]}
          className="text-[clamp(1.75rem,8.4vw,2.25rem)] font-semibold leading-tight tracking-tight text-[#f5f5f2] md:text-[clamp(2.25rem,3.3vw,3rem)]"
        />

        <ul className="arch-list mt-10 grid-cols-1 gap-4 sm:grid-cols-2">
          {ARCHITECTURE_NODES.map((node, i) => (
            <li key={node.id} className="border-l border-[#ff8a3d]/40 pl-4">
              <span className="font-mono text-[11px] tracking-[0.2em] text-[#f5f5f2]">
                <span className="text-[#ff8a3d]">{String(i + 1).padStart(2, "0")}</span>{" "}
                {node.label}
              </span>
              <p className="mt-1 text-[13px] leading-relaxed text-[#8a8a8f]">{node.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
