import type { Metadata } from "next";
import { ContributionWizard } from "@/components/ContributionWizard";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = {
  title: "Document Your Tanda",
  description:
    "Contribute a missing Tanda, a correction, an oral history or a document. Every submission is reviewed before it appears.",
};

export default async function ContributePage({
  searchParams,
}: {
  searchParams: Promise<{ tanda?: string }>;
}) {
  const { tanda } = await searchParams;
  return (
    <>
      <PageHeader
        eyebrow="Community contribution"
        title="Document Your Tanda"
        standfirst="Most of what belongs in this archive is not in any book. It is held by people who live in these settlements and by families who left them."
      />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <ContributionWizard presetTandaId={tanda} />
      </div>
    </>
  );
}
