import type {
  ConfidenceLevel,
  InterpretationLabel,
  Period,
  PresenceBand,
  SettlementType,
  VerificationStatus,
} from "@/lib/types";

/**
 * Period rendering.
 *
 * This function is the user-facing half of the anti-fabrication rule. The
 * schema refuses to store "1887" when the evidence says "late nineteenth
 * century"; this refuses to *display* a false precision even when a range is
 * narrow enough that a midpoint would look tidier.
 */
export function formatPeriod(p: Period | undefined | null): string {
  if (!p || (p.start === null && p.end === null)) return "Not yet documented";
  const { start, end, precision } = p;

  if (precision === "exact_year" && start !== null) return String(start);

  if (precision === "century" && start !== null) {
    const c = Math.floor(start / 100) * 100;
    return `${c}s (approx.)`;
  }

  if (precision === "decade" && start !== null) {
    return `${Math.floor(start / 10) * 10}s (approx.)`;
  }

  if (precision === "quarter_century" && start !== null && end !== null) {
    const centuryStart = Math.floor(start / 100) * 100;
    const half = start - centuryStart >= 50 ? "second half" : "first half";
    const spansHalf = end - start >= 40;
    if (spansHalf) return `${half} of the ${centuryStart}s (approx.)`;
    return `${start}–${end} (approx.)`;
  }

  if (precision === "era") {
    if (start !== null && end !== null) return `${start}–${end} (era, approximate)`;
    return "Era not precisely dated";
  }

  if (start !== null && end !== null) return start === end ? String(start) : `${start}–${end}`;
  if (start !== null) return `From ${start}`;
  if (end !== null) return `Until ${end}`;
  return "Not yet documented";
}

/** A short note explaining *why* a period is imprecise, shown next to it. */
export function periodPrecisionNote(p: Period | undefined | null): string | null {
  if (!p) return null;
  switch (p.precision) {
    case "exact_year":
      return "Dated to a single year by a documentary source.";
    case "decade":
      return "Evidence supports a decade, not a year.";
    case "quarter_century":
      return "Evidence supports a range of about a quarter-century, not a year.";
    case "century":
      return "Evidence supports a century only.";
    case "era":
      return "A broad era. The boundaries are markers, not dates.";
    case "unknown":
      return "Period not established.";
    default:
      return null;
  }
}

export const VERIFICATION_LABEL: Record<VerificationStatus, string> = {
  verified: "Verified",
  partially_verified: "Partially verified",
  unverified: "Location only",
  disputed: "Disputed",
  not_documented: "Not yet documented",
};

/** What each status actually means, for the provenance popover and legend. */
export const VERIFICATION_MEANING: Record<VerificationStatus, string> = {
  verified:
    "Two or more independent sources, at least one documentary, checked by a state editor or historian who did not contribute the record.",
  partially_verified:
    "One credible source, or several oral accounts that agree, reviewed but not independently corroborated.",
  unverified: "Recorded and plausible, but not yet corroborated against any source.",
  disputed:
    "Credible accounts conflict. All versions are retained and shown; the platform does not adjudicate between them.",
  not_documented: "No claim exists. This is an honest absence, not a loading state.",
};

export const VERIFICATION_COLOR: Record<VerificationStatus, string> = {
  verified: "var(--v-verified)",
  partially_verified: "var(--v-partial)",
  unverified: "var(--v-basic)",
  disputed: "var(--v-disputed)",
  not_documented: "var(--muted)",
};

export const CONFIDENCE_LABEL: Record<ConfidenceLevel, string> = {
  high: "High confidence",
  medium: "Medium confidence",
  low: "Low confidence",
};

export const INTERPRETATION_LABEL: Record<InterpretationLabel, string> = {
  documented: "Documented",
  widely_accepted_interpretation: "Widely accepted interpretation",
  oral_tradition: "Oral tradition",
  disputed: "Disputed",
  insufficient_evidence: "Insufficient evidence",
};

export const INTERPRETATION_MEANING: Record<InterpretationLabel, string> = {
  documented: "Contemporaneous written or material evidence exists.",
  widely_accepted_interpretation:
    "A reading held widely by scholars and communities, but an interpretation rather than a documented fact.",
  oral_tradition: "Community memory, attributed to named narrators under recorded consent.",
  disputed: "Credible accounts conflict.",
  insufficient_evidence: "The claim circulates but cannot currently be assessed.",
};

export const PRESENCE_BAND_LABEL: Record<PresenceBand, string> = {
  predominant: "Predominant",
  substantial: "Substantial",
  present: "Present",
  reported: "Reported",
  not_documented: "Not documented",
};

export const SETTLEMENT_TYPE_LABEL: Record<SettlementType, string> = {
  rural: "Rural settlement",
  urban: "Urban settlement",
  relocated: "Relocated settlement",
  absorbed: "Absorbed into a larger settlement",
  historical: "Historical settlement",
  diaspora: "Diaspora settlement",
};

/** Marker colour by state, matching the legend and doc 06. */
export function markerState(
  verification: VerificationStatus,
  settlementType: SettlementType,
): { key: string; label: string; color: string } {
  if (settlementType === "diaspora")
    return { key: "diaspora", label: "Diaspora settlement", color: "var(--v-diaspora)" };
  if (settlementType === "relocated" || settlementType === "historical")
    return {
      key: "historical",
      label: "Historical or relocated settlement",
      color: "var(--v-historical)",
    };
  if (verification === "disputed")
    return { key: "disputed", label: "Disputed data — under review", color: "var(--v-disputed)" };
  if (verification === "verified")
    return { key: "verified", label: "Verified Tanda profile", color: "var(--v-verified)" };
  if (verification === "partially_verified")
    return { key: "partial", label: "Partially verified", color: "var(--v-partial)" };
  return { key: "basic", label: "Basic location only", color: "var(--v-basic)" };
}

export function formatNumber(n: number | null | undefined): string {
  if (n === null || n === undefined) return "Not yet documented";
  return n.toLocaleString("en-IN");
}

export function formatCoordinates(
  coords: [number, number] | null,
  precision: string,
): string {
  if (!coords) return "Not yet documented";
  const dp = precision === "obscured" ? 1 : precision === "reduced" ? 2 : 4;
  return `${coords[1].toFixed(dp)}°N, ${coords[0].toFixed(dp)}°E`;
}

export const COORDINATE_PRECISION_NOTE: Record<string, string> = {
  surveyed: "Surveyed or officially sourced position.",
  approximate: "Community-confirmed position at full precision.",
  reduced:
    "Rounded to roughly 110 m. Unverified locations are published at reduced precision by default.",
  obscured:
    "Rounded to roughly 5 km. This location is flagged sensitive and is excluded from bulk dataset export.",
};
