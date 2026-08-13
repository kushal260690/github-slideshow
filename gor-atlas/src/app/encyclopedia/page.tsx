import type { Metadata } from "next";
import Link from "next/link";
import { Callout, PageHeader } from "@/components/ui";
import { PLANNED_SECTIONS } from "@/data/articles";
import { listArticles } from "@/lib/repository";

export const metadata: Metadata = {
  title: "Cultural encyclopedia",
  description:
    "Editorially drafted articles on Gor/Banjara origins, language, clans, governance, trade, festivals, dress, colonial and post-independence history.",
};

export default function EncyclopediaPage() {
  const articles = listArticles();

  return (
    <>
      <PageHeader
        eyebrow="Cultural archive"
        title="Cultural encyclopedia"
        standfirst="Articles that say what is documented, what is interpretation, what is community memory and what is not known — in that order of honesty rather than in order of readability."
      />

      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        <Callout tone="warn" title="Every article here is an editorial draft">
          These articles were drafted for the prototype and have not been checked against their
          source leads by a named reviewer. Each carries a visible draft notice and lists the
          sources an editor must confirm before any statement in it can be cited. They do not
          carry invented page numbers, because a fabricated citation is worse than no citation.
        </Callout>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((a) => (
            <Link
              key={a.id}
              href={`/encyclopedia/${a.slug}`}
              className="flex flex-col rounded-lg border border-line bg-surface-1 p-5 transition-colors hover:border-peacock"
            >
              <p className="text-[11px] uppercase tracking-wider text-terracotta">{a.section}</p>
              <h2 className="mt-1 font-display text-lg text-ink-strong">{a.title}</h2>
              <p className="mt-2 flex-1 text-sm text-muted">{a.standfirst}</p>
              <p className="mt-3 text-[11px] text-muted">
                {a.readingMinutes} min read · {a.sourceIds.length} source leads · Editorial draft
              </p>
            </Link>
          ))}
        </div>

        <section className="rounded-lg border border-line bg-surface-1 p-5">
          <h2 className="font-display text-xl text-ink-strong">Sections not yet written</h2>
          <p className="mt-1 max-w-3xl text-sm text-muted">
            Listed rather than hidden. An encyclopedia&rsquo;s gaps are part of its state, and a
            reader should not have to infer completeness from a tidy index.
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {PLANNED_SECTIONS.map((s) => (
              <li
                key={s}
                className="rounded-sm border border-line-strong px-2.5 py-1 text-xs text-muted"
              >
                {s}
              </li>
            ))}
          </ul>
          <Link href="/contribute" className="mt-4 inline-block text-sm text-peacock underline">
            Contribute knowledge for one of these →
          </Link>
        </section>
      </div>
    </>
  );
}
