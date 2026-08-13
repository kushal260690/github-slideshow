import type { Metadata } from "next";
import Link from "next/link";
import { Callout, PageHeader, SectionCard } from "@/components/ui";
import { VERIFICATION_MEANING, INTERPRETATION_MEANING } from "@/lib/format";

export const metadata: Metadata = {
  title: "Methodology",
  description:
    "How Gor Atlas collects, evaluates, labels and corrects evidence — the verification model, precision rules and dispute handling.",
};

export default function MethodologyPage() {
  return (
    <>
      <PageHeader
        eyebrow="How this archive works"
        title="Methodology"
        standfirst="Gor Atlas is not an encyclopedia that asserts facts. It is a register of claims with evidence attached to each one, and this page explains exactly how that evidence is graded."
      />

      <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
        <SectionCard
          title="The problem this model solves"
          description="Five kinds of evidence with genuinely different properties, which a single 'fact' field would destroy."
        >
          <div className="prose-atlas max-w-none text-sm text-muted">
            <ul>
              <li>
                A <strong className="text-ink">census figure</strong> is precise, dated and
                methodologically documented — and frequently undercounts hamlets that are
                administratively folded into a parent village.
              </li>
              <li>
                A <strong className="text-ink">gazetteer or revenue record</strong> is authoritative
                on administrative status and often wrong or colonial-inflected on community
                description.
              </li>
              <li>
                An <strong className="text-ink">academic study</strong> is interpretive. Two
                competent scholars disagree.
              </li>
              <li>
                An <strong className="text-ink">oral history</strong> is the community&rsquo;s own
                memory, and for settlement formation and migration it is usually the only record.
                It is not lesser evidence — it is different evidence, with different failure modes.
              </li>
              <li>
                An <strong className="text-ink">unverified submission</strong> is a lead, not a
                finding.
              </li>
            </ul>
            <p className="text-ink">
              A platform that displays all five identically is lying about its own confidence.
            </p>
          </div>
        </SectionCard>

        <SectionCard
          title="Two independent axes"
          description="What kind of evidence this is, and how well it has been checked, are separate questions. Both are always shown."
        >
          <h3 className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-terracotta">
            Verification status
          </h3>
          <dl className="mt-2 space-y-2 text-sm">
            {Object.entries(VERIFICATION_MEANING).map(([k, v]) => (
              <div key={k} className="border-b border-line pb-2">
                <dt className="font-medium text-ink">{k.replace(/_/g, " ")}</dt>
                <dd className="text-muted">{v}</dd>
              </div>
            ))}
          </dl>

          <h3 className="mt-5 text-[11px] font-semibold uppercase tracking-wider text-terracotta">
            Interpretation labels for historical and migration claims
          </h3>
          <dl className="mt-2 space-y-2 text-sm">
            {Object.entries(INTERPRETATION_MEANING).map(([k, v]) => (
              <div key={k} className="border-b border-line pb-2">
                <dt className="font-medium text-ink">{k.replace(/_/g, " ")}</dt>
                <dd className="text-muted">{v}</dd>
              </div>
            ))}
          </dl>

          <p className="mt-4 text-sm text-muted">
            Confidence — high, medium or low — combines both axes with the{" "}
            <em>specificity of the claim</em>. A precisely dated settlement year taken from a single
            oral account is low confidence, because the precision of the claim exceeds what the
            evidence can carry.
          </p>
        </SectionCard>

        <SectionCard
          title="Precision rules"
          description="Enforced in the database schema, not left to editorial goodwill. A rule that depends on everyone remembering it is not a rule."
        >
          <ol className="list-decimal space-y-2 pl-5 text-sm text-muted">
            <li>
              <strong className="text-ink">No population figure without a dated source.</strong>{" "}
              Both the year and the source are <code>NOT NULL</code> on the population table.
            </li>
            <li>
              <strong className="text-ink">No exact year when only a period is known.</strong> Dates
              are stored as a range plus a precision. &ldquo;Late nineteenth century&rdquo; is
              stored as 1875–1900 and rendered as &ldquo;second half of the 1800s
              (approx.)&rdquo; — never as 1887. A constraint blocks marking a range as an exact
              year.
            </li>
            <li>
              <strong className="text-ink">No surname exclusivity.</strong> Surname-to-clan links
              are many-to-many, region-qualified and strength-graded. There is no column that could
              express &ldquo;belongs to&rdquo;.
            </li>
            <li>
              <strong className="text-ink">No inference.</strong> Nothing derives a person&rsquo;s
              clan, caste or family from a surname. There is no code path that does this.
            </li>
            <li>
              <strong className="text-ink">Reduced precision for unverified locations.</strong>{" "}
              Coordinates not confirmed by a verified representative are rounded to roughly 110 m;
              sensitive sites to roughly 5 km, and excluded from bulk export.
            </li>
            <li>
              <strong className="text-ink">Empty is a visible answer.</strong> &ldquo;Not yet
              documented&rdquo; is a first-class state with a contribution prompt, not a blank.
            </li>
          </ol>
        </SectionCard>

        <SectionCard
          title="Who may verify what"
          description="Promotion to verified always requires a second reviewer distinct from the contributor. Self-verification is blocked at the database level."
        >
          <p className="text-sm text-muted">
            Roles run from public contributor through verified Tanda representative, district
            researcher, subject-matter expert and state editor to historian-reviewer and super
            administrator. Each has a ceiling on the verification status it may set, and state
            editors are scoped to their own state. The full table is on the{" "}
            <Link href="/admin" className="text-peacock underline">
              moderation dashboard
            </Link>
            .
          </p>
        </SectionCard>

        <SectionCard
          title="Dispute handling"
          description="The platform records disagreement rather than adjudicating it."
        >
          <ol className="list-decimal space-y-2 pl-5 text-sm text-muted">
            <li>Anyone may open a dispute, with a reason and ideally a counter-source.</li>
            <li>
              The claim is immediately marked disputed and rendered with a red outline. It is{" "}
              <strong className="text-ink">not</strong> hidden — suppressing a contested claim is
              itself an editorial act.
            </li>
            <li>A historian-level reviewer attaches a note on the state of the evidence.</li>
            <li>
              Resolution is either corroboration of one version, or permanent coexistence.
              Coexistence is legitimate and, for traditions that genuinely differ by region, the
              expected outcome.
            </li>
          </ol>
          <Callout tone="gold" title="The position this archive takes">
            Regional variation in oral tradition is data, not error. An archive that harmonises
            differing accounts into one clean narrative has destroyed the very thing that made them
            worth collecting.
          </Callout>
        </SectionCard>

        <SectionCard title="What this archive will never publish">
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
            <li>Fabricated seed data of any kind</li>
            <li>A precise population without a dated source</li>
            <li>An exact establishment year when only a period is known</li>
            <li>A claim that a surname belongs exclusively to one clan</li>
            <li>Any inference of caste, clan or family relationship from a surname</li>
            <li>Individual-level genealogical records without explicit consent</li>
            <li>Political-party classification of a settlement</li>
            <li>Household mapping, private phone numbers or sensitive personal records</li>
            <li>Any ranking of clans by status</li>
            <li>Unsupported claims of racial, royal or ancient descent</li>
          </ul>
          <p className="mt-3 text-sm text-muted">
            The five demonstration records in this prototype are the only invented data in the
            system. Each is labelled on every screen it appears on, excluded from every public
            counter, blocked from search-engine indexing, and — by a database rule — can never be
            marked verified.
          </p>
        </SectionCard>

        <Callout title="Corrections">
          If something here is wrong, the correction path is the same one used for new information,
          and a correction with a source attached is the most valuable contribution this archive
          can receive.{" "}
          <Link href="/contribute">Submit a correction →</Link>
        </Callout>
      </div>
    </>
  );
}
