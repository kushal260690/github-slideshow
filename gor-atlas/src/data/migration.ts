import type { MigrationRoute, HistoricalEvent } from "@/lib/types";

/**
 * Migration routes and community-wide historical events.
 *
 * The hardest editorial problem on this page: origin and migration are the
 * parts of Banjara history most often stated with false confidence, in both
 * popular and official accounts. So every route here carries SEVERAL evidence
 * entries with DIFFERENT labels, and the map renders them separately. A route
 * can be simultaneously "documented" as to the existence of the trade that
 * moved along it and "insufficient evidence" as to its precise chronology, and
 * saying so is more accurate than choosing one label for the whole thing.
 *
 * Waypoints are coarse regional anchors for drawing a line on a map. They are
 * not a claim that any specific group passed through any specific place.
 */

export const MIGRATION_ROUTES: MigrationRoute[] = [
  {
    id: "route-nw-deccan",
    slug: "north-west-to-deccan",
    name: "North-western India towards the Deccan",
    description:
      "The broad southward movement most often described in accounts of Gor/Banjara history: a shift over generations from north-western and western India into the Deccan plateau, where the largest documented concentrations are found today.",
    period: { start: 1500, end: 1900, precision: "era" },
    waypoints: [
      { label: "North-western India (regional anchor)", coordinates: [73.8, 26.3] },
      { label: "Malwa / central plateau (regional anchor)", coordinates: [76.0, 23.2] },
      { label: "Khandesh–Berar corridor (regional anchor)", coordinates: [76.6, 20.9] },
      { label: "Marathwada (regional anchor)", coordinates: [77.3, 19.1] },
      { label: "Telangana plateau (regional anchor)", coordinates: [78.8, 17.4] },
      { label: "Rayalaseema (regional anchor)", coordinates: [78.0, 15.2] },
    ],
    evidence: [
      {
        interpretation: "widely_accepted_interpretation",
        summary:
          "That Gor/Banjara populations in the Deccan trace to earlier movement from north-western and western India is the most widely held reading in both community accounts and published scholarship, supported by linguistic affinity between Gor Boli and the Rajasthani group of Indo-Aryan languages.",
        sourceIds: ["src-lsi", "src-iso-lmn", "src-people-of-india"],
        verification: "partially_verified",
        confidence: "medium",
        editorialNote:
          "Listed as an interpretation, not as a documented fact. Linguistic affinity is strong evidence of relationship; it is weaker evidence of the route, timing or manner of movement.",
      },
      {
        interpretation: "oral_tradition",
        summary:
          "Community accounts across several regions describe movement southward over generations in connection with cartage and grazing, often naming origin places in the north-west. Details, chronology and named places vary considerably between regions and between families.",
        sourceIds: ["src-oral-history-protocol"],
        verification: "unverified",
        confidence: "low",
        editorialNote:
          "Variation between accounts is recorded as variation. This project does not merge differing oral accounts into a single composite narrative — doing so would destroy the very information that makes them useful.",
      },
      {
        interpretation: "insufficient_evidence",
        summary:
          "The chronology of this movement — when it began, whether it was continuous or episodic, and how it related to specific political events — cannot be established from the sources currently held by this project.",
        sourceIds: [],
        verification: "unverified",
        confidence: "low",
        editorialNote:
          "Stated explicitly, because the absence of a chronology is routinely filled in elsewhere with confident dates that no source supports.",
      },
    ],
  },
  {
    id: "route-cartage-corridors",
    slug: "cartage-corridors",
    name: "Pack-bullock cartage corridors",
    description:
      "Long-distance overland carriage of grain, salt and other bulk goods by pack-bullock caravan, an occupation extensively associated with Banjara groups in pre-railway India and described in colonial administrative and military records.",
    period: { start: 1600, end: 1900, precision: "era" },
    waypoints: [
      { label: "Western coast salt sources (regional anchor)", coordinates: [72.9, 21.2] },
      { label: "Central plateau (regional anchor)", coordinates: [77.4, 22.0] },
      { label: "Deccan interior (regional anchor)", coordinates: [78.4, 18.6] },
      { label: "Eastern Deccan (regional anchor)", coordinates: [80.6, 17.2] },
    ],
    evidence: [
      {
        interpretation: "documented",
        summary:
          "The existence of large-scale itinerant bulk transport by pack-bullock caravan, and the association of Banjara groups with it, is documented in colonial administrative, revenue and military records, which relied on such caravans for provisioning.",
        sourceIds: ["src-district-gazetteers", "src-people-of-india"],
        verification: "partially_verified",
        confidence: "medium",
        editorialNote:
          "Documented as to the existence and general character of the trade. Colonial records describing the *people* involved are a separate matter and are read critically — the same administrative apparatus later notified several of these communities under the Criminal Tribes Act.",
      },
      {
        interpretation: "widely_accepted_interpretation",
        summary:
          "The nineteenth-century expansion of railways is generally understood to have displaced long-distance pack-bullock cartage, removing the economic basis of an itinerant livelihood and contributing to settlement.",
        sourceIds: ["src-district-gazetteers"],
        verification: "unverified",
        confidence: "low",
        editorialNote:
          "Widely repeated and plausible; the specific mechanism and pace differed by region and this project has not yet verified it for any particular district.",
      },
      {
        interpretation: "disputed",
        summary:
          "Which specific corridors were used, and by which groups, is not settled. Route reconstructions in popular accounts frequently exceed what the records support.",
        sourceIds: [],
        verification: "disputed",
        confidence: "low",
      },
    ],
  },
  {
    id: "route-demo-northwest-deccan",
    slug: "demo-settlement-route",
    name: "DEMO — settlement-level route",
    description:
      "A demonstration route attached to the prototype Tanda records, showing how a settlement-level migration link renders on the map and on a profile. It describes nothing real.",
    period: { start: 1850, end: 1900, precision: "quarter_century" },
    waypoints: [
      { label: "Demo origin (illustrative)", coordinates: [75.2, 21.8] },
      { label: "Demo halt (illustrative)", coordinates: [77.6, 19.2] },
      { label: "Demo destination (illustrative)", coordinates: [79.3, 17.1] },
    ],
    evidence: [
      {
        interpretation: "oral_tradition",
        summary: "Demonstration evidence entry. Invented.",
        sourceIds: ["src-demo-oral"],
        verification: "unverified",
        confidence: "low",
        editorialNote: "Demo data — not historically verified.",
      },
    ],
    isDemo: true,
  },
];

export const ROUTE_BY_ID = new Map(MIGRATION_ROUTES.map((r) => [r.id, r]));
export const ROUTE_BY_SLUG = new Map(MIGRATION_ROUTES.map((r) => [r.slug, r]));

/**
 * Community-wide historical events for the national timeline.
 *
 * These are events in the public historical record that bear on the community,
 * not events *of* the community — the distinction matters, because the public
 * record about denotified communities was largely produced by the state rather
 * than by the communities themselves.
 */
export const COMMUNITY_TIMELINE: HistoricalEvent[] = [
  {
    id: "evt-cartage-era",
    kind: "other",
    title: "Long-distance pack-bullock cartage",
    description:
      "Bulk overland transport of grain, salt and military provisions by itinerant caravan, extensively associated with Banjara groups and relied upon by successive states and armies.",
    period: { start: 1600, end: 1850, precision: "era" },
    interpretation: "documented",
    verification: "partially_verified",
    confidence: "medium",
    sourceIds: ["src-district-gazetteers", "src-people-of-india"],
    tandaId: null,
    editorialNote:
      "Period boundaries are approximate era markers, not dates. The trade did not begin or end in a year.",
  },
  {
    id: "evt-railway-displacement",
    kind: "other",
    title: "Railway expansion and the decline of caravan transport",
    description:
      "The spread of railway freight through the nineteenth century displaced long-distance pack-bullock cartage as the principal means of moving bulk goods.",
    period: { start: 1850, end: 1900, precision: "quarter_century" },
    interpretation: "widely_accepted_interpretation",
    verification: "unverified",
    confidence: "low",
    sourceIds: ["src-district-gazetteers"],
    tandaId: null,
    editorialNote:
      "The connection between railway expansion and the settling of itinerant carriers is widely drawn and plausible, but this project has not verified it for any specific district.",
  },
  {
    id: "evt-cta-1871",
    kind: "legal_policy_change",
    title: "Criminal Tribes Act, 1871",
    description:
      "Colonial legislation under which a number of nomadic and itinerant communities were notified and subjected to registration, restriction of movement and surveillance. Which communities were notified varied by province and by amendment.",
    period: { start: 1871, end: 1871, precision: "exact_year" },
    interpretation: "documented",
    verification: "partially_verified",
    confidence: "medium",
    sourceIds: ["src-cta-1871"],
    tandaId: null,
    editorialNote:
      "The Act and its date are a matter of public legal record. Which specific groups were notified in which province is NOT summarised here, because it varied and getting it wrong would repeat a historical injury. It must be established province by province from the notification texts.",
  },
  {
    id: "evt-cta-repeal",
    kind: "legal_policy_change",
    title: "Repeal of the Criminal Tribes Act",
    description:
      "The Act was repealed in 1952 and the communities notified under it were subsequently described as denotified.",
    period: { start: 1952, end: 1952, precision: "exact_year" },
    interpretation: "documented",
    verification: "partially_verified",
    confidence: "medium",
    sourceIds: ["src-cta-1871"],
    tandaId: null,
    editorialNote:
      "Repeal ended the legal category. The administrative and social consequences did not end with it, and successive national commissions have since reported on denotified and nomadic communities.",
  },
  {
    id: "evt-classification",
    kind: "administrative_change",
    title: "Post-independence classification differs by state",
    description:
      "Following independence, Gor/Banjara communities were classified differently in different states — reported as Scheduled Tribe in some southern states and under denotified or backward-class categories elsewhere. Classification affects entitlements and is periodically revised.",
    period: { start: 1950, end: 2025, precision: "era" },
    interpretation: "documented",
    verification: "unverified",
    confidence: "low",
    sourceIds: ["src-dnt-commissions"],
    tandaId: null,
    editorialNote:
      "That classification varies by state is well established. The specific classification currently in force in each state must be checked against the current notification for that state — see the state directory, where each is marked for verification rather than stated.",
  },
  {
    id: "evt-commissions",
    kind: "legal_policy_change",
    title: "National commissions on denotified and nomadic communities",
    description:
      "Successive national commissions in the 2000s and 2010s examined the position of denotified, nomadic and semi-nomadic communities and made recommendations on welfare, documentation and legal protection.",
    period: { start: 2005, end: 2020, precision: "decade" },
    interpretation: "documented",
    verification: "unverified",
    confidence: "low",
    sourceIds: ["src-dnt-commissions"],
    tandaId: null,
    editorialNote:
      "Recorded at the level of 'these commissions existed and reported'. Specific findings and figures are not summarised here until an editor has quoted them from the report text.",
  },
];
