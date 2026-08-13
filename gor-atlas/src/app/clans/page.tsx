import type { Metadata } from "next";
import Link from "next/link";
import { ClanExplorer } from "@/components/ClanExplorer";
import { Callout, PageHeader } from "@/components/ui";
import { clanRelationships, listClans } from "@/lib/repository";

export const metadata: Metadata = {
  title: "Clan explorer",
  description:
    "Gor/Banjara clan names, their spelling variants and the associations reported between them — recorded as names, not as a genealogy.",
};

export default function ClansPage() {
  const clans = listClans();
  const relationships = clanRelationships();

  return (
    <>
      <PageHeader
        eyebrow="Clans and surnames"
        title="Clan explorer"
        standfirst="Clan names as they are used and spelled, and the associations communities report between them. Where regions disagree, both accounts are kept."
      />

      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        <Callout tone="warn" title="Four things this explorer will not do">
          <ul className="mt-1 list-disc space-y-1 pl-5">
            <li>
              <strong className="text-ink">Build a genealogy.</strong> No clan is recorded as the
              parent, ancestor or origin of another. The layout has no root for that reason.
            </li>
            <li>
              <strong className="text-ink">Rank.</strong> Order here is alphabetical, deliberately.
            </li>
            <li>
              <strong className="text-ink">Claim exclusivity.</strong> A surname is never recorded
              as belonging to one clan; associations are many-to-many and qualified by region.
            </li>
            <li>
              <strong className="text-ink">Infer.</strong> Nothing here can tell you an
              individual&rsquo;s clan, caste or family from their name, and no feature will be
              added that does.
            </li>
          </ul>
        </Callout>

        <ClanExplorer clans={clans} relationships={relationships} />

        <section>
          <h2 className="mb-3 font-display text-2xl text-ink-strong">All clan names</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {clans.map((c) => (
              <Link
                key={c.id}
                href={`/clans/${c.slug}`}
                className="rounded-lg border border-line bg-surface-1 p-4 transition-colors hover:border-peacock"
              >
                <h3 className="font-display text-lg text-ink-strong">{c.primaryName}</h3>
                <p className="mt-1 text-xs text-muted">
                  {c.variants
                    .filter((v) => !v.script || v.script === "Latn")
                    .map((v) => v.variant)
                    .join(" · ")}
                </p>
                <p className="mt-2 line-clamp-2 text-xs text-muted">{c.summary}</p>
              </Link>
            ))}
          </div>
        </section>

        <Callout title="On sub-clans and gotra">
          Sub-clan and gotra structures are reported very differently across regions, and this
          archive holds none of them yet. Rather than reproduce a scheme from one region as if it
          were general, the field is empty and marked as such. Sub-clan structure recorded by
          people who use it, with the region attached, is one of the most valuable things this
          archive could receive.{" "}
          <Link href="/contribute">Contribute what you know →</Link>
        </Callout>
      </div>
    </>
  );
}
