"use client";

import { useEffect, useState } from "react";
import { NAV_LINKS, SITE } from "@/lib/constants";
import { scrollToSection } from "@/lib/utils";

function NavLink({
  label,
  href,
  onClick,
}: {
  label: string;
  href: string;
  onClick: () => void;
}) {
  return (
    <a
      href={href}
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      className="group relative py-1 font-mono text-[11px] tracking-[0.25em] text-[#c9c9cf] transition-colors duration-300 hover:text-[#f5f5f2]"
    >
      {label}
      <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-[#ff8a3d] transition-all duration-300 ease-out group-hover:w-full" />
    </a>
  );
}

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const go = (href: string) => {
    setMenuOpen(false);
    scrollToSection(href.replace("#", ""));
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "border-b border-white/[0.06] bg-[#050506]/70 backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-5 md:px-10">
        <a
          href="#hero"
          onClick={(e) => {
            e.preventDefault();
            go("#hero");
          }}
          className="font-mono text-[13px] font-medium tracking-[0.35em] text-[#f5f5f2]"
        >
          {SITE.name}
        </a>

        <nav
          aria-label="Primary"
          className="hidden items-center gap-10 md:flex"
        >
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.href}
              label={link.label}
              href={link.href}
              onClick={() => go(link.href)}
            />
          ))}
        </nav>

        <a
          href="#cta"
          onClick={(e) => {
            e.preventDefault();
            go("#cta");
          }}
          className="hidden border border-white/15 px-4 py-2 font-mono text-[11px] tracking-[0.25em] text-[#f5f5f2] transition-colors duration-300 hover:border-[#ff8a3d]/60 hover:text-[#ff8a3d] md:inline-block"
        >
          [ CONNECT ]
        </a>

        <button
          type="button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
          className="flex h-8 w-8 flex-col items-center justify-center gap-1.5 md:hidden"
        >
          <span
            className={`h-px w-5 bg-[#f5f5f2] transition-transform duration-300 ${
              menuOpen ? "translate-y-[3.5px] rotate-45" : ""
            }`}
          />
          <span
            className={`h-px w-5 bg-[#f5f5f2] transition-transform duration-300 ${
              menuOpen ? "-translate-y-[3.5px] -rotate-45" : ""
            }`}
          />
        </button>
      </div>

      {menuOpen && (
        <nav
          aria-label="Mobile"
          className="flex flex-col gap-1 border-t border-white/[0.06] bg-[#050506]/95 px-6 py-6 backdrop-blur-md md:hidden"
        >
          {NAV_LINKS.map((link) => (
            <button
              key={link.href}
              onClick={() => go(link.href)}
              className="py-3 text-left font-mono text-xs tracking-[0.25em] text-[#c9c9cf] hover:text-[#ff8a3d]"
            >
              {link.label}
            </button>
          ))}
          <button
            onClick={() => go("#cta")}
            className="mt-2 border border-white/15 px-4 py-3 text-left font-mono text-xs tracking-[0.25em] text-[#f5f5f2]"
          >
            [ CONNECT ]
          </button>
        </nav>
      )}
    </header>
  );
}
