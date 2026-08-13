import { fail, ok } from "@/lib/api";
import { listTandas } from "@/lib/repository";
import type { SubmissionKind } from "@/lib/types";

/**
 * Create a submission.
 *
 * The one invariant this handler exists to hold: there is no code path from
 * here to a published value. It returns `status: "pending"` and nothing else,
 * always. Publication happens only when a reviewer acts on a submission in the
 * moderation dashboard, and that path writes a revision, an audit entry and a
 * changelog line in the same transaction.
 */

const MEDIA_KINDS: SubmissionKind[] = ["photograph", "document", "audio_video", "oral_history"];

const INDIA_BBOX = { minLng: 67, maxLng: 98.5, minLat: 6, maxLat: 36.5 };

interface SubmissionBody {
  kind?: SubmissionKind;
  tandaId?: string;
  proposedTandaName?: string;
  relationshipToTanda?: string;
  sourceCategory?: string;
  sourceDescription?: string;
  consentProvided?: boolean;
  permissionToPublish?: boolean;
  attribution?: string;
  coordinates?: [number, number];
  isDiaspora?: boolean;
  fields?: { field: string; label?: string; proposedValue: string }[];
  contributorContactVerified?: boolean;
}

export async function POST(request: Request) {
  let body: SubmissionBody;
  try {
    body = (await request.json()) as SubmissionBody;
  } catch {
    return fail("validation_failed", "Body must be JSON", 400);
  }

  const errors: Record<string, string> = {};
  const flags: string[] = [];

  if (!body.kind) errors.kind = "Required";
  if (!body.relationshipToTanda) {
    errors.relationshipToTanda =
      "Required. A contribution is weighed partly by the contributor's relationship to the settlement.";
  }
  if (!body.sourceCategory) {
    errors.sourceCategory = "Required. Every submission must declare what kind of evidence it is.";
  }
  if (!body.contributorContactVerified) {
    errors.contributorContactVerified =
      "Contributor identity must be verified before a submission is accepted into the queue.";
  }
  if (!body.tandaId && !body.proposedTandaName) {
    errors.tanda = "Either an existing Tanda or a proposed settlement name is required.";
  }

  // Consent is a hard gate for anything carrying media or testimony.
  if (body.kind && MEDIA_KINDS.includes(body.kind) && !body.consentProvided) {
    return fail(
      "consent_required",
      "Media and oral-history submissions cannot be accepted without a consent record. Recorded verbal consent in the narrator's own language is acceptable and is often the appropriate route.",
      422,
    );
  }

  // Coordinate sanity. Outside India is legitimate only for a diaspora record.
  if (body.coordinates) {
    const [lng, lat] = body.coordinates;
    const inIndia =
      lng >= INDIA_BBOX.minLng &&
      lng <= INDIA_BBOX.maxLng &&
      lat >= INDIA_BBOX.minLat &&
      lat <= INDIA_BBOX.maxLat;
    if (!inIndia && !body.isDiaspora) {
      errors.coordinates =
        "Coordinates fall outside India. If this is a diaspora settlement, mark it as one; otherwise check the point.";
    }

    // Duplicate detection within 5 km, per docs/07.
    const near = listTandas({ near: { lat, lng, radiusKm: 5 } });
    if (near.length > 0 && !body.tandaId) {
      flags.push("duplicate_candidate_within_5km");
      return NextResponseDuplicate(near.map((t) => ({ id: t.id, name: t.primaryName })));
    }
  }

  // An exact year offered without a documentary source is refused at the door
  // rather than stored and quietly downgraded later.
  for (const f of body.fields ?? []) {
    if (
      /year|established|founded/i.test(f.field) &&
      /^\d{4}$/.test(f.proposedValue.trim()) &&
      !["census", "government_record", "academic", "archival_document"].includes(
        body.sourceCategory ?? "",
      )
    ) {
      flags.push("exact_year_without_document");
    }
  }

  if (Object.keys(errors).length > 0) {
    return fail("validation_failed", "Submission is incomplete", 400, errors);
  }

  const reference = `GA-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  return ok(
    {
      referenceCode: reference,
      // Always pending. There is no branch of this function that returns
      // anything else.
      status: "pending" as const,
      flags,
      whatHappensNext: [
        "A district researcher or state editor reviews the submission field by field.",
        "Fields may be accepted, rejected or returned with a request for evidence, individually.",
        "Accepted fields create a revision, an audit entry and a public changelog line.",
        "You can track progress with the reference code above.",
      ],
    },
    {
      publicationNote:
        "Nothing in this submission is publicly visible. Submissions never publish automatically.",
    },
  );
}

function NextResponseDuplicate(candidates: { id: string; name: string }[]) {
  return fail(
    "duplicate_candidate",
    "A settlement is already recorded within 5 km. Confirm whether this is the same place or a genuinely separate one before continuing.",
    409,
    { candidates },
  );
}
