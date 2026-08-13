import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { Breadcrumbs, Callout, SourceBadge, TextileRule, VerificationChip } from "@/components/ui";
import { ARTICLES } from "@/data/articles";
import { listArticles } from "@/lib/repository";

export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = ARTICLES.find((a) => a.slug === slug);
  if (!article) return { title: "Article not found" };
  return {
    title: article.title,
    description: article.standfirst,
    openGraph: { title: article.title, description: article.standfirst, type: "article" },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = ARTICLES.find((a) => a.slug === slug);
  if (!article) notFound();

  const others = listArticles()
    .filter((a) => a.slug !== article.slug)
    .slice(0, 4);

  return (
    <>
      <header className="paper-grain border-b border-line bg-surface-1">
        <TextileRule />
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          <Breadcrumbs
            items={[
              { label: "Encyclopedia", href: "/encyclopedia" },
              { label: article.section },
            ]}
          />
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-terracotta">
            {article.section}
          </p>
          <h1 className="mt-2 font-display text-3xl text-ink-strong sm:text-4xl">
            {article.title}
          </h1>
          <p className="mt-3 text-lg text-muted">{article.standfirst}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted">
            <VerificationChip status={article.verification} size="sm" />
            <span>{article.readingMinutes} min read</span>
            <span>Updated {article.updatedAt}</span>
            <span>{article.contributors.join(", ")}</span>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_16rem]">
        <article>
          {article.editorialNote ? (
            <div className="mb-6">
              <Callout tone="warn" title="Editorial draft">
                {article.editorialNote}
              </Callout>
            </div>
          ) : null}

          <div
            className="prose-atlas text-ink"
            dangerouslySetInnerHTML={{ __html: article.body }}
          />

          <section className="mt-10 border-t border-line pt-6">
            <h2 className="font-display text-xl text-ink-strong">Sources</h2>
            <p className="mt-1 text-sm text-muted">
              Registered source leads for this article. These are real bodies of record; the
              specific volumes, pages and findings must be confirmed by an editor before any
              statement above is attributed to them.
            </p>
            <ul className="mt-3 space-y-2">
              {article.sourceIds.map((id) => (
                <li key={id}>
                  <SourceBadge id={id} />
                </li>
              ))}
            </ul>

            {article.sourceLeads?.length ? (
              <>
                <h3 className="mt-5 text-[11px] font-semibold uppercase tracking-wider text-terracotta">
                  Further leads to verify
                </h3>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-muted">
                  {article.sourceLeads.map((l) => (
                    <li key={l}>{l}</li>
                  ))}
                </ul>
              </>
            ) : null}
          </section>

          <section className="mt-8 border-t border-line pt-6">
            <h2 className="font-display text-xl text-ink-strong">Revision history</h2>
            <ul className="mt-2 space-y-1 text-sm text-muted">
              {article.revisions.map((r, i) => (
                <li key={i}>
                  <span className="tabular text-ink">{r.at}</span> — {r.summary} ({r.by})
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-8 rounded-lg border border-line bg-surface-1 p-5">
            <h2 className="font-display text-lg text-ink-strong">Can you improve this?</h2>
            <p className="mt-1 text-sm text-muted">
              Corrections with a source attached are the most valuable contribution to an article
              at this stage — more so than new prose. Regional variation that this draft flattens
              is also worth reporting.
            </p>
            <Link
              href="/contribute"
              className="mt-3 inline-block rounded-sm bg-terracotta px-4 py-2 text-sm font-semibold text-terracotta-ink"
            >
              Suggest a correction
            </Link>
          </section>
        </article>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-lg border border-line bg-surface-1 p-4">
            <h2 className="font-display text-base text-ink-strong">More from the encyclopedia</h2>
            <ul className="mt-2 space-y-2">
              {others.map((a) => (
                <li key={a.id}>
                  <Link href={`/encyclopedia/${a.slug}`} className="text-sm text-muted hover:text-peacock">
                    {a.title}
                  </Link>
                </li>
              ))}
            </ul>
            <Link href="/encyclopedia" className="mt-3 inline-block text-sm text-peacock underline">
              All articles →
            </Link>
          </div>
        </aside>
      </div>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: article.title,
          description: article.standfirst,
          dateModified: article.updatedAt,
          inLanguage: article.locale,
          isAccessibleForFree: true,
          publisher: { "@type": "Organization", name: "Gor Atlas" },
          // Disclosed in the structured data too, not only in the visible page.
          creativeWorkStatus: "Draft",
        }}
      />
    </>
  );
}
