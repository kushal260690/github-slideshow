import type { StateRecord } from "@/lib/types";

/**
 * Administrative geography.
 *
 * State and district names here are real public administrative units. They are
 * included as a *frame for documentation*, not as a claim about the community.
 * Listing a district does NOT assert that Banjara settlements exist there — it
 * asserts only that the district exists and is open for documentation. Every
 * district begins at zero documented Tandas, which is the truthful starting
 * state of this archive.
 *
 * Centroids are approximate label placements for map framing only. They are not
 * boundary claims and are not survey data.
 */

export interface StateContext {
  /**
   * How the community is officially classified in this state. Classifications
   * differ by state and change by notification, so each is marked for
   * verification rather than stated as settled.
   */
  reportedClassification: string;
  classificationNote: string;
}

export const STATE_CONTEXT: Record<string, StateContext> = {
  TG: {
    reportedClassification: "Scheduled Tribe (Lambada / Banjara)",
    classificationNote:
      "Widely reported; confirm against the current Scheduled Tribes order for Telangana before citing.",
  },
  AP: {
    reportedClassification: "Scheduled Tribe (Lambadi / Sugali / Banjara)",
    classificationNote:
      "Widely reported; confirm against the current Scheduled Tribes order for Andhra Pradesh before citing.",
  },
  KA: {
    reportedClassification: "Scheduled Tribe (Lambani / Banjara)",
    classificationNote:
      "Widely reported; confirm against the current Scheduled Tribes order for Karnataka before citing.",
  },
  MH: {
    reportedClassification: "Vimukta Jati / Denotified — Banjara",
    classificationNote:
      "Reported as classified under Maharashtra's Vimukta Jati (VJ-A) category rather than as a Scheduled Tribe. Verify against the current state notification.",
  },
  RJ: {
    reportedClassification: "Other Backward Classes / Denotified (varies)",
    classificationNote:
      "Reported classification varies by group and district. Not yet verified by this project.",
  },
  MP: {
    reportedClassification: "Varies by group and district",
    classificationNote: "Not yet verified by this project.",
  },
  GJ: {
    reportedClassification: "Varies by group and district",
    classificationNote: "Not yet verified by this project.",
  },
  CG: {
    reportedClassification: "Varies by group and district",
    classificationNote: "Not yet verified by this project.",
  },
  UP: {
    reportedClassification: "Varies by group and district",
    classificationNote: "Not yet verified by this project.",
  },
  TN: {
    reportedClassification: "Varies by group and district",
    classificationNote: "Not yet verified by this project.",
  },
};

function districts(stateId: string, names: string[]) {
  return names.map((name) => ({
    id: `${stateId}-${name.toLowerCase().replace(/[^a-z]+/g, "-")}`,
    stateId,
    name,
  }));
}

export const STATES: StateRecord[] = [
  {
    id: "TG",
    code: "TG",
    name: "Telangana",
    nameLocal: "తెలంగాణ",
    centroid: [79.0, 17.9],
    districts: districts("TG", [
      "Adilabad",
      "Bhadradri Kothagudem",
      "Jangaon",
      "Jayashankar Bhupalpally",
      "Kamareddy",
      "Karimnagar",
      "Khammam",
      "Mahabubabad",
      "Mahabubnagar",
      "Medak",
      "Nagarkurnool",
      "Nalgonda",
      "Nirmal",
      "Nizamabad",
      "Rangareddy",
      "Sangareddy",
      "Siddipet",
      "Suryapet",
      "Vikarabad",
      "Wanaparthy",
      "Warangal",
      "Yadadri Bhuvanagiri",
    ]),
  },
  {
    id: "AP",
    code: "AP",
    name: "Andhra Pradesh",
    nameLocal: "ఆంధ్రప్రదేశ్",
    centroid: [80.0, 15.5],
    districts: districts("AP", [
      "Anantapur",
      "Annamayya",
      "Chittoor",
      "Guntur",
      "Kadapa",
      "Kurnool",
      "Nandyal",
      "Palnadu",
      "Prakasam",
      "Sri Sathya Sai",
      "Tirupati",
    ]),
  },
  {
    id: "MH",
    code: "MH",
    name: "Maharashtra",
    nameLocal: "महाराष्ट्र",
    centroid: [76.5, 19.6],
    districts: districts("MH", [
      "Akola",
      "Amravati",
      "Buldhana",
      "Chhatrapati Sambhajinagar",
      "Hingoli",
      "Jalgaon",
      "Jalna",
      "Latur",
      "Nanded",
      "Nashik",
      "Parbhani",
      "Washim",
      "Yavatmal",
    ]),
  },
  {
    id: "KA",
    code: "KA",
    name: "Karnataka",
    nameLocal: "ಕರ್ನಾಟಕ",
    centroid: [76.5, 15.0],
    districts: districts("KA", [
      "Bagalkote",
      "Ballari",
      "Belagavi",
      "Bidar",
      "Chitradurga",
      "Davanagere",
      "Dharwad",
      "Gadag",
      "Kalaburagi",
      "Koppal",
      "Raichur",
      "Vijayanagara",
      "Vijayapura",
      "Yadgir",
    ]),
  },
  {
    id: "RJ",
    code: "RJ",
    name: "Rajasthan",
    nameLocal: "राजस्थान",
    centroid: [74.2, 26.6],
    districts: districts("RJ", [
      "Ajmer",
      "Bhilwara",
      "Jaipur",
      "Jodhpur",
      "Nagaur",
      "Pali",
      "Rajsamand",
      "Sikar",
      "Tonk",
      "Udaipur",
    ]),
  },
  {
    id: "MP",
    code: "MP",
    name: "Madhya Pradesh",
    nameLocal: "मध्य प्रदेश",
    centroid: [78.4, 23.4],
    districts: districts("MP", [
      "Betul",
      "Bhopal",
      "Chhindwara",
      "Dewas",
      "Khargone",
      "Raisen",
      "Sehore",
      "Vidisha",
    ]),
  },
  {
    id: "GJ",
    code: "GJ",
    name: "Gujarat",
    nameLocal: "ગુજરાત",
    centroid: [71.8, 22.6],
    districts: districts("GJ", [
      "Banaskantha",
      "Kutch",
      "Panchmahal",
      "Sabarkantha",
      "Surendranagar",
    ]),
  },
  {
    id: "CG",
    code: "CG",
    name: "Chhattisgarh",
    nameLocal: "छत्तीसगढ़",
    centroid: [82.0, 21.3],
    districts: districts("CG", ["Durg", "Raipur", "Rajnandgaon"]),
  },
  {
    id: "UP",
    code: "UP",
    name: "Uttar Pradesh",
    nameLocal: "उत्तर प्रदेश",
    centroid: [80.9, 26.8],
    districts: districts("UP", ["Agra", "Jhansi", "Lalitpur", "Mathura"]),
  },
  {
    id: "TN",
    code: "TN",
    name: "Tamil Nadu",
    nameLocal: "தமிழ்நாடு",
    centroid: [78.4, 11.1],
    districts: districts("TN", ["Dharmapuri", "Krishnagiri", "Salem", "Vellore"]),
  },
];

export const STATE_BY_ID = new Map(STATES.map((s) => [s.id, s]));

export const ALL_DISTRICTS = STATES.flatMap((s) => s.districts);
export const DISTRICT_BY_ID = new Map(ALL_DISTRICTS.map((d) => [d.id, d]));

export function stateName(id: string): string {
  return STATE_BY_ID.get(id)?.name ?? id;
}

export function districtName(id: string): string {
  return DISTRICT_BY_ID.get(id)?.name ?? id;
}

/** Map framing for India, used as the default viewport. */
export const INDIA_VIEW = {
  center: [79.0, 21.5] as [number, number],
  zoom: 3.9,
  bounds: [
    [67.0, 6.0],
    [98.5, 36.5],
  ] as [[number, number], [number, number]],
};
