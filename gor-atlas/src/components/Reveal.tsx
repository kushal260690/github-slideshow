"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Scroll-triggered reveal.
 *
 * Deliberately conservative, following the motion rules in the design skill:
 *
 *  - transform and opacity only, so nothing here can trigger layout or CLS
 *  - 260ms, ease-out on enter (entering elements decelerate)
 *  - 40ms stagger per item in a group — fast enough to read as one gesture
 *  - fires once, then the element is left alone; content that re-animates on
 *    every scroll-past is the classic way to make a long archive page unusable
 *  - `prefers-reduced-motion` and low-data mode skip the animation entirely
 *    and render the final state immediately, rather than playing a shorter
 *    version of it
 *
 * The reveal is an enhancement layered on top of already-visible content: if
 * the observer never fires — old browser, JS failure — the element still ends
 * up at opacity 1, because the hidden state is applied only after mount.
 */
export function Reveal({
  children,
  delay = 0,
  y = 14,
  as: Tag = "div",
  className = "",
}: {
  children: ReactNode;
  /** Milliseconds. Use `index * 40` inside a list. */
  delay?: number;
  /** Distance travelled, in px. Kept small — this is a nudge, not an entrance. */
  y?: number;
  as?: "div" | "section" | "li" | "article";
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    const reduced =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ||
      document.documentElement.getAttribute("data-lowdata") === "on";
    if (reduced) {
      setShown(true);
      return;
    }
    setArmed(true);

    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) {
      setShown(true);
      return;
    }

    // Anything on screen or within the next couple of screens is shown at
    // once rather than animated in. Hiding content behind an observer is how
    // "invisible until you scroll" bugs happen, and it also breaks printing,
    // find-in-page and full-page capture. The window is generous on purpose:
    // the reveal is a nudge for content the reader scrolls a long way to
    // reach, not a gate on the top of the page.
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 2.5) {
      setShown(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true);
            io.disconnect();
          }
        }
      },
      // Slightly negative bottom margin so the element animates as it enters
      // the reading area rather than the instant it clears the fold.
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Printing must never lose content to an un-fired observer.
  useEffect(() => {
    if (!armed || shown) return;
    const before = () => setShown(true);
    window.addEventListener("beforeprint", before);
    return () => window.removeEventListener("beforeprint", before);
  }, [armed, shown]);

  const hidden = armed && !shown;

  return (
    <Tag
      ref={ref as never}
      className={className}
      style={{
        opacity: hidden ? 0 : 1,
        transform: hidden ? `translate3d(0, ${y}px, 0)` : "none",
        transition: armed
          ? `opacity 260ms cubic-bezier(.2,.8,.2,1) ${delay}ms, transform 260ms cubic-bezier(.2,.8,.2,1) ${delay}ms`
          : undefined,
        willChange: hidden ? "opacity, transform" : undefined,
      }}
    >
      {children}
    </Tag>
  );
}

/** Counts up to a value once visible. Falls straight to the value if reduced. */
export function CountUp({ value, duration = 900 }: { value: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const reduced =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ||
      document.documentElement.getAttribute("data-lowdata") === "on";
    // Counting up from zero to zero is pointless, and most counters here are
    // legitimately zero.
    if (reduced || value === 0) {
      setDisplay(value);
      return;
    }
    setDisplay(0);

    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) {
      setDisplay(value);
      return;
    }

    let raf = 0;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / duration);
          // ease-out cubic
          setDisplay(Math.round(value * (1 - Math.pow(1 - t, 3))));
          if (t < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, duration]);

  return (
    <span ref={ref} className="tabular">
      {display.toLocaleString("en-IN")}
    </span>
  );
}
