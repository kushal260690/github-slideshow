import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { WORLD_REGIONS } from "@/data/geography";
import { TANDAS } from "@/data/tandas";

/**
 * World scope strip.
 *
 * Exists to answer a question the old homepage answered wrongly by omission:
 * is this an Indian archive? It is not. Documentation begins in India because
 * that is where the settlements and the records are densest, but the community
 * moved — and an atlas framed on one country tells a reader in the Gulf or in
 * Chicago that their family is a footnote to somewhere else.
 *
 * Every region shows its true count, which is zero everywhere outside South
 * Asia. Listing a region asserts only that the archive will accept and review
 * records from it, exactly as with an Indian district.
 */
const REGION_COLORS = [
  "var(--gor-lac)",
  "var(--gor-marigold)",
  "var(--gor-parrot)",
  "var(--gor-turquoise)",
  "var(--gor-fuchsia)",
  "var(--gor-violet)",
  "var(--gor-amber)",
  "var(--gor-crimson)",
];

export function WorldStrip() {
  const counts = new Map<string, number>();
  for (const t of TANDAS) {
    // Only the demo diaspora record sits outside South Asia in this build.
    const key = t.settlementType === "diaspora" ? "gulf" : "south-asia";
    counts.set(key, (counts.get(key) ?? 0) + (t.isDemo ? 0 : 1));
  }

  return (
    <section className="gor-wash border-b border-line bg-surface-0">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <Reveal>
          <h2 className="flex items-center gap-3 font-display text-2xl text-ink-strong">
            <span className="mirror-dot" aria-hidden />
            An atlas of a community, not of a country
          </h2>
          <p className="mt-1 max-w-3xl text-sm text-muted">
            Documentation begins in India because that is where the settlements and the records are
            densest. It does not end there. Every region below is open for contribution and shows
            its real count — which is currently zero almost everywhere, and is shown as zero.
          </p>
        </Reveal>

        <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {WORLD_REGIONS.map((r, i) => (
            <Reveal as="li" key={r.id} delay={i * 40}>
              <div
                className="h-full rounded-lg border border-line bg-surface-1 p-4 transition-transform hover:-translate-y-0.5"
                style={{ borderLeft: `4px solid ${REGION_COLORS[i % REGION_COLORS.length]}` }}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="font-display text-base text-ink-strong">{r.name}</h3>
                  <span className="tabular text-sm text-muted">{counts.get(r.id) ?? 0}</span>
                </div>
                <p className="mt-1 text-[11px] text-muted">{r.note}</p>
              </div>
            </Reveal>
          ))}
        </ul>

        <Reveal delay={120}>
          <p className="mt-5 rounded-lg border-l-4 border-l-[color:var(--gold)] bg-surface-1 p-4 text-sm text-muted">
            Diaspora records are handled more carefully than settlement records, not less. They
            frequently concern labour-migrant populations whose circumstances can be precarious, so
            their coordinates are coarsened by default and they are excluded from bulk dataset
            export.{" "}
            <Link href="/privacy" className="text-peacock underline">
              Read why
            </Link>
            .
          </p>
        </Reveal>
      </div>
    </section>
  );
}
