import type { Metadata } from "next";
import Link from "next/link";
import { Callout, PageHeader, VerificationChip } from "@/components/ui";
import { TANDAS } from "@/data/tandas";
import { formatPeriod } from "@/lib/format";

export const metadata: Metadata = {
  title: "Media archive",
  description:
    "Photographs, recordings, documents and maps held by the archive, each with ownership, capture date, contributor and consent metadata.",
};

export default function ArchivePage() {
  const media = TANDAS.flatMap((t) => t.media.map((m) => ({ media: m, tanda: t })));
  const published = media.filter((m) => m.media.isPublished);

  return (
    <>
      <PageHeader
        eyebrow="Cultural archive"
        title="Media archive"
        standfirst="Photographs, recordings, documents, newspaper pages and maps — each carrying its ownership, capture period, contributor, consent scope and verification state."
      />

      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        <Callout title="Nothing appears here without consent">
          A media asset cannot be published unless a live consent record permits it. That rule is
          enforced by a database trigger, so it holds even if a bug or a direct API call tries to
          bypass the interface. Consent is revocable at any time, is honoured within seven days,
          and a withdrawal is logged without naming the person who withdrew.
        </Callout>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-line bg-surface-1 p-4">
            <p className="tabular font-display text-3xl text-ink-strong">{published.length}</p>
            <p className="mt-1 text-sm text-ink">Published assets</p>
          </div>
          <div className="rounded-lg border border-line bg-surface-1 p-4">
            <p className="tabular font-display text-3xl text-ink-strong">
              {media.length - published.length}
            </p>
            <p className="mt-1 text-sm text-ink">Held but not published</p>
            <p className="mt-1 text-[11px] text-muted">Awaiting consent or review</p>
          </div>
          <div className="rounded-lg border border-line bg-surface-1 p-4">
            <p className="tabular font-display text-3xl" style={{ color: "var(--gold)" }}>
              0
            </p>
            <p className="mt-1 text-sm text-ink">Assets cleared for reuse</p>
            <p className="mt-1 text-[11px] text-muted">
              Commercial and AI-training use default to no
            </p>
          </div>
        </div>

        {media.length === 0 ? (
          <p className="text-sm text-muted">No media assets are held yet.</p>
        ) : (
          <ul className="space-y-3">
            {media.map(({ media: m, tanda }) => (
              <li key={m.id} className="rounded-lg border border-line bg-surface-1 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-base text-ink-strong">{m.title}</h2>
                  <span className="text-[11px] uppercase tracking-wider text-terracotta">
                    {m.kind.replace(/_/g, " ")}
                  </span>
                  <VerificationChip status={m.verification} size="sm" />
                  {m.isDemo ? (
                    <span className="rounded-sm bg-v-disputed px-1 text-[10px] font-bold text-white">
                      DEMO
                    </span>
                  ) : null}
                </div>
                {m.description ? (
                  <p className="mt-1 text-sm text-muted">{m.description}</p>
                ) : null}
                <dl className="mt-2 grid gap-x-6 gap-y-1 text-[11px] text-muted sm:grid-cols-3">
                  <div>
                    <dt className="inline text-ink">Settlement: </dt>
                    <dd className="inline">
                      <Link href={`/tanda/${tanda.id}`} className="underline">
                        {tanda.primaryName}
                      </Link>
                    </dd>
                  </div>
                  <div>
                    <dt className="inline text-ink">Captured: </dt>
                    <dd className="inline">{m.captured ? formatPeriod(m.captured) : "—"}</dd>
                  </div>
                  <div>
                    <dt className="inline text-ink">Status: </dt>
                    <dd className="inline">
                      {m.isPublished ? "Published" : "Held, not published"}
                    </dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        )}

        <Callout tone="warn" title="On photographs of people">
          This archive does not use photographs of community members decoratively. Imagery appears
          where it is the record, with its metadata attached — not as texture behind a headline.
          Media identifying a minor defaults to archive-only and requires a guardian&rsquo;s
          consent and a benefit review before it can be published at all.
        </Callout>
      </div>
    </>
  );
}
