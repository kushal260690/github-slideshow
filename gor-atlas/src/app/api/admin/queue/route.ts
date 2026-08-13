import { ok } from "@/lib/api";
import { AUDIT_LOG, DISPUTES, SUBMISSIONS } from "@/data/moderation";

/**
 * Moderation queue.
 *
 * In production this is role-gated at district_researcher or above and the
 * response is scoped to the reviewer's state or district (db/policies.sql).
 * The prototype serves it unauthenticated because there is no auth provider
 * wired up, and says so rather than pretending otherwise.
 */
export function GET() {
  return ok(
    { submissions: SUBMISSIONS, disputes: DISPUTES, audit: AUDIT_LOG },
    {
      authNote:
        "PROTOTYPE: unauthenticated. Production requires district_researcher or above, scoped to the reviewer's geography.",
    },
  );
}
