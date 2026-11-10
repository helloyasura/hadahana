/** Human-auditable allowlist. No generated word or model-supplied meaning is accepted. */
import type { ReligionContext } from "./personalities";
import { nameMatchesLetter } from "./sinhala-base";
export type Culture = "sinhala" | "tamil" | "international" | "arabic";
export type NameRecord = {
  id: string;
  sinhala: string;
  roman: string;
  gender: "male" | "female" | "unisex";
  meaningSi: string;
  meaningEn: string;
  religions: ReligionContext[];
  culture: Culture;
  era: "modern" | "timeless" | "traditional";
  meaningStatus: "sourced" | "review";
  source: string;
  syllables: number;
  variantGroup?: string;
};
const B = "https://www.behindthename.com/name/";
const K = "https://kosha.sanskrit.today/word/sa/";
const M = "https://www.maduraonline.com/?find=";
// Columns: roman | Sinhala | gender | Sinhala gloss | English gloss | compatible contexts | culture | era | syllables | source.
const DATA = `
Mihira|මිහිර|male|සූර්යයා (සංස්කෘත)|Sun (Sanskrit mihira)|buddhist,secular|sinhala|modern|3|${K}mihira
Mudith|මුදිත්|male|සතුටු වූ / ප්‍රීතිමත්|Happy, delighted; variant of Mudit|buddhist,hindu,secular|sinhala|modern|2|https://parenting.firstcry.com/baby-names/meaning-of-muditha/
Mithun|මිථුන්|male|යුගලය / නිවුන්|Pair, twins (Sanskrit mithuna)|buddhist,hindu,secular|sinhala|modern|2|${B}mithun/submitted
Milan|මිලාන්|male|ආදරණීය (ස්ලාවික් මූලය)|Dear, gracious (Slavic reading; not a Sinhala etymology)|buddhist,christian,hindu,islamic,secular|international|modern|2|${B}milan
Pahan|පහන්|male|පහන / ආලෝකය|Lamp, light (Sinhala lexical reading)|buddhist,secular|sinhala|modern|2|${M}lamp
Pavan|පවන්|male|සුළඟ; වායු දෙවියාගේ නාමයක් ද වේ|Wind; also a Vayu epithet (Sanskrit pavana)|hindu|tamil|modern|2|${B}pavana
Praveen|ප්‍රවීන්|male|දක්ෂ / නිපුණ|Skilled (Sanskrit pravina)|buddhist,hindu,secular|sinhala|modern|2|${B}pravin
Praneeth|ප්‍රණීත්|male|ඉදිරියට ගෙන ගිය / මඟ පෙන්වූ|Led forward, guided (Sanskrit pranita)|buddhist,hindu,secular|sinhala|modern|2|${K}praNIta
Pamod|පමෝද්|male|ප්‍රීතිය / සතුට|Joy (Pali pamoda)|buddhist,secular|sinhala|modern|2|https://www.wisdomlib.org/definition/pamoda
Pamuditha|පමුදිත|male|ප්‍රීතිමත්|Delighted (Pali pamudita)|buddhist,secular|sinhala|timeless|4|https://www.wisdomlib.org/definition/pamudita
Madhura|මධුර|unisex|මිහිරි / මධුර|Sweet, pleasant|buddhist,hindu,secular|sinhala|timeless|3|${K}madhura
Mihiri|මිහිරි|female|මිහිරි / මධුර|Sweet, pleasant (Sinhala lexical reading)|buddhist,secular|sinhala|timeless|3|${M}sweet
Madhuri|මධුරි|female|මිහිරි බව|Sweetness|buddhist,hindu,secular|sinhala|timeless|3|${B}madhuri
Piumi|පියුමි|female|පියුම / නෙළුම් මල (මූලය)|Lotus (Sinhala piyum root; feminine name form)|buddhist,secular|sinhala|modern|3|${M}lotus
Pavithra|පවිත්‍රා|female|පවිත්‍ර|Pure (Sanskrit pavitra)|buddhist,hindu,secular|sinhala|timeless|3|${K}pavitra
Priya|ප්‍රියා|female|ආදරණීය|Dear, beloved|buddhist,hindu,secular|tamil|timeless|2|${B}priya
Kavin|කවින්|male|සුන්දරත්වය (දෙමළ)|Beauty (Tamil)|hindu,secular|tamil|modern|2|https://dsal.uchicago.edu/cgi-bin/app/tamil-lex_query.py?qs=%E0%AE%95%E0%AE%B5%E0%AE%BF%E0%AE%A9%E0%AF%8D&searchhws=yes
Akash|ආකාශ්|male|අහස|Sky|hindu,secular|tamil|modern|2|${B}akash
Arjun|අර්ජුන්|male|දීප්තිමත් / සුදු; මහාභාරත චරිත නාමය|White, clear; Mahabharata character name|hindu|tamil|modern|2|${B}arjuna
Mohan|මෝහන්|male|ආකර්ෂණීය; ක්‍රිෂ්ණ නාමයක්|Charming; epithet of Krishna|hindu|tamil|traditional|2|${B}mohana
Mahesh|මහේෂ්|male|මහා ඊශ්වර; ශිව නාමයක්|Great lord; epithet of Shiva|hindu|tamil|traditional|2|${B}mahesha
Mukund|මුකුන්ද්|male|මුක්තිය දෙන්නා; විෂ්ණු නාමයක්|Giver of liberation; epithet of Vishnu|hindu|tamil|timeless|2|${K}mukunda
Manoj|මනෝජ්|male|මනසින් උපන්; කාම නාමයක්|Born of the mind; epithet of Kama|hindu|tamil|traditional|2|${B}manoja
Murugan|මුරුගන්|male|දෙමළ දෙවියෙකුගේ නාමය|Name of the Tamil god Murugan; associated with youth|hindu|tamil|traditional|3|${B}murugan
Malar|මලර්|female|මල (දෙමළ)|Flower (Tamil)|hindu,secular|tamil|modern|2|${B}malar/submitted
Iniya|ඉනියා|female|මිහිරි (දෙමළ)|Sweet (Tamil)|hindu,secular|tamil|modern|3|https://dt.madurai.io/%E0%AE%87%E0%AE%A9%E0%AF%8D
Nila|නිලා|female|සඳ (දෙමළ)|Moon (Tamil nila reading)|hindu,secular|tamil|modern|2|https://dt.madurai.io/%E0%AE%A8%E0%AE%BF%E0%AE%B2%E0%AE%BE
Ananya|අනන්‍යා|female|අසමසම|Unique, having no equivalent|hindu,secular|tamil|modern|3|${B}ananya/submitted
Matthew|මැතිව්|male|දෙවියන්ගේ ත්‍යාගය; බයිබල් නාමය|Gift of Yahweh; biblical name|christian|international|timeless|2|${B}matthew
Michael|මයිකල්|male|දෙවියන්ට සමාන කවරෙක්ද?; බයිබල් නාමය|Who is like God?; biblical name|christian|international|timeless|2|${B}michael
Mark|මාක්|male|මාර්ස් දෙවියාට සම්බන්ධ මූලය; සුභාරංචි කර්තෘ නාමය|From Marcus, linked to Mars; evangelist name|christian|international|traditional|1|${B}mark
Paul|පෝල්|male|කුඩා; බයිබල් නාමය|Small; biblical name|christian|international|traditional|1|${B}paul
Peter|පීටර්|male|ගල; බයිබල් නාමය|Stone; biblical name|christian|international|traditional|2|${B}peter
Noah|නෝවා|male|විවේකය; බයිබල් නාමය|Rest; biblical name|christian|international|modern|2|${B}noah-1
Daniel|ඩැනියෙල්|male|දෙවියන් මාගේ විනිශ්චයකරුය|God is my judge; biblical name|christian|international|modern|3|${B}daniel
Gabriel|ගාබ්‍රියෙල්|male|දෙවියන් මාගේ ශක්තියයි|God is my strong man; biblical name|christian|international|modern|3|${B}gabriel
Anna|ඇනා|female|කරුණාව; බයිබල් නාම රූපය|Grace; biblical name form|christian|international|modern|2|${B}anna
Sarah|සාරා|female|කුමරිය; බයිබල් නාමය|Princess; biblical name|christian,islamic|international|timeless|2|${B}sarah
Abigail|ඇබිගේල්|female|මාගේ පියා ප්‍රීතියයි|My father is joy; biblical name|christian|international|modern|3|${B}abigail
Muneer|මුනීර්|male|ආලෝකමත්|Luminous, shining (Arabic Munir)|islamic|arabic|modern|2|${B}munir
Malik|මලික්|male|රජු|King (Arabic)|islamic|arabic|modern|2|${B}malik-1
Mazin|මාසින්|male|වැසි වලාකුළ|Rain cloud (Arabic)|islamic|arabic|modern|2|${B}mazin
Amin|අමීන්|male|විශ්වාසවන්ත|Trustworthy (Arabic)|islamic|arabic|modern|2|${B}amin
Anas|අනස්|male|මිත්‍රශීලී බව|Friendliness (Arabic)|islamic|arabic|modern|2|${B}anas
Rayyan|රය්යාන්|male|හොඳින් දිය ලැබූ / සශ්‍රීක|Watered, luxuriant; Islamic association|islamic|arabic|modern|2|${B}rayyan
Samir|සමීර්|male|සන්ධ්‍යා කතාබහේ සගයා|Companion in evening conversation (Arabic reading)|islamic|arabic|modern|2|${B}samir-1
Salim|සලීම්|male|ආරක්ෂිත / නිරුපද්‍රිත|Safe, sound (Arabic)|islamic|arabic|timeless|2|${B}salim
Zayn|සේන්|male|සුන්දරත්වය|Beauty, grace (Arabic)|islamic|arabic|modern|1|${B}zayn
Amina|අමීනා|female|ආරක්ෂිත / විශ්වාසවන්ත|Safe, trustworthy (Arabic)|islamic|arabic|modern|3|${B}amina
Amira|අමීරා|female|කුමරිය / නායිකාව|Princess, commander (Arabic)|islamic|arabic|modern|3|${B}amira-1
Nura|නූරා|female|ආලෝකය|Light; feminine form of Nur|islamic|arabic|modern|2|${B}nura
Yasmin|යස්මින්|female|සමන්පිච්ච මල|Jasmine (Persian)|islamic,secular|arabic|modern|2|${B}yasmin
Ruchira|රුචිර|male|දීප්තිමත් / සුන්දර|Bright, beautiful (Sanskrit rucira)|buddhist,hindu,secular|sinhala|timeless|3|${K}rucira
Ravindu|රවිඳු|male|හිරු සහ සඳ යන මූල පද|Sun and moon (Ravi + indu compound reading)|buddhist,secular|sinhala|timeless|3|${K}ravIndu
Kavindu|කවිඳු|male|කවීන් අතර ප්‍රධානියා (කවි + ඉඳු)|Chief among poets (kavi + indu compound reading)|buddhist,secular|sinhala|modern|3|${K}kavIndra
Sahan|සහන්|male|ඉවසීම (සහනය මූලය)|Forbearance (Sinhala sahan root)|buddhist,secular|sinhala|modern|2|${M}forbearance
Sandun|සඳුන්|male|සඳුන්|Sandalwood|buddhist,secular|sinhala|timeless|2|${M}sandalwood
Chathura|චතුර|male|දක්ෂ / නිපුණ|Clever, skilful (Sanskrit catura)|buddhist,hindu,secular|sinhala|timeless|3|${K}catura
Aruna|අරුණ|male|අරුණෝදය|Dawn; reddish glow (lexical reading)|buddhist,hindu,secular|sinhala|traditional|3|${K}aruNa
Prasanna|ප්‍රසන්න|male|පැහැදිලි / සන්සුන්|Clear, bright, tranquil|buddhist,hindu,secular|sinhala|traditional|3|${B}prasanna
Pradeep|ප්‍රදීප්|male|ආලෝකය / පහන|Light, lamp|buddhist,hindu,secular|sinhala|traditional|2|${B}pradip
Pramod|ප්‍රමෝද්|male|ප්‍රීතිය|Joy|buddhist,hindu,secular|sinhala|traditional|2|${B}pramoda
Malani|මාලනී|female|මල් මාලා දරන්නිය|Garlanded; Sanskrit Malini variant|buddhist,hindu,secular|sinhala|traditional|3|${B}malini
Yamuna|යමුනා|female|යමුනා ගඟ / දෙවඟනගේ නාමය|Yamuna river and goddess name|hindu|tamil|traditional|3|${B}yamuna
Monica|මොනිකා|female|මූල අර්ථය අවිනිශ්චිත; සාන්තුවරියගේ නාමය|Etymology uncertain; saint's name|christian|international|traditional|3|${B}monica
`;
export const NAME_CATALOGUE: NameRecord[] = DATA.trim()
  .split("\n")
  .map((line) => {
    const [
      roman,
      sinhala,
      gender,
      meaningSi,
      meaningEn,
      religions,
      culture,
      era,
      syllables,
      source,
    ] = line.split("|");
    return {
      id: roman.toLowerCase(),
      roman,
      sinhala,
      gender: gender as NameRecord["gender"],
      meaningSi,
      meaningEn,
      religions: religions.split(",") as ReligionContext[],
      culture: culture as Culture,
      era: era as NameRecord["era"],
      syllables: Number(syllables),
      source,
      meaningStatus: "sourced",
    };
  });
// Modern forms are not assigned attractive invented meanings. Explicit opt-in review only.
const REVIEW = [
  [
    "Janeesh",
    "ජනීෂ්",
    "ජ",
    "User style example; Sanskrit/Pali derivation not established",
  ],
  [
    "Vidiyan",
    "විදියන්",
    "වි",
    "User style example; derivation not established",
  ],
  [
    "Mineth",
    "මිනෙත්",
    "මි",
    "Gem-eye interpretation in old dataset is not independently verified",
  ],
  [
    "Mihin",
    "මිහින්",
    "මි",
    "Modern usage form; full-name etymology not established",
  ],
  [
    "Minula",
    "මිනුල",
    "මි",
    "Modern usage form; full-name etymology not established",
  ],
  [
    "Mithum",
    "මිතුම්",
    "මි",
    "Do not infer loving-kindness merely from similar sounds",
  ],
  [
    "Pavith",
    "පවිත්",
    "ප",
    "Possible pavitra adaptation; confirm form and meaning with a linguist",
  ],
  ["Pinith", "පිනිත්", "පි", "Full-name etymology not established"],
  [
    "Pinsara",
    "පින්සර",
    "පි",
    "Merit/essence compound interpretation needs linguistic review",
  ],
  ["Pamith", "පමිත්", "ප", "Full-name etymology not established"],
  ["Pulith", "පුලිත්", "පු", "Full-name etymology not established"],
  [
    "Tishan",
    "ටිෂාන්",
    "ටි",
    "Old keen gloss unsupported; do not confuse retroflex ට with dental ත",
  ],
] as const;
export const REVIEW_NOTES = Object.fromEntries(
  REVIEW.map(([roman, , , note]) => [roman.toLowerCase(), note]),
);
for (const [roman, sinhala] of REVIEW)
  NAME_CATALOGUE.push({
    id: roman.toLowerCase(),
    roman,
    sinhala,
    gender: "male",
    meaningSi: "අර්ථය සත්‍යාපනය කර නැත — භාෂා විශේෂඥ සමාලෝචනය අවශ්‍යයි.",
    meaningEn: "Meaning unverified — linguistic review required.",
    religions: ["buddhist", "secular"],
    culture: "sinhala",
    era: "modern",
    syllables: 2,
    source: "editorial-review",
    meaningStatus: "review",
  });
// Explicit uncertainty is preserved, never relabelled verified.
for (const id of ["monica", "ravindu", "kavindu", "malani"]) {
  const n = NAME_CATALOGUE.find((n) => n.id === id)!;
  n.meaningStatus = "review";
  if (id !== "monica") {
    n.meaningSi = "පෙර දත්තයේ අර්ථ විවරණය තහවුරු කර නැත — සමාලෝචනය අවශ්‍යයි.";
    n.meaningEn =
      "Earlier meaning gloss unverified — linguistic review required.";
  }
}
export function allowedNames(
  letters: string[],
  gender: string,
  religion: ReligionContext = "buddhist",
  traditional = false,
  includeReview = false,
) {
  const context = religion === "unspecified" ? "buddhist" : religion;
  return NAME_CATALOGUE.filter(
    (n) =>
      (gender === "unspecified" ||
        gender === "unisex" ||
        n.gender === gender ||
        n.gender === "unisex") &&
      (context === "interfaith" || n.religions.includes(context)) &&
      (traditional || n.era !== "traditional") &&
      (includeReview || n.meaningStatus === "sourced") &&
      letters.some((l) => nameMatchesLetter(n.sinhala, n.roman, l)),
  );
}
