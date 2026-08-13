import type { Metadata } from "next";
import { AdminDashboard } from "@/components/AdminDashboard";
import { Callout, PageHeader } from "@/components/ui";

export const metadata: Metadata = {
  title: "Moderation dashboard",
  description: "Editorial review queue, disputes, duplicates, consent, coverage and audit log.",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <>
      <PageHeader
        eyebrow="Editorial"
        title="Moderation dashboard"
        standfirst="Where submissions become records — field by field, with a reason recorded for every decision."
      />
      <div className="mx-auto max-w-7xl space-y-5 px-4 py-8 sm:px-6">
        <Callout tone="warn" title="Prototype: unauthenticated">
          In production this surface requires a district researcher role or above and is scoped to
          the reviewer&rsquo;s own state or district by row-level security. This build has no auth
          provider wired up, so the dashboard is open — and says so rather than implying a
          protection it does not have. Decisions made here are local to your browser and are not
          persisted.
        </Callout>
        <AdminDashboard />
      </div>
    </>
  );
}
