import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapView } from "@/components/MapView";
import {
  Breadcrumbs,
  Callout,
  ConfidenceChip,
  DemoChip,
  FactRow,
  PageHeader,
  SectionCard,
  SourceList,
  VerificationChip,
} from "@/components/ui";
import { CLANS, CLAN_RELATIONSHIP_LABEL } from "@/data/clans";
import { STATE_BY_ID } from "@/data/geography";
import { SURNAMES } from "@/data/surnames";
import { PRESENCE_BAND_LABEL, markerState } from "@/lib/format";
import { clanRelationships, getClan, tandasForClan } from "@/lib/repository";

export function generateStaticParams() {
  return CLANS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const clan = getClan(slug);
  if (!clan) return { title: "Clan not found" };
  return {
    title: clan.primaryName,
    description: `${clan.primaryName} — recorded spellings, regions where the name is reported, associations and sources. ${clan.summary.slice(0, 120)}`,
  };
}

export default async function ClanDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const clan = getClan(slug);
  if (!clan) notFound();

  const rels = clanRelationships(clan.id);
  const settlements = tandasForClan(clan.id);
  const relatedSurnames = SURNAMES.filter((s) =>
    s.clanAssociations.some((a) => a.clanId === clan.id),
  );

  return (
    <>
      <PageHeader eyebrow="Clan name" title={clan.primaryName} standfirst={clan.summary}>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <VerificationChip status={clan.verification} />
          <ConfidenceChip level={clan.confidence} />
        </div>
      </PageHeader>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_18rem]">
        <div className="space-y-6">
          <Breadcrumbs
            items={[{ label: "Clan explorer", href: "/clans" }, { label: clan.primaryName }]}
          />

          <SectionCard
            title="Recorded name variants"
            description="Search runs across every spelling here, not against a single canonical form. There is no 'correct' spelling privileged in lookup."
          >
            <ul className="flex flex-wrap gap-2">
              <li className="rounded-sm border-2 border-terracotta px-3 py-1.5 text-sm text-ink">
                {clan.primaryName} <span className="text-[10px] text-muted">display form</span>
              </li>
              {clan.variants.map((v) => (
                <li
                  key={v.variant}
                  className="rounded-sm border border-line-strong px-3 py-1.5 text-sm text-ink"
                >
                  {v.variant}
                  {v.region ? (
                    <span className="ml-1.5 text-[10px] text-muted">{v.region}</span>
                  ) : null}
                  {v.script && v.script !== "Latn" ? (
                    <span className="ml-1.5 text-[10px] text-muted">{v.script}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard
            title="Where the name is reported"
            description="Regions where the name is commonly used in community speech. This is not a distribution measurement and carries no population implication."
          >
            <dl>
              <FactRow
                label="Reported regions"
                fact={{
                  ...clan.reportedRegions,
                  value: clan.reportedRegions.value?.join(" · ") ?? null,
                }}
              />
              <FactRow label="Traditional occupations" fact={clan.traditionalOccupations} />
            </dl>
          </SectionCard>

          <SectionCard
            title="Associated names"
            description="Typed associations, each with its own source and region. There is deliberately no parent, no child and no ordering."
          >
            {rels.length === 0 ? (
              <p className="text-sm text-muted">No associations recorded for this name.</p>
            ) : (
              <ul className="space-y-3">
                {rels.map((r, i) => {
                  const otherId = r.fromClanId === clan.id ? r.toClanId : r.fromClanId;
                  const other = CLANS.find((c) => c.id === otherId);
                  const disputed = r.relationship === "disputed_association";
                  return (
                    <li
                      key={i}
                      className="rounded-lg border p-3"
                      style={{
                        borderColor: disputed ? "var(--v-disputed)" : "var(--line)",
                        borderWidth: disputed ? 2 : 1,
                      }}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/clans/${other?.slug ?? ""}`}
                          className="font-display text-base text-ink-strong hover:text-peacock"
                        >
                          {other?.primaryName ?? otherId}
                        </Link>
                        <span className="text-[11px] uppercase tracking-wider text-terracotta">
                          {CLAN_RELATIONSHIP_LABEL[r.relationship]}
                        </span>
                        <VerificationChip status={r.verification} size="sm" />
                      </div>
                      {r.region ? (
                        <p className="mt-1 text-xs text-muted">Region: {r.region}</p>
                      ) : null}
                      {r.editorialNote ? (
                        <p className="mt-1 text-[11px] italic text-muted">{r.editorialNote}</p>
                      ) : null}
                      <div className="mt-2">
                        <SourceList ids={r.sourceIds} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </SectionCard>

          <SectionCard
            title="Surnames associated with this name"
            description="Associations are region-qualified and strength-graded. A surname is never recorded as belonging to a clan."
          >
            {relatedSurnames.length === 0 ? (
              <p className="text-sm text-muted">No surnames indexed against this name yet.</p>
            ) : (
              <ul className="space-y-2">
                {relatedSurnames.map((s) => {
                  const assoc = s.clanAssociations.find((a) => a.clanId === clan.id)!;
                  return (
                    <li
                      key={s.id}
                      className="flex flex-wrap items-center gap-2 border-b border-line pb-2 last:border-b-0"
                    >
                      <Link
                        href={`/surnames?s=${s.slug}`}
                        className="font-display text-base text-ink-strong hover:text-peacock"
                      >
                        {s.primaryForm}
                      </Link>
                      <span className="text-xs text-muted">
                        {s.variants.map((v) => v.variant).join(" · ")}
                      </span>
                      <span className="ml-auto text-[11px] text-muted">{assoc.region}</span>
                      <VerificationChip status={assoc.verification} size="sm" />
                    </li>
                  );
                })}
              </ul>
            )}
          </SectionCard>

          <SectionCard
            title="Settlements where this name is documented"
            description="Presence bands, never counts. A settlement appears here because a source records the name there."
          >
            {settlements.length === 0 ? (
              <p className="text-sm text-muted">
                No settlements in this archive record this name yet.
              </p>
            ) : (
              <ul className="space-y-2">
                {settlements.map(({ tanda, band }) => (
                  <li
                    key={tanda.id}
                    className="flex flex-wrap items-center gap-2 border-b border-line pb-2 last:border-b-0"
                  >
                    <Link
                      href={`/tanda/${tanda.id}`}
                      className="font-display text-base text-ink-strong hover:text-peacock"
                    >
                      {tanda.primaryName}
                    </Link>
                    {tanda.isDemo ? <DemoChip /> : null}
                    <span className="rounded-sm border border-line-strong px-1.5 py-0.5 text-[11px] text-ink">
                      {PRESENCE_BAND_LABEL[band]}
                    </span>
                    <span className="ml-auto text-xs text-muted">
                      {STATE_BY_ID.get(tanda.stateId)?.name}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard title="Oral traditions and origin accounts">
            {clan.oralTraditions ? (
              <ul className="space-y-3">
                {clan.oralTraditions.claims.map((c, i) => (
                  <li key={i} className="rounded-lg border border-line bg-surface-0 p-3">
                    <p className="text-sm text-ink">{c.value}</p>
                    <div className="mt-2">
                      <VerificationChip status={c.verification} size="sm" />
                    </div>
                    <div className="mt-2">
                      <SourceList ids={c.sourceIds} />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-muted">
                <p>
                  No oral tradition is recorded for this name. Where different regions hold
                  different accounts, this archive will show each separately rather than merge them
                  — merging is what destroys the information.
                </p>
                <Link href="/contribute" className="mt-2 inline-block text-peacock underline">
                  Record an account →
                </Link>
              </div>
            )}
          </SectionCard>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="overflow-hidden rounded-lg border border-line bg-surface-1">
            <div className="h-52">
              <MapView
                points={settlements
                  .filter(({ tanda }) => tanda.coordinates)
                  .map(({ tanda }) => ({
                    id: tanda.id,
                    name: tanda.primaryName,
                    lng: tanda.coordinates![0],
                    lat: tanda.coordinates![1],
                    markerKey: markerState(tanda.verification, tanda.settlementType).key,
                    isDemo: tanda.isDemo,
                  }))}
                cluster={false}
                interactive={false}
                className="h-full w-full"
              />
            </div>
            <p className="p-3 text-[11px] text-muted">
              Settlements in this archive where the name is recorded. With {settlements.length}{" "}
              {settlements.length === 1 ? "record" : "records"} this is not a distribution map, and
              should not be read as one.
            </p>
          </div>

          {clan.editorialNote ? (
            <Callout title="Editorial note">{clan.editorialNote}</Callout>
          ) : null}

          <Callout tone="warn" title="Do not use this to classify a person">
            Clan names are shared far beyond community boundaries. Several of the names in this
            index are borne widely by people with no connection to Gor/Banjara communities.
            Treating a name as a classification is how records become instruments of harm.
          </Callout>
        </aside>
      </div>
    </>
  );
}
