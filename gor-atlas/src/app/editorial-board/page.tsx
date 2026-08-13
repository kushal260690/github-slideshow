import type { Metadata } from "next";
import Link from "next/link";
import { Callout, PageHeader, SectionCard } from "@/components/ui";
import { EDITORIAL_ROLES } from "@/data/moderation";

export const metadata: Metadata = {
  title: "Editorial board",
  description: "Editorial roles, appointment principles and the independence statement.",
};

export default function EditorialBoardPage() {
  return (
    <>
      <PageHeader
        eyebrow="Governance"
        title="Editorial board"
        standfirst="Who decides what gets published, on what authority, and how that authority is limited."
      />

      <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
        <Callout tone="warn" title="No board has been appointed">
          This is a prototype. Listing invented names here would be the same category of
          fabrication as inventing a settlement — arguably worse, since it would manufacture
          credibility rather than data. The structure below is the design; the seats are empty.
        </Callout>

        <SectionCard
          title="Roles and their limits"
          description="Each role has a ceiling on what it may verify. Geographic roles are scoped to their own state or district."
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[32rem] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-[11px] uppercase tracking-wider text-terracotta">
                  <th className="py-2 pr-3">Role</th>
                  <th className="py-2 pr-3">Responsibility</th>
                  <th className="py-2">May verify up to</th>
                </tr>
              </thead>
              <tbody>
                {EDITORIAL_ROLES.map((r) => (
                  <tr key={r.role} className="border-b border-line align-top">
                    <td className="py-2 pr-3 text-ink">{r.role}</td>
                    <td className="py-2 pr-3 text-muted">{r.canDo}</td>
                    <td className="py-2 text-muted">{r.maxVerification}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard title="Appointment principles">
          <ol className="list-decimal space-y-2 pl-5 text-sm text-muted">
            <li>
              <strong className="text-ink">Community representation is not advisory.</strong>{" "}
              Verified Tanda representatives and district researchers drawn from the community hold
              real decision rights over their own settlements, not a consultative role.
            </li>
            <li>
              <strong className="text-ink">Nobody verifies their own work.</strong> Promotion to
              verified requires a reviewer distinct from the contributor, enforced by a database
              constraint rather than by convention.
            </li>
            <li>
              <strong className="text-ink">Geographic scope is real.</strong> A state editor cannot
              verify records in another state. Row-level security enforces it.
            </li>
            <li>
              <strong className="text-ink">Academic credentials do not outrank community
              knowledge.</strong> A subject-matter expert and a district researcher have different
              ceilings for different reasons, not a hierarchy of worth.
            </li>
            <li>
              <strong className="text-ink">Every decision is attributable.</strong> The audit log is
              append-only; a rollback writes a new entry rather than erasing an old one.
            </li>
          </ol>
        </SectionCard>

        <SectionCard title="Independence statement">
          <div className="prose-atlas max-w-none text-sm text-muted">
            <p>
              Gor Atlas is editorially independent. It accepts no direction on content from any
              political party, government body, religious organisation or commercial sponsor. It
              does not classify settlements by political affiliation and will reject data that
              attempts to.
            </p>
            <p>
              It takes no position on contested questions of origin, precedence or classification
              between clans or regional groups. Where accounts differ, it records the difference.
            </p>
            <p>
              Funding sources, when there are any, will be disclosed on this page with amounts and
              any conditions attached.
            </p>
          </div>
        </SectionCard>

        <SectionCard title="Appeals">
          <p className="text-sm text-muted">
            A contributor whose submission is rejected may appeal to a reviewer at a higher level,
            and a community body may dispute any published claim about its own settlement. Outcomes
            are logged, anonymised, in the public changelog so that the appeals mechanism is itself
            auditable.
          </p>
          <Link href="/privacy" className="mt-2 inline-block text-sm text-peacock underline">
            Correction and grievance process →
          </Link>
        </SectionCard>
      </div>
    </>
  );
}
