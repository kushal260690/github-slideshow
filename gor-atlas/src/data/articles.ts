import type { Article } from "@/lib/types";

/**
 * Cultural Encyclopedia.
 *
 * Editorial standard applied to every article below:
 *   - Contested things are named as contested, in the article's own voice.
 *   - Where this project has not verified something, the article says so
 *     rather than adopting the confident register of a reference work.
 *   - Sources are listed as leads to be confirmed, not as attached citations
 *     with invented page numbers.
 *   - Nothing here asserts royal, racial or ancient descent for the community
 *     or for any clan within it.
 *
 * Every article is therefore `unverified` and carries a visible draft notice.
 * That is the accurate state of a prototype encyclopedia, and stating it is
 * cheaper than the credibility cost of being caught overstating.
 */

const DRAFT_NOTE =
  "Editorial draft. Written for the prototype from general reference knowledge and not yet checked against the source leads listed below by a named reviewer. Treat every statement here as provisional.";

function article(
  a: Omit<Article, "id" | "locale" | "verification" | "editorialNote" | "revisions"> &
    Partial<Pick<Article, "revisions">>,
): Article {
  return {
    id: `art-${a.slug}`,
    locale: "en",
    verification: "unverified",
    editorialNote: DRAFT_NOTE,
    revisions: a.revisions ?? [
      { at: "2026-08-13", by: "Prototype build", summary: "Initial draft created." },
    ],
    ...a,
  };
}

export const ARTICLES: Article[] = [
  article({
    slug: "origins-and-identity",
    section: "Origins and identity",
    title: "Origins and identity",
    standfirst:
      "What can and cannot be said about where the Gor/Banjara community came from — and why the confident versions should be treated with suspicion.",
    readingMinutes: 6,
    sourceIds: ["src-lsi", "src-people-of-india", "src-iso-lmn"],
    sourceLeads: [
      "Linguistic Survey of India — sections on Banjari/Lambadi speech",
      "Anthropological Survey of India, People of India — relevant state volumes",
      "Regional academic studies of nomadic and itinerant communities in the Deccan",
    ],
    contributors: ["Prototype build"],
    updatedAt: "2026-08-13",
    body: `
<p>Accounts of Banjara origins circulate in three registers that are easy to confuse: what the historical record documents, what scholars infer, and what communities remember. They do not agree, and this article does not resolve them.</p>

<h2>What the evidence supports</h2>
<p>The strongest available evidence is linguistic. Gor Boli — also called Gormati, Lambadi or Banjari — is an Indo-Aryan language whose closest affinities lie with the Rajasthani group of languages of north-western India, not with the Dravidian languages of the Deccan region where most of its speakers now live. A community whose language belongs to one region and whose settlements lie in another is, on the face of it, a community that moved.</p>
<p>That inference is widely accepted. It is also limited. Linguistic affinity establishes a relationship; it does not establish when a movement happened, whether it was a single migration or a long series of them, or what route it took. Confident claims about any of those things generally exceed what the sources can carry.</p>

<h2>What is interpretation</h2>
<p>The most common scholarly reading connects the community's presence across central and southern India to its historically documented occupation: long-distance overland transport of bulk goods by pack-bullock caravan. On this reading, dispersal follows trade — an itinerant carrying trade would naturally leave settled populations along the corridors it used. This is a coherent and widely held interpretation. It is not the same thing as a documented migration history.</p>

<h2>What is community memory</h2>
<p>Oral accounts across many regions describe movement from the north-west over generations, often naming places of origin. These accounts differ from one another — in chronology, in the places named, and in the reasons given — and the differences are systematic rather than random, varying by region and by family line.</p>
<p>This project treats that variation as information, not as noise to be averaged away. A composite narrative assembled from several oral accounts would be more satisfying to read and would tell you less than the accounts do separately.</p>

<h2>What this project will not say</h2>
<p>A recurring feature of popular accounts is the assertion of descent from named ancient or royal lineages, sometimes on the basis of shared clan names. Clan names such as Rathod, Pawar, Chauhan and Jadhav are borne by many communities across India, and a shared name is weak evidence of shared descent — surnames travel, are adopted, and are assigned. Gor Atlas records these names as names, and does not convert them into a genealogy.</p>
<p>Nor does it rank. Some accounts arrange clans in an order of precedence or antiquity. This archive does not reproduce those orderings, in either direction.</p>

<h2>Identity is not only origin</h2>
<p>It is worth separating the historical question from the present one. Whatever the migration history turns out to be, Gor/Banjara identity today is constituted by living things — a language still spoken, a settlement form still named, festivals still observed, and a shared experience of how the community has been classified and administered over the last century and a half. Those are documentable in a way that origin often is not, and much of this archive is directed at them.</p>
`,
  }),

  article({
    slug: "community-names-across-india",
    section: "Community names across India",
    title: "Community names across India",
    standfirst:
      "Gor, Banjara, Lambadi, Lambani, Sugali, Vanjari — one community, many names, and a self-designation that differs from the administrative one.",
    readingMinutes: 4,
    sourceIds: ["src-people-of-india", "src-district-gazetteers"],
    sourceLeads: [
      "State-wise Scheduled Tribes and Denotified Tribes notifications",
      "Anthropological Survey of India, People of India — state volumes",
    ],
    contributors: ["Prototype build"],
    updatedAt: "2026-08-13",
    body: `
<p>The community is known by different names in different regions, and the name used by outsiders is often not the name used within.</p>

<h2>The self-designation</h2>
<p><strong>Gor</strong> is widely reported as the community's own term for itself, with <strong>Gormati</strong> or <strong>Gor Boli</strong> used for the language. Members of the community are commonly described as <em>Gor</em> in their own speech even where administrative records use another term entirely. This is the reason this project is called Gor Atlas rather than Banjara Atlas — though both terms appear throughout, because both are in use.</p>

<h2>Regional and administrative names</h2>
<ul>
<li><strong>Banjara</strong> — the most widely used term across northern, central and western India, and the term most common in administrative and academic writing.</li>
<li><strong>Lambadi</strong>, <strong>Lambada</strong> — commonly used in Telangana and Andhra Pradesh.</li>
<li><strong>Lambani</strong> — commonly used in Karnataka.</li>
<li><strong>Sugali</strong>, <strong>Sukali</strong> — reported in parts of Andhra Pradesh.</li>
<li><strong>Lamani</strong> — reported in parts of Maharashtra and Karnataka.</li>
<li><strong>Vanjari</strong>, <strong>Banjari</strong> — appear in older records and in some regions; note that in Maharashtra "Vanjari" is also the name of a separate community, and the two should not be conflated.</li>
</ul>

<h2>Why this matters practically</h2>
<p>Names are not interchangeable in records. A settlement may appear in a census under one term, in a revenue record under another, and be known locally by a third. Searching a single term will miss records held under the others — which is why this archive indexes settlements, clans and surnames across all recorded name variants rather than choosing a canonical form.</p>
<p>Classification also follows names. Because official categories were assigned state by state under different terms, the same community is recorded as a Scheduled Tribe in some states and under denotified or backward-class categories in others. Those classifications, and the entitlements attached to them, are matters of current notification and are recorded per state in this archive with a request that each be verified against the notification in force.</p>

<h2>Editorial practice here</h2>
<p>Gor Atlas uses "Gor/Banjara" as its general term, uses the regional term where a regional context is being described, and always records the name a source itself used. A name in a record is evidence about that record.</p>
`,
  }),

  article({
    slug: "gor-boli-language",
    section: "Language and Gor Boli",
    title: "Gor Boli — the language",
    standfirst:
      "An Indo-Aryan language carried across a Dravidian-speaking region, spoken far more than it is written.",
    readingMinutes: 5,
    sourceIds: ["src-iso-lmn", "src-lsi"],
    sourceLeads: [
      "ISO 639-3 registry entry for Lambadi [lmn]",
      "Linguistic Survey of India — Banjari/Lambadi material",
      "Contemporary descriptive linguistics of Lambadi/Gor Boli",
    ],
    contributors: ["Prototype build"],
    updatedAt: "2026-08-13",
    body: `
<p><strong>Gor Boli</strong> — also called Gormati, Lambadi, Lamani or Banjari — is an Indo-Aryan language spoken by Gor/Banjara communities across central and southern India. It carries the ISO 639-3 code <code>lmn</code>.</p>

<h2>Where it sits</h2>
<p>Its affinities lie with the Rajasthani group of Indo-Aryan languages of north-western India. That places it in a different language family from Telugu and Kannada, the dominant languages of the regions where most speakers now live, and in a different branch from Marathi, its neighbour in much of Maharashtra. Speakers are typically multilingual, using Gor Boli within the community and the regional language for schooling, administration and work.</p>

<h2>A predominantly spoken language</h2>
<p>Gor Boli is transmitted primarily by speech. There is no single settled orthography: where it is written, both Devanagari and Telugu script are in community use, and practice varies by region. No script is treated as canonical by this project, and the data model reflects that — script is stored as a dimension separate from language, so the same text may exist in more than one script without either being marked as the correct one.</p>
<p>This has a practical consequence for an archive. For a language whose primary form is spoken, an audio recording is not an illustration attached to a text record — it is the more faithful record, and a transcription is the derivative. Gor Atlas is built to treat an audio rendition as a first-class representation of an article or an oral history rather than as a media attachment.</p>

<h2>Dialect variation</h2>
<p>Regional variation is reported between Gor Boli as spoken in Telangana, Karnataka, Maharashtra and further north, with borrowing from the surrounding regional language differing accordingly. This project records dialect variation at settlement level where a source describes it, and records "not documented" where none does — which is currently almost everywhere.</p>

<h2>Status</h2>
<p>Like many languages without official status in the states where they are spoken, Gor Boli faces pressure from dominant regional languages, particularly in education. Assessments of its vitality vary and this project has not verified any of them. Documenting the language as it is actually spoken, settlement by settlement, is one of the things this archive is for.</p>
`,
  }),

  article({
    slug: "clan-systems",
    section: "Clan systems",
    title: "Clan systems",
    standfirst:
      "How clan names work in Gor/Banjara society, and why this archive refuses to turn them into a family tree.",
    readingMinutes: 5,
    sourceIds: ["src-people-of-india"],
    sourceLeads: [
      "Anthropological Survey of India, People of India — kinship and clan sections",
      "Regional ethnographic studies of clan and marriage practice",
    ],
    contributors: ["Prototype build"],
    updatedAt: "2026-08-13",
    body: `
<p>Gor/Banjara society is organised in named clan groups, and the clan name is generally also the surname. A number of names recur across regions — Rathod, Pawar, Chauhan and Jadhav are among those most frequently reported — alongside many names particularly associated with Telangana and Andhra Pradesh, commonly ending in <em>-avath</em>, <em>-oth</em> or <em>-vath</em>: Banoth, Dharavath, Bhukya, Mudavath, Nenavath, Ramavath and others.</p>

<h2>What the clan does</h2>
<p>Clan affiliation is most consequential in marriage practice, where clan exogamy — marrying outside one's own clan group — is widely reported. Beyond that, accounts of what clans do, how they are ranked (or whether they are ranked at all), and how they relate to one another differ substantially by region.</p>

<h2>Four things this archive will not do</h2>
<p><strong>It will not build a genealogy.</strong> There is no parent-child relationship in the clan data model. Relationships between clan names are typed as "reported together in this region" or "association disputed", each with its own source. A network of associations is not a family tree, and the Clan Explorer says so on the graph itself.</p>
<p><strong>It will not rank.</strong> Accounts that arrange clans in an order of precedence or antiquity are not reproduced here in either direction. The list order in this archive is alphabetical, and that is a deliberate choice rather than a default.</p>
<p><strong>It will not claim exclusivity.</strong> A surname is never recorded as belonging to a clan. Associations are many-to-many, qualified by region, and graded by strength — because the same name is genuinely associated with different groups in different states, and asserting a single mapping would be a fabrication dressed as a fact.</p>
<p><strong>It will not infer.</strong> Nothing in this system derives a person's clan, caste, community or family from their name. There is no such feature, no such API, and no plan for one. Surnames are shared far beyond community boundaries — Rathod, Pawar, Chauhan and Jadhav are all borne widely by people with no connection to Gor/Banjara communities — and treating a name as a classification is how records become instruments of harm.</p>

<h2>Where regions disagree</h2>
<p>Whether a given name is a distinct clan or a sub-group of another is one of the most common points of disagreement, and it is usually regional. This archive holds both readings simultaneously, labelled as disputed, with the sources for each. Permanent coexistence of differing accounts is a legitimate outcome and, for traditions that vary by region, the expected one.</p>
`,
  }),

  article({
    slug: "tanda-governance",
    section: "Tanda governance",
    title: "The Tanda and its governance",
    standfirst:
      "The settlement form that gives this archive its unit of record, and the customary authority associated with it.",
    readingMinutes: 4,
    sourceIds: ["src-people-of-india", "src-district-gazetteers"],
    sourceLeads: [
      "District gazetteers — settlement and revenue administration sections",
      "Ethnographic studies of Tanda organisation",
    ],
    contributors: ["Prototype build"],
    updatedAt: "2026-08-13",
    body: `
<p>A <strong>Tanda</strong> is the characteristic Gor/Banjara settlement: a hamlet, often located at some distance from the parent village with which it is administratively grouped. The word is also used for a caravan — the same term covering the travelling group and the place where it settled, which is itself a piece of history.</p>

<h2>Administrative invisibility</h2>
<p>The relationship between a Tanda and the revenue village it is attached to is the single most important practical fact for anyone trying to document these settlements. Many Tandas have no separate administrative identity: they are counted within a parent village, share its code and its PIN, and do not appear as a distinct entry in official lists. A settlement of several hundred people can therefore be, in record terms, invisible.</p>
<p>This is why Gor Atlas treats the Tanda rather than the village as its unit of record, and why it records the absence of an official code as information in its own right rather than as a missing field.</p>

<h2>The Naik</h2>
<p>The customary head of a Tanda is widely reported as the <strong>Naik</strong>, a role associated with dispute resolution, representation of the settlement to outside authority, and decisions affecting the community as a whole. Other customary roles are reported in various regions under various names; terminology and function differ, and this project does not standardise them into a single scheme it cannot support.</p>
<p>Note that "Naik" is also a widespread surname, including outside Gor/Banjara communities. The role and the name are frequently conflated in records, and this archive keeps them separate: the role is recorded in the governance section of a settlement, the name in the surname index, and neither implies the other.</p>

<h2>Recorded as structure, not as roster</h2>
<p>Governance is stored here as a structure — which customary roles exist, and whether they are reported as still active — never as a register of who currently holds them. Naming current office-holders would make this archive a directory of identifiable individuals, which is precisely what it is designed not to be.</p>

<h2>Alongside the statutory system</h2>
<p>Customary authority now coexists with the statutory panchayat system, and the relationship between them varies. Where a Tanda falls within a gram panchayat, that body is recorded as a public institution with its public contact details. Where customary and statutory authority are reported to interact in a particular way in a particular settlement, that is recorded as a sourced claim about that settlement, not generalised.</p>
`,
  }),

  article({
    slug: "trade-and-migration",
    section: "Trade and migration",
    title: "Trade, cartage and movement",
    standfirst:
      "The carrying trade that shaped the community's geography — and what happened when it ended.",
    readingMinutes: 5,
    sourceIds: ["src-district-gazetteers", "src-people-of-india", "src-cta-1871"],
    sourceLeads: [
      "Colonial revenue, military and commissariat records on caravan provisioning",
      "District gazetteers — trade and communications sections",
      "Economic history of pre-railway overland transport in India",
    ],
    contributors: ["Prototype build"],
    updatedAt: "2026-08-13",
    body: `
<p>Before railways, moving bulk goods overland in India meant moving them on animals. Grain, salt and military provisions travelled in large pack-bullock caravans, and Banjara groups are extensively associated with that trade in the historical record — including in the records of the states and armies that depended on it.</p>

<h2>Why this is comparatively well documented</h2>
<p>Most of what is documented about the community before the twentieth century is documented because the state had a use for it. Armies needed provisioning; revenue administrations needed to account for the movement of grain. Caravan transport therefore appears in military and administrative records in a way that ordinary community life does not.</p>
<p>This is worth stating plainly, because it shapes what an archive built from those records can and cannot show. The written record is dense on the community as a logistical resource and thin on almost everything else — which is one reason oral history is not a supplement to the documentary record here but a necessary correction to its selectivity.</p>

<h2>The end of the trade</h2>
<p>The expansion of railway freight through the nineteenth century displaced long-distance pack-bullock cartage. The general connection between that displacement and the settling of previously itinerant groups is widely drawn and plausible. Its specifics — the pace, the regional variation, what people did next — differ by district and are not established by this project for any particular one.</p>
<p>What followed the loss of a livelihood is not only an economic story. Within a few decades, the colonial state moved from relying on itinerant carriers to legislating against itinerancy itself: the Criminal Tribes Act of 1871 notified a number of nomadic and itinerant communities, subjecting them to registration and restriction of movement. The relationship between the two developments is a serious historical question that this archive does not attempt to settle in a paragraph.</p>

<h2>How routes are recorded here</h2>
<p>Every migration route in this archive carries several evidence entries with different labels, because different aspects of the same route have different evidential standing. The existence of the carrying trade is <em>documented</em>. The claim that railways displaced it is a <em>widely accepted interpretation</em>. The specific corridors used by specific groups are <em>disputed</em>. Its chronology is often <em>insufficient evidence</em>. Collapsing those into one confidence rating for the whole route would lose the only part that is actually useful to a researcher.</p>
`,
  }),

  article({
    slug: "sant-sevalal",
    section: "Sevalal Maharaj",
    title: "Sant Sevalal",
    standfirst:
      "The figure most widely revered across Gor/Banjara communities, and what is and is not established about him.",
    readingMinutes: 4,
    sourceIds: ["src-oral-history-protocol", "src-people-of-india"],
    sourceLeads: [
      "Devotional and hagiographic literature in Gor Boli, Marathi and Telugu",
      "Records of the pilgrimage centre at Pohradevi, Washim district, Maharashtra",
      "Academic studies of Banjara religious practice",
    ],
    contributors: ["Prototype build"],
    updatedAt: "2026-08-13",
    body: `
<p><strong>Sant Sevalal</strong> — also called Sevabhaya or Sevalal Maharaj — is the figure most widely revered across Gor/Banjara communities, and reverence for him is one of the few things reported consistently from Rajasthan to Karnataka.</p>

<h2>What is widely reported</h2>
<p>Sevalal is remembered as a spiritual teacher and protector of the community, associated with the period when the carrying trade was still the community's characteristic occupation. <strong>Pohradevi</strong>, in Washim district in Maharashtra, is widely described as the principal centre associated with him and is a major pilgrimage destination, sometimes referred to as the community's foremost sacred site. Sevalal Jayanti is observed as a community-wide occasion.</p>

<h2>What is not established here</h2>
<p>Dates for Sevalal's life are commonly given in devotional and popular accounts — a birth in 1739 and a death in 1806 are the figures most often cited. This project has <strong>not</strong> verified those dates against any contemporaneous source and does not publish them as established. They are recorded as commonly cited, which is a different claim.</p>
<p>Biographical accounts vary in detail between regions, as devotional traditions generally do. Where accounts differ, this archive records them separately with their sources rather than harmonising them into a single life.</p>

<h2>Editorial position on religious material</h2>
<p>Gor Atlas documents religious practice as practice: what is observed, where, by whom, and as reported by which source. It does not adjudicate theological claims, does not rank traditions, and does not treat devotional literature as historical documentation or dismiss it as worthless — devotional texts are excellent evidence of what a community believes and holds, and weak evidence of dates.</p>
<p>Alongside the Sevalal tradition, local deities and spiritual practices vary considerably between regions and settlements. These are recorded at settlement level where a source describes them, and left as "not documented" where none does.</p>
`,
  }),

  article({
    slug: "festivals",
    section: "Festivals",
    title: "Festivals",
    standfirst: "Teej and the calendar of community observance.",
    readingMinutes: 4,
    sourceIds: ["src-people-of-india"],
    sourceLeads: [
      "Ethnographic accounts of Banjara festival practice by region",
      "Recorded oral testimony from participants",
    ],
    contributors: ["Prototype build"],
    updatedAt: "2026-08-13",
    body: `
<p><strong>Teej</strong> is the observance most distinctively associated with Gor/Banjara communities, and is described across regions as a festival of unmarried young women.</p>

<h2>Teej</h2>
<p>Accounts describe seeds — commonly wheat — sown in small baskets and tended over a period of days, with the seedlings' growth watched as an augury. The observance is marked by songs performed collectively by the young women, by dance, and by a concluding immersion of the baskets. It is generally described as taking place in the monsoon month corresponding to Shravan.</p>
<p>Details differ by region: the number of days, the specific songs, the accompanying rites and the degree of participation by others in the settlement are all reported differently in different places. This project records regional variation as variation and does not present one version as the standard.</p>

<h2>Other observances</h2>
<p>Sevalal Jayanti is observed community-wide. Holi is reported as widely observed, with regionally distinctive practices in some areas. Local deity observances vary substantially between settlements, and this archive records them at settlement level or not at all — a festival reported in one district is not evidence about another.</p>

<h2>What this archive is missing</h2>
<p>Festival practice is the kind of knowledge that lives with participants and is poorly served by written sources. It is also changing: accounts frequently note that observance patterns have shifted with migration for work and with school calendars. Recorded testimony from participants — with proper consent, and in their own language — is worth more here than any secondary description, and collecting it is one of the clearest gaps this archive currently has.</p>
`,
  }),

  article({
    slug: "clothing-and-embroidery",
    section: "Clothing and embroidery",
    title: "Clothing, embroidery and jewellery",
    standfirst:
      "The most internationally recognised element of Banjara material culture — and the one most exposed to appropriation.",
    readingMinutes: 5,
    sourceIds: ["src-people-of-india"],
    sourceLeads: [
      "Textile scholarship on Banjara/Lambani embroidery traditions",
      "Geographical Indication registration records for regional embroidery styles",
      "Museum and private collection catalogues",
    ],
    contributors: ["Prototype build"],
    updatedAt: "2026-08-13",
    body: `
<p>Banjara embroidery is among the most widely recognised textile traditions in India, and it is the element of the community's material culture most likely to be encountered by outsiders — often with no attribution at all.</p>

<h2>Dress</h2>
<p>Women's dress is commonly described as comprising a wide skirt (reported as <em>phetiya</em> or by regional equivalents), a bodice (<em>kanchali</em>), and a head covering or veil cloth (<em>odhni</em>, <em>chantiya</em>), heavily worked with embroidery. Terminology varies regionally, and this project records the term the source itself used.</p>

<h2>The embroidery</h2>
<p>Characteristic techniques reported across regions include mirror work, appliqué and patchwork, cowrie shell and coin ornamentation, and dense geometric stitching in strong colour. Regional styles differ considerably — enough that specialists distinguish them — and this archive records style at regional or settlement level where a source supports it rather than describing a single generic "Banjara style".</p>
<p>Regional embroidery traditions have in some cases received formal recognition; the Lambani embroidery associated with Sandur in Karnataka is reported to hold Geographical Indication status. This project has not verified the registration details and records the claim as reported.</p>

<h2>Jewellery</h2>
<p>Heavy silver ornament is widely reported — anklets, bangles, neck and head ornaments — alongside pieces incorporating coins and cowries. As with textiles, form and terminology vary by region.</p>

<h2>Why attribution is an archival problem</h2>
<p>Banjara embroidery circulates commercially at scale, frequently stripped of attribution and sold as generic "tribal" or "boho" work, and the makers rarely capture the value. That is a reason for an archive like this one to be careful in the opposite direction from usual: documenting a design carries a risk of making it easier to copy.</p>
<p>Gor Atlas's practice is therefore that media of textile work carries the same consent record as any other asset, that <code>commercial_use_permitted</code> and <code>ai_training_permitted</code> both default to false and cannot be silently changed, and that the interface uses only abstract geometric motifs of its own construction as decoration — never a reproduction of a specific community's design.</p>
`,
  }),

  article({
    slug: "colonial-era-history",
    section: "Colonial-era history",
    title: "The colonial era and the Criminal Tribes Act",
    standfirst:
      "How an administration that relied on itinerant carriers came to legislate against itinerancy.",
    readingMinutes: 5,
    sourceIds: ["src-cta-1871", "src-district-gazetteers"],
    sourceLeads: [
      "Criminal Tribes Act 1871 and provincial notification texts",
      "Provincial administration records on settlement and registration",
      "Historical scholarship on denotified communities",
    ],
    contributors: ["Prototype build"],
    updatedAt: "2026-08-13",
    body: `
<p>The <strong>Criminal Tribes Act of 1871</strong> allowed provincial governments to notify entire communities as criminal by birth. Communities so notified were subject to registration, restriction of movement, compulsory reporting and, in some cases, confinement to settlements. The Act was extended and amended over the following decades before being repealed in 1952.</p>

<h2>Establishing what applied where</h2>
<p>A number of nomadic and itinerant communities, including Banjara groups in several provinces, were notified. <strong>Which</strong> groups were notified varied by province and by amendment, and this article does not summarise it, because a summary would be wrong somewhere and the cost of being wrong about this particular thing is not academic.</p>
<p>Establishing what applied in a given district requires reading the notification texts for that province in that period. Gor Atlas records this at district level, sourced to the specific notification, or records it as not documented. It is not inferred from what applied elsewhere.</p>

<h2>Repeal is not the end of the story</h2>
<p>The Act was repealed in 1952 and the affected communities were subsequently described as <em>denotified</em>. The legal category ended; the administrative habits, the local reputations and the police practices formed over eight decades did not end with it, and successive national commissions have since been appointed to examine the position of denotified and nomadic communities.</p>

<h2>Reading colonial records</h2>
<p>This history has a direct methodological consequence for an archive. Much of the surviving documentary record about the community was produced by an administration that had already classified it as criminal. Those records are genuine evidence — of administrative action, of settlement locations, of movement, of what officials did. They are not neutral evidence of what the community was.</p>
<p>Gor Atlas therefore treats administrative facts and ethnographic characterisation in colonial sources as different kinds of claim, cited differently and weighted differently. A gazetteer's statement about where a settlement was is one thing; the same gazetteer's characterisation of the people in it is another, and is recorded as evidence about the gazetteer.</p>
`,
  }),

  article({
    slug: "post-independence-history",
    section: "Post-independence history",
    title: "After 1947 — classification, entitlement and unevenness",
    standfirst:
      "Why the same community holds different official statuses on different sides of a state border.",
    readingMinutes: 4,
    sourceIds: ["src-dnt-commissions", "src-census-india"],
    sourceLeads: [
      "State-wise Scheduled Tribe and Denotified Tribe notifications and amendments",
      "National commission reports on denotified, nomadic and semi-nomadic communities",
      "Census of India — Scheduled Tribes tables by state",
    ],
    contributors: ["Prototype build"],
    updatedAt: "2026-08-13",
    body: `
<p>After independence, the community was classified differently in different states — and because classification governs access to reservations in education and employment, welfare schemes and political representation, those differences have material consequences.</p>

<h2>The unevenness</h2>
<p>Broadly, and subject to verification against current notifications: the community is reported as classified as a Scheduled Tribe in Telangana, Andhra Pradesh and Karnataka, and under denotified or backward-class categories in Maharashtra, Rajasthan and elsewhere. The result is that a family on one side of a state border may hold a different official status from relatives on the other, with different entitlements attached.</p>
<p>Gor Atlas records the reported classification for each state and marks each one for verification rather than stating it as settled. Notifications are amended, and an archive that states an outdated classification as current is worse than one that says "verify this".</p>

<h2>Commissions and their aftermath</h2>
<p>Successive national commissions in the 2000s and 2010s examined the position of denotified, nomadic and semi-nomadic communities and made recommendations on documentation, welfare and legal protection. Their specific findings are not summarised here until an editor has quoted them from the report text with page references — which is the standard this archive applies to any claim precise enough to be quoted back at it.</p>

<h2>What changed on the ground</h2>
<p>Settlement, agriculture, wage labour and migration for work have reshaped Tanda economies over the last seventy years. Educational participation has risen, unevenly. Movement to cities has produced substantial urban populations whose relationship to a home Tanda is often maintained but is poorly documented.</p>
<p>These are exactly the changes this archive is built to record, and it currently records almost none of them. Development indicators, education figures and migration patterns are all fields that require dated sources this project does not yet hold — so they are shown as not documented, at settlement after settlement, until someone supplies them.</p>
`,
  }),

  article({
    slug: "women-in-banjara-society",
    section: "Women in Banjara society",
    title: "Women in Gor/Banjara society",
    standfirst:
      "Carriers of the most visible elements of the culture — and the least documented part of the record.",
    readingMinutes: 4,
    sourceIds: ["src-people-of-india"],
    sourceLeads: [
      "Gender-focused ethnographic studies of Banjara communities",
      "Recorded testimony from women in Tandas, collected under consent",
      "Studies of craft economies and women's labour",
    ],
    contributors: ["Prototype build"],
    updatedAt: "2026-08-13",
    body: `
<p>Two things are simultaneously true and are usually reported separately. The elements of Gor/Banjara culture most recognised from outside — the embroidery, the dress, the Teej observance, the song repertoire — are overwhelmingly made, held and transmitted by women. And the documentary record about women's lives in these communities is thin, largely written by outsiders, and heavily weighted towards the visually striking.</p>

<h2>What is documented</h2>
<p>Women's centrality to textile production is well attested, as is their role in Teej and in the collective song traditions attached to it. Participation in agricultural and wage labour is widely reported. Beyond that, the record thins quickly.</p>

<h2>What is not</h2>
<p>Educational participation, health access, decision-making within customary governance, control over craft earnings, and the effects of male out-migration on household labour are all poorly documented for these communities specifically, as distinct from being documented for rural populations in general. This archive shows them as not documented rather than filling them in from generic rural statistics.</p>

<h2>An editorial caution</h2>
<p>Writing about women in a documented-as-picturesque community carries a specific risk: the available imagery is abundant and the available testimony is scarce, so accounts drift towards describing appearance and away from describing lives. Gor Atlas's counter is procedural rather than rhetorical — recorded testimony from women, in their own language, with consent recorded in that language, weighs more here than any secondary description of them, and the media policy explicitly refuses the decorative use of photographs of community members.</p>
<p>This article is short because the honest version is short. It should be replaced by one built on collected testimony.</p>
`,
  }),
];

export const ARTICLE_BY_SLUG = new Map(ARTICLES.map((a) => [a.slug, a]));

/**
 * Encyclopedia sections from the editorial plan that have no article yet.
 * Listed rather than hidden: an encyclopedia's gaps are part of its state, and
 * a reader deserves to know what is missing rather than inferring completeness
 * from a tidy index.
 */
export const PLANNED_SECTIONS = [
  "Jewellery",
  "Music and instruments",
  "Dance",
  "Food",
  "Marriage customs",
  "Oral literature",
  "Traditional occupations",
  "Education",
  "Political and social movements",
  "Contemporary entrepreneurship",
  "Banjara diaspora",
  "Community challenges and development indicators",
];
