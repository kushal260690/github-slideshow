import type { Metadata } from "next";
import Link from "next/link";
import { SearchBox } from "@/components/SearchBox";
import { PageHeader } from "@/components/ui";
import { search } from "@/lib/repository";

export const metadata: Metadata = {
  title: "Search",
  description: "Search Tandas, clans, surnames, districts, articles and migration routes.",
};

const KIND_LABEL: Record<string, string> = {
  tanda: "Tanda",
  clan: "Clan",
  surname: "Surname",
  article: "Article",
  route: "Migration route",
  place: "Place",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const results = q.trim().length >= 2 ? search(q, 50) : [];

  return (
    <>
      <PageHeader
        eyebrow="Universal search"
        title={q ? `Results for “${q}”` : "Search the atlas"}
        standfirst="Spelling-tolerant across every recorded name variant and script. Searching one spelling finds records held under another."
      >
        <div className="mt-5 max-w-2xl">
          <SearchBox autoFocus />
        </div>
      </PageHeader>

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {q.trim().length < 2 ? (
          <div className="text-sm text-muted">
            <p className="mb-3">Try one of these:</p>
            <ul className="space-y-1">
              {["Rathwad", "Nalgonda", "Teej", "Gor Boli", "cartage", "Pawar"].map((s) => (
                <li key={s}>
                  <Link href={`/search?q=${encodeURIComponent(s)}`} className="text-peacock underline">
                    {s}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : results.length === 0 ? (
          <div className="rounded-lg border border-line bg-surface-1 p-5">
            <p className="text-sm text-ink">Nothing matched “{q}”.</p>
            <p className="mt-2 text-sm text-muted">
              In an archive at this stage, an empty result is usually a fact about the archive
              rather than about the world. If you know this place, name or story, it belongs here.
            </p>
            <Link
              href="/contribute"
              className="mt-3 inline-block rounded-sm bg-terracotta px-4 py-2 text-sm font-semibold text-terracotta-ink"
            >
              Document it
            </Link>
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm text-muted">
              {results.length} {results.length === 1 ? "result" : "results"}
            </p>
            <ul className="space-y-2">
              {results.map((r) => (
                <li key={`${r.kind}-${r.href}`}>
                  <Link
                    href={r.href}
                    className="flex items-baseline gap-3 rounded-lg border border-line bg-surface-1 p-4 transition-colors hover:border-peacock"
                  >
                    <span className="w-24 shrink-0 text-[10px] uppercase tracking-wider text-terracotta">
                      {KIND_LABEL[r.kind]}
                    </span>
                    <span className="min-w-0">
                      <span className="block font-display text-base text-ink-strong">
                        {r.title}
                        {r.isDemo ? (
                          <span className="ml-2 rounded-sm bg-v-disputed px-1 text-[10px] font-bold text-white">
                            DEMO
                          </span>
                        ) : null}
                      </span>
                      <span className="block text-xs text-muted">
                        {r.subtitle}
                        {r.matchedOn ? ` · matched the spelling “${r.matchedOn}”` : ""}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </>
  );
}
