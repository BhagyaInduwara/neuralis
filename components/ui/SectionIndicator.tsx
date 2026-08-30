"use client";

import { SECTIONS } from "@/lib/constants";
import { scrollToSection } from "@/lib/utils";
import { useActiveSection } from "@/hooks/useActiveSection";

export default function SectionIndicator() {
  const active = useActiveSection();

  return (
    <div className="fixed right-6 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-end gap-4 lg:flex">
      {SECTIONS.map((section) => {
        const isActive = section.id === active;
        return (
          <button
            key={section.id}
            onClick={() => scrollToSection(section.id)}
            aria-label={`Go to ${section.label} section`}
            aria-current={isActive}
            className="group flex items-center gap-3"
          >
            <span
              className={`font-mono text-[10px] tracking-[0.2em] transition-all duration-300 ${
                isActive
                  ? "translate-x-0 text-[#ff8a3d] opacity-100"
                  : "translate-x-1 text-[#8a8a8f] opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
              }`}
            >
              {section.index} / {section.label}
            </span>
            <span
              className={`h-1.5 rounded-full transition-all duration-300 ${
                isActive
                  ? "w-5 bg-[#ff8a3d]"
                  : "w-1.5 bg-white/25 group-hover:bg-white/50"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}
