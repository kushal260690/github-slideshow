"use client";

import { useMemo } from "react";
import { MapView, type MapLine, type MapPoint } from "@/components/MapView";
import { usePrefs } from "@/components/Preferences";
import { WORLD_REGIONS } from "@/data/geography";
import { MIGRATION_ROUTES } from "@/data/migration";
import { TANDAS } from "@/data/tandas";
import { markerState } from "@/lib/format";

/**
 * The homepage hero is the real map, in globe projection, slowly rotating.
 *
 * Using the actual map rather than an illustration is the point: the first
 * thing a reader sees is the instrument they are about to use, and a decorative
 * mock-up of a globe would be one more thing on this site that looks like data
 * without being data.
 *
 * What is drawn, and what each thing means:
 *   - filled markers   the five demonstration records, in their marker colours
 *   - hollow rings     world regions OPEN FOR DOCUMENTATION — deliberately a
 *                      different shape, because they are not settlements and
 *                      must never be counted as any
 *   - arcs             the recorded migration routes
 *
 * Under reduced-motion or low-data the globe is replaced by a static SVG
 * that costs nothing to render and makes no network requests.
 */
export function HeroGlobe() {
  const { lowData } = usePrefs();

  const points: MapPoint[] = useMemo(
    () => [
      ...WORLD_REGIONS.map((r) => ({
        id: `region-${r.id}`,
        name: r.name,
        lng: r.centroid[0],
        lat: r.centroid[1],
        markerKey: "region",
        isDemo: false,
        completeness: 0,
      })),
      ...TANDAS.filter((t) => t.coordinates).map((t) => ({
        id: t.id,
        name: t.primaryName,
        lng: t.coordinates![0],
        lat: t.coordinates![1],
        markerKey: markerState(t.verification, t.settlementType).key,
        isDemo: t.isDemo,
        completeness: t.completenessPct,
      })),
    ],
    [],
  );

  const lines: MapLine[] = useMemo(
    () =>
      MIGRATION_ROUTES.filter((r) => !r.isDemo).map((r, i) => ({
        id: r.id,
        name: r.name,
        coordinates: r.waypoints.map((w) => w.coordinates),
        color: i === 0 ? "#d4674a" : "#2fb6bf",
      })),
    [],
  );

  if (lowData) return <StaticGlobe />;

  return (
    <div aria-hidden className="hero-decoration pointer-events-none absolute inset-0">
      <MapView
        points={points}
        lines={lines}
        cluster={false}
        interactive={false}
        globe
        autoSpin
        initialZoom={1.35}
        className="h-full w-full opacity-70"
      />
      {/* Vignette so the headline keeps its contrast over any part of the globe */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 45%, transparent 30%, var(--surface-0) 78%)",
        }}
      />
    </div>
  );
}

/** Zero-network, zero-animation fallback. */
function StaticGlobe() {
  const project = (lng: number, lat: number) => {
    const r = 150;
    const l = ((lng - 55) * Math.PI) / 180;
    const p = (lat * Math.PI) / 180;
    return {
      x: 200 + r * Math.cos(p) * Math.sin(l),
      y: 200 - r * Math.sin(p),
      front: Math.cos(p) * Math.cos(l) > 0,
    };
  };

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <svg viewBox="0 0 400 400" className="h-full w-auto opacity-60">
        <defs>
          <radialGradient id="limb" cx="40%" cy="35%">
            <stop offset="0%" stopColor="#1b1f3b" />
            <stop offset="100%" stopColor="#0b0d16" />
          </radialGradient>
        </defs>
        <circle cx="200" cy="200" r="150" fill="url(#limb)" stroke="var(--line-strong)" />
        {/* graticule */}
        {[-60, -30, 0, 30, 60].map((lat) => {
          const y = 200 - 150 * Math.sin((lat * Math.PI) / 180);
          const rx = 150 * Math.cos((lat * Math.PI) / 180);
          return (
            <ellipse
              key={lat}
              cx="200"
              cy={y}
              rx={rx}
              ry={rx * 0.18}
              fill="none"
              stroke="var(--line-strong)"
              strokeWidth="0.6"
              opacity="0.5"
            />
          );
        })}
        {[0, 30, 60, 90, 120, 150].map((a) => (
          <ellipse
            key={a}
            cx="200"
            cy="200"
            rx={150 * Math.abs(Math.cos((a * Math.PI) / 180))}
            ry="150"
            fill="none"
            stroke="var(--line-strong)"
            strokeWidth="0.6"
            opacity="0.4"
          />
        ))}
        {WORLD_REGIONS.map((r) => {
          const p = project(r.centroid[0], r.centroid[1]);
          if (!p.front) return null;
          return (
            <circle
              key={r.id}
              cx={p.x}
              cy={p.y}
              r="4"
              fill="none"
              stroke="var(--peacock)"
              strokeWidth="1.2"
              opacity="0.8"
            />
          );
        })}
      </svg>
    </div>
  );
}
