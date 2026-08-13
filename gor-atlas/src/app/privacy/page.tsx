import type { Metadata } from "next";
import Link from "next/link";
import { Callout, PageHeader, SectionCard } from "@/components/ui";

export const metadata: Metadata = {
  title: "Privacy and community data policy",
  description:
    "What this archive stores, what it structurally cannot store, how consent works, and how to have something corrected or removed.",
};

export default function PrivacyPage() {
  return (
    <>
      <PageHeader
        eyebrow="Policy"
        title="Privacy and community data policy"
        standfirst="This archive documents a community that earlier record-keeping systems used against it. The safeguards below are built into the schema, not bolted onto the interface."
      />

      <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
        <Callout tone="warn" title="Why this policy is stricter than you might expect">
          A number of nomadic and itinerant communities, including Banjara groups in several
          provinces, were notified under the Criminal Tribes Act of 1871 and subjected to
          registration, restriction of movement and surveillance. The Act was repealed in 1952 and
          affected communities were described as denotified. A cultural archive of a historically
          over-policed community must be structurally incapable of being used as a registry of
          people. That requirement shaped the data model before it shaped anything else.
        </Callout>

        <SectionCard
          title="What this archive structurally cannot store"
          description="These are absences in the data model. There is no column, no upload category and no API field for any of them."
        >
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
            <li>Household-level mapping or household enumeration</li>
            <li>Names, addresses or phone numbers of private individuals</li>
            <li>Individual-level genealogical records</li>
            <li>Caste certificates, ration or BPL identifiers, Aadhaar or any government ID</li>
            <li>Political-party classification of a Tanda or clan</li>
            <li>Land-ownership or dispute records attributable to a family</li>
            <li>Any ranking of clans by status, purity or precedence</li>
          </ul>
          <p className="mt-3 text-sm text-muted">
            Only public institutional contact details — a school, a panchayat office, a registered
            society — may be stored, in a table that has no relationship to any person entity.
          </p>
        </SectionCard>

        <SectionCard
          title="Aggregation floor"
          description="The minimum publishable unit is the settlement."
        >
          <p className="text-sm text-muted">
            Clan and surname information is published only as a band —{" "}
            <em>predominant, substantial, present, reported</em> — never as a count of families and
            never as a percentage unless a dated credible source supplies one. Where a
            settlement&rsquo;s recorded household count is below ten, sex and child breakdowns are
            withheld even when a source provides them, because at that size a breakdown becomes
            individually identifying.
          </p>
        </SectionCard>

        <SectionCard
          title="Consent"
          description="Every media asset carries a consent record before it can be published. This is enforced by a database trigger."
        >
          <p className="text-sm text-muted">The consent record captures:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
            <li>Who granted it and in what capacity (recorded internally, not published)</li>
            <li>
              Scope: archive only, public display, or public reuse under a licence — defaulting to
              the most restrictive
            </li>
            <li>Attribution preference: full name, initials, village only, or anonymous</li>
            <li>
              Commercial use: <strong className="text-ink">no</strong> by default
            </li>
            <li>
              AI training use: <strong className="text-ink">no</strong> by default, and never
              defaulted to yes under any circumstance
            </li>
            <li>Whether a minor is depicted, and guardian consent if so</li>
            <li>Whether consent was verbal, and a recording of it in the speaker&rsquo;s language</li>
          </ul>
          <p className="mt-3 text-sm text-muted">
            <strong className="text-ink">Verbal consent is fully valid</strong>, and must be: many
            oral-history narrators are elders who may not read the consent language. Recorded verbal
            consent in the narrator&rsquo;s own language is attached to the consent record.
          </p>
        </SectionCard>

        <SectionCard title="Withdrawal">
          <p className="text-sm text-muted">
            Consent is revocable at any time. A withdrawal is honoured within seven days and
            cascades: the asset is unpublished and removed from caches and search indexes. The
            public changelog records that a withdrawal occurred{" "}
            <strong className="text-ink">without naming the person who withdrew it</strong>.
          </p>
          <p className="mt-2 text-sm text-muted">
            A verified representative body of a settlement may also request removal of that
            settlement&rsquo;s culturally specific material — media, oral histories, ritual detail.
            Geographic and census-derived facts, which are public record, remain.
          </p>
        </SectionCard>

        <SectionCard title="Children and vulnerable persons">
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
            <li>No identifying media of a minor is published without guardian consent and a benefit review.</li>
            <li>School photographs, if published, carry no names.</li>
            <li>
              Media depicting a person in distress, a disaster, a displacement or an eviction is
              archive-only by default and requires historian-level review to publish at all.
            </li>
          </ul>
        </SectionCard>

        <SectionCard title="Location precision is a privacy control">
          <p className="text-sm text-muted">
            Verified settlement centroids are published at full precision. Unverified and
            community-submitted locations are rounded to roughly 110 m. A settlement flagged
            sensitive — for instance one facing eviction pressure or a live dispute — is rounded to
            roughly 5 km and excluded from bulk dataset export. There is never a household-level
            coordinate; the smallest geographic unit is the settlement.
          </p>
        </SectionCard>

        <SectionCard title="Contributor data">
          <p className="text-sm text-muted">
            Contributor identity is verified for audit integrity and is not public by default.
            Contributors choose per submission between public name, initials, village-only
            attribution, or anonymity. Internal identity is accessible only to super administrators
            and is never included in a dataset export.
          </p>
        </SectionCard>

        <SectionCard title="Data sovereignty">
          <p className="text-sm text-muted">
            The community, not the platform, owns contributed cultural material. The platform holds
            a revocable licence to display it. Bulk export excludes contributor identities, consent
            evidence, archive-only media, sensitive coordinates, demonstration records, and any
            oral-history transcript whose consent scope does not permit reuse.
          </p>
        </SectionCard>

        <SectionCard title="Correction and grievance">
          <ol className="list-decimal space-y-1 pl-5 text-sm text-muted">
            <li>Submit a correction or removal request through the contribution route.</li>
            <li>Acknowledgement within 72 hours.</li>
            <li>Resolution, or a written explanation of why not, within 30 days.</li>
            <li>Appeal to the editorial board if the outcome is unsatisfactory.</li>
            <li>
              Outcomes are logged anonymously in the public changelog, so the grievance mechanism is
              itself auditable.
            </li>
          </ol>
          <Link href="/contribute" className="mt-3 inline-block text-sm text-peacock underline">
            Submit a correction or removal request →
          </Link>
        </SectionCard>

        <SectionCard title="Analytics">
          <p className="text-sm text-muted">
            Analytics, when enabled, are privacy-respecting and aggregate: no cross-site tracking,
            no advertising identifiers, no third-party profiling, and no sale or sharing of usage
            data. Location used for the &ldquo;Tandas near me&rdquo; feature stays in your browser
            and is never sent to the server.
          </p>
        </SectionCard>
      </div>
    </>
  );
}
