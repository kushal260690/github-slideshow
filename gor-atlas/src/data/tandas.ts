import type { Fact, Tanda } from "@/lib/types";
import { notDocumented } from "@/lib/types";

/**
 * ============================================================================
 * FIVE DEMONSTRATION RECORDS — NOT HISTORICALLY VERIFIED
 * ============================================================================
 *
 * Every record in this file is invented. The settlement names do not refer to
 * real places. The coordinates are rounded to 0.1 degrees and are illustrative
 * positions inside a district, not the location of any real settlement. The
 * populations, dates, clan compositions and oral accounts are fabrications
 * written to exercise the interface.
 *
 * They exist for exactly one reason: to demonstrate how the profile template,
 * the provenance envelope, the marker states and the contested-claim rendering
 * behave with data in them. Every one carries `isDemo: true`, which drives a
 * permanent banner on the profile, a DEMO chip beside every occurrence of the
 * name, exclusion from all public counters, and — per db/policies.sql — an
 * absolute block on ever being promoted to `verified`.
 *
 * That last rule is why no demo record below is green on the map. A green
 * marker means a real settlement checked against real sources by a real
 * reviewer, and this file cannot produce one.
 *
 * The five records are deliberately chosen to cover five different marker
 * states, because the honest range of an archive at launch is mostly *not*
 * "fully documented":
 *   demo-0001  partially verified   (amber)
 *   demo-0002  location only        (grey)
 *   demo-0003  historical/relocated (blue)
 *   demo-0004  disputed             (red outline)
 *   demo-0005  diaspora             (purple)
 */

export const DEMO_DISCLAIMER =
  "Demo data — not historically verified. This settlement is invented. Its name, coordinates, population, dates and clan composition are fabrications used to demonstrate the interface.";

const COORD_NOTE =
  "Illustrative position rounded to 0.1°. This is a demonstration point inside the district, not the location of a real settlement.";

function demoFact<T>(value: T, sourceIds: string[], note?: string): Fact<T> {
  return {
    value,
    verification: "unverified",
    confidence: "low",
    sourceIds,
    isDemo: true,
    editorialNote: note ?? "Demonstration value — invented.",
  };
}

export const TANDAS: Tanda[] = [
  /* ==================================================================== */
  /* demo-0001 — partially verified, rural, Telangana                     */
  /* ==================================================================== */
  {
    id: "demo-0001",
    publicId: "GOR-DEMO-0001",
    primaryName: "Nandiwada Tanda",
    names: [
      { name: "Nandiwada Tanda", kind: "official", script: "Latn", locale: "en", isPrimary: true },
      { name: "నందివాడ తండా", kind: "transliteration", script: "Telu", locale: "te" },
      { name: "नंदिवाडा तांडा", kind: "transliteration", script: "Deva", locale: "hi" },
      { name: "Nandivada Thanda", kind: "alternate_spelling", script: "Latn" },
      { name: "Nandiwad Tanda", kind: "alternate_spelling", script: "Latn" },
      {
        name: "Nandiwada Guda",
        kind: "historical",
        script: "Latn",
        period: { start: 1900, end: 1950, precision: "quarter_century" },
      },
    ],
    stateId: "TG",
    districtId: "TG-nalgonda",
    subdistrict: demoFact("Demo Mandal", ["src-demo-gazetteer"]),
    nearestVillage: demoFact("Demo parent village", ["src-demo-gazetteer"]),
    pinCode: notDocumented(
      "No PIN code recorded for this demonstration settlement. Many Tandas share the PIN code of a parent village rather than holding one of their own.",
    ),
    settlementType: "rural",
    coordinates: [79.3, 17.1],
    coordinatePrecision: "reduced",
    coordinateNote: COORD_NOTE,
    sensitiveLocation: false,
    verification: "partially_verified",
    completenessPct: 62,
    isDemo: true,
    editorialNote:
      "Demonstration record. Shown as partially verified to illustrate an amber marker: some fields carry a source and a reviewer, others do not, and the profile shows which is which rather than averaging them into a single impression of reliability.",
    lastReviewedAt: "2026-02-11",

    populationRecords: [
      {
        asOfYear: 2011,
        sourceId: "src-demo-census",
        totalPopulation: 1240,
        households: 268,
        malePopulation: 631,
        femalePopulation: 609,
        childPopulation: 194,
        isCommunityEstimate: false,
        verification: "unverified",
        confidence: "low",
        isDemo: true,
        editorialNote:
          "Invented figure attached to a demo source, to show how a dated census row renders. A real row would name the exact census table.",
      },
      {
        asOfYear: 2024,
        sourceId: "src-demo-community",
        totalPopulation: 1610,
        households: 352,
        malePopulation: null,
        femalePopulation: null,
        childPopulation: null,
        isCommunityEstimate: true,
        migrationIn: null,
        migrationOut: null,
        verification: "unverified",
        confidence: "low",
        isDemo: true,
        editorialNote:
          "Invented community estimate. Note that no sex or child breakdown is carried: a community estimate that cannot support a breakdown does not get one.",
      },
    ],
    populationTrend: demoFact(
      "Reported as rising between the two demonstration figures. A trend across a census count and a community estimate is not a like-for-like comparison and is labelled accordingly.",
      [],
    ),

    clanPresence: [
      {
        clanId: "clan-rathod",
        band: "predominant",
        verification: "unverified",
        confidence: "low",
        sourceIds: ["src-demo-community"],
        editorialNote:
          "Band, not a percentage and not a family count. The archive never publishes clan composition at a resolution that could identify households.",
      },
      {
        clanId: "clan-banoth",
        band: "substantial",
        verification: "unverified",
        confidence: "low",
        sourceIds: ["src-demo-community"],
      },
      {
        clanId: "clan-bhukya",
        band: "present",
        verification: "unverified",
        confidence: "low",
        sourceIds: ["src-demo-community"],
      },
    ],
    surnameNotes: demoFact(
      "Surnames reported in this demonstration settlement follow the -oth/-avath pattern common in Telangana. Nothing in this list should be read as telling you which clan any individual belongs to.",
      [],
    ),

    events: [
      {
        id: "demo-0001-e1",
        kind: "settlement_founded",
        title: "Settlement established by a migrating group",
        description:
          "A demonstration founding account: a group is said to have settled near a seasonal watercourse after moving south. Recorded as oral tradition, with a period rather than a year — this is exactly the case where a single year would be a fabrication.",
        period: { start: 1850, end: 1900, precision: "quarter_century" },
        interpretation: "oral_tradition",
        verification: "unverified",
        confidence: "low",
        sourceIds: ["src-demo-oral"],
        tandaId: "demo-0001",
        isDemo: true,
        editorialNote:
          "Note the period: 1850–1900, precision 'quarter century'. The interface renders this as 'second half of the 1800s (approx.)' and the schema physically prevents storing it as an exact year.",
      },
      {
        id: "demo-0001-e2",
        kind: "institution_founded",
        title: "Primary school opened",
        description: "Demonstration event showing an institution entry on the timeline.",
        period: { start: 1972, end: 1972, precision: "exact_year" },
        interpretation: "documented",
        verification: "partially_verified",
        confidence: "medium",
        sourceIds: ["src-demo-gazetteer"],
        tandaId: "demo-0001",
        isDemo: true,
        editorialNote:
          "An exact year is permitted here only because the demonstration source is a document that would carry one. Contrast with the founding event above.",
      },
      {
        id: "demo-0001-e3",
        kind: "administrative_change",
        title: "Recorded as a separate revenue entry",
        description:
          "Demonstration event showing how a change in administrative status is tracked separately from settlement history.",
        period: { start: 1990, end: 2000, precision: "decade" },
        interpretation: "documented",
        verification: "partially_verified",
        confidence: "medium",
        sourceIds: ["src-demo-gazetteer"],
        tandaId: "demo-0001",
        isDemo: true,
      },
    ],
    originStory: {
      claims: [
        {
          value:
            "A demonstration oral account describing arrival from the north-west over several generations, following grazing and cartage routes.",
          verification: "unverified",
          confidence: "low",
          sourceIds: ["src-demo-oral"],
          interpretation: "oral_tradition",
          isDemo: true,
          editorialNote: "Invented account. Attributed to a demo oral-history source.",
        },
      ],
      editorialNote:
        "Only one account is recorded here. Where a settlement has two incompatible accounts, both appear side by side — see demo-0004.",
    },
    previousLocation: notDocumented(
      "No previous location recorded for this demonstration settlement.",
    ),
    migrationRouteIds: ["route-demo-northwest-deccan"],

    dialect: demoFact(
      "Gor Boli (Gormati) reported as the community language, alongside Telugu in schooling and administration.",
      [],
      "Demonstration value. A real entry would name the specific local variation and cite a linguistic source.",
    ),
    languagesSpoken: demoFact(["Gor Boli / Gormati", "Telugu"], []),
    practices: [
      {
        id: "demo-0001-p1",
        kind: "festival",
        name: "Teej (demonstration entry)",
        description:
          "Teej is widely documented as observed by Banjara women, involving the sowing of seedlings in baskets and songs performed over several days. This demonstration entry shows how a community-wide practice is attached to a settlement without asserting a settlement-specific variation that has not been recorded.",
        verification: "unverified",
        confidence: "low",
        interpretation: "widely_accepted_interpretation",
        sourceIds: [],
        isDemo: true,
        editorialNote:
          "The general practice is widely reported for the community. Any local variation specific to this settlement is not documented and is not invented here.",
      },
      {
        id: "demo-0001-p2",
        kind: "dress_embroidery",
        name: "Embroidery and mirror work (demonstration entry)",
        description:
          "Banjara embroidery incorporating mirror work, appliqué and cowrie ornamentation is widely documented across regions, with regional styles differing considerably. No style is attributed to this demonstration settlement specifically.",
        verification: "unverified",
        confidence: "low",
        interpretation: "widely_accepted_interpretation",
        sourceIds: [],
        isDemo: true,
      },
      {
        id: "demo-0001-p3",
        kind: "spiritual_tradition",
        name: "Sevalal tradition (demonstration entry)",
        description:
          "Reverence for Sant Sevalal (also Sevabhaya) is widely reported across Gor/Banjara communities. Whether this demonstration settlement holds any specific associated institution is not documented.",
        verification: "unverified",
        confidence: "low",
        interpretation: "widely_accepted_interpretation",
        sourceIds: [],
        isDemo: true,
      },
    ],
    governance: [
      {
        roleName: "Naik",
        description:
          "The customary head of a Tanda. Recorded here as a structure — the role, and whether it is reported as still active — never as a register of who currently holds it.",
        isCustomary: true,
        currentlyActive: null,
        verification: "unverified",
        confidence: "low",
        sourceIds: [],
        editorialNote:
          "Whether the role remains active in this demonstration settlement is not documented, and 'not documented' is shown rather than guessed.",
      },
      {
        roleName: "Karbhari",
        description:
          "A customary assisting role reported in some regions. Terminology and function vary regionally and are not standardised by this project.",
        isCustomary: true,
        currentlyActive: null,
        verification: "unverified",
        confidence: "low",
        sourceIds: [],
      },
    ],
    institutions: [
      {
        id: "demo-0001-i1",
        kind: "school",
        name: "Demonstration Primary School",
        established: { start: 1972, end: 1972, precision: "exact_year" },
        verification: "unverified",
        sourceIds: ["src-demo-gazetteer"],
        isDemo: true,
      },
      {
        id: "demo-0001-i2",
        kind: "gram_panchayat",
        name: "Demonstration Gram Panchayat",
        verification: "unverified",
        sourceIds: [],
        isDemo: true,
      },
    ],
    media: [
      {
        id: "demo-0001-m1",
        kind: "audio_oral_history",
        title: "Demonstration oral history recording",
        description:
          "A placeholder entry showing the metadata every media asset carries before it can be published: owner, contributor, capture period, consent scope, attribution preference and verification state. No file is attached.",
        ownerAttribution: "Demonstration contributor",
        contributorLabel: "Village-only attribution",
        consentId: "consent-demo-1",
        captured: { start: 2025, end: 2025, precision: "exact_year" },
        tandaId: "demo-0001",
        sourceIds: ["src-demo-oral"],
        verification: "unverified",
        isPublished: false,
        durationSeconds: 0,
        isDemo: true,
      },
    ],
  },

  /* ==================================================================== */
  /* demo-0002 — location only, rural, Maharashtra                        */
  /* ==================================================================== */
  {
    id: "demo-0002",
    publicId: "GOR-DEMO-0002",
    primaryName: "Kesarwadi Tanda",
    names: [
      { name: "Kesarwadi Tanda", kind: "official", script: "Latn", locale: "en", isPrimary: true },
      { name: "केसरवाडी तांडा", kind: "transliteration", script: "Deva", locale: "mr" },
      { name: "Kesarwadi Thanda", kind: "alternate_spelling", script: "Latn" },
    ],
    stateId: "MH",
    districtId: "MH-yavatmal",
    subdistrict: notDocumented(),
    nearestVillage: notDocumented(),
    pinCode: notDocumented(),
    settlementType: "rural",
    coordinates: [78.1, 20.4],
    coordinatePrecision: "reduced",
    coordinateNote: COORD_NOTE,
    sensitiveLocation: false,
    verification: "unverified",
    completenessPct: 11,
    isDemo: true,
    editorialNote:
      "Demonstration record showing the most common real state of a new entry: a name, a district, an approximate point, and almost nothing else. This is what the majority of the archive will honestly look like at launch, and the interface is designed so that this state is respectable rather than embarrassing.",

    populationRecords: [],
    populationTrend: notDocumented(),
    clanPresence: [],
    surnameNotes: notDocumented(),
    events: [],
    originStory: null,
    previousLocation: notDocumented(),
    migrationRouteIds: [],
    dialect: notDocumented(),
    languagesSpoken: notDocumented(),
    practices: [],
    governance: [],
    institutions: [],
    media: [],
  },

  /* ==================================================================== */
  /* demo-0003 — historical / relocated, Karnataka                        */
  /* ==================================================================== */
  {
    id: "demo-0003",
    publicId: "GOR-DEMO-0003",
    primaryName: "Old Bhimgarh Tanda",
    names: [
      { name: "Old Bhimgarh Tanda", kind: "official", script: "Latn", locale: "en", isPrimary: true },
      { name: "ಹಳೆಯ ಭೀಮಗಡ ತಾಂಡಾ", kind: "transliteration", script: "Knda", locale: "kn" },
      {
        name: "Bhimgarh Tanda",
        kind: "historical",
        script: "Latn",
        period: { start: 1900, end: 1975, precision: "quarter_century" },
      },
    ],
    stateId: "KA",
    districtId: "KA-kalaburagi",
    subdistrict: notDocumented(),
    nearestVillage: demoFact("Demonstration relocation site", ["src-demo-gazetteer"]),
    pinCode: notDocumented(),
    settlementType: "relocated",
    coordinates: [76.8, 17.3],
    coordinatePrecision: "reduced",
    coordinateNote:
      "Illustrative position of the demonstration ORIGINAL site, rounded to 0.1°. Where a settlement has moved, the archive keeps the original location as a historical point and links it to the present one, rather than overwriting it.",
    sensitiveLocation: false,
    verification: "unverified",
    completenessPct: 34,
    isDemo: true,
    editorialNote:
      "Demonstration record for a relocated settlement (blue marker). Relocation is common and frequently undocumented; when a settlement moves, the archive does not delete the earlier point, because the earlier point is often the only surviving trace of where a community lived.",

    populationRecords: [],
    populationTrend: notDocumented(
      "Population history across a relocation is not comparable and is not reconstructed here.",
    ),
    clanPresence: [
      {
        clanId: "clan-pawar",
        band: "reported",
        verification: "unverified",
        confidence: "low",
        sourceIds: ["src-demo-oral"],
      },
    ],
    surnameNotes: notDocumented(),
    events: [
      {
        id: "demo-0003-e1",
        kind: "settlement_founded",
        title: "Original settlement established",
        description: "Demonstration founding, recorded only to a century.",
        period: { start: 1800, end: 1900, precision: "century" },
        interpretation: "oral_tradition",
        verification: "unverified",
        confidence: "low",
        sourceIds: ["src-demo-oral"],
        tandaId: "demo-0003",
        isDemo: true,
        editorialNote:
          "Precision 'century'. The interface renders this as '1800s (approx.)'. Where an account cannot narrow the period, the record says so instead of picking a mid-point.",
      },
      {
        id: "demo-0003-e2",
        kind: "relocation",
        title: "Settlement relocated",
        description:
          "Demonstration relocation event. A real entry would record the stated reason, the destination, and whether the move was voluntary — and would treat displacement and voluntary relocation as different things.",
        period: { start: 1975, end: 1985, precision: "decade" },
        interpretation: "insufficient_evidence",
        verification: "unverified",
        confidence: "low",
        sourceIds: [],
        tandaId: "demo-0003",
        isDemo: true,
        editorialNote:
          "Labelled 'insufficient evidence': the demonstration record has an account of a move but nothing that establishes when or why. That label is a legitimate outcome, not a failure.",
      },
    ],
    originStory: null,
    previousLocation: demoFact(
      "This record IS the previous location. The present-day settlement is not yet documented.",
      [],
    ),
    migrationRouteIds: [],
    dialect: notDocumented(),
    languagesSpoken: notDocumented(),
    practices: [],
    governance: [],
    institutions: [],
    media: [],
  },

  /* ==================================================================== */
  /* demo-0004 — disputed, Andhra Pradesh                                 */
  /* ==================================================================== */
  {
    id: "demo-0004",
    publicId: "GOR-DEMO-0004",
    primaryName: "Sangapur Tanda",
    names: [
      { name: "Sangapur Tanda", kind: "official", script: "Latn", locale: "en", isPrimary: true },
      { name: "సంగాపూర్ తండా", kind: "transliteration", script: "Telu", locale: "te" },
      { name: "Sangapoor Thanda", kind: "alternate_spelling", script: "Latn" },
      { name: "Sangapur Guda", kind: "local", script: "Latn" },
    ],
    stateId: "AP",
    districtId: "AP-kurnool",
    subdistrict: notDocumented(),
    nearestVillage: notDocumented(),
    pinCode: notDocumented(),
    settlementType: "rural",
    coordinates: [78.0, 15.8],
    coordinatePrecision: "reduced",
    coordinateNote: COORD_NOTE,
    sensitiveLocation: false,
    verification: "disputed",
    completenessPct: 28,
    isDemo: true,
    editorialNote:
      "Demonstration record for a disputed entry (red outline). Two incompatible founding accounts are held at the same time. The platform does not adjudicate between them and does not hide either: suppressing a contested claim would itself be an editorial act, and regional variation in oral tradition is data rather than error.",

    populationRecords: [],
    populationTrend: notDocumented(),
    clanPresence: [
      {
        clanId: "clan-chauhan",
        band: "reported",
        verification: "disputed",
        confidence: "low",
        sourceIds: ["src-demo-community", "src-demo-oral"],
        editorialNote:
          "Accounts differ on which clans are predominant here. The band is recorded at the weakest level both accounts support.",
      },
      {
        clanId: "clan-vadtya",
        band: "reported",
        verification: "disputed",
        confidence: "low",
        sourceIds: ["src-demo-community"],
      },
    ],
    surnameNotes: notDocumented(),
    events: [
      {
        id: "demo-0004-e1",
        kind: "settlement_founded",
        title: "Founding — account A",
        description:
          "Demonstration account A places the founding in the early 1800s by a group moving along a cartage route.",
        period: { start: 1800, end: 1830, precision: "quarter_century" },
        interpretation: "oral_tradition",
        verification: "disputed",
        confidence: "low",
        sourceIds: ["src-demo-oral"],
        tandaId: "demo-0004",
        isDemo: true,
      },
      {
        id: "demo-0004-e2",
        kind: "settlement_founded",
        title: "Founding — account B",
        description:
          "Demonstration account B places the founding roughly two generations later and attributes it to a different group.",
        period: { start: 1870, end: 1900, precision: "quarter_century" },
        interpretation: "disputed",
        verification: "disputed",
        confidence: "low",
        sourceIds: ["src-demo-community"],
        tandaId: "demo-0004",
        isDemo: true,
        editorialNote:
          "Two founding events on one timeline is not a data error. It is the accurate representation of a settlement whose community holds two accounts.",
      },
    ],
    originStory: {
      claims: [
        {
          value:
            "Account A: arrival from the north along a cartage corridor, with settlement near a trading halt.",
          verification: "disputed",
          confidence: "low",
          sourceIds: ["src-demo-oral"],
          interpretation: "oral_tradition",
          isDemo: true,
        },
        {
          value:
            "Account B: a later split from a neighbouring settlement, with the name carried over from the parent site.",
          verification: "disputed",
          confidence: "low",
          sourceIds: ["src-demo-community"],
          interpretation: "disputed",
          isDemo: true,
        },
      ],
      editorialNote:
        "Both accounts are recorded in full. Resolution may be that one is eventually corroborated, or that both remain — permanent coexistence is a legitimate outcome, and is common where traditions genuinely differ between families in one settlement.",
    },
    previousLocation: notDocumented(),
    migrationRouteIds: ["route-demo-northwest-deccan"],
    dialect: notDocumented(),
    languagesSpoken: notDocumented(),
    practices: [],
    governance: [
      {
        roleName: "Naik",
        description: "Customary head of the Tanda, recorded as a structure only.",
        isCustomary: true,
        currentlyActive: null,
        verification: "unverified",
        confidence: "low",
        sourceIds: [],
      },
    ],
    institutions: [],
    media: [],
  },

  /* ==================================================================== */
  /* demo-0005 — diaspora, urban                                          */
  /* ==================================================================== */
  {
    id: "demo-0005",
    publicId: "GOR-DEMO-0005",
    primaryName: "Demonstration Diaspora Cluster",
    names: [
      {
        name: "Demonstration Diaspora Cluster",
        kind: "official",
        script: "Latn",
        locale: "en",
        isPrimary: true,
      },
    ],
    stateId: "TG",
    districtId: "TG-nalgonda",
    subdistrict: notDocumented(),
    nearestVillage: notDocumented(),
    pinCode: notDocumented(),
    settlementType: "diaspora",
    coordinates: [55.3, 25.3],
    coordinateNote:
      "Illustrative point only, rounded to 0.1°, showing how a diaspora entry renders on the map. It does not mark a real community location. Diaspora records are attached to a state of origin — here shown as the origin district, since the point of a diaspora record is the link back to where people came from.",
    coordinatePrecision: "obscured",
    sensitiveLocation: true,
    verification: "unverified",
    completenessPct: 8,
    isDemo: true,
    editorialNote:
      "Demonstration record for a diaspora entry (purple marker). Diaspora records are handled with more caution than settlement records: they frequently concern labour-migrant populations whose circumstances can be precarious, so location precision is coarsened by default and such records are excluded from bulk dataset export.",

    populationRecords: [],
    populationTrend: notDocumented(
      "Diaspora population is not estimated by this project without a credible dated source. Estimating it from community impression would be a fabrication with real consequences.",
    ),
    clanPresence: [],
    surnameNotes: notDocumented(),
    events: [],
    originStory: null,
    previousLocation: demoFact(
      "Origin recorded at district level only, deliberately. Finer origin detail on a diaspora record edges towards identifying individuals.",
      [],
    ),
    migrationRouteIds: [],
    dialect: notDocumented(),
    languagesSpoken: notDocumented(),
    practices: [],
    governance: [],
    institutions: [],
    media: [],
  },
];

export const TANDA_BY_ID = new Map(TANDAS.map((t) => [t.id, t]));
