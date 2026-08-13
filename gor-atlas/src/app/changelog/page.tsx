import type { Metadata } from "next";
import { Callout, PageHeader } from "@/components/ui";
import { AUDIT_LOG } from "@/data/moderation";

export const metadata: Metadata = {
  title: "Public changelog",
  description: "Every editorial change to the archive, publicly logged.",
};

export default function ChangelogPage() {
  return (
    <>
      <PageHeader
        eyebrow="Transparency"
        title="Public changelog"
        standfirst="Every accepted change writes a revision, an audit entry and a line here. History is appended to, never rewritten."
      />

      <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
        <Callout title="What appears here and what does not">
          Every editorial decision appears: acceptances, rejections, verifications, disputes and
          rollbacks, with the reason and the acting role. Consent withdrawals appear as the fact
          that a withdrawal happened — never who withdrew, and never what was withdrawn in enough
          detail to identify them.
        </Callout>

        <ol className="space-y-3">
          {[...AUDIT_LOG]
            .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
            .map((a) => (
              <li key={a.id} className="rounded-lg border border-line bg-surface-1 p-4">
                <p className="tabular text-xs text-terracotta">
                  {a.occurredAt.slice(0, 16).replace("T", " ")}
                </p>
                <p className="mt-1 text-sm text-ink">
                  <strong>{a.action.replace(/_/g, " ")}</strong> — {a.subjectLabel}
                  {a.field ? ` · ${a.field}` : ""}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {a.actor}
                  {a.reason ? ` — ${a.reason}` : ""}
                </p>
              </li>
            ))}
        </ol>

        <p className="text-sm text-muted">
          This log currently shows demonstration entries only. A real archive&rsquo;s changelog is
          long and dull, and that is what it should look like.
        </p>
      </div>
    </>
  );
}
