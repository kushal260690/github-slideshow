import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs, Callout, DemoChip, PageHeader, VerificationChip } from "@/components/ui";
import { STATES, STATE_CONTEXT } from "@/data/geography";
import { districtDirectory, listTandas } from "@/lib/repository";

export function generateStaticParams() {
  return STATES.map((s) => ({ state: s.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string }>;
}): Promise<Metadata> {
  const { state } = await params;
  const dir = districtDirectory(state.toUpperCase());
  if (!dir) return { title: "State not found" };
  return {
    title: `${dir.state.name} — district directory`,
    description: `Districts of ${dir.state.name} open for documentation of Gor/Banjara settlements, with coverage counts.`,
  };
}

export default async function DistrictDirectoryPage({
  params,
}: {
  params: Promise<{ state: string }>;
}) {
  const { state } = await params;
  const dir = districtDirectory(state.toUpperCase());
  if (!dir) notFound();

  const ctx = STATE_CONTEXT[dir.state.id];
  const records = listTandas({ state: dir.state.id });
  const documented = dir.districts.filter((d) => d.documented + d.demo > 0);

  return (
    <>
      <PageHeader
        eyebrow="District directory"
        title={dir.state.name}
        standfirst={`${dir.districts.length} districts listed. ${documented.length} hold any record at all.`}
      />

      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        <Breadcrumbs
          items={[
            { label: "States", href: "/states" },
            { label: dir.state.name },
          ]}
        />

        {ctx ? (
          <Callout title={`Reported classification in ${dir.state.name}`}>
            <p className="text-ink">{ctx.reportedClassification}</p>
            <p className="mt-1 italic">{ctx.classificationNote}</p>
          </Callout>
        ) : null}

        {records.length > 0 ? (
          <section>
            <h2 className="mb-3 font-display text-2xl text-ink-strong">Records in this state</h2>
            <ul className="space-y-2">
              {records.map((t) => (
                <li
                  key={t.id}
                  className="flex flex-wrap items-center gap-2 rounded-lg border border-line bg-surface-1 p-3"
                >
                  <Link
                    href={`/tanda/${t.id}`}
                    className="font-display text-base text-ink-strong hover:text-peacock"
                  >
                    {t.primaryName}
                  </Link>
                  {t.isDemo ? <DemoChip /> : null}
                  <VerificationChip status={t.verification} size="sm" />
                  <span className="ml-auto text-xs text-muted">
                    {dir.districts.find((d) => d.id === t.districtId)?.name}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section>
          <h2 className="mb-1 font-display text-2xl text-ink-strong">Districts</h2>
          <p className="mb-3 text-sm text-muted">
            A district showing zero has not been documented. It is not a statement that no
            settlements exist there.
          </p>
          <div className="overflow-x-auto rounded-lg border border-line">
            <table className="w-full min-w-[32rem] text-sm">
              <thead className="bg-surface-2">
                <tr className="text-left text-[11px] uppercase tracking-wider text-terracotta">
                  <th className="px-3 py-2">District</th>
                  <th className="px-3 py-2 text-right">Documented</th>
                  <th className="px-3 py-2 text-right">Verified</th>
                  <th className="px-3 py-2 text-right">Demo</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {dir.districts.map((d) => (
                  <tr key={d.id} id={d.id} className="border-t border-line bg-surface-1">
                    <td className="px-3 py-2 text-ink">{d.name}</td>
                    <td className="tabular px-3 py-2 text-right">{d.documented}</td>
                    <td className="tabular px-3 py-2 text-right" style={{ color: "var(--gold)" }}>
                      {d.verified}
                    </td>
                    <td
                      className="tabular px-3 py-2 text-right"
                      style={{ color: d.demo ? "var(--v-disputed)" : undefined }}
                    >
                      {d.demo || "—"}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted">
                      {d.documented + d.demo === 0 ? (
                        <Link href="/contribute" className="text-peacock underline">
                          Nothing recorded — contribute
                        </Link>
                      ) : (
                        "Records held"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}
