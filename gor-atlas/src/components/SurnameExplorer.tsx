"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ASSOCIATION_STRENGTH_LABEL } from "@/data/surnames";
import { SourceList, VerificationChip } from "@/components/ui";
import { similarity } from "@/lib/repository";
import type { Clan, Surname } from "@/lib/types";

export function SurnameExplorer({ surnames, clans }: { surnames: Surname[]; clans: Clan[] }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(surnames[0]?.slug ?? null);

  // Fuzzy across every recorded spelling, not just the display form: a reader
  // searching "Rathwad" must find the record whose display form is "Rathod".
  const filtered = useMemo(() => {
    const q = query.trim();
    if (q.length < 2) return surnames;
    return surnames
      .map((s) => {
        const forms = [s.primaryForm, ...s.variants.map((v) => v.variant)];
        const score = Math.max(
          ...forms.map((f) =>
            f.toLowerCase().includes(q.toLowerCase()) ? 1 : similarity(f, q),
          ),
        );
        return { s, score };
      })
      .filter((x) => x.score > 0.28)
      .sort((a, b) => b.score - a.score)
      .map((x) => x.s);
  }, [query, surnames]);

  const active = surnames.find((s) => s.slug === selected) ?? null;

  return (
    <div className="grid gap-5 lg:grid-cols-[20rem_1fr]">
      <div>
        <label htmlFor="sn-search" className="sr-only">
          Search surnames and spelling variants
        </label>
        <input
          id="sn-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search any spelling — e.g. Rathwad, Chavhan"
          className="w-full rounded-sm border border-line bg-surface-1 px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-peacock"
        />
        <p className="mt-1 text-[11px] text-muted">
          Spelling-tolerant. Searching a variant finds the record and tells you which spelling
          matched.
        </p>

        <ul className="mt-3 divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface-1">
          {filtered.length === 0 ? (
            <li className="p-4 text-sm text-muted">
              No surname matched. It may simply not be indexed yet —{" "}
              <Link href="/contribute" className="text-peacock underline">
                add it
              </Link>
              .
            </li>
          ) : (
            filtered.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => setSelected(s.slug)}
                  className={`w-full px-4 py-3 text-left hover:bg-surface-2 ${
                    selected === s.slug ? "bg-surface-2" : ""
                  }`}
                >
                  <span className="block font-display text-base text-ink-strong">
                    {s.primaryForm}
                  </span>
                  <span className="block truncate text-[11px] text-muted">
                    {s.variants.map((v) => v.variant).join(" · ")}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      </div>

      {active ? (
        <article className="rounded-lg border border-line bg-surface-1 p-5">
          <h2 className="font-display text-2xl text-ink-strong">{active.primaryForm}</h2>

          <h3 className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-terracotta">
            Recorded spellings
          </h3>
          <ul className="mt-1 flex flex-wrap gap-2">
            <li className="rounded-sm border-2 border-terracotta px-2.5 py-1 text-sm text-ink">
              {active.primaryForm}
            </li>
            {active.variants.map((v) => (
              <li
                key={v.variant}
                className="rounded-sm border border-line-strong px-2.5 py-1 text-sm text-ink"
              >
                {v.variant}
                {v.region ? <span className="ml-1.5 text-[10px] text-muted">{v.region}</span> : null}
                {v.script && v.script !== "Latn" ? (
                  <span className="ml-1.5 text-[10px] text-muted">{v.script}</span>
                ) : null}
              </li>
            ))}
          </ul>

          <h3 className="mt-5 text-[11px] font-semibold uppercase tracking-wider text-terracotta">
            Clan associations
          </h3>
          {active.clanAssociations.length === 0 ? (
            <p className="mt-1 text-sm text-muted">
              No clan association is recorded for this name — which for some names is the correct
              and deliberate state rather than a gap.
            </p>
          ) : (
            <ul className="mt-2 space-y-3">
              {active.clanAssociations.map((a, i) => {
                const clan = clans.find((c) => c.id === a.clanId);
                return (
                  <li key={i} className="rounded-lg border border-line bg-surface-0 p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/clans/${clan?.slug ?? ""}`}
                        className="font-display text-base text-ink-strong hover:text-peacock"
                      >
                        {clan?.primaryName ?? a.clanId}
                      </Link>
                      <span className="rounded-sm border border-line-strong px-1.5 py-0.5 text-[11px] text-ink">
                        {ASSOCIATION_STRENGTH_LABEL[a.strength]}
                      </span>
                      <VerificationChip status={a.verification} size="sm" />
                    </div>
                    {a.region ? (
                      <p className="mt-1 text-xs text-muted">Region: {a.region}</p>
                    ) : null}
                    <div className="mt-2">
                      <SourceList ids={a.sourceIds} />
                    </div>
                    {a.editorialNote ? (
                      <p className="mt-1.5 text-[11px] italic text-muted">{a.editorialNote}</p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}

          {active.notes ? (
            <div className="mt-5 rounded-lg border-l-4 border-l-[color:var(--v-disputed)] bg-surface-0 p-3">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-terracotta">
                Editorial note
              </h3>
              <p className="mt-1 text-sm text-muted">{active.notes}</p>
            </div>
          ) : null}

          <h3 className="mt-5 text-[11px] font-semibold uppercase tracking-wider text-terracotta">
            Geographic concentration
          </h3>
          <p className="mt-1 text-sm text-muted">
            Not yet documented. Concentration requires a dated source with a defensible
            methodology, and inferring it from the handful of records currently in this archive
            would produce a map that looked authoritative and meant nothing.
          </p>
        </article>
      ) : null}
    </div>
  );
}
