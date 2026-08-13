import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = {
  title: "Offline",
  description: "You are offline. Saved Tanda profiles remain readable.",
  robots: { index: false, follow: false },
};

/**
 * Served by the service worker when a navigation fails and nothing cached
 * matches. Written to be useful rather than apologetic: it tells the reader
 * what still works.
 */
export default function OfflinePage() {
  return (
    <>
      <PageHeader
        eyebrow="No connection"
        title="You are offline"
        standfirst="The page you asked for has not been saved to this device. Anything you have opened before, or saved deliberately, is still readable."
      />
      <div className="mx-auto max-w-3xl space-y-5 px-4 py-8 sm:px-6">
        <div className="rounded-lg border border-line bg-surface-1 p-5">
          <h2 className="font-display text-xl text-ink-strong">What still works</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
            <li>Any Tanda profile you saved with &ldquo;Save for offline&rdquo;</li>
            <li>Pages you have already visited on this device</li>
            <li>Map areas you have already panned over, from cached tiles</li>
            <li>A contribution draft in progress — it is stored on this device, not on a server</li>
          </ul>
        </div>

        <div className="rounded-lg border border-line bg-surface-1 p-5">
          <h2 className="font-display text-xl text-ink-strong">Try</h2>
          <ul className="mt-2 space-y-1.5 text-sm">
            {[
              ["/", "Home"],
              ["/map", "Explore map"],
              ["/directory", "Text directory"],
            ].map(([href, label]) => (
              <li key={href}>
                <Link href={href} className="text-peacock underline">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-sm text-muted">
          Nothing you have written is lost. Contribution drafts are saved on this device as you
          type and are submitted only when you choose to, so a dropped connection costs you
          nothing.
        </p>
      </div>
    </>
  );
}
