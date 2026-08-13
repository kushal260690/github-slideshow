"use client";

import { useMemo, useState } from "react";
import { InterpretationChip, SourceList, VerificationChip } from "@/components/ui";
import { formatPeriod, periodPrecisionNote } from "@/lib/format";
import type { HistoricalEvent } from "@/lib/types";

/**
 * Interactive timeline.
 *
 * The width of each event bar is the width of its *evidence*, not a decorative
 * choice: an event dated to a century occupies a century of the axis. A reader
 * can see at a glance which claims are precisely dated and which are broad —
 * which is information that a list of bullet points with years destroys.
 */
export function Timeline({
  events,
  title = "Timeline",
  emptyNote,
}: {
  events: HistoricalEvent[];
  title?: string;
  emptyNote?: string;
}) {
  const [selected, setSelected] = useState<string | null>(events[0]?.id ?? null);

  const dated = useMemo(
    () => events.filter((e) => e.period.start !== null).sort((a, b) => a.period.start! - b.period.start!),
    [events],
  );
  const undated = events.filter((e) => e.period.start === null);

  const bounds = useMemo(() => {
    if (dated.length === 0) return { min: 1500, max: 2050 };
    const min = Math.min(...dated.map((e) => e.period.start!));
    const max = Math.max(...dated.map((e) => e.period.end ?? e.period.start!));
    const pad = Math.max(20, Math.round((max - min) * 0.08));
    return { min: min - pad, max: max + pad };
  }, [dated]);

  const span = bounds.max - bounds.min;
  const pos = (y: number) => ((y - bounds.min) / span) * 100;

  if (events.length === 0) {
    return (
      <p className="text-sm text-muted">
        {emptyNote ??
          "No historical events are documented for this record yet. Settlement history is exactly the kind of knowledge held by residents rather than by archives."}
      </p>
    );
  }

  const decades = [];
  const tickStep = span > 300 ? 100 : span > 120 ? 50 : 25;
  for (let y = Math.ceil(bounds.min / tickStep) * tickStep; y <= bounds.max; y += tickStep) {
    decades.push(y);
  }

  const active = events.find((e) => e.id === selected) ?? null;

  return (
    <div>
      <h3 className="sr-only">{title}</h3>

      {/* Axis */}
      <div className="relative mb-1 h-5 border-b border-line">
        {decades.map((y) => (
          <span
            key={y}
            className="absolute -translate-x-1/2 text-[10px] text-muted"
            style={{ left: `${pos(y)}%` }}
          >
            {y}
          </span>
        ))}
      </div>

      {/* Bars */}
      <ul className="space-y-1.5">
        {dated.map((e) => {
          const start = e.period.start!;
          const end = e.period.end ?? start;
          const left = pos(start);
          const width = Math.max(1.2, pos(end) - left);
          const on = selected === e.id;
          return (
            <li key={e.id} className="relative h-8">
              <button
                type="button"
                onClick={() => setSelected(e.id)}
                aria-pressed={on}
                className="absolute inset-y-0 flex items-center rounded-sm border px-2 text-left text-[11px] transition-colors"
                style={{
                  left: `${left}%`,
                  width: `${width}%`,
                  minWidth: "3.5rem",
                  borderColor: on ? "var(--peacock)" : "var(--line-strong)",
                  backgroundColor: on ? "var(--surface-2)" : "var(--surface-1)",
                  color: "var(--ink)",
                }}
                title={`${e.title} — ${formatPeriod(e.period)}`}
              >
                <span className="truncate">{e.title}</span>
              </button>
            </li>
          );
        })}
      </ul>

      {undated.length > 0 ? (
        <div className="mt-3 rounded-sm border border-line bg-surface-0 p-2">
          <p className="text-[11px] text-muted">
            {undated.length} recorded {undated.length === 1 ? "event has" : "events have"} no
            established period and cannot be placed on the axis. They are listed below rather than
            dropped.
          </p>
          <ul className="mt-1 space-y-1">
            {undated.map((e) => (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => setSelected(e.id)}
                  className="text-[11px] text-peacock underline"
                >
                  {e.title}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Detail */}
      {active ? (
        <div className="mt-4 rounded-lg border border-line bg-surface-0 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-display text-base text-ink-strong">{active.title}</h4>
            {active.isDemo ? (
              <span className="rounded-sm bg-v-disputed px-1 text-[10px] font-bold text-white">
                DEMO
              </span>
            ) : null}
          </div>
          <p className="tabular mt-1 text-sm text-terracotta">{formatPeriod(active.period)}</p>
          {periodPrecisionNote(active.period) ? (
            <p className="text-[11px] text-muted">{periodPrecisionNote(active.period)}</p>
          ) : null}
          {active.description ? (
            <p className="mt-2 text-sm text-muted">{active.description}</p>
          ) : null}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <InterpretationChip label={active.interpretation} />
            <VerificationChip status={active.verification} size="sm" />
          </div>
          <div className="mt-2">
            <SourceList ids={active.sourceIds} />
          </div>
          {active.editorialNote ? (
            <p className="mt-2 text-[11px] italic text-muted">
              Editorial note: {active.editorialNote}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
