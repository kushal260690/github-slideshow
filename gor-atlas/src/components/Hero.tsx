"use client";

import { useMemo } from "react";
import { STATES } from "@/data/geography";
import { MIGRATION_ROUTES } from "@/data/migration";
import { usePrefs } from "@/components/Preferences";

/**
 * Homepage hero.
 *
 * A stylised map of India drawn as an SVG, not a tile map: the hero must
 * render instantly on a slow connection, and a decorative basemap would cost
 * a dozen network requests before the headline appears.
 *
 * The glow points are placed at STATE CENTROIDS and are explicitly labelled in
 * the caption as decoration. They are not settlement markers — putting
 * thousands of invented dots on a map of a community whose settlements are
 * largely undocumented would be the exact fabrication this project refuses,
 * however good it looks.
 */
export function Hero() {
  const { lowData } = usePrefs();

  // Rough outline of India for a decorative silhouette. Coarse by design.
  const outline =
    "M 200 40 L 250 55 L 300 45 L 340 70 L 370 60 L 400 90 L 420 130 L 445 150 L 470 200 L 460 250 L 430 300 L 420 350 L 400 420 L 370 480 L 340 540 L 310 600 L 290 660 L 270 700 L 250 660 L 230 600 L 200 540 L 175 480 L 150 420 L 130 360 L 110 300 L 95 250 L 80 200 L 90 150 L 120 110 L 150 70 Z";

  const points = useMemo(
    () =>
      STATES.map((s, i) => ({
        // Project rough lng/lat into the decorative viewbox.
        x: ((s.centroid[0] - 67) / 31.5) * 400 + 70,
        y: ((36.5 - s.centroid[1]) / 30.5) * 660 + 40,
        delay: (i % 7) * 0.55,
      })),
    [],
  );

  const arcs = useMemo(
    () =>
      MIGRATION_ROUTES.filter((r) => !r.isDemo).map((r) => {
        const pts = r.waypoints.map((w) => ({
          x: ((w.coordinates[0] - 67) / 31.5) * 400 + 70,
          y: ((36.5 - w.coordinates[1]) / 30.5) * 660 + 40,
        }));
        return pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
      }),
    [],
  );

  return (
    <div
      aria-hidden
      className="hero-decoration pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden"
    >
      <svg viewBox="0 0 560 760" className="h-full w-auto opacity-70">
        <defs>
          <radialGradient id="glow">
            <stop offset="0%" stopColor="var(--peacock)" stopOpacity="0.9" />
            <stop offset="100%" stopColor="var(--peacock)" stopOpacity="0" />
          </radialGradient>
        </defs>

        <path
          d={outline}
          fill="color-mix(in srgb, var(--indigo) 70%, transparent)"
          stroke="var(--line-strong)"
          strokeWidth="1"
        />

        {!lowData
          ? arcs.map((d, i) => (
              <path
                key={i}
                d={d}
                fill="none"
                stroke="var(--terracotta)"
                strokeWidth="1.5"
                strokeOpacity="0.5"
                className="animate-draw"
                style={{ ["--dash" as string]: "900", animationDelay: `${i * 0.8}s` }}
              />
            ))
          : arcs.map((d, i) => (
              <path
                key={i}
                d={d}
                fill="none"
                stroke="var(--terracotta)"
                strokeWidth="1.5"
                strokeOpacity="0.35"
              />
            ))}

        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="14" fill="url(#glow)" opacity="0.5" />
            <circle
              cx={p.x}
              cy={p.y}
              r="2.5"
              fill="var(--peacock)"
              className={lowData ? "" : "animate-pulse-point"}
              style={{ animationDelay: `${p.delay}s` }}
            />
          </g>
        ))}
      </svg>
    </div>
  );
}
