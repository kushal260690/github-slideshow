import type { Metadata } from "next";
import { SurnameExplorer } from "@/components/SurnameExplorer";
import { Callout, PageHeader } from "@/components/ui";
import { listClans, listSurnames } from "@/lib/repository";

export const metadata: Metadata = {
  title: "Surname explorer",
  description:
    "Surnames and their spelling variants across scripts and regions, with region-qualified clan associations.",
};

export default function SurnamesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Clans and surnames"
        title="Surname explorer"
        standfirst="Names and the many ways they are written. A surname here is a name — not a person, not a classification, and not a means of inferring anything about anyone."
      />

      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        <Callout tone="warn" title="Read this before using this index">
          Several of these surnames are borne very widely by people with no connection to
          Gor/Banjara communities. Rathod, Pawar, Chavan and Jadhav in particular are common
          across many communities in India. A shared surname is not evidence of a shared
          community, and this index must not be used to decide anything about an individual.
        </Callout>

        <SurnameExplorer surnames={listSurnames()} clans={listClans()} />
      </div>
    </>
  );
}
