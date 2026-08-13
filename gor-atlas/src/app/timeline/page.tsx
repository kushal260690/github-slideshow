import type { Metadata } from "next";
import { Timeline } from "@/components/Timeline";
import { Callout, PageHeader, SectionCard } from "@/components/ui";
import { timeline } from "@/lib/repository";

export const metadata: Metadata = {
  title: "Historical timeline",
  description:
    "Events in the public historical record bearing on Gor/Banjara communities, dated as periods with their evidence attached.",
};

export default function TimelinePage() {
  return (
    <>
      <PageHeader
        eyebrow="History"
        title="Historical timeline"
        standfirst="Events in the public record that bear on the community. The width of each bar is the width of its evidence — an event dated to a century occupies a century."
      />

      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
        <Callout title="Whose record is this?">
          Most of what is documented about this community before the twentieth century was
          recorded because the state had a use for it — provisioning armies, accounting for grain,
          and later registering people under the Criminal Tribes Act. That selectivity is a
          property of the record, not of the community, and it is the reason oral history is
          treated here as a necessary correction rather than as a supplement.
        </Callout>

        <SectionCard
          title="Community-wide events"
          description="Periodised, labelled by interpretation, and sourced. Select a bar to read the evidence."
        >
          <Timeline events={timeline()} title="Community timeline" />
        </SectionCard>

        <Callout tone="warn" title="What is deliberately absent">
          There is no entry stating when the community arrived in the Deccan, and no origin date.
          Those are the entries a reader most expects on a timeline like this, and they are exactly
          the ones no source in this archive can support. See the{" "}
          <a href="/encyclopedia/origins-and-identity">origins article</a> for what can and cannot
          be said.
        </Callout>
      </div>
    </>
  );
}
