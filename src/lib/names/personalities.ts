/**
 * Naming-agent personalities + living-country styles.
 * Kendraya letters stay mandatory; culture only shapes form & meaning.
 * Safe for client import (no OpenAI / Node deps).
 */

export const INTERESTS = [
  { id: "education", si: "අධ්‍යාපනය / ඉගෙනුම", en: "Education & learning" },
  { id: "arts", si: "කලාව / සංගීතය", en: "Arts & music" },
  { id: "sports", si: "ක්‍රීඩාව", en: "Sports" },
  { id: "leadership", si: "නායකත්වය", en: "Leadership" },
  { id: "kindness", si: "දයාව / මෛත්‍රී", en: "Kindness & compassion" },
  { id: "courage", si: "ධෛර්යය", en: "Courage" },
  { id: "science", si: "විද්‍යාව / තාක්ෂණය", en: "Science & technology" },
  { id: "business", si: "ව්‍යාපාර / ධනය", en: "Business & prosperity" },
  { id: "spirituality", si: "ආධ්‍යාත්මිකත්වය", en: "Spirituality" },
  { id: "nature", si: "සොබාදහම", en: "Nature" },
] as const;

export type InterestId = (typeof INTERESTS)[number]["id"];

export type LivingCountry =
  | "lk"
  | "au"
  | "uk"
  | "us"
  | "ca"
  | "ae"
  | "sg"
  | "in"
  | "other";

export type NamingPersonalityId =
  | "athurudaya"
  | "diaspora"
  | "multicultural"
  | "meaning_weaver"
  | "family_harmony"
  | "sinhala_language"
  | "sinhala_literature"
  | "multi_religion";

export type ReligionContext =
  | "buddhist"
  | "hindu"
  | "christian"
  | "islamic"
  | "interfaith"
  | "secular"
  | "unspecified";

export const RELIGION_OPTIONS: Array<{
  id: ReligionContext;
  si: string;
  en: string;
}> = [
  { id: "unspecified", si: "සඳහන් නොකරයි", en: "Not specified" },
  { id: "buddhist", si: "බෞද්ධ / සිංහල", en: "Buddhist / Sinhala" },
  { id: "hindu", si: "හින්දු / දෙමළ", en: "Hindu / Tamil" },
  { id: "christian", si: "ක්‍රිස්තියානි / කතෝලික", en: "Christian / Catholic" },
  { id: "islamic", si: "මුස්ලිම්", en: "Muslim" },
  { id: "interfaith", si: "අන්තර් ආගමික", en: "Interfaith" },
  { id: "secular", si: "ආගම් නොබැඳි / නවීන", en: "Neutral / modern" },
];

export type NameLanguagePref = "si" | "en" | "bilingual";

export const NAME_LANGUAGE_OPTIONS: Array<{
  id: NameLanguagePref;
  si: string;
  en: string;
}> = [
  {
    id: "bilingual",
    si: "සිංහල + ඉංග්‍රීසි (දෙබස)",
    en: "Sinhala + English (bilingual)",
  },
  { id: "si", si: "සිංහල ප්‍රමුඛ", en: "Sinhala-first" },
  { id: "en", si: "ඉංග්‍රීසි / රෝමානු ප්‍රමුඛ", en: "English / roman-first" },
];

export const LIVING_COUNTRIES: Array<{
  id: LivingCountry;
  si: string;
  en: string;
  namingHint: string;
}> = [
  {
    id: "lk",
    si: "ශ්‍රී ලංකාව",
    en: "Sri Lanka",
    namingHint:
      "Prefer natural modern Sinhala given names used in Lanka schools and offices.",
  },
  {
    id: "au",
    si: "ඕස්ට්‍රේලියාව",
    en: "Australia",
    namingHint:
      "Easy English pronunciation for AU teachers/peers; keep phonetic start; Sinhala form optional beside roman.",
  },
  {
    id: "uk",
    si: "එක්සත් රාජධානිය",
    en: "United Kingdom",
    namingHint:
      "UK-friendly roman spelling; avoid hard consonants clusters; Sinhala script as cultural twin.",
  },
  {
    id: "us",
    si: "ඇමරිකා එක්සත් ජනපදය",
    en: "United States",
    namingHint:
      "US classroom-friendly roman names; short or familiar cadence; preserve chart syllable.",
  },
  {
    id: "ca",
    si: "කැනඩාව",
    en: "Canada",
    namingHint:
      "Multicultural CA context — clear roman form, respectful Sinhala twin.",
  },
  {
    id: "ae",
    si: "UAE / මැදපෙරදිග",
    en: "UAE / Middle East",
    namingHint:
      "International roman clarity for Gulf schools; avoid awkward English slang meanings.",
  },
  {
    id: "sg",
    si: "සිංගප්පූරුව",
    en: "Singapore",
    namingHint:
      "Cosmopolitan SG style — sleek roman + optional Sinhala; easy for multi-ethnic peers.",
  },
  {
    id: "in",
    si: "ඉන්දියාව",
    en: "India",
    namingHint:
      "Indic-friendly names that still match SL Kendraya letters; Sanskrit-leaning OK if modern.",
  },
  {
    id: "other",
    si: "වෙනත් රට",
    en: "Other country",
    namingHint:
      "International roman-first names with correct phonetic start; Sinhala form for home use.",
  },
];

export const NAMING_PERSONALITIES: Array<{
  id: NamingPersonalityId;
  si: string;
  en: string;
  role: string;
  systemExtra: string;
}> = [
  {
    id: "athurudaya",
    si: "සම්ප්‍රදායික ආතුරුදය",
    en: "Traditional Athurudaya",
    role: "classical SL Handahana namer + chart personality aligner",
    systemExtra:
      "Favour authentic Sinhala (and familiar Sanskritic-Sinhala) names used in Sri Lanka. Meaning must be auspicious. Primary letter first. Critically match each name to the HOROSCOPE PERSONA temperament and predicted personal behaviour (lagna + moon/nekatha) — the name should sound and mean like someone with that nature, without fatalistic claims.",
  },
  {
    id: "diaspora",
    si: "ප්‍රවාසී / විදේශ ජීවිතය",
    en: "Diaspora-friendly",
    role: "diaspora school & passport namer",
    systemExtra:
      "Optimise for the living country: easy roman pronunciation, short forms, nicknames OK. Keep first syllable locked to Kendraya letter. Provide Sinhala spelling that matches the sound.",
  },
  {
    id: "multicultural",
    si: "බහු සංස්කෘතික",
    en: "Multicultural bridge",
    role: "cross-culture name bridge",
    systemExtra:
      "Propose names that work in both Sinhala home culture and the living country. Dual forms (roman + sinhala). Avoid names that sound odd or have negative slang in the living country.",
  },
  {
    id: "meaning_weaver",
    si: "අර්ථ කේන්ද්‍රීය",
    en: "Meaning weaver",
    role: "meaning & aspiration specialist",
    systemExtra:
      "Prioritise parents' interests/hopes in the meaning. Still MUST start with allowed letters. Explain meaning clearly in SI+EN.",
  },
  {
    id: "family_harmony",
    si: "පවුල් ගැළපීම",
    en: "Family harmony",
    role: "sibling & parent name harmony",
    systemExtra:
      "Match cadence with mother/father/sibling names without duplicating sibling given names. Soft phonetic complement. Letter constraint absolute.",
  },
  {
    id: "sinhala_language",
    si: "සිංහල භාෂා විශේෂඥ",
    en: "Sinhala language expert",
    role: "Sinhala linguistics & phonology namer",
    systemExtra:
      "You are a Sinhala language expert. Prefer morphologically sound Sinhala (nispanna / tatsama used correctly), natural sandhi, pleasant syllable rhythm, and authentic modern Sinhala spelling. Avoid awkward hybrid romanisations. First+middle must flow when spoken as a Sinhala full given name. Letter constraint absolute.",
  },
  {
    id: "sinhala_literature",
    si: "සිංහල සාහිත්‍ය / ලේඛක",
    en: "Sinhala literature & writer",
    role: "literary Sinhala name craftsman",
    systemExtra:
      "You are a Sinhala literature expert and creative writer. Craft names with literary beauty, memorable cadence, and poetic but usable everyday forms. Draw aesthetic inspiration from classical & modern Sinhala literary taste WITHOUT copying copyrighted character names. Keep meanings auspicious and clear. Letter constraint absolute.",
  },
  {
    id: "multi_religion",
    si: "බහු ආගමික නාම විශේෂඥ",
    en: "Multi-religion naming expert",
    role: "Buddhist, Hindu, Christian, Islamic & interfaith name specialist",
    systemExtra:
      "You specialise in names across Buddhist, Hindu, Christian, and Islamic traditions (and respectful interfaith blends). Honour the family's stated religion context. Prefer meanings of virtue, light, wisdom, compassion. Never force a religious marker if the family is secular. For interfaith homes, choose bridge names that feel welcome in more than one tradition. Letter constraint absolute.",
  },
];

export function countryHint(id: LivingCountry): string {
  return (
    LIVING_COUNTRIES.find((c) => c.id === id)?.namingHint ??
    LIVING_COUNTRIES.find((c) => c.id === "other")!.namingHint
  );
}

export function personalityById(id: NamingPersonalityId) {
  return NAMING_PERSONALITIES.find((p) => p.id === id)!;
}
