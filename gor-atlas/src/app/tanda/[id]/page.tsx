import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { MapView } from "@/components/MapView";
import { ShareRow } from "@/components/ShareRow";
import { Timeline } from "@/components/Timeline";
import {
  Breadcrumbs,
  Callout,
  ContestedBlock,
  DemoBanner,
  DemoChip,
  FactRow,
  NotDocumented,
  SectionCard,
  SourceList,
  TextileRule,
  VerificationChip,
} from "@/components/ui";
import { CLAN_BY_ID } from "@/data/clans";
import { ALL_DISTRICTS, STATE_BY_ID } from "@/data/geography";
import { SOURCE_CATEGORY_LABEL, getSource } from "@/data/sources";
import { TANDAS } from "@/data/tandas";
import {
  COORDINATE_PRECISION_NOTE,
  PRESENCE_BAND_LABEL,
  SETTLEMENT_TYPE_LABEL,
  formatCoordinates,
  formatNumber,
  formatPeriod,
  markerState,
} from "@/lib/format";
import { getTanda } from "@/lib/repository";
import type { Tanda } from "@/lib/types";

export function generateStaticParams() {
  return TANDAS.map((t) => ({ id: t.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const tanda = getTanda(id);
  if (!tanda) return { title: "Tanda not found" };
  const state = STATE_BY_ID.get(tanda.stateId)?.name ?? "";
  const district = ALL_DISTRICTS.find((d) => d.id === tanda.districtId)?.name ?? "";
  return {
    title: `${tanda.primaryName}${tanda.isDemo ? " [DEMO]" : ""}`,
    description: tanda.isDemo
      ? `Demonstration record. ${tanda.primaryName} is an invented settlement used to demonstrate the Gor Atlas profile template.`
      : `Settlement profile for ${tanda.primaryName}, ${district}, ${state}. Names, population, clans, history, culture and sources.`,
    // Demo records are not indexed. A fabricated settlement must not enter a
    // search index where it would be encountered stripped of its warning.
    robots: tanda.isDemo ? { index: false, follow: false } : undefined,
  };
}

export default async function TandaProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tanda = getTanda(id);
  if (!tanda) notFound();

  const state = STATE_BY_ID.get(tanda.stateId);
  const district = ALL_DISTRICTS.find((d) => d.id === tanda.districtId);
  const marker = markerState(tanda.verification, tanda.settlementType);
  const official = tanda.names.find((n) => n.kind === "official");
  const local = tanda.names.find((n) => n.kind === "local");
  const historical = tanda.names.find((n) => n.kind === "historical");
  const scripts = tanda.names.filter((n) => n.kind === "transliteration");
  const spellings = tanda.names.filter((n) => n.kind === "alternate_spelling");

  return (
    <>
      {tanda.isDemo ? <DemoBanner /> : null}

      {/* ---------------------------------------------------------------- */}
      {/* Identity header                                                  */}
      {/* ---------------------------------------------------------------- */}
      <header className="paper-grain border-b border-line bg-surface-1">
        <TextileRule />
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <Breadcrumbs
            items={[
              { label: "States", href: "/states" },
              { label: state?.name ?? "", href: `/states/${tanda.stateId}` },
              { label: district?.name ?? "" },
              { label: tanda.primaryName },
            ]}
          />

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-3xl text-ink-strong sm:text-4xl">
              {tanda.primaryName}
            </h1>
            {tanda.isDemo ? <DemoChip /> : null}
            <VerificationChip status={tanda.verification} />
          </div>

          {scripts.length > 0 ? (
            <p className="mt-2 text-lg text-muted">
              {scripts.map((n) => (
                <span key={n.name} lang={n.locale} className="mr-3">
                  {n.name}
                </span>
              ))}
            </p>
          ) : null}

          {spellings.length > 0 ? (
            <p className="mt-1 text-sm text-muted">
              also written: {spellings.map((n) => n.name).join(" · ")}
            </p>
          ) : null}

          <p className="mt-3 text-sm text-muted">
            {district?.name}, {state?.name} ·{" "}
            <span className="tabular">{tanda.publicId}</span> ·{" "}
            <span style={{ color: marker.color }}>{marker.label}</span>
          </p>

          <ShareRow
            title={tanda.primaryName}
            path={`/tanda/${tanda.id}`}
            isDemo={tanda.isDemo}
            storageKey={`tanda-${tanda.id}`}
          />
        </div>
      </header>

      {/* ---------------------------------------------------------------- */}
      {/* Body                                                             */}
      {/* ---------------------------------------------------------------- */}
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_18rem]">
        <div className="space-y-6">
          {/* A — Identity ------------------------------------------------ */}
          <SectionCard
            title="Identity"
            id="identity"
            description="Names are stored as a table, not a string: a settlement legitimately has an official name, a local name, a historical name, transliterations and several spellings, and search runs across all of them."
          >
            <dl>
              <FactRow
                label="Official name"
                fact={{
                  value: official?.name ?? null,
                  verification: official ? "unverified" : "not_documented",
                  confidence: "low",
                  sourceIds: official?.sourceIds ?? [],
                }}
              />
              <FactRow
                label="Local name"
                fact={{
                  value: local?.name ?? null,
                  verification: local ? "unverified" : "not_documented",
                  confidence: "low",
                  sourceIds: [],
                  editorialNote: local
                    ? undefined
                    : "No separate local name recorded. Many settlements have one that differs from the official record.",
                }}
              />
              <FactRow
                label="Historical name"
                fact={{
                  value: historical
                    ? `${historical.name}${
                        historical.period ? ` — ${formatPeriod(historical.period)}` : ""
                      }`
                    : null,
                  verification: historical ? "unverified" : "not_documented",
                  confidence: "low",
                  sourceIds: [],
                }}
              />
              <FactRow
                label="Names in regional scripts"
                fact={{
                  value: scripts.length ? scripts.map((n) => n.name).join(" · ") : null,
                  verification: scripts.length ? "unverified" : "not_documented",
                  confidence: "low",
                  sourceIds: [],
                  editorialNote:
                    "A name in another script is a name variant, not a translation. Transliteration and translation are stored differently.",
                }}
              />
              <FactRow
                label="Tanda ID"
                fact={{
                  value: tanda.publicId,
                  verification: "verified",
                  confidence: "high",
                  sourceIds: [],
                  editorialNote: "Assigned by this archive. Stable across renames and relocations.",
                }}
              />
              <FactRow
                label="Coordinates"
                fact={{
                  value: `${formatCoordinates(tanda.coordinates, tanda.coordinatePrecision)}`,
                  verification: tanda.coordinates ? "unverified" : "not_documented",
                  confidence: "low",
                  sourceIds: [],
                  editorialNote: `${COORDINATE_PRECISION_NOTE[tanda.coordinatePrecision]}${
                    tanda.coordinateNote ? ` ${tanda.coordinateNote}` : ""
                  }`,
                }}
              />
              <FactRow label="PIN code" fact={tanda.pinCode} />
              <FactRow
                label="State"
                fact={{
                  value: state?.name ?? null,
                  verification: "partially_verified",
                  confidence: "high",
                  sourceIds: [],
                }}
              />
              <FactRow
                label="District"
                fact={{
                  value: district?.name ?? null,
                  verification: "partially_verified",
                  confidence: "high",
                  sourceIds: [],
                }}
              />
              <FactRow label="Mandal / Tehsil" fact={tanda.subdistrict} />
              <FactRow label="Nearest village" fact={tanda.nearestVillage} />
              <FactRow
                label="Classification"
                fact={{
                  value: SETTLEMENT_TYPE_LABEL[tanda.settlementType],
                  verification: "unverified",
                  confidence: "low",
                  sourceIds: [],
                }}
              />
            </dl>
          </SectionCard>

          {/* B — Population --------------------------------------------- */}
          <SectionCard
            title="Population"
            id="population"
            description="One row per census year and source. Rows are never overwritten, which is what makes a trend a comparison rather than a stored claim."
          >
            {tanda.populationRecords.length === 0 ? (
              <NotDocumented note="No dated population figure is held for this settlement. The archive does not publish a population without a source and a year." />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[36rem] text-sm">
                    <thead>
                      <tr className="border-b border-line text-left text-[11px] uppercase tracking-wider text-terracotta">
                        <th className="py-2 pr-3">Year</th>
                        <th className="py-2 pr-3 text-right">Total</th>
                        <th className="py-2 pr-3 text-right">Households</th>
                        <th className="py-2 pr-3 text-right">Male</th>
                        <th className="py-2 pr-3 text-right">Female</th>
                        <th className="py-2 pr-3 text-right">Children</th>
                        <th className="py-2">Basis</th>
                      </tr>
                    </thead>
                    <tbody className="tabular">
                      {[...tanda.populationRecords]
                        .sort((a, b) => b.asOfYear - a.asOfYear)
                        .map((p) => (
                          <tr key={`${p.asOfYear}-${p.sourceId}`} className="border-b border-line">
                            <td className="py-2 pr-3">{p.asOfYear}</td>
                            <td className="py-2 pr-3 text-right">
                              {formatNumber(p.totalPopulation)}
                            </td>
                            <td className="py-2 pr-3 text-right">{formatNumber(p.households)}</td>
                            <td className="py-2 pr-3 text-right text-muted">
                              {p.malePopulation === null || p.malePopulation === undefined
                                ? "—"
                                : formatNumber(p.malePopulation)}
                            </td>
                            <td className="py-2 pr-3 text-right text-muted">
                              {p.femalePopulation === null || p.femalePopulation === undefined
                                ? "—"
                                : formatNumber(p.femalePopulation)}
                            </td>
                            <td className="py-2 pr-3 text-right text-muted">
                              {p.childPopulation === null || p.childPopulation === undefined
                                ? "—"
                                : formatNumber(p.childPopulation)}
                            </td>
                            <td className="py-2 text-xs">
                              {p.isCommunityEstimate ? "Community estimate" : "Enumerated"}
                              <span className="block">
                                {SOURCE_CATEGORY_LABEL[getSource(p.sourceId)?.category ?? ""] ??
                                  "Source not registered"}
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-2 text-[11px] text-muted">
                  A dash means the figure is not held, not that it is zero. Sex and child
                  breakdowns are withheld below ten households, because at that size a breakdown
                  becomes individually identifying.
                </p>
                <div className="mt-4">
                  <dl>
                    <FactRow label="Population trend" fact={tanda.populationTrend} />
                  </dl>
                </div>
              </>
            )}
          </SectionCard>

          {/* C — Clans and surnames ------------------------------------- */}
          <SectionCard
            title="Clans and surnames"
            id="clans"
            description="Aggregated at settlement level and expressed as bands. Never counts, never percentages, never households."
          >
            {tanda.clanPresence.length === 0 ? (
              <NotDocumented note="No clan composition is recorded for this settlement." />
            ) : (
              <ul className="space-y-3">
                {tanda.clanPresence.map((cp) => {
                  const clan = CLAN_BY_ID.get(cp.clanId);
                  return (
                    <li
                      key={cp.clanId}
                      className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-3 last:border-b-0"
                    >
                      <div className="min-w-0">
                        <Link
                          href={`/clans/${clan?.slug ?? ""}`}
                          className="font-display text-base text-ink-strong hover:text-peacock"
                        >
                          {clan?.primaryName ?? cp.clanId}
                        </Link>
                        <p className="mt-0.5">
                          <span className="rounded-sm border border-line-strong px-1.5 py-0.5 text-[11px] text-ink">
                            {PRESENCE_BAND_LABEL[cp.band]}
                          </span>
                        </p>
                        {cp.editorialNote ? (
                          <p className="mt-1 max-w-xl text-[11px] italic text-muted">
                            {cp.editorialNote}
                          </p>
                        ) : null}
                      </div>
                      <div className="shrink-0 space-y-1 text-right">
                        <VerificationChip status={cp.verification} size="sm" />
                        <SourceList ids={cp.sourceIds} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            <div className="mt-4">
              <dl>
                <FactRow label="Notes on surnames" fact={tanda.surnameNotes} />
              </dl>
            </div>
            <Callout tone="warn" title="What this section will never contain">
              Household lists, family names, individual records or any means of inferring a
              person&rsquo;s clan from their surname. The minimum publishable unit is the
              settlement, and submissions containing household-level data are rejected and the
              data discarded rather than stored.
            </Callout>
          </SectionCard>

          {/* D — History ------------------------------------------------ */}
          <SectionCard
            title="History"
            id="history"
            description="Dated as periods, not as years. The bar width on the timeline is the width of the evidence."
          >
            <Timeline events={tanda.events} title={`${tanda.primaryName} timeline`} />
            <div className="mt-5 space-y-3">
              {tanda.originStory ? (
                <ContestedBlock label="Origin account" contested={tanda.originStory} />
              ) : (
                <dl>
                  <FactRow
                    label="Origin account"
                    fact={{
                      value: null,
                      verification: "not_documented",
                      confidence: "low",
                      sourceIds: [],
                      editorialNote:
                        "No origin account recorded. This is the single most common thing a resident can contribute that no archive holds.",
                    }}
                  />
                </dl>
              )}
              <dl>
                <FactRow label="Previous location" fact={tanda.previousLocation} />
              </dl>
              {tanda.migrationRouteIds.length > 0 ? (
                <p className="text-sm text-muted">
                  Linked migration routes:{" "}
                  {tanda.migrationRouteIds.map((rid) => (
                    <Link key={rid} href="/migration" className="text-peacock underline">
                      {rid}
                    </Link>
                  ))}
                </p>
              ) : null}
            </div>
          </SectionCard>

          {/* E — Culture ------------------------------------------------ */}
          <SectionCard
            title="Cultural profile"
            id="culture"
            description="Community-wide practices are recorded as community-wide. A festival documented in one district is not evidence about another."
          >
            <dl>
              <FactRow label="Local dialect" fact={tanda.dialect} />
              <FactRow
                label="Languages used"
                fact={{
                  ...tanda.languagesSpoken,
                  value: tanda.languagesSpoken.value?.join(", ") ?? null,
                }}
              />
            </dl>
            {tanda.practices.length === 0 ? (
              <div className="mt-4">
                <NotDocumented note="No cultural practices are recorded for this settlement." />
              </div>
            ) : (
              <ul className="mt-4 space-y-3">
                {tanda.practices.map((p) => (
                  <li key={p.id} className="rounded-lg border border-line bg-surface-0 p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-display text-base text-ink-strong">{p.name}</h4>
                      <span className="text-[11px] uppercase tracking-wider text-terracotta">
                        {p.kind.replace(/_/g, " ")}
                      </span>
                    </div>
                    {p.description ? (
                      <p className="mt-1 text-sm text-muted">{p.description}</p>
                    ) : null}
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <VerificationChip status={p.verification} size="sm" />
                    </div>
                    {p.editorialNote ? (
                      <p className="mt-1 text-[11px] italic text-muted">{p.editorialNote}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          {/* F — Governance --------------------------------------------- */}
          <SectionCard
            title="Governance and institutions"
            id="governance"
            description="Governance is recorded as a structure — which customary roles exist — never as a register of who holds them."
          >
            {tanda.governance.length === 0 ? (
              <NotDocumented note="No governance structure recorded." />
            ) : (
              <ul className="space-y-3">
                {tanda.governance.map((g) => (
                  <li key={g.roleName} className="border-b border-line pb-3 last:border-b-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-display text-base text-ink-strong">{g.roleName}</h4>
                      <span className="text-[11px] text-muted">
                        {g.isCustomary ? "Customary role" : "Statutory role"}
                      </span>
                      <VerificationChip status={g.verification} size="sm" />
                    </div>
                    {g.description ? (
                      <p className="mt-1 text-sm text-muted">{g.description}</p>
                    ) : null}
                    <p className="mt-1 text-[11px] text-muted">
                      Currently active:{" "}
                      {g.currentlyActive === null
                        ? "Not documented"
                        : g.currentlyActive
                          ? "Reported active"
                          : "Reported inactive"}
                    </p>
                  </li>
                ))}
              </ul>
            )}

            <h4 className="mt-5 text-[11px] font-semibold uppercase tracking-wider text-terracotta">
              Institutions
            </h4>
            {tanda.institutions.length === 0 ? (
              <p className="mt-1 text-sm italic text-muted">Not yet documented</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {tanda.institutions.map((inst) => (
                  <li key={inst.id} className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="text-ink">{inst.name}</span>
                    <span className="text-[11px] uppercase tracking-wider text-muted">
                      {inst.kind.replace(/_/g, " ")}
                    </span>
                    {inst.established ? (
                      <span className="text-[11px] text-muted">
                        est. {formatPeriod(inst.established)}
                      </span>
                    ) : null}
                    <VerificationChip status={inst.verification} size="sm" />
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-2 text-[11px] text-muted">
              Only public institutional contact details are ever stored here. Private individuals
              have no entry in this archive.
            </p>
          </SectionCard>

          {/* G — Media -------------------------------------------------- */}
          <SectionCard
            title="Media archive"
            id="media"
            description="Every asset carries ownership, capture period, contributor, consent scope and verification state before it can be published."
          >
            {tanda.media.length === 0 ? (
              <NotDocumented note="No media held for this settlement." />
            ) : (
              <ul className="space-y-3">
                {tanda.media.map((m) => (
                  <li key={m.id} className="rounded-lg border border-line bg-surface-0 p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-display text-base text-ink-strong">{m.title}</h4>
                      <span className="text-[11px] uppercase tracking-wider text-terracotta">
                        {m.kind.replace(/_/g, " ")}
                      </span>
                      <span
                        className="rounded-sm px-1.5 py-0.5 text-[10px]"
                        style={{
                          color: m.isPublished ? "var(--v-verified)" : "var(--v-partial)",
                          border: `1px solid ${m.isPublished ? "var(--v-verified)" : "var(--v-partial)"}`,
                        }}
                      >
                        {m.isPublished ? "Published" : "Held, not published"}
                      </span>
                    </div>
                    {m.description ? (
                      <p className="mt-1 text-sm text-muted">{m.description}</p>
                    ) : null}
                    <dl className="mt-2 grid gap-x-4 gap-y-1 text-[11px] text-muted sm:grid-cols-2">
                      <div>
                        <dt className="inline text-ink">Owner: </dt>
                        <dd className="inline">{m.ownerAttribution ?? "Not recorded"}</dd>
                      </div>
                      <div>
                        <dt className="inline text-ink">Attribution: </dt>
                        <dd className="inline">{m.contributorLabel ?? "Not recorded"}</dd>
                      </div>
                      <div>
                        <dt className="inline text-ink">Captured: </dt>
                        <dd className="inline">{m.captured ? formatPeriod(m.captured) : "—"}</dd>
                      </div>
                      <div>
                        <dt className="inline text-ink">Consent record: </dt>
                        <dd className="inline">{m.consentId}</dd>
                      </div>
                    </dl>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          {/* H — Sources ------------------------------------------------ */}
          <SectionCard
            title="Sources and verification"
            id="sources"
            description="Every source referenced anywhere in this profile, with its category and what it was used for."
          >
            <SourcesTable tanda={tanda} />
            {tanda.editorialNote ? (
              <div className="mt-4">
                <Callout title="Editorial note on this record">{tanda.editorialNote}</Callout>
              </div>
            ) : null}
          </SectionCard>
        </div>

        {/* -------------------------------------------------------------- */}
        {/* Aside                                                          */}
        {/* -------------------------------------------------------------- */}
        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="overflow-hidden rounded-lg border border-line bg-surface-1">
            <div className="h-44">
              {tanda.coordinates ? (
                <MapView
                  points={[
                    {
                      id: tanda.id,
                      name: tanda.primaryName,
                      lng: tanda.coordinates[0],
                      lat: tanda.coordinates[1],
                      markerKey: marker.key,
                      isDemo: tanda.isDemo,
                    },
                  ]}
                  cluster={false}
                  interactive={false}
                  initialZoom={7}
                  flyTo={{ lng: tanda.coordinates[0], lat: tanda.coordinates[1], zoom: 7 }}
                  className="h-full w-full"
                />
              ) : (
                <div className="flex h-full items-center justify-center p-4 text-center text-xs text-muted">
                  No location recorded
                </div>
              )}
            </div>
            <div className="p-3 text-[11px] text-muted">
              {COORDINATE_PRECISION_NOTE[tanda.coordinatePrecision]}
            </div>
          </div>

          <div className="rounded-lg border border-line bg-surface-1 p-4">
            <h3 className="mb-3 font-display text-base text-ink-strong">At a glance</h3>
            <div className="mb-3">
              <div className="mb-1 flex justify-between text-[11px] text-muted">
                <span>Profile completeness</span>
                <span className="tabular">{tanda.completenessPct}%</span>
              </div>
              <div
                className="h-2 w-full overflow-hidden rounded-full bg-surface-0"
                role="progressbar"
                aria-valuenow={tanda.completenessPct}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${tanda.completenessPct}%`,
                    backgroundColor: "var(--gold)",
                  }}
                />
              </div>
            </div>
            <dl className="space-y-1.5 text-xs">
              <div className="flex justify-between gap-2">
                <dt className="text-muted">Sources referenced</dt>
                <dd className="tabular text-ink">{collectSourceIds(tanda).length}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted">Recorded events</dt>
                <dd className="tabular text-ink">{tanda.events.length}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted">Media assets</dt>
                <dd className="tabular text-ink">{tanda.media.length}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted">Last reviewed</dt>
                <dd className="text-ink">{tanda.lastReviewedAt ?? "Never"}</dd>
              </div>
            </dl>
          </div>

          <nav className="rounded-lg border border-line bg-surface-1 p-4">
            <h3 className="mb-2 font-display text-base text-ink-strong">On this page</h3>
            <ul className="space-y-1 text-sm">
              {[
                ["identity", "Identity"],
                ["population", "Population"],
                ["clans", "Clans and surnames"],
                ["history", "History"],
                ["culture", "Cultural profile"],
                ["governance", "Governance and institutions"],
                ["media", "Media archive"],
                ["sources", "Sources and verification"],
              ].map(([anchor, label]) => (
                <li key={anchor}>
                  <a href={`#${anchor}`} className="text-muted hover:text-peacock">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="rounded-lg border border-line bg-surface-1 p-4">
            <h3 className="font-display text-base text-ink-strong">Something wrong or missing?</h3>
            <p className="mt-1 text-xs text-muted">
              Corrections carry the same weight as new information, and are reviewed field by
              field.
            </p>
            <Link
              href={`/contribute?tanda=${tanda.id}`}
              className="mt-3 inline-block rounded-sm bg-terracotta px-4 py-2 text-sm font-semibold text-terracotta-ink"
            >
              Suggest a correction
            </Link>
          </div>
        </aside>
      </div>

      {/* Structured data — never emitted for demo records */}
      {!tanda.isDemo && tanda.coordinates ? (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "Place",
            name: tanda.primaryName,
            alternateName: tanda.names.filter((n) => !n.isPrimary).map((n) => n.name),
            identifier: tanda.publicId,
            address: {
              "@type": "PostalAddress",
              addressRegion: state?.name,
              addressCountry: "IN",
            },
            geo: {
              "@type": "GeoCoordinates",
              latitude: tanda.coordinates[1],
              longitude: tanda.coordinates[0],
            },
          }}
        />
      ) : null}
    </>
  );
}

/* ------------------------------------------------------------------ */

function collectSourceIds(tanda: Tanda): string[] {
  const ids = new Set<string>();
  const add = (list?: string[]) => list?.forEach((i) => ids.add(i));
  add(tanda.subdistrict.sourceIds);
  add(tanda.nearestVillage.sourceIds);
  add(tanda.pinCode.sourceIds);
  add(tanda.dialect.sourceIds);
  add(tanda.populationTrend.sourceIds);
  add(tanda.surnameNotes.sourceIds);
  add(tanda.previousLocation.sourceIds);
  tanda.populationRecords.forEach((p) => ids.add(p.sourceId));
  tanda.clanPresence.forEach((c) => add(c.sourceIds));
  tanda.events.forEach((e) => add(e.sourceIds));
  tanda.practices.forEach((p) => add(p.sourceIds));
  tanda.governance.forEach((g) => add(g.sourceIds));
  tanda.institutions.forEach((i) => add(i.sourceIds));
  tanda.media.forEach((m) => add(m.sourceIds));
  tanda.originStory?.claims.forEach((c) => add(c.sourceIds));
  return [...ids];
}

function SourcesTable({ tanda }: { tanda: Tanda }) {
  const ids = collectSourceIds(tanda);
  if (ids.length === 0) {
    return (
      <p className="text-sm text-muted">
        No sources are attached to this record. Everything shown above is recorded but not
        evidenced, and the verification chips say so field by field.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[38rem] text-sm">
        <thead>
          <tr className="border-b border-line text-left text-[11px] uppercase tracking-wider text-terracotta">
            <th className="py-2 pr-3">Source</th>
            <th className="py-2 pr-3">Author / organisation</th>
            <th className="py-2 pr-3">Year</th>
            <th className="py-2">Category</th>
          </tr>
        </thead>
        <tbody>
          {ids.map((id) => {
            const s = getSource(id);
            const demo = s?.category === "demo_placeholder";
            return (
              <tr key={id} className="border-b border-line align-top">
                <td className="py-2 pr-3">
                  <span style={demo ? { color: "var(--v-disputed)" } : undefined}>
                    {s?.title ?? id}
                  </span>
                  {s?.notes ? (
                    <span className="mt-0.5 block text-[11px] text-muted">{s.notes}</span>
                  ) : null}
                </td>
                <td className="py-2 pr-3 text-muted">{s?.authorOrOrg ?? "—"}</td>
                <td className="tabular py-2 pr-3 text-muted">{s?.publicationYear ?? "—"}</td>
                <td className="py-2 text-muted">
                  {SOURCE_CATEGORY_LABEL[s?.category ?? ""] ?? "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
