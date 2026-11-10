export type Lang = "si" | "en";

/** UI default — Sinhala first, English toggle (user preference). */
export const DEFAULT_LANG: Lang = "si";

const dict = {
  brand: { en: "Handahana Studio", si: "හඳහන ස්ටූඩියෝ" },
  tagline: {
    en: "Complete Sri Lankan Kendraya & Handahana workspace for jyotishiya",
    si: "ශ්‍රී ලාංකික කේන්ද්‍ර සහ හඳහන — ජ්‍යොතිෂවේදීන් සඳහා සම්පූර්ණ වැඩබිම",
  },
  birthDetails: { en: "Birth details", si: "උපන් විස්තර" },
  name: { en: "Name (optional)", si: "නම (විකල්ප)" },
  date: { en: "Date", si: "දිනය" },
  time: { en: "Exact time", si: "නිශ්චිත වේලාව" },
  place: { en: "Place / hospital", si: "ස්ථානය / රෝහල" },
  placeSearch: { en: "Filter places", si: "ස්ථාන පෙරහන" },
  placeAddress: { en: "Address / place name", si: "ලිපිනය / ස්ථාන නාමය" },
  placeCustomCoords: {
    en: "Enter coordinates manually",
    si: "ඛණ්ඩාංක අතින් ඇතුළත් කරන්න",
  },
  latitude: { en: "Latitude (°N)", si: "අක්ෂාංශ (°N)" },
  longitude: { en: "Longitude (°E)", si: "දේශාංශ (°E)" },
  hospitals: { en: "Hospitals", si: "රෝහල්" },
  cities: { en: "Cities", si: "නගර" },
  towns: { en: "Towns / suburbs", si: "නගර / උපනගර" },
  gender: { en: "Gender", si: "ස්ත්‍රී / පුරුෂ" },
  male: { en: "Male", si: "පුරුෂ" },
  female: { en: "Female", si: "ස්ත්‍රී" },
  unspecified: { en: "Unspecified", si: "නොකියන ලද" },
  cast: { en: "Cast Kendraya", si: "කේන්ද්‍රය සාදන්න" },
  casting: { en: "Calculating…", si: "ගණනය වෙමින්…" },
  tabChart: { en: "Kendraya", si: "කේන්ද්‍රය" },
  tabNam: { en: "Nam Thebima", si: "නම් තැබීම" },
  tabPalapala: { en: "Palapala", si: "පලාපල" },
  tabPorondam: { en: "Porondam", si: "පොරොන්දම්" },
  tabMuhurta: { en: "Muhurta / Nakath", si: "මුහුර්ත / නැකත" },
  tabPanchanga: { en: "Panchanga", si: "පංචාංග" },
  tabDosha: { en: "Dosha / Yoga", si: "දෝෂ / යෝග" },
  tabExport: { en: "Export", si: "අපනයනය" },
  tabAgent: { en: "Athurudaya AI", si: "ආතුරුදය AI" },
  lagna: { en: "Lagna", si: "ලග්නය" },
  chandra: { en: "Moon / Chandra", si: "චන්ද්‍ර රාශිය" },
  nekatha: { en: "Janma Nekatha", si: "ජන්ම නැකත" },
  pada: { en: "Pada", si: "පාදය" },
  primaryLetters: { en: "Primary letters", si: "ප්‍රධාන අකුරු" },
  secondaryLetters: { en: "Subha-class letters", si: "සුභ කාණ්ඩ අකුරු" },
  especiallyGood: { en: "Especially good (∩ lagna/weekday)", si: "විශේෂයෙන් යෝග්‍ය" },
  avoidLetters: { en: "Avoid (asubha tara)", si: "වළකින්න (අසුභ තාරා)" },
  navagraha: { en: "Navagraha", si: "නවග්‍රහ" },
  dasha: { en: "Vimshottari Dasha", si: "විංශෝත්තරී දසා" },
  disclaimer: {
    en: "Shows tendencies and timing — not fixed fate. For medical or legal matters, consult qualified humans.",
    si: "මෙය ප්‍රවණතා සහ කාල නිර්ණය පෙන්වයි — නියත විපාක නොවේ. වෛද්‍ය/නීති කරුණු සඳහා සුදුසුකම් ඇති අයගෙන් උපදෙස් ගන්න.",
  },
  partner: { en: "Partner birth details", si: "සහකරුගේ උපන් විස්තර" },
  match: { en: "Match Porondam", si: "පොරොන්දම් ගළපන්න" },
  print: { en: "Print / PDF", si: "මුද්‍රණය / PDF" },
  printLayout: { en: "Print layout", si: "මුද්‍රණ ආකාරය" },
  printPaper: { en: "Paper size", si: "කඩදාසි ප්‍රමාණය" },
  features: { en: "Jyotishiya toolkit", si: "ජ්‍යොතිෂ මෙවලම්" },
  rahu: { en: "Rahu Kalaya", si: "රාහු කාලය" },
  subha: { en: "Subha windows", si: "සුභ වේලා" },
  error: { en: "Could not calculate", si: "ගණනය අසාර්ථකයි" },
} as const;

export type DictKey = keyof typeof dict;

export function t(lang: Lang, key: DictKey): string {
  return dict[key][lang];
}

export const FEATURE_MATRIX: Array<{ id: string; en: string; si: string }> = [
  { id: "kendraya", en: "Kendraya cast (Lahiri + Swiss Ephemeris)", si: "කේන්ද්‍ර සෑදීම (ලහිරි + Swiss)" },
  { id: "nam", en: "Nam Thebima multi-letter sets (pada + tara + lagna)", si: "නම් තැබීම — බහු අකුරු කට්ටල" },
  { id: "palapala", en: "Full Handahana palapala (12 bhava reading)", si: "සම්පූර්ණ හඳහන පලාපල" },
  { id: "dasha", en: "Vimshottari maha / antar dasha", si: "මහා / අතුරු දසා" },
  { id: "porondam", en: "Dasa Porondam matching", si: "දස පොරොන්දම් ගැළපීම" },
  {
    id: "muhurta",
    en: "Muhurta · event nakath · find dates · Rahu Kalaya",
    si: "මුහුර්ත · අවස්ථා නැකත · දින සෙවීම · රාහු කාලය",
  },
  { id: "panchanga", en: "Daily Panchanga (tithi, yoga, karana…)", si: "දෛනික පංචාංගය" },
  { id: "dosha", en: "Dosha / yoga flags (Kuja, Kalsarpa…)", si: "දෝෂ / යෝග ධජ" },
  { id: "navamsa", en: "Navamsa (D9) overview", si: "නවාංශ (D9) දළ විශ්ලේෂණය" },
  { id: "export", en: "View / Download PDF", si: "PDF බලන්න / බාගන්න" },
  {
    id: "places",
    en: "All SL cities, towns, hospitals + manual lat/lon",
    si: "සියලු නගර/රෝහල් + අතින් ඛණ්ඩාංක",
  },
  { id: "bilingual", en: "Sinhala + English throughout", si: "සිංහල + ඉංග්‍රීසි" },
  {
    id: "agent",
    en: "Athurudaya AI agent (calc tools + RAG)",
    si: "ආතුරුදය AI නියෝජිතයා (ගණනය + RAG)",
  },
  {
    id: "nameStudio",
    en: "Agentic Name Studio — multi-personality ~20 names + living country",
    si: "නාම චිත්‍රාගාරය — බහු-පෞරුෂ නියෝජිත · රට අනුව ~20 නම්",
  },
];
