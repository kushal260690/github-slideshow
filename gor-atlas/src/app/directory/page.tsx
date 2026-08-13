import type { Metadata } from "next";
import Link from "next/link";
import { Callout, DemoChip, PageHeader, VerificationChip } from "@/components/ui";
import { ALL_DISTRICTS, STATES } from "@/data/geography";
import { formatCoordinates, formatNumber, formatPeriod } from "@/lib/format";
import { foundingEvent, latestPopulation, listTandas, majorClans } from "@/lib/repository";

export const metadata: Metadata = {
  title: "Text directory",
  description:
    "A complete, keyboard-accessible text listing of every documented Tanda — the accessible equivalent of the interactive map.",
};

/**
 * The accessible equivalent of the map (WCAG 2.2 AA).
 *
 * Not a stripped-down fallback: it carries the same records with the same
 * fields, is fully keyboard operable, reads correctly in a screen reader, and
 * is linked from the map itself rather than buried in the footer. Anyone who
 * cannot use a drag-and-zoom canvas gets the archive, not a summary of it.
 */
export default function DirectoryPage() {
  const tandas = listTandas();
  const byState = STATES.map((s) => ({
    state: s,
    records: tandas.filter((t) => t.stateId === s.id),
  })).filter((g) => g.records.length > 0);

  return (
    <>
      <PageHeader
        eyebrow="Accessible equivalent of the map"
        title="Text directory"
        standfirst="Every record on the interactive map, as a keyboard-navigable list. Same data, same fields, no canvas required."
      />

      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        <Callout title="Why this page exists">
          A map is a visual interface, and an archive that only exists as a map excludes anyone
          using a screen reader, anyone who cannot use a pointer, and anyone on a device where a
          tile map will not load. This directory is maintained as an equal representation rather
          than as a courtesy — it is generated from the same query the map runs.
        </Callout>

        <p className="text-sm text-muted">
          {tandas.length} records across {byState.length} states.{" "}
          {ALL_DISTRICTS.length} districts are open for documentation and currently hold no
          records at all.
        </p>

        {byState.map(({ state, records }) => (
          <section key={state.id} aria-labelledby={`state-${state.id}`}>
            <h2
              id={`state-${state.id}`}
              className="border-b border-line pb-2 font-display text-2xl text-ink-strong"
            >
              {state.name}{" "}
              <span className="text-base text-muted">
                ({records.length} {records.length === 1 ? "record" : "records"})
              </span>
            </h2>
            <ul className="mt-3 space-y-3">
              {records.map((t) => {
                const pop = latestPopulation(t);
                const founded = foundingEvent(t);
                return (
                  <li key={t.id} className="rounded-lg border border-line bg-surface-1 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/tanda/${t.id}`}
                        className="font-display text-lg text-ink-strong hover:text-peacock"
                      >
                        {t.primaryName}
                      </Link>
                      {t.isDemo ? <DemoChip /> : null}
                      <VerificationChip status={t.verification} size="sm" />
                    </div>
                    {t.names.filter((n) => !n.isPrimary).length > 0 ? (
                      <p className="mt-1 text-xs text-muted">
                        Also known as:{" "}
                        {t.names
                          .filter((n) => !n.isPrimary)
                          .map((n) => n.name)
                          .join(" · ")}
                      </p>
                    ) : null}
                    <dl className="mt-2 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2 lg:grid-cols-3">
                      <div>
                        <dt className="inline text-muted">District: </dt>
                        <dd className="inline text-ink">
                          {ALL_DISTRICTS.find((d) => d.id === t.districtId)?.name ?? "—"}
                        </dd>
                      </div>
                      <div>
                        <dt className="inline text-muted">Location: </dt>
                        <dd className="inline text-ink">
                          {formatCoordinates(t.coordinates, t.coordinatePrecision)}
                        </dd>
                      </div>
                      <div>
                        <dt className="inline text-muted">Population: </dt>
                        <dd className="inline text-ink">
                          {pop?.totalPopulation
                            ? `${formatNumber(pop.totalPopulation)} (${pop.asOfYear})`
                            : "Not yet documented"}
                        </dd>
                      </div>
                      <div>
                        <dt className="inline text-muted">Established: </dt>
                        <dd className="inline text-ink">
                          {founded ? formatPeriod(founded.period) : "Not yet documented"}
                        </dd>
                      </div>
                      <div>
                        <dt className="inline text-muted">Major clans: </dt>
                        <dd className="inline text-ink">
                          {majorClans(t).join(", ") || "Not yet documented"}
                        </dd>
                      </div>
                      <div>
                        <dt className="inline text-muted">Tanda ID: </dt>
                        <dd className="tabular inline text-ink">{t.publicId}</dd>
                      </div>
                    </dl>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
