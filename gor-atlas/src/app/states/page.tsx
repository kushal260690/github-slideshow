import type { Metadata } from "next";
import Link from "next/link";
import { Callout, PageHeader } from "@/components/ui";
import { STATE_CONTEXT } from "@/data/geography";
import { stateDirectory } from "@/lib/repository";

export const metadata: Metadata = {
  title: "State directory",
  description:
    "States and union territories open for documentation, with coverage counts and reported community classification per state.",
};

export default function StatesPage() {
  const states = stateDirectory();
  const totalDistricts = states.reduce((n, s) => n + s.districtCount, 0);

  return (
    <>
      <PageHeader
        eyebrow="Coverage"
        title="State directory"
        standfirst="Where documentation stands, state by state. Listing a state does not assert that settlements exist in every district — it asserts that the district is open for documentation and currently holds nothing."
      />

      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        <Callout title="Reading these numbers">
          Coverage counts exclude demonstration records. Almost all of them are zero. That is the
          truthful starting state of an archive that has not yet collected anything, and showing
          the zeros is how a reader can tell the difference between &ldquo;nothing is there&rdquo;
          and &ldquo;nothing has been recorded&rdquo;.
        </Callout>

        <p className="text-sm text-muted">
          {states.length} states listed · {totalDistricts} districts open for documentation
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          {states.map((s) => {
            const ctx = STATE_CONTEXT[s.id];
            return (
              <article key={s.id} className="rounded-lg border border-line bg-surface-1 p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="font-display text-xl text-ink-strong">
                    <Link href={`/states/${s.id}`} className="hover:text-peacock">
                      {s.name}
                    </Link>
                  </h2>
                  {s.nameLocal ? (
                    <span className="text-sm text-muted">{s.nameLocal}</span>
                  ) : null}
                </div>

                <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-sm border border-line bg-surface-0 p-2">
                    <dt className="text-[10px] uppercase tracking-wider text-muted">Documented</dt>
                    <dd className="tabular font-display text-xl text-ink-strong">{s.documented}</dd>
                  </div>
                  <div className="rounded-sm border border-line bg-surface-0 p-2">
                    <dt className="text-[10px] uppercase tracking-wider text-muted">Verified</dt>
                    <dd className="tabular font-display text-xl" style={{ color: "var(--gold)" }}>
                      {s.verified}
                    </dd>
                  </div>
                  <div className="rounded-sm border border-line bg-surface-0 p-2">
                    <dt className="text-[10px] uppercase tracking-wider text-muted">Districts</dt>
                    <dd className="tabular font-display text-xl text-ink-strong">
                      {s.districtCount}
                    </dd>
                  </div>
                </dl>

                {s.demo > 0 ? (
                  <p className="mt-2 text-[11px]" style={{ color: "var(--v-disputed)" }}>
                    Plus {s.demo} demonstration {s.demo === 1 ? "record" : "records"}, excluded
                    from the counts above.
                  </p>
                ) : null}

                {ctx ? (
                  <div className="mt-3 border-t border-line pt-3">
                    <p className="text-[11px] uppercase tracking-wider text-terracotta">
                      Reported classification
                    </p>
                    <p className="mt-0.5 text-sm text-ink">{ctx.reportedClassification}</p>
                    <p className="mt-1 text-[11px] italic text-muted">{ctx.classificationNote}</p>
                  </div>
                ) : null}

                <Link
                  href={`/states/${s.id}`}
                  className="mt-3 inline-block text-sm text-peacock underline"
                >
                  District directory →
                </Link>
              </article>
            );
          })}
        </div>

        <Callout tone="warn" title="On classification">
          Official classification differs by state, changes by notification, and governs real
          entitlements. This archive records what is reported and marks every entry for
          verification against the notification currently in force. An archive that states an
          outdated classification as current is worse than one that says &ldquo;check this&rdquo;.
        </Callout>
      </div>
    </>
  );
}
