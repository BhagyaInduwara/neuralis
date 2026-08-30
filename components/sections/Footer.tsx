"use client";

import { FOOTER_LINKS, SITE } from "@/lib/constants";
import { scrollToSection } from "@/lib/utils";

export default function Footer() {
  return (
    <footer className="relative border-t border-white/10 bg-[#050506] px-6 py-14 md:px-10 lg:px-16">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-10 md:flex-row md:items-start md:justify-between">
        <span className="font-mono text-[13px] tracking-[0.35em] text-[#f5f5f2]">
          {SITE.name}
        </span>

        <nav
          aria-label="Footer"
          className="flex flex-wrap gap-x-10 gap-y-4"
        >
          {FOOTER_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={(e) => {
                if (link.href.startsWith("#")) {
                  e.preventDefault();
                  scrollToSection(link.href.replace("#", ""));
                }
              }}
              className="font-mono text-[11px] tracking-[0.2em] text-[#8a8a8f] transition-colors duration-300 hover:text-[#ff8a3d]"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>

      <p className="mx-auto mt-14 max-w-[1600px] font-mono text-[10px] tracking-[0.15em] text-[#86868d]">
        © 2026 NEURALIS LABS
      </p>
    </footer>
  );
}
