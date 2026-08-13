import type { Metadata } from "next";
import { MigrationMap } from "@/components/MigrationMap";
import { Callout } from "@/components/ui";
import { listRoutes } from "@/lib/repository";

export const metadata: Metadata = {
  title: "Migration map",
  description:
    "Animated map of recorded migration routes, with each route's evidence shown separately by interpretation label.",
};

export default function MigrationPage() {
  return (
    <>
      <div className="border-b border-line bg-surface-1 px-4 py-5 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <h1 className="font-display text-2xl text-ink-strong sm:text-3xl">
            Migration and movement
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-muted">
            Drag the timeline to draw routes by period. Select a route to read its evidence — each
            reading is labelled separately, because the existence of a trade, the reason it ended
            and the specific corridors it used do not have the same evidential standing.
          </p>
          <div className="mt-3">
            <Callout tone="warn" title="Speculative origin theories are not presented as fact">
              Nothing on this page states when the community arrived anywhere, or by what route,
              in the platform&rsquo;s own voice. Claims appear only under one of five labels:
              Documented, Widely accepted interpretation, Oral tradition, Disputed, or
              Insufficient evidence.
            </Callout>
          </div>
        </div>
      </div>
      <MigrationMap routes={listRoutes()} />
    </>
  );
}
