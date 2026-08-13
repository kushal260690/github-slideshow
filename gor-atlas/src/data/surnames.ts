import type { Surname } from "@/lib/types";

/**
 * Surname index.
 *
 * Read this first: a surname in this index is a NAME, not a person and not a
 * classification. Three rules are enforced by the shape of the data:
 *
 *  1. `clanAssociations` is a list, never a single value. A surname may be
 *     associated with more than one clan, and commonly is.
 *  2. Every association is region-qualified and strength-graded. There is no
 *     way to express "this surname belongs to this clan".
 *  3. Nothing here supports inferring an individual's clan, caste, community
 *     or family from their name. The platform has no such feature and will not
 *     acquire one.
 *
 * All associations below are `unverified` / `low` confidence: they record
 * common community usage, not a documented finding.
 */

const NOTE =
  "Recorded from common community usage. Not traced to a documentary source by this project, and not usable to infer anything about any individual.";

function surname(
  slug: string,
  primaryForm: string,
  variants: { variant: string; script?: string; region?: string }[],
  associations: { clanId: string; region: string }[],
  notes?: string,
): Surname {
  return {
    id: `sn-${slug}`,
    slug,
    primaryForm,
    variants,
    clanAssociations: associations.map((a) => ({
      clanId: a.clanId,
      strength: "regionally_associated" as const,
      region: a.region,
      verification: "unverified" as const,
      confidence: "low" as const,
      sourceIds: [],
      editorialNote: NOTE,
    })),
    notes,
  };
}

export const SURNAMES: Surname[] = [
  surname(
    "rathod",
    "Rathod",
    [
      { variant: "Rathore", region: "Rajasthan and north India" },
      { variant: "Rathwad", region: "Deccan" },
      { variant: "Rathoad" },
      { variant: "Rathod Naik" },
      { variant: "राठोड", script: "Deva" },
      { variant: "రాఠోడ్", script: "Telu" },
      { variant: "ರಾಠೋಡ", script: "Knda" },
    ],
    [{ clanId: "clan-rathod", region: "Telangana, Andhra Pradesh, Maharashtra, Karnataka" }],
    "Also borne by communities unrelated to Gor/Banjara elsewhere in India. A shared surname is not evidence of a shared community.",
  ),
  surname(
    "pawar",
    "Pawar",
    [
      { variant: "Panwar" },
      { variant: "Powar" },
      { variant: "Pamar" },
      { variant: "Parmar", region: "western India" },
      { variant: "पवार", script: "Deva" },
    ],
    [{ clanId: "clan-pawar", region: "Maharashtra, Telangana, Karnataka" }],
    "Widely borne outside Gor/Banjara communities as well, particularly in Maharashtra.",
  ),
  surname(
    "chavan",
    "Chavan",
    [
      { variant: "Chauhan" },
      { variant: "Chavhan" },
      { variant: "Chohan" },
      { variant: "चव्हाण", script: "Deva" },
    ],
    [{ clanId: "clan-chauhan", region: "Maharashtra, Karnataka, Telangana" }],
    "Widely borne outside Gor/Banjara communities as well.",
  ),
  surname(
    "jadhav",
    "Jadhav",
    [{ variant: "Jadhao" }, { variant: "Jadav" }, { variant: "जाधव", script: "Deva" }],
    [{ clanId: "clan-jadhav", region: "Maharashtra, Telangana, Karnataka" }],
    "Widely borne outside Gor/Banjara communities as well.",
  ),
  surname(
    "badavath",
    "Badavath",
    [{ variant: "Vadtya" }, { variant: "Vadithya" }, { variant: "బడావత్", script: "Telu" }],
    [{ clanId: "clan-vadtya", region: "Telangana, Andhra Pradesh" }],
  ),
  surname(
    "banoth",
    "Banoth",
    [{ variant: "Banothu" }, { variant: "బానోతు", script: "Telu" }],
    [{ clanId: "clan-banoth", region: "Telangana, Andhra Pradesh" }],
  ),
  surname(
    "dharavath",
    "Dharavath",
    [{ variant: "Dharavathu" }, { variant: "ధరావత్", script: "Telu" }],
    [{ clanId: "clan-dharavath", region: "Telangana, Andhra Pradesh" }],
  ),
  surname(
    "bhukya",
    "Bhukya",
    [{ variant: "Bhukiya" }, { variant: "Bukya" }, { variant: "భుక్యా", script: "Telu" }],
    [{ clanId: "clan-bhukya", region: "Telangana, Andhra Pradesh" }],
  ),
  surname(
    "mudavath",
    "Mudavath",
    [{ variant: "Mudhavath" }, { variant: "Mudavathu" }],
    [{ clanId: "clan-mudavath", region: "Telangana, Andhra Pradesh" }],
  ),
  surname(
    "nenavath",
    "Nenavath",
    [{ variant: "Nenavathu" }, { variant: "Nenavat" }],
    [{ clanId: "clan-nenavath", region: "Telangana, Andhra Pradesh" }],
  ),
  surname(
    "ramavath",
    "Ramavath",
    [{ variant: "Ramavathu" }, { variant: "Ramavat" }],
    [{ clanId: "clan-ramavath", region: "Telangana, Andhra Pradesh" }],
  ),
  surname(
    "ajmeera",
    "Ajmeera",
    [{ variant: "Ajmera" }, { variant: "Ajmeer" }],
    [{ clanId: "clan-ajmeera", region: "Telangana, Andhra Pradesh" }],
  ),
  surname(
    "lakavath",
    "Lakavath",
    [{ variant: "Lakavathu" }, { variant: "Lakavat" }],
    [{ clanId: "clan-lakavath", region: "Telangana, Andhra Pradesh" }],
  ),
  surname(
    "kethavath",
    "Kethavath",
    [{ variant: "Katrawath" }, { variant: "Ketavath" }, { variant: "Kethavathu" }],
    [{ clanId: "clan-kethavath", region: "Telangana, Andhra Pradesh" }],
  ),
  surname(
    "naik",
    "Naik",
    [
      { variant: "Nayak" },
      { variant: "Naikda" },
      { variant: "नाईक", script: "Deva" },
      { variant: "నాయక్", script: "Telu" },
    ],
    [],
    "Naik is reported both as a surname and as the title of the customary head of a Tanda, and the two uses are frequently conflated. Because it is also a title, it carries no clan association in this index, and it is borne very widely outside Gor/Banjara communities. See the Tanda governance section for the customary role.",
  ),
];

export const SURNAME_BY_ID = new Map(SURNAMES.map((s) => [s.id, s]));
export const SURNAME_BY_SLUG = new Map(SURNAMES.map((s) => [s.slug, s]));

export const ASSOCIATION_STRENGTH_LABEL: Record<string, string> = {
  commonly_associated: "Commonly reported together",
  regionally_associated: "Reported together in some regions",
  contested: "Association is contested",
};

/** Every spelling of every surname, for the fuzzy search index. */
export function allSurnameForms(): { form: string; surnameSlug: string }[] {
  return SURNAMES.flatMap((s) => [
    { form: s.primaryForm, surnameSlug: s.slug },
    ...s.variants.map((v) => ({ form: v.variant, surnameSlug: s.slug })),
  ]);
}
