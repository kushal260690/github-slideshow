"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { CLAN_RELATIONSHIP_LABEL } from "@/data/clans";
import type { Clan, ClanRelationship } from "@/lib/types";

/**
 * Clan relationship network.
 *
 * Laid out as a ring rather than a tree, and that is the whole argument of
 * this component. A tree layout implies descent, and the moment a reader sees
 * one clan above another they have been told something this archive does not
 * know and does not claim. A ring has no root, no generations, and no top.
 *
 * Edges are typed and carry their own verification state. A disputed
 * association is drawn as a dashed red line and stays visible — hiding a
 * contested link would be an editorial judgement disguised as a layout choice.
 */
export function ClanNetwork({
  clans,
  relationships,
  onSelect,
  selectedId,
}: {
  clans: Clan[];
  relationships: ClanRelationship[];
  onSelect?: (id: string) => void;
  selectedId?: string | null;
}) {
  const [zoom, setZoom] = useState(1);
  const [hovered, setHovered] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const size = 720;
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.36;

  const nodes = useMemo(
    () =>
      clans.map((c, i) => {
        const angle = (i / clans.length) * Math.PI * 2 - Math.PI / 2;
        return {
          clan: c,
          x: cx + Math.cos(angle) * radius,
          y: cy + Math.sin(angle) * radius,
          angle,
        };
      }),
    [clans, cx, cy, radius],
  );

  const nodeById = new Map(nodes.map((n) => [n.clan.id, n]));

  const activeId = hovered ?? selectedId ?? null;

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="max-w-2xl text-xs text-muted">
          <strong className="text-ink">This is not a genealogy.</strong> Nodes are clan names;
          edges record that names are reported together in a region, or that an association is
          disputed. There is no root, no generation and no ordering — a tree layout would imply
          descent that no source establishes.
        </p>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.6, z - 0.2))}
            className="rounded-sm border border-line px-2 py-1 text-[11px] text-muted hover:border-peacock hover:text-peacock"
          >
            Zoom out
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(2.4, z + 0.2))}
            className="rounded-sm border border-line px-2 py-1 text-[11px] text-muted hover:border-peacock hover:text-peacock"
          >
            Zoom in
          </button>
          <button
            type="button"
            onClick={() => setZoom(1)}
            className="rounded-sm border border-line px-2 py-1 text-[11px] text-muted hover:border-peacock hover:text-peacock"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="overflow-auto rounded-lg border border-line bg-surface-0">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${size} ${size}`}
          width={size * zoom}
          height={size * zoom}
          className="max-w-none"
          role="img"
          aria-label="Network of reported associations between clan names. An equivalent list follows below."
        >
          {/* Edges */}
          <g>
            {relationships.map((rel, i) => {
              const a = nodeById.get(rel.fromClanId);
              const b = nodeById.get(rel.toClanId);
              if (!a || !b) return null;
              const disputed = rel.relationship === "disputed_association";
              const dim =
                activeId !== null && rel.fromClanId !== activeId && rel.toClanId !== activeId;
              // Curve edges through the centre so the ring stays readable.
              const mx = (a.x + b.x) / 2;
              const my = (a.y + b.y) / 2;
              const qx = cx + (mx - cx) * 0.35;
              const qy = cy + (my - cy) * 0.35;
              return (
                <path
                  key={i}
                  d={`M ${a.x} ${a.y} Q ${qx} ${qy} ${b.x} ${b.y}`}
                  fill="none"
                  stroke={disputed ? "var(--v-disputed)" : "var(--peacock)"}
                  strokeWidth={disputed ? 2 : 1.2}
                  strokeDasharray={disputed ? "6 4" : undefined}
                  opacity={dim ? 0.12 : disputed ? 0.9 : 0.45}
                />
              );
            })}
          </g>

          {/* Nodes */}
          <g>
            {nodes.map((n) => {
              const active = activeId === n.clan.id;
              const anchor = Math.cos(n.angle) < -0.2 ? "end" : Math.cos(n.angle) > 0.2 ? "start" : "middle";
              const lx = n.x + Math.cos(n.angle) * 18;
              const ly = n.y + Math.sin(n.angle) * 18;
              return (
                <g
                  key={n.clan.id}
                  onMouseEnter={() => setHovered(n.clan.id)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => onSelect?.(n.clan.id)}
                  style={{ cursor: "pointer" }}
                >
                  <circle
                    cx={n.x}
                    cy={n.y}
                    r={active ? 10 : 7}
                    fill={active ? "var(--terracotta)" : "var(--surface-2)"}
                    stroke={active ? "var(--terracotta)" : "var(--line-strong)"}
                    strokeWidth={2}
                  />
                  <text
                    x={lx}
                    y={ly}
                    textAnchor={anchor}
                    dominantBaseline="middle"
                    fontSize={13}
                    fill={active ? "var(--ink-strong)" : "var(--muted)"}
                    style={{ fontFamily: "var(--font-ui)" }}
                  >
                    {n.clan.primaryName}
                  </text>
                </g>
              );
            })}
          </g>

          <text
            x={cx}
            y={cy - 6}
            textAnchor="middle"
            fontSize={12}
            fill="var(--muted)"
            style={{ fontFamily: "var(--font-ui)" }}
          >
            No centre, no root, no ranking
          </text>
          <text
            x={cx}
            y={cy + 12}
            textAnchor="middle"
            fontSize={11}
            fill="var(--muted)"
            style={{ fontFamily: "var(--font-ui)" }}
          >
            all associations unverified
          </text>
        </svg>
      </div>

      {/* Accessible equivalent — not a fallback, a parallel representation */}
      <details className="mt-3 rounded-lg border border-line bg-surface-1 p-3">
        <summary className="cursor-pointer text-sm text-peacock">
          Read the same relationships as a list (keyboard accessible)
        </summary>
        <ul className="mt-2 space-y-2">
          {relationships.map((rel, i) => {
            const from = clans.find((c) => c.id === rel.fromClanId);
            const to = clans.find((c) => c.id === rel.toClanId);
            if (!from || !to) return null;
            return (
              <li key={i} className="text-xs text-muted">
                <Link href={`/clans/${from.slug}`} className="text-ink underline">
                  {from.primaryName}
                </Link>{" "}
                — <span className="text-terracotta">{CLAN_RELATIONSHIP_LABEL[rel.relationship]}</span> —{" "}
                <Link href={`/clans/${to.slug}`} className="text-ink underline">
                  {to.primaryName}
                </Link>
                {rel.region ? ` · ${rel.region}` : ""}
                {rel.editorialNote ? (
                  <span className="mt-0.5 block italic">{rel.editorialNote}</span>
                ) : null}
              </li>
            );
          })}
        </ul>
      </details>
    </div>
  );
}
