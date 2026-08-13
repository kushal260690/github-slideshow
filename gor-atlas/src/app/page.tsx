import Link from "next/link";
import { HeroCopy } from "@/components/HeroCopy";
import { HeroGlobe } from "@/components/HeroGlobe";
import { CountUp, Reveal } from "@/components/Reveal";
import { WorldStrip } from "@/components/WorldStrip";
import { Callout, DemoChip, Stat, TextileRule, VerificationChip } from "@/components/ui";
import { ARTICLES } from "@/data/articles";
import { STATES } from "@/data/geography";
import { formatNumber, formatPeriod } from "@/lib/format";
import {
  foundingEvent,
  latestAdditions,
  latestPopulation,
  listClans,
  listRoutes,
  listTandas,
  majorClans,
  publicStats,
} from "@/lib/repository";

/** Decorative rotation for article cards. Carries no meaning. */
const ART_COLORS = [
  "var(--gor-magenta)",
  "var(--gor-turmeric)",
  "var(--gor-peacock)",
  "var(--gor-vermilion)",
  "var(--gor-cream)",
  "var(--gor-cobalt-deep)",
];

export default function HomePage() {
  const stats = publicStats();
  const featured = listTandas()[0];
  const clans = listClans().slice(0, 8);
  const routes = listRoutes().filter((r) => !r.isDemo);
  const additions = latestAdditions(4);
  const featuredPop = latestPopulation(featured);
  const featuredFounded = foundingEvent(featured);

  return (
    <>
      {/* ---------------------------------------------------------------- */}
      {/* Hero                                                             */}
      {/* ---------------------------------------------------------------- */}
      <section className="relative min-h-[86vh] overflow-hidden border-b border-line bg-surface-0">
        <HeroGlobe />
        <HeroCopy />
      </section>

      {/* World scope — the archive is not India-only */}
      <WorldStrip />

      {/* ---------------------------------------------------------------- */}
      {/* Counters — computed from the database, including the zeros        */}
      {/* ---------------------------------------------------------------- */}
      <section className="border-b border-line bg-surface-1">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <h2 className="mb-1 flex items-center gap-3 font-poster text-3xl text-ink-strong">
            <span className="mirror-dot" aria-hidden />
            Where the archive stands
          </h2>
          <p className="mb-5 max-w-3xl text-sm text-muted">
            Every figure below is computed from the live database. Most of them are zero, and they
            are shown as zero. A cultural archive that opens with impressive numbers it cannot
            source has already told you what kind of archive it is.
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Stat
              value={<CountUp value={stats.tandasDocumented} />}
              label="Tandas documented"
              note="Real records, excluding demos"
              href="/directory"
            />
            <Stat
              value={<CountUp value={stats.tandasVerified} />}
              label="Verified profiles"
              note="Two sources, one documentary, one reviewer"
              tone="gold"
            />
            <Stat
              value={<CountUp value={stats.statesCovered} />}
              label="States covered"
              note={`${stats.statesOpenForDocumentation} states open for documentation`}
              href="/states"
            />
            <Stat
              value={<CountUp value={stats.documentarySources} />}
              label="Documentary source leads"
              note="Registered, awaiting citation detail"
              href="/sources"
            />
            <Stat
              value={<CountUp value={stats.oralHistories} />}
              label="Oral histories preserved"
              note="Published with recorded consent"
              href="/oral-histories"
            />
            <Stat
              value={<CountUp value={stats.tandasDemo} />}
              label="Demonstration records"
              note="Invented. Excluded from every count above."
              tone="demo"
              href="/tanda/demo-0001"
            />
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Map preview                                                      */}
      {/* ---------------------------------------------------------------- */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-poster text-3xl text-ink-strong">The interactive map</h2>
              <p className="mt-1 max-w-2xl text-sm text-muted">
                Zoom from country to Tanda, filter by clan, period, population and verification
                status, and switch between standard, satellite, terrain and archival views.
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/map" className="text-sm text-peacock underline">
                Open the full map →
              </Link>
              <Link href="/directory" className="text-sm text-peacock underline">
                Text directory →
              </Link>
            </div>
          </div>
          <Link
            href="/map"
            className="group relative block overflow-hidden rounded-lg border border-line bg-surface-1"
          >
            <div className="relative h-64 sm:h-80">
              <HeroGlobe />
              <div className="absolute inset-0 flex items-center justify-center bg-surface-0/40">
                <span className="rounded-sm border border-line-strong bg-surface-1 px-4 py-2 text-sm text-ink transition-colors group-hover:border-peacock group-hover:text-peacock">
                  Open the interactive map
                </span>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Featured Tanda + clans                                           */}
      {/* ---------------------------------------------------------------- */}
      <section className="border-b border-line bg-surface-1">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-2">
          <div>
            <h2 className="font-poster text-3xl text-ink-strong">Featured Tanda</h2>
            <p className="mt-1 text-sm text-muted">
              A profile template shown with demonstration data, so you can see the structure a real
              record will carry.
            </p>
            <article className="paper mt-4 rounded-lg border border-line p-5 shadow-lg">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-display text-xl text-ink-strong">{featured.primaryName}</h3>
                {featured.isDemo ? <DemoChip /> : null}
                <VerificationChip status={featured.verification} size="sm" />
              </div>
              <p className="mt-1 text-sm text-muted">
                {STATES.find((s) => s.id === featured.stateId)
                  ?.districts.find((d) => d.id === featured.districtId)?.name ?? ""}
                , {STATES.find((s) => s.id === featured.stateId)?.name}
              </p>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between gap-4 border-b border-line pb-2">
                  <dt className="text-muted">Population</dt>
                  <dd className="tabular text-right text-ink">
                    {featuredPop?.totalPopulation
                      ? `${formatNumber(featuredPop.totalPopulation)} (${featuredPop.asOfYear})`
                      : "Not yet documented"}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-line pb-2">
                  <dt className="text-muted">Established</dt>
                  <dd className="text-right text-ink">
                    {featuredFounded ? formatPeriod(featuredFounded.period) : "Not yet documented"}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-line pb-2">
                  <dt className="text-muted">Major clans</dt>
                  <dd className="text-right text-ink">
                    {majorClans(featured).join(", ") || "Not yet documented"}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Profile completeness</dt>
                  <dd className="text-right text-ink">{featured.completenessPct}%</dd>
                </div>
              </dl>
              <Link
                href={`/tanda/${featured.id}`}
                className="mt-4 inline-block rounded-sm bg-terracotta px-4 py-2 text-sm font-semibold text-terracotta-ink"
              >
                Explore Tanda
              </Link>
            </article>
          </div>

          <div>
            <h2 className="font-poster text-3xl text-ink-strong">Clans and surnames</h2>
            <p className="mt-1 text-sm text-muted">
              Names as names. Not a genealogy, not a ranking, and never a way to infer anything
              about an individual.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {clans.map((c) => (
                <Link
                  key={c.id}
                  href={`/clans/${c.slug}`}
                  className="rounded-lg border border-line bg-surface-0 p-3 transition-colors hover:border-peacock"
                >
                  <span className="block font-display text-base text-ink-strong">
                    {c.primaryName}
                  </span>
                  <span className="mt-0.5 block truncate text-[11px] text-muted">
                    {c.variants
                      .filter((v) => !v.script || v.script === "Latn")
                      .slice(0, 3)
                      .map((v) => v.variant)
                      .join(" · ")}
                  </span>
                </Link>
              ))}
            </div>
            <div className="mt-3 flex gap-3">
              <Link href="/clans" className="text-sm text-peacock underline">
                Clan explorer →
              </Link>
              <Link href="/surnames" className="text-sm text-peacock underline">
                Surname explorer →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Migration                                                        */}
      {/* ---------------------------------------------------------------- */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <h2 className="font-poster text-3xl text-ink-strong">The migration story</h2>
          <p className="mt-1 max-w-3xl text-sm text-muted">
            Movement is the part of this history most often stated with false confidence. Every
            route here carries several evidence entries with different labels, and they are shown
            separately rather than averaged.
          </p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {routes.map((r) => (
              <Link
                key={r.id}
                href={`/migration?route=${r.slug}`}
                className="rounded-lg border border-line bg-surface-1 p-5 transition-colors hover:border-peacock"
              >
                <h3 className="font-display text-lg text-ink-strong">{r.name}</h3>
                <p className="tabular mt-0.5 text-xs text-terracotta">{formatPeriod(r.period)}</p>
                <p className="mt-2 line-clamp-3 text-sm text-muted">{r.description}</p>
                <p className="mt-3 text-[11px] text-muted">
                  {r.evidence.length} evidence entries ·{" "}
                  {[...new Set(r.evidence.map((e) => e.interpretation))].length} different
                  interpretation labels
                </p>
              </Link>
            ))}
          </div>
          <div className="mt-4 flex gap-3">
            <Link href="/migration" className="text-sm text-peacock underline">
              Open the migration map →
            </Link>
            <Link href="/timeline" className="text-sm text-peacock underline">
              Historical timeline →
            </Link>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Cultural archive                                                 */}
      {/* ---------------------------------------------------------------- */}
      <section className="border-b border-line bg-surface-1">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-poster text-3xl text-ink-strong">Cultural archive</h2>
              <p className="mt-1 max-w-2xl text-sm text-muted">
                Editorial drafts, each marked as such. Nothing here has been checked against its
                sources by a named reviewer yet.
              </p>
            </div>
            <Link href="/encyclopedia" className="text-sm text-peacock underline">
              All articles →
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ARTICLES.slice(0, 6).map((a, i) => (
              <Reveal key={a.id} delay={i * 40}>
              <Link
                href={`/encyclopedia/${a.slug}`}
                className="paper group rounded-lg border border-line p-5 transition-all hover:-translate-y-0.5 hover:border-gor-magenta"
              >
                <p
                  className="text-[11px] uppercase tracking-wider"
                  style={{ color: ART_COLORS[i % ART_COLORS.length] }}
                >
                  {a.section}
                </p>
                <h3 className="mt-1 font-display text-lg text-ink-strong">{a.title}</h3>
                <p className="mt-2 line-clamp-3 text-sm text-muted">{a.standfirst}</p>
                <p className="mt-3 text-[11px] text-muted">
                  {a.readingMinutes} min read · Editorial draft
                </p>
              </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Contribute + partners + latest                                   */}
      {/* ---------------------------------------------------------------- */}
      <section>
        <TextileRule variant="gold" />
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h2 className="font-poster text-3xl text-ink-strong">
              This archive is built by the community
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-muted">
              Most of what belongs in this archive is not in any book. It is held by people who
              live in these settlements and by families who left them. If you know a Tanda —
              its name, its clans, when it was founded, why people came — that is the record.
            </p>
            <Callout tone="gold" title="What happens to what you send">
              Nothing publishes automatically. Every submission is reviewed field by field by a
              district researcher or state editor, and a reviewer may accept some fields and
              reject others. Nothing carrying media or testimony moves at all without a consent
              record — and recorded verbal consent, in the speaker&rsquo;s own language, counts.
            </Callout>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/contribute"
                className="rounded-sm bg-terracotta px-5 py-2.5 text-sm font-semibold text-terracotta-ink"
              >
                Document Your Tanda
              </Link>
              <Link
                href="/methodology"
                className="rounded-sm border border-line-strong px-5 py-2.5 text-sm text-ink hover:border-peacock hover:text-peacock"
              >
                How we verify
              </Link>
            </div>
          </div>

          <div>
            <h3 className="font-display text-lg text-ink-strong">Latest additions</h3>
            <ul className="mt-3 space-y-2">
              {additions.map((a) => (
                <li key={a.href} className="border-b border-line pb-2">
                  <Link href={a.href} className="text-sm text-ink hover:text-peacock">
                    {a.title}
                  </Link>
                  <p className="text-[11px] text-muted">
                    {a.kind} · {a.at}
                  </p>
                </li>
              ))}
            </ul>
            <h3 className="mt-6 font-display text-lg text-ink-strong">Research partners</h3>
            <p className="mt-1 text-xs text-muted">
              No institution has endorsed this prototype. The partners page lists the
              relationships this project intends to build and marks each as intended rather than
              established.
            </p>
            <Link href="/sources" className="mt-2 inline-block text-sm text-peacock underline">
              Sources and partners →
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
