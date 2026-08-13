import type { Metadata } from "next";
import { Callout, PageHeader, SectionCard } from "@/components/ui";
import { RESEARCH_PARTNERS, SOURCE_CATEGORY_LABEL } from "@/data/sources";
import { listSources } from "@/lib/repository";

export const metadata: Metadata = {
  title: "Sources and research partners",
  description:
    "The source register: real bodies of record this project works from, and the demonstration placeholders attached to prototype data.",
};

export default function SourcesPage() {
  const sources = listSources();
  const real = sources.filter((s) => s.category !== "demo_placeholder");
  const demo = sources.filter((s) => s.category === "demo_placeholder");

  return (
    <>
      <PageHeader
        eyebrow="Evidence"
        title="Sources and research partners"
        standfirst="Two kinds of entry live in this register, and they are never mixed: real bodies of record, and demonstration placeholders that are not real documents."
      />

      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
        <Callout title="Why there are no page numbers here">
          Every real entry below is a <strong>reference lead</strong>: a genuine, existing body of
          record that this project intends to work from. None carries a volume, a page or a
          specific finding, because inventing a locator to make a citation look complete is exactly
          the fabrication this archive exists to refuse. Bibliographic detail is added by an editor
          when a claim is actually attached to it.
        </Callout>

        <SectionCard
          title="Reference leads"
          description={`${real.length} registered bodies of record.`}
        >
          <ul className="space-y-4">
            {real.map((s) => (
              <li key={s.id} className="border-b border-line pb-4 last:border-b-0">
                <div className="flex flex-wrap items-baseline gap-2">
                  <h3 className="font-display text-base text-ink-strong">{s.title}</h3>
                  <span className="rounded-sm bg-surface-2 px-1.5 py-0.5 text-[11px] text-muted">
                    {SOURCE_CATEGORY_LABEL[s.category]}
                  </span>
                  {s.publicationYear ? (
                    <span className="tabular text-[11px] text-muted">{s.publicationYear}</span>
                  ) : null}
                </div>
                {s.authorOrOrg ? (
                  <p className="mt-0.5 text-sm text-ink">{s.authorOrOrg}</p>
                ) : null}
                {s.notes ? <p className="mt-1 text-sm text-muted">{s.notes}</p> : null}
                {s.url ? (
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="mt-1 inline-block text-xs text-peacock underline"
                  >
                    {s.url}
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard
          title="Demonstration placeholders"
          description="These references do not exist. They are attached to the five prototype records to show how citation rendering works."
        >
          <ul className="space-y-3">
            {demo.map((s) => (
              <li
                key={s.id}
                className="rounded-lg border-2 p-3"
                style={{ borderColor: "var(--v-disputed)" }}
              >
                <h3 className="font-display text-base" style={{ color: "var(--v-disputed)" }}>
                  {s.title}
                </h3>
                <p className="mt-1 text-sm text-muted">{s.notes}</p>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard
          title="Research partners"
          description="Relationships this project intends to build. None of these bodies has endorsed this prototype."
        >
          <ul className="space-y-3">
            {RESEARCH_PARTNERS.map((p) => (
              <li key={p.name} className="border-b border-line pb-3 last:border-b-0">
                <h3 className="font-display text-base text-ink-strong">{p.name}</h3>
                <p className="mt-0.5 text-sm text-muted">{p.role}</p>
                <p className="mt-1 text-[11px] uppercase tracking-wider text-terracotta">
                  {p.status}
                </p>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>
    </>
  );
}
