import type { Metadata } from "next";
import Link from "next/link";
import { Callout, PageHeader, SectionCard, TextileRule } from "@/components/ui";
import { publicStats } from "@/lib/repository";

export const metadata: Metadata = {
  title: "About the project",
  description: "What Gor Atlas is, what it is not, and what it currently holds.",
};

export default function AboutPage() {
  const stats = publicStats();
  return (
    <>
      <PageHeader
        eyebrow="About"
        title="Gor Atlas"
        standfirst="A source-attributed geographic and cultural archive of the Gor/Banjara/Lambadi/Lambani community. Every Tanda. Every Clan. Every Story."
      />

      <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
        <div className="prose-atlas max-w-none text-ink">
          <h2>What this is</h2>
          <p>
            Gor Atlas records Gor/Banjara settlements, clans, migration, language and cultural
            practice, with the evidence for each claim attached to that claim. Its unit of record
            is the <strong>Tanda</strong> rather than the village, because that is the settlement
            form the community actually lives in — and because many Tandas are administratively
            folded into a parent village and appear in no official list of their own.
          </p>

          <h2>What makes it different from a wiki</h2>
          <p>
            There is no bare factual field anywhere in this system. Every contestable statement
            carries its own source, verification status, confidence level, contributor and
            reviewer, and the interface never shows a value without also showing that provenance.
            Two sources that disagree are represented as two claims, not resolved into one.
          </p>

          <h2>What it will not do</h2>
          <p>
            It will not build a genealogy, rank clans, infer a person&rsquo;s community from their
            surname, map households, publish an exact date the evidence cannot support, or hold any
            record about a private individual. These are not policy promises — they are absences in
            the data model. There is no column for most of them.
          </p>

          <h2>Why the safeguards are this strict</h2>
          <p>
            This archive documents a community that has been surveilled, mis-registered and
            criminalised by earlier record-keeping systems. A number of nomadic and itinerant
            communities, including Banjara groups in several provinces, were notified under the
            Criminal Tribes Act of 1871, which was not repealed until 1952. A cultural archive of a
            historically over-policed community has to be structurally incapable of being used as a
            registry of people, and that requirement shaped the schema before it shaped the
            interface.
          </p>

          <h2>Where it currently stands</h2>
          <p>
            This is a prototype. It holds <strong>{stats.tandasDocumented} real settlement records</strong>{" "}
            and {stats.tandasDemo} clearly labelled demonstration records, {stats.clansDocumented}{" "}
            community-attested clan names, {stats.surnamesIndexed} indexed surnames,{" "}
            {stats.articlesPublished} editorial draft articles and {stats.migrationRoutes} migration
            routes. Nothing is verified. Those numbers are computed from the database rather than
            written into the page, and they are shown as they are.
          </p>
        </div>

        <TextileRule />

        <SectionCard title="How it is built">
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
            <li>Next.js with TypeScript, server-rendered public profiles, SEO metadata and JSON-LD</li>
            <li>Tailwind CSS on a token layer with dark, light and high-contrast themes</li>
            <li>MapLibre GL over open raster tiles — no proprietary map dependency</li>
            <li>PostgreSQL with PostGIS, pg_trgm fuzzy search and row-level security</li>
            <li>Object storage for archival media, gated behind consent records</li>
            <li>Role-based editorial workflow with field-level review and an append-only audit log</li>
            <li>Multilingual architecture storing translations separately from originals</li>
          </ul>
          <p className="mt-3 text-sm text-muted">
            The full information architecture, data model, verification model and privacy design
            are documented in the repository under <code>docs/</code>, and the schema under{" "}
            <code>db/</code>.
          </p>
        </SectionCard>

        <Callout tone="gold" title="Editorial independence">
          Gor Atlas carries no political affiliation, endorses no organisation, and ranks no clan
          above another. It does not classify settlements by political allegiance and will not
          accept data that does.
        </Callout>

        <div className="rounded-lg border border-line bg-surface-1 p-5">
          <h2 className="font-display text-xl text-ink-strong">Take part</h2>
          <p className="mt-1 text-sm text-muted">
            The archive is empty until people fill it. If you know a Tanda, its clans, its founding
            or its songs, that knowledge is the record.
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <Link href="/contribute" className="rounded-sm bg-terracotta px-4 py-2 text-sm font-semibold text-terracotta-ink">
              Document Your Tanda
            </Link>
            <Link href="/methodology" className="rounded-sm border border-line-strong px-4 py-2 text-sm text-ink hover:border-peacock hover:text-peacock">
              Read the methodology
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
