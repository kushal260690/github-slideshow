import type { Metadata } from "next";
import Link from "next/link";
import { Callout, PageHeader } from "@/components/ui";
import { TANDAS } from "@/data/tandas";

export const metadata: Metadata = {
  title: "Oral histories",
  description:
    "Recorded community testimony, collected under consent, in the narrator's own language.",
};

export default function OralHistoriesPage() {
  const recordings = TANDAS.flatMap((t) =>
    t.media
      .filter((m) => m.kind === "audio_oral_history" || m.kind === "video_interview")
      .map((m) => ({ media: m, tanda: t })),
  );
  const published = recordings.filter((r) => r.media.isPublished);

  return (
    <>
      <PageHeader
        eyebrow="Cultural archive"
        title="Oral histories"
        standfirst="The primary record for settlement formation, migration and clan relationships — and for most settlements, the only record."
      />

      <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
        <Callout title="Why oral history is not a lesser source here">
          Most of what was written down about this community before the twentieth century was
          written by an administration that had already classified it as criminal. Those records
          are evidence — of what officials did. They are not neutral evidence of what the community
          was. Recorded testimony is not a supplement to that record; it is a necessary correction
          to its selectivity, and it is treated as a primary source with its own failure modes,
          not as colour.
        </Callout>

        <div className="rounded-lg border border-line bg-surface-1 p-5">
          <p className="tabular font-display text-4xl text-ink-strong">{published.length}</p>
          <p className="mt-1 text-sm text-ink">Oral histories published</p>
          <p className="mt-2 text-sm text-muted">
            {recordings.length - published.length} held but not published, awaiting consent or
            review. This archive has collected nothing real yet — the number above is the honest
            state of the collection, not a placeholder.
          </p>
        </div>

        <section className="rounded-lg border border-line bg-surface-1 p-5">
          <h2 className="font-display text-xl text-ink-strong">The collection protocol</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-muted">
            <li>
              <strong className="text-ink">Consent first, in the narrator&rsquo;s language.</strong>{" "}
              Recorded verbal consent is fully valid and is usually the right route: many narrators
              are elders who may not read the consent language, and a written-only process would
              exclude exactly the people whose knowledge matters most.
            </li>
            <li>
              <strong className="text-ink">The narrator chooses attribution</strong> — full name,
              initials, village only, or anonymous — and can change or withdraw it later.
            </li>
            <li>
              <strong className="text-ink">The original language is kept.</strong> A translation
              sits alongside the original, never in place of it, so a reader can see what was
              actually said.
            </li>
            <li>
              <strong className="text-ink">No machine translation is published.</strong> A machine
              draft may exist internally to help a reviewer, but a published translation is human
              or community work. A mistranslation can invert a carefully hedged claim.
            </li>
            <li>
              <strong className="text-ink">Variation is preserved.</strong> Where accounts differ,
              each is recorded separately with its narrator and region. Merging them into one
              coherent narrative destroys the information that makes them useful.
            </li>
            <li>
              <strong className="text-ink">Withdrawal works.</strong> Consent is revocable, honoured
              within seven days, and cascades through caches and search indexes.
            </li>
          </ol>
        </section>

        <div className="rounded-lg border border-line bg-surface-1 p-5">
          <h2 className="font-display text-xl text-ink-strong">
            Record an elder&rsquo;s testimony
          </h2>
          <p className="mt-1 text-sm text-muted">
            If there is someone in your Tanda who remembers how it was founded, who came, and from
            where — that is the single most valuable contribution this archive can receive, and the
            one with the shortest window.
          </p>
          <Link
            href="/contribute"
            className="mt-3 inline-block rounded-sm bg-terracotta px-4 py-2 text-sm font-semibold text-terracotta-ink"
          >
            Contribute an oral history
          </Link>
        </div>
      </div>
    </>
  );
}
