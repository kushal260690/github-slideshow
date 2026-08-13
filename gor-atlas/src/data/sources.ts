import type { Source } from "@/lib/types";

/**
 * The source register.
 *
 * Two kinds of entry live here, and they are never mixed:
 *
 *  1. `demo_placeholder` — invented references attached to the five prototype
 *     Tanda records. They exist to demonstrate how citation rendering works.
 *     They are not real documents and are labelled as such everywhere.
 *
 *  2. Reference leads — real, genuinely-existing bodies of record that this
 *     project intends to work from. They are listed WITHOUT page numbers,
 *     volume numbers or specific findings, because inventing a locator would be
 *     exactly the fabrication this platform exists to avoid. Each carries a
 *     note saying the bibliographic detail must be confirmed by an editor
 *     before it is attached to any claim as a citation.
 */

export const SOURCES: Source[] = [
  /* ---------------------------------------------------------------- */
  /* Reference leads — real record-holding bodies and instruments      */
  /* ---------------------------------------------------------------- */
  {
    id: "src-census-india",
    title: "Census of India — Primary Census Abstract and Scheduled Tribes tables",
    authorOrOrg: "Office of the Registrar General & Census Commissioner, India",
    category: "census",
    url: "https://censusindia.gov.in/",
    notes:
      "Reference lead. The census is the primary settlement-level population source for this project. Individual figures must be taken from a specific dated table and cited with its exact reference; no figure is carried here.",
  },
  {
    id: "src-lgd",
    title: "Local Government Directory (LGD) — village and sub-district codes",
    authorOrOrg: "Ministry of Panchayati Raj, Government of India",
    category: "government_record",
    url: "https://lgdirectory.gov.in/",
    notes:
      "Reference lead. Used to anchor a Tanda to an official village and sub-district code where one exists. Many Tandas are administratively folded into a parent village and have no code of their own — that absence is itself recorded.",
  },
  {
    id: "src-district-gazetteers",
    title: "District Gazetteers of India (state gazetteer departments)",
    authorOrOrg: "Various state gazetteer departments",
    category: "government_record",
    notes:
      "Reference lead. Gazetteers are useful for administrative history and often unreliable or colonial-inflected on community description. Treat administrative facts and ethnographic characterisation differently when citing.",
  },
  {
    id: "src-people-of-india",
    title: "People of India series",
    authorOrOrg: "Anthropological Survey of India",
    category: "academic",
    notes:
      "Reference lead. A national ethnographic survey series covering communities state by state. Volume, page and edition must be confirmed by an editor before any claim is attributed to it.",
  },
  {
    id: "src-lsi",
    title: "Linguistic Survey of India",
    authorOrOrg: "G. A. Grierson (ed.)",
    category: "academic",
    notes:
      "Reference lead. Early twentieth-century survey containing material on Banjari/Lambadi speech. Historically valuable, methodologically dated; cite as a historical record of description rather than as current linguistic fact.",
  },
  {
    id: "src-iso-lmn",
    title: "ISO 639-3 registry entry for Lambadi [lmn]",
    authorOrOrg: "SIL International (ISO 639-3 Registration Authority)",
    category: "academic",
    url: "https://iso639-3.sil.org/code/lmn",
    notes:
      "Reference lead for the language code used by this project for Gor Boli / Gormati / Lambadi.",
  },
  {
    id: "src-cta-1871",
    title: "Criminal Tribes Act, 1871 (and subsequent amendments; repealed 1952)",
    authorOrOrg: "Government of India (colonial legislation)",
    publicationYear: 1871,
    category: "archival_document",
    notes:
      "Reference lead. A number of nomadic and itinerant communities, including Banjara groups in several provinces, were notified under this Act; it was repealed in 1952 and affected communities were subsequently described as denotified. Which specific groups were notified varied by province and must be checked province by province before any settlement-level claim is made.",
  },
  {
    id: "src-dnt-commissions",
    title:
      "National commission reports on Denotified, Nomadic and Semi-Nomadic Tribes (2008 and 2017 commissions)",
    authorOrOrg: "Government of India",
    category: "government_record",
    notes:
      "Reference lead. Successive national commissions have reported on denotified and nomadic communities. Specific findings, recommendations and figures must be quoted from the report text with page references.",
  },
  {
    id: "src-oral-history-protocol",
    title: "Gor Atlas oral history collection protocol",
    authorOrOrg: "Gor Atlas editorial board",
    category: "oral_history",
    notes:
      "The project's own protocol for recording, consenting, transcribing and attributing oral testimony. Every oral-history source in the register is collected under this protocol.",
  },

  /* ---------------------------------------------------------------- */
  /* Demo placeholders — attached only to the five prototype records   */
  /* ---------------------------------------------------------------- */
  {
    id: "src-demo-census",
    title: "DEMO — illustrative census extract",
    authorOrOrg: "Not a real document",
    publicationYear: 2011,
    category: "demo_placeholder",
    isDemo: true,
    notes:
      "This reference does not exist. It is attached to prototype records to demonstrate how a dated census citation renders. No figure derived from it is real.",
  },
  {
    id: "src-demo-oral",
    title: "DEMO — illustrative recorded oral testimony",
    authorOrOrg: "Not a real recording",
    category: "demo_placeholder",
    isDemo: true,
    notes:
      "This reference does not exist. It demonstrates how an attributed oral-history citation renders, including narrator attribution and consent state.",
  },
  {
    id: "src-demo-gazetteer",
    title: "DEMO — illustrative gazetteer entry",
    authorOrOrg: "Not a real document",
    category: "demo_placeholder",
    isDemo: true,
    notes:
      "This reference does not exist. It demonstrates how an administrative-history citation renders.",
  },
  {
    id: "src-demo-community",
    title: "DEMO — illustrative community submission",
    authorOrOrg: "Not a real submission",
    category: "demo_placeholder",
    isDemo: true,
    notes:
      "This reference does not exist. It demonstrates how an unverified community submission renders before review.",
  },
];

export const SOURCE_BY_ID = new Map(SOURCES.map((s) => [s.id, s]));

export function getSource(id: string): Source | undefined {
  return SOURCE_BY_ID.get(id);
}

export const SOURCE_CATEGORY_LABEL: Record<string, string> = {
  census: "Census record",
  government_record: "Government record",
  academic: "Academic research",
  archival_document: "Archival document",
  oral_history: "Oral history",
  community_submission: "Community submission",
  media_report: "Media report",
  demo_placeholder: "Demo placeholder — not a real source",
};

/**
 * Institutions this project intends to work with or draw from. Listed as
 * intended relationships, not as endorsements — none of these bodies has
 * endorsed this prototype.
 */
export const RESEARCH_PARTNERS = [
  {
    name: "State gazetteer and archive departments",
    role: "Administrative history, settlement records, historical maps",
    status: "Intended — no relationship established yet",
  },
  {
    name: "University departments of anthropology, history and linguistics",
    role: "Peer review of interpretive claims; dialect documentation",
    status: "Intended — no relationship established yet",
  },
  {
    name: "Community organisations and Tanda representative bodies",
    role: "Oral history collection, consent, correction and withdrawal rights",
    status: "Essential — the project cannot proceed without these",
  },
  {
    name: "District administrations",
    role: "Verification of settlement identity and administrative status",
    status: "Intended — no relationship established yet",
  },
];
