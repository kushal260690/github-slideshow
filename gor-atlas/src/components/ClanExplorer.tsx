"use client";

import Link from "next/link";
import { useState } from "react";
import { ClanNetwork } from "@/components/ClanNetwork";
import { VerificationChip } from "@/components/ui";
import type { Clan, ClanRelationship } from "@/lib/types";

export function ClanExplorer({
  clans,
  relationships,
}: {
  clans: Clan[];
  relationships: ClanRelationship[];
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const active = clans.find((c) => c.id === selected) ?? null;

  return (
    <section className="grid gap-5 lg:grid-cols-[1fr_20rem]">
      <ClanNetwork
        clans={clans}
        relationships={relationships}
        selectedId={selected}
        onSelect={setSelected}
      />

      <aside className="rounded-lg border border-line bg-surface-1 p-4">
        {active ? (
          <>
            <h3 className="font-display text-xl text-ink-strong">{active.primaryName}</h3>
            <div className="mt-2">
              <VerificationChip status={active.verification} size="sm" />
            </div>
            <p className="mt-3 text-sm text-muted">{active.summary}</p>

            <h4 className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-terracotta">
              Recorded spellings
            </h4>
            <p className="mt-1 text-sm text-ink">
              {[active.primaryName, ...active.variants.map((v) => v.variant)].join(" · ")}
            </p>

            <h4 className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-terracotta">
              Associations recorded
            </h4>
            <ul className="mt-1 space-y-1 text-xs text-muted">
              {relationships
                .filter((r) => r.fromClanId === active.id || r.toClanId === active.id)
                .map((r, i) => {
                  const otherId = r.fromClanId === active.id ? r.toClanId : r.fromClanId;
                  const other = clans.find((c) => c.id === otherId);
                  return (
                    <li key={i}>
                      {other?.primaryName}
                      {r.region ? ` · ${r.region}` : ""}
                      {r.relationship === "disputed_association" ? (
                        <span style={{ color: "var(--v-disputed)" }}> — disputed</span>
                      ) : null}
                    </li>
                  );
                })}
              {relationships.filter((r) => r.fromClanId === active.id || r.toClanId === active.id)
                .length === 0 ? (
                <li>No associations recorded.</li>
              ) : null}
            </ul>

            <Link
              href={`/clans/${active.slug}`}
              className="mt-4 inline-block rounded-sm bg-terracotta px-4 py-2 text-sm font-semibold text-terracotta-ink"
            >
              Open clan detail
            </Link>
          </>
        ) : (
          <>
            <h3 className="font-display text-lg text-ink-strong">Select a name</h3>
            <p className="mt-2 text-sm text-muted">
              Choose a node on the network, or a name from the list below, to see its recorded
              spellings and the associations reported for it.
            </p>
            <p className="mt-3 rounded-sm border border-line bg-surface-0 p-3 text-[11px] text-muted">
              Every association shown here is <strong className="text-ink">unverified</strong> and
              carries low confidence. They record community usage, not documented findings, and
              the interface does not disguise that with a confident visual treatment.
            </p>
          </>
        )}
      </aside>
    </section>
  );
}
