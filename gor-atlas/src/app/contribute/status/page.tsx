import type { Metadata } from "next";
import Link from "next/link";
import { Callout, PageHeader } from "@/components/ui";
import { SUBMISSIONS } from "@/data/moderation";

export const metadata: Metadata = {
  title: "Contribution status",
  description: "Track a submission through review using its reference code.",
};

const STATUS_MEANING: Record<string, string> = {
  pending: "In the queue. Not yet claimed by a reviewer.",
  in_review: "A reviewer has claimed it and is working through it field by field.",
  evidence_requested: "The reviewer needs something more before they can proceed.",
  accepted: "Accepted in full. A revision and a changelog entry were created.",
  partially_accepted: "Some fields accepted, others not. The reasons are recorded per field.",
  rejected: "Not accepted. The reason is recorded.",
  withdrawn: "Withdrawn by the contributor.",
  draft: "Saved but not submitted.",
};

export default function StatusPage() {
  return (
    <>
      <PageHeader
        eyebrow="Contribution"
        title="Track a submission"
        standfirst="Enter the reference code you were given. The queue below shows the demonstration submissions currently in review."
      />

      <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
        <form className="flex flex-wrap gap-2">
          <label className="sr-only" htmlFor="ref">
            Reference code
          </label>
          <input
            id="ref"
            className="flex-1 rounded-sm border border-line bg-surface-1 px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-peacock"
            placeholder="GA-2026-1042"
          />
          <button
            type="button"
            className="rounded-sm bg-terracotta px-4 py-2 text-sm font-semibold text-terracotta-ink"
          >
            Track
          </button>
        </form>

        <Callout title="What the statuses mean">
          <dl className="mt-1 space-y-1">
            {Object.entries(STATUS_MEANING).map(([k, v]) => (
              <div key={k}>
                <dt className="inline font-medium text-ink">{k.replace(/_/g, " ")}: </dt>
                <dd className="inline">{v}</dd>
              </div>
            ))}
          </dl>
        </Callout>

        <section>
          <h2 className="mb-3 font-display text-xl text-ink-strong">
            Demonstration submissions in review
          </h2>
          <ul className="space-y-3">
            {SUBMISSIONS.map((s) => (
              <li key={s.id} className="rounded-lg border border-line bg-surface-1 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="tabular font-display text-base text-terracotta">
                    {s.referenceCode}
                  </span>
                  <span className="rounded-sm border border-line-strong px-2 py-0.5 text-[11px] text-ink">
                    {s.status.replace(/_/g, " ")}
                  </span>
                  <span className="text-xs text-muted">{s.kind.replace(/_/g, " ")}</span>
                </div>
                <p className="mt-1 text-sm text-muted">{STATUS_MEANING[s.status]}</p>
                <p className="mt-1 text-xs text-muted">
                  {s.fields.length} {s.fields.length === 1 ? "field" : "fields"} ·{" "}
                  {s.fields.filter((f) => f.decision !== "pending").length} decided
                </p>
                {s.decisionNote ? (
                  <p className="mt-1 text-xs italic text-muted">{s.decisionNote}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>

        <Callout tone="warn" title="If a field of yours was rejected">
          A rejection is not a judgement of you. The most common reasons are that a date was more
          precise than the evidence could carry, or that a submission contained household-level
          information the archive cannot hold. Both are usually fixable — the reviewer&rsquo;s
          reason is recorded, and you can resubmit.{" "}
          <Link href="/privacy">See the correction and grievance process →</Link>
        </Callout>
      </div>
    </>
  );
}
