"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MapView, type MapLine } from "@/components/MapView";
import { InterpretationChip, SourceList, VerificationChip } from "@/components/ui";
import { formatPeriod } from "@/lib/format";
import type { MigrationRoute } from "@/lib/types";

/* Decorative route colours from the Banjara palette — they distinguish routes
   from one another and carry no claim about evidence quality. */
const ROUTE_COLORS = ["#ff8a1f", "#26d3d3", "#f0409c", "#2fd07a"];

const YEAR_MIN = 1500;
const YEAR_MAX = 2000;
const STEP = 25;

/**
 * Animated migration map with a timeline scrubber.
 *
 * The editorial point of this screen is in the right-hand panel, not the
 * animation: selecting a route shows each interpretation of it *separately*,
 * with its own label and sources. A single route can be documented as to the
 * trade that moved along it and disputed as to its precise corridor, and the
 * panel shows both rather than averaging them into one confidence.
 *
 * Keyboard: the slider is a native range input, so arrow keys, Home and End
 * work without extra code, and explicit step buttons satisfy WCAG 2.5.7
 * (dragging movements must have a non-dragging alternative).
 */
export function MigrationMap({ routes }: { routes: MigrationRoute[] }) {
  const [year, setYear] = useState(YEAR_MAX);
  const [playing, setPlaying] = useState(false);
  const [selected, setSelected] = useState<string | null>(routes[0]?.id ?? null);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (!playing) return;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setYear(YEAR_MAX);
      setPlaying(false);
      return;
    }
    let last = performance.now();
    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      setYear((y) => {
        const next = y + dt * 0.05;
        if (next >= YEAR_MAX) {
          setPlaying(false);
          return YEAR_MAX;
        }
        return next;
      });
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [playing]);

  const lines: MapLine[] = useMemo(
    () =>
      routes.map((r, i) => {
        const start = r.period.start ?? YEAR_MIN;
        const end = r.period.end ?? YEAR_MAX;
        const span = Math.max(1, end - start);
        const progress = Math.max(0, Math.min(1, (year - start) / span));
        return {
          id: r.id,
          name: r.name,
          coordinates: r.waypoints.map((w) => w.coordinates),
          color:
            selected === null || selected === r.id
              ? ROUTE_COLORS[i % ROUTE_COLORS.length]
              : "#5c5480",
          progress,
        };
      }),
    [routes, year, selected],
  );

  const visibleRoutes = routes.filter((r) => (r.period.start ?? YEAR_MIN) <= year);
  const activeRoute = routes.find((r) => r.id === selected) ?? null;

  const chip =
    "rounded-sm border border-line px-2 py-1 text-[11px] text-muted hover:border-peacock hover:text-peacock";

  return (
    <div className="flex flex-col lg:flex-row">
      <div className="relative min-h-[420px] flex-1 lg:h-[calc(100vh-10rem)]">
        <MapView lines={lines} baseLayer="archival" cluster={false} className="h-full w-full" />

        <div className="absolute inset-x-3 bottom-3 z-10 rounded-lg border border-line-strong bg-surface-1/95 p-3 backdrop-blur">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <label htmlFor="year" className="text-xs text-muted">
              Timeline —{" "}
              <span className="tabular font-display text-lg text-ink-strong">
                {Math.round(year)}
              </span>
            </label>
            <div className="flex items-center gap-1">
              <button
                type="button"
                className={chip}
                onClick={() => setYear((y) => Math.max(YEAR_MIN, y - STEP))}
              >
                ← {STEP} years
              </button>
              <button type="button" className={chip} onClick={() => setPlaying((p) => !p)}>
                {playing ? "Pause" : "Play"}
              </button>
              <button
                type="button"
                className={chip}
                onClick={() => setYear((y) => Math.min(YEAR_MAX, y + STEP))}
              >
                {STEP} years →
              </button>
            </div>
          </div>
          <input
            id="year"
            type="range"
            min={YEAR_MIN}
            max={YEAR_MAX}
            step={5}
            value={Math.round(year)}
            onChange={(e) => {
              setPlaying(false);
              setYear(Number(e.target.value));
            }}
            className="w-full accent-[var(--terracotta)]"
            aria-valuetext={`Year ${Math.round(year)}`}
          />
          <div className="mt-1 flex justify-between text-[10px] text-muted">
            <span>{YEAR_MIN}</span>
            <span>Era boundaries are approximate markers, not dates</span>
            <span>{YEAR_MAX}</span>
          </div>
        </div>
      </div>

      <aside className="w-full shrink-0 overflow-y-auto border-line bg-surface-1 lg:h-[calc(100vh-10rem)] lg:w-96 lg:border-l">
        <div className="border-b border-line p-4">
          <h2 className="font-display text-lg text-ink-strong">
            Routes visible at {Math.round(year)}
          </h2>
          <p className="mt-1 text-xs text-muted">
            {visibleRoutes.length} of {routes.length} recorded routes
          </p>
        </div>

        <ul className="divide-y divide-line">
          {routes.map((r, i) => (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => setSelected(r.id)}
                className={`w-full px-4 py-3 text-left hover:bg-surface-2 ${
                  selected === r.id ? "bg-surface-2" : ""
                }`}
              >
                <span className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className="inline-block h-1 w-6 rounded-full"
                    style={{ backgroundColor: ROUTE_COLORS[i % ROUTE_COLORS.length] }}
                  />
                  <span className="font-display text-base text-ink-strong">{r.name}</span>
                  {r.isDemo ? (
                    <span className="rounded-sm bg-v-disputed px-1 text-[10px] font-bold text-white">
                      DEMO
                    </span>
                  ) : null}
                </span>
                <span className="mt-0.5 block text-[11px] text-muted">
                  {formatPeriod(r.period)}
                </span>
              </button>
            </li>
          ))}
        </ul>

        {activeRoute ? (
          <div className="border-t border-line p-4">
            <h3 className="font-display text-base text-ink-strong">The evidence</h3>
            <p className="mt-1 text-xs text-muted">{activeRoute.description}</p>
            <p className="mt-3 rounded-sm border border-line bg-surface-0 p-2 text-[11px] text-muted">
              This route carries {activeRoute.evidence.length} evidence{" "}
              {activeRoute.evidence.length === 1 ? "entry" : "entries"} with different labels. They
              are shown separately on purpose — different aspects of one route have different
              evidential standing.
            </p>
            <ul className="mt-3 space-y-3">
              {activeRoute.evidence.map((e, i) => (
                <li key={i} className="rounded-lg border border-line bg-surface-0 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <InterpretationChip label={e.interpretation} />
                    <VerificationChip status={e.verification} size="sm" />
                  </div>
                  <p className="mt-2 text-xs text-ink">{e.summary}</p>
                  <div className="mt-2">
                    <SourceList ids={e.sourceIds} emptyNote="No source attached to this reading." />
                  </div>
                  {e.editorialNote ? (
                    <p className="mt-2 text-[11px] italic text-muted">
                      Editorial note: {e.editorialNote}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>

            <h4 className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-terracotta">
              Waypoints
            </h4>
            <ol className="mt-1 space-y-0.5 text-[11px] text-muted">
              {activeRoute.waypoints.map((w, i) => (
                <li key={i}>
                  {i + 1}. {w.label}
                </li>
              ))}
            </ol>
            <p className="mt-2 text-[11px] italic text-muted">
              Waypoints are coarse regional anchors used to draw a line. They are not a claim that
              any specific group passed through any specific place.
            </p>
          </div>
        ) : null}
      </aside>
    </div>
  );
}
