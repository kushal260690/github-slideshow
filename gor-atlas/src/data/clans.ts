import type { Clan, ClanRelationship } from "@/lib/types";

/**
 * Clan register.
 *
 * What these records are: clan and surname names that are **widely used and
 * self-reported within Gor/Banjara communities**, recorded here as
 * community-attested names awaiting source verification.
 *
 * What these records are NOT:
 *  - a genealogy. No clan is recorded as the parent or ancestor of another.
 *  - a ranking. No clan is above another; the list order is alphabetical.
 *  - an exclusivity claim. A surname is never said to "belong to" one clan.
 *  - a settled account of origin. Where regional traditions differ, both are
 *    kept, separately labelled, and neither is resolved by this platform.
 *
 * Every entry below is therefore `unverified` with `low` confidence and an
 * editorial note saying so. That is the accurate state of this data, not a
 * placeholder to be quietly upgraded later — promotion to `partially_verified`
 * or `verified` requires an actual source and a named reviewer.
 */

const COMMUNITY_ATTESTED_NOTE =
  "Community-attested name. Recorded from general community usage, not yet traced to a documentary source by this project. Regional variation is expected and is not an error.";

function clan(
  slug: string,
  primaryName: string,
  summary: string,
  variants: { variant: string; script?: string; region?: string }[],
  reportedRegions: string[],
): Clan {
  return {
    id: `clan-${slug}`,
    slug,
    primaryName,
    summary,
    variants,
    subclans: [],
    reportedRegions: {
      value: reportedRegions,
      verification: "unverified",
      confidence: "low",
      sourceIds: [],
      editorialNote:
        "Regions where the name is commonly reported in community usage. This is not a distribution measurement and carries no population implication.",
    },
    traditionalOccupations: {
      value: null,
      verification: "not_documented",
      confidence: "low",
      sourceIds: [],
      editorialNote:
        "Occupational association is not recorded at clan level by this project without a source. Historical occupations documented for the wider community are described in the encyclopedia, not attributed to individual clans.",
    },
    oralTraditions: null,
    verification: "unverified",
    confidence: "low",
    sourceIds: [],
    editorialNote: COMMUNITY_ATTESTED_NOTE,
  };
}

export const CLANS: Clan[] = [
  clan(
    "rathod",
    "Rathod",
    "One of the most frequently reported clan names across Gor/Banjara communities, recorded in many spellings. Accounts connecting the name to wider north-Indian lineages of the same name circulate widely; this project treats such connections as unverified claims rather than as established descent, and does not assert royal or ancient ancestry for any clan.",
    [
      { variant: "Rathore", region: "Rajasthan, north India" },
      { variant: "Rathwad" },
      { variant: "Rathoad" },
      { variant: "राठोड", script: "Deva" },
      { variant: "రాఠోడ్", script: "Telu" },
      { variant: "ರಾಠೋಡ", script: "Knda" },
    ],
    ["Telangana", "Andhra Pradesh", "Maharashtra", "Karnataka", "Rajasthan"],
  ),
  clan(
    "pawar",
    "Pawar",
    "A widely reported clan name, appearing in several spellings that are treated here as variants of one another rather than as separate groups. Whether Pawar, Panwar and Parmar are the same name in different regional pronunciations is itself a question communities answer differently, and both readings are retained.",
    [
      { variant: "Panwar" },
      { variant: "Pamar" },
      { variant: "Parmar", region: "western India" },
      { variant: "Powar" },
      { variant: "पवार", script: "Deva" },
      { variant: "పవార్", script: "Telu" },
    ],
    ["Maharashtra", "Telangana", "Karnataka", "Madhya Pradesh"],
  ),
  clan(
    "chauhan",
    "Chauhan",
    "A widely reported clan name, recorded in both Chauhan and Chavan forms depending on region and language. As with other clan names shared with non-Banjara communities elsewhere in India, a shared name is not treated here as evidence of shared descent.",
    [
      { variant: "Chavan", region: "Maharashtra, Karnataka" },
      { variant: "Chavhan" },
      { variant: "Chohan" },
      { variant: "चौहान", script: "Deva" },
      { variant: "చౌహాన్", script: "Telu" },
    ],
    ["Maharashtra", "Telangana", "Karnataka", "Andhra Pradesh"],
  ),
  clan(
    "jadhav",
    "Jadhav",
    "A clan name reported across the Deccan, particularly in Maharashtra and adjoining districts of Telangana and Karnataka.",
    [
      { variant: "Jadhao" },
      { variant: "Jadav" },
      { variant: "जाधव", script: "Deva" },
    ],
    ["Maharashtra", "Telangana", "Karnataka"],
  ),
  clan(
    "vadtya",
    "Vadtya",
    "A clan name reported in Telangana and Andhra Pradesh, where it also appears in the Badavath and Vadithya spellings. Whether these are one name or several is recorded as an open question.",
    [
      { variant: "Badavath" },
      { variant: "Vadithya" },
      { variant: "Vadtiya" },
      { variant: "బడావత్", script: "Telu" },
    ],
    ["Telangana", "Andhra Pradesh"],
  ),
  clan(
    "banoth",
    "Banoth",
    "A surname and clan name widely reported in Telangana and Andhra Pradesh, commonly written with a final -oth or -othu.",
    [
      { variant: "Banothu" },
      { variant: "Banoth" },
      { variant: "బానోతు", script: "Telu" },
    ],
    ["Telangana", "Andhra Pradesh"],
  ),
  clan(
    "dharavath",
    "Dharavath",
    "A name reported in Telangana and Andhra Pradesh in several spellings.",
    [
      { variant: "Dharavathu" },
      { variant: "Dharavath" },
      { variant: "ధరావత్", script: "Telu" },
    ],
    ["Telangana", "Andhra Pradesh"],
  ),
  clan(
    "bhukya",
    "Bhukya",
    "A name reported in Telangana and Andhra Pradesh, sometimes written Bhukiya.",
    [
      { variant: "Bhukiya" },
      { variant: "Bukya" },
      { variant: "భుక్యా", script: "Telu" },
    ],
    ["Telangana", "Andhra Pradesh"],
  ),
  clan(
    "mudavath",
    "Mudavath",
    "A name reported in Telangana and Andhra Pradesh.",
    [{ variant: "Mudhavath" }, { variant: "Mudavathu" }],
    ["Telangana", "Andhra Pradesh"],
  ),
  clan(
    "nenavath",
    "Nenavath",
    "A name reported in Telangana and Andhra Pradesh, sometimes written Nenavathu or Nenavat.",
    [{ variant: "Nenavathu" }, { variant: "Nenavat" }],
    ["Telangana", "Andhra Pradesh"],
  ),
  clan(
    "ramavath",
    "Ramavath",
    "A name reported in Telangana and Andhra Pradesh.",
    [{ variant: "Ramavathu" }, { variant: "Ramavat" }],
    ["Telangana", "Andhra Pradesh"],
  ),
  clan(
    "ajmeera",
    "Ajmeera",
    "A name reported in Telangana and Andhra Pradesh, also written Ajmera. Accounts linking the name to the city of Ajmer circulate but are not documented, and are recorded here only as reported etymology.",
    [{ variant: "Ajmera" }, { variant: "Ajmeer" }],
    ["Telangana", "Andhra Pradesh"],
  ),
  clan(
    "lakavath",
    "Lakavath",
    "A name reported in Telangana and Andhra Pradesh.",
    [{ variant: "Lakavathu" }, { variant: "Lakavat" }],
    ["Telangana", "Andhra Pradesh"],
  ),
  clan(
    "kethavath",
    "Kethavath",
    "A name reported in Telangana and Andhra Pradesh, appearing in several spellings including Katrawath.",
    [{ variant: "Katrawath" }, { variant: "Kethavathu" }, { variant: "Ketavath" }],
    ["Telangana", "Andhra Pradesh"],
  ),
];

export const CLAN_BY_ID = new Map(CLANS.map((c) => [c.id, c]));
export const CLAN_BY_SLUG = new Map(CLANS.map((c) => [c.slug, c]));

/**
 * Relationships between clan names.
 *
 * Note what is absent: there is no 'parent_of', no 'descended_from', no
 * ordering. The only relationships recorded are that names are reported
 * together in a region, or that a claimed association is contested. Every one
 * of these is unverified, and the Clan Explorer says so on the graph itself.
 */
export const CLAN_RELATIONSHIPS: ClanRelationship[] = [
  {
    fromClanId: "clan-rathod",
    toClanId: "clan-pawar",
    relationship: "regionally_grouped_with",
    region: "Deccan (Telangana, Maharashtra, Karnataka)",
    verification: "unverified",
    confidence: "low",
    sourceIds: [],
    editorialNote:
      "Reported as commonly named together when communities describe the major clan groupings. Groupings differ by region and this is not a structural claim.",
  },
  {
    fromClanId: "clan-rathod",
    toClanId: "clan-chauhan",
    relationship: "regionally_grouped_with",
    region: "Deccan",
    verification: "unverified",
    confidence: "low",
    sourceIds: [],
    editorialNote: "Reported grouping only. Not a genealogical relationship.",
  },
  {
    fromClanId: "clan-rathod",
    toClanId: "clan-jadhav",
    relationship: "regionally_grouped_with",
    region: "Maharashtra",
    verification: "unverified",
    confidence: "low",
    sourceIds: [],
    editorialNote: "Reported grouping only. Not a genealogical relationship.",
  },
  {
    fromClanId: "clan-pawar",
    toClanId: "clan-chauhan",
    relationship: "regionally_grouped_with",
    region: "Deccan",
    verification: "unverified",
    confidence: "low",
    sourceIds: [],
    editorialNote: "Reported grouping only.",
  },
  {
    fromClanId: "clan-vadtya",
    toClanId: "clan-rathod",
    relationship: "disputed_association",
    region: "Telangana",
    verification: "disputed",
    confidence: "low",
    sourceIds: [],
    editorialNote:
      "Accounts differ on whether Vadtya/Badavath is described as a distinct clan or as a sub-group associated with Rathod. Both accounts are reported by community members in Telangana. This project records the disagreement and does not resolve it.",
  },
  {
    fromClanId: "clan-banoth",
    toClanId: "clan-vadtya",
    relationship: "regionally_grouped_with",
    region: "Telangana",
    verification: "unverified",
    confidence: "low",
    sourceIds: [],
    editorialNote: "Reported co-occurrence in the same districts. Not a structural claim.",
  },
  {
    fromClanId: "clan-bhukya",
    toClanId: "clan-dharavath",
    relationship: "regionally_grouped_with",
    region: "Telangana",
    verification: "unverified",
    confidence: "low",
    sourceIds: [],
    editorialNote: "Reported co-occurrence in the same districts.",
  },
  {
    fromClanId: "clan-nenavath",
    toClanId: "clan-mudavath",
    relationship: "regionally_grouped_with",
    region: "Telangana",
    verification: "unverified",
    confidence: "low",
    sourceIds: [],
    editorialNote: "Reported co-occurrence in the same districts.",
  },
  {
    fromClanId: "clan-ramavath",
    toClanId: "clan-lakavath",
    relationship: "regionally_grouped_with",
    region: "Telangana",
    verification: "unverified",
    confidence: "low",
    sourceIds: [],
    editorialNote: "Reported co-occurrence in the same districts.",
  },
  {
    fromClanId: "clan-kethavath",
    toClanId: "clan-ajmeera",
    relationship: "regionally_grouped_with",
    region: "Telangana",
    verification: "unverified",
    confidence: "low",
    sourceIds: [],
    editorialNote: "Reported co-occurrence in the same districts.",
  },
];

export const CLAN_RELATIONSHIP_LABEL: Record<string, string> = {
  associated_with: "Associated with",
  regionally_grouped_with: "Reported together in a region",
  shares_tradition_with: "Shares a reported tradition with",
  name_variant_of: "Recorded as a name variant of",
  disputed_association: "Association is disputed",
};
