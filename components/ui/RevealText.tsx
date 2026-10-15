"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);

type Line = string | { text: string; className?: string };

interface RevealHeadingProps {
  as?: "h1" | "h2";
  lines: Line[];
  className?: string;
  /** Omit to reveal on scroll-in; pass a boolean to drive it manually. */
  play?: boolean;
  delay?: number;
}

/**
 * Heading split into lines, each sliding up from behind a clip-path mask.
 * The inset extends slightly past the line box so glyph overhangs and
 * punctuation aren't shaved off once the line has settled.
 */
export function RevealHeading({
  as: Tag = "h2",
  lines,
  className = "",
  play,
  delay = 0,
}: RevealHeadingProps) {
  const ref = useRef<HTMLHeadingElement>(null);
  const manual = play !== undefined;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = prefersReducedMotion();
    const inners = el.querySelectorAll<HTMLElement>("[data-line]");

    const ctx = gsap.context(() => {
      gsap.set(inners, reduced ? { opacity: 0 } : { yPercent: 115 });
      const reveal = () =>
        gsap.to(
          inners,
          reduced
            ? { opacity: 1, duration: 0.4, delay }
            : { yPercent: 0, duration: 1.05, ease: "power4.out", stagger: 0.1, delay }
        );

      if (manual) {
        if (play) reveal();
      } else {
        ScrollTrigger.create({ trigger: el, start: "top 85%", once: true, onEnter: reveal });
      }
    }, el);

    return () => ctx.revert();
  }, [manual, play, delay]);

  return (
    <Tag ref={ref} className={className}>
      {lines.map((line, i) => {
        const text = typeof line === "string" ? line : line.text;
        const lineClass = typeof line === "string" ? "" : line.className ?? "";
        return (
          <span
            key={i}
            className="block"
            style={{ clipPath: "inset(-0.1em -0.5em -0.14em -0.5em)" }}
          >
            <span data-line className={`block will-change-transform ${lineClass}`}>
              {text}
            </span>
          </span>
        );
      })}
    </Tag>
  );
}

interface TypeLabelProps {
  text: string;
  className?: string;
  play?: boolean;
  delay?: number;
}

/**
 * Small mono label that types itself in. An invisible copy of the full text
 * reserves the final size so nothing reflows while characters appear.
 */
export function TypeLabel({ text, className = "", play, delay = 0 }: TypeLabelProps) {
  const ref = useRef<HTMLParagraphElement>(null);
  const typedRef = useRef<HTMLSpanElement>(null);
  const manual = play !== undefined;

  useEffect(() => {
    const el = ref.current;
    const typed = typedRef.current;
    if (!el || !typed) return;
    const reduced = prefersReducedMotion();
    const proxy = { n: 0 };

    const render = () => {
      const n = Math.round(proxy.n);
      typed.textContent = text.slice(0, n) + (n < text.length ? "▍" : "");
    };

    if (reduced) {
      typed.textContent = text;
      return;
    }

    typed.textContent = "";
    let tween: gsap.core.Tween | null = null;
    const start = () => {
      tween = gsap.to(proxy, {
        n: text.length,
        duration: Math.min(0.025 * text.length + 0.2, 0.9),
        ease: "none",
        delay,
        onUpdate: render,
        onStart: render,
      });
    };

    let trigger: ScrollTrigger | null = null;
    if (manual) {
      if (play) start();
    } else {
      trigger = ScrollTrigger.create({ trigger: el, start: "top 90%", once: true, onEnter: start });
    }

    return () => {
      tween?.kill();
      trigger?.kill();
    };
  }, [text, manual, play, delay]);

  return (
    <p ref={ref} className={`relative ${className}`} aria-label={text}>
      <span aria-hidden="true" className="invisible">
        {text}
      </span>
      <span ref={typedRef} aria-hidden="true" className="absolute inset-0 whitespace-pre-wrap" />
    </p>
  );
}
