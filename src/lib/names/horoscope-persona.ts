/**
 * Horoscope → personality / behaviour brief for Name Studio.
 * Used by every naming agent + the factor_align critic so names
 * suit the temperament the chart tends to describe (not fate).
 */

import { RASHI } from "@/lib/astrology/sinhala-names";

export type HoroscopePersonaBrief = {
  lagnaRashi: string;
  lagnaRashiSi: string;
  chandraRashi: string;
  chandraRashiSi: string;
  nekatha: string;
  nekathaSi: string;
  pada: number;
  lagnaLord: string;
  element: string;
  traitsEn: string[];
  traitsSi: string[];
  behaviourEn: string[];
  behaviourSi: string[];
  nameToneEn: string[];
  nameToneSi: string[];
  summaryEn: string;
  summarySi: string;
};

const RASHI_PERSONA: Record<
  string,
  {
    traitsEn: string[];
    traitsSi: string[];
    behaviourEn: string[];
    behaviourSi: string[];
    nameToneEn: string[];
    nameToneSi: string[];
  }
> = {
  Aries: {
    traitsEn: ["bold", "initiative", "warm courage"],
    traitsSi: ["ධෛර්ය", "මුලපිරීම", "උණුසුම් ධෛර්යය"],
    behaviourEn: ["acts first", "competitive spark", "protective of kin"],
    behaviourSi: ["ක්‍රියාශීලී", "තරඟකාරී බව", "පවුල රැකීම"],
    nameToneEn: ["bright", "strong but short", "energetic"],
    nameToneSi: ["දීප්තිමත්", "කෙටි ශක්තිමත්", "ජවසම්පන්න"],
  },
  Taurus: {
    traitsEn: ["steady", "sensual calm", "loyal"],
    traitsSi: ["ස්ථිර", "සන්සුන්", "විශ්වාසවන්ත"],
    behaviourEn: ["patient builder", "values comfort", "stubborn when pushed"],
    behaviourSi: ["ඉවසීම", "සුවපහසුව අගය කිරීම", "බලකිරීමේදී දැඩි"],
    nameToneEn: ["soft vowels", "earthy meaning", "memorable cadence"],
    nameToneSi: ["මෘදු ස්වර", "පෘථිවි අර්ථ", "මතක රැඳෙන රිද්මය"],
  },
  Gemini: {
    traitsEn: ["curious", "verbal", "adaptable"],
    traitsSi: ["කුතුහලය", "වාචික", "නම්‍යශීලී"],
    behaviourEn: ["learns fast", "social wit", "needs mental variety"],
    behaviourSi: ["ඉක්මන් ඉගෙනීම", "සමාජ බුද්ධිය", "මානසික විවිධත්වය"],
    nameToneEn: ["light rhythm", "easy to say", "modern"],
    nameToneSi: ["සැහැල්ලු රිද්මය", "කියන්න පහසු", "නවීන"],
  },
  Cancer: {
    traitsEn: ["nurturing", "intuitive", "home-centred"],
    traitsSi: ["පෝෂණීය", "සහජ බුද්ධිය", "ගෙදර කේන්ද්‍රීය"],
    behaviourEn: ["protective of family", "mood-sensitive", "loyal memory"],
    behaviourSi: ["පවුල රැකීම", "හැඟුම් සංවේදී", "මතක විශ්වාසය"],
    nameToneEn: ["gentle", "heart-meaning", "flowing syllables"],
    nameToneSi: ["මෘදු", "හෘද අර්ථ", "ගලා යන අකුරු"],
  },
  Leo: {
    traitsEn: ["radiant", "dignified", "creative pride"],
    traitsSi: ["දීප්තිමත්", "ගෞරවනීය", "නිර්මාණාත්මක අභිමානය"],
    behaviourEn: ["likes recognition", "generous lead", "dramatic flair"],
    behaviourSi: ["පිළිගැනීම කැමති", "උදාර නායකත්වය", "නාට්‍යමය බව"],
    nameToneEn: ["noble sound", "clear presence", "sunny meaning"],
    nameToneSi: ["උත්තුංග ශබ්දය", "පැහැදිලි පැවැත්ම", "සූර්ය අර්ථ"],
  },
  Virgo: {
    traitsEn: ["precise", "helpful", "analytical"],
    traitsSi: ["නිවැරදි", "උපකාරී", "විශ්ලේෂණාත්මක"],
    behaviourEn: ["service mindset", "detail care", "practical speech"],
    behaviourSi: ["සේවා මනස", "සියුම් සැලකිල්ල", "ප්‍රායෝගික කතාව"],
    nameToneEn: ["clean spelling", "modest elegance", "clear meaning"],
    nameToneSi: ["පිරිසිදු අකුරු", "සරල අලංකාරය", "පැහැදිලි අර්ථ"],
  },
  Libra: {
    traitsEn: ["harmonising", "fair", "aesthetic"],
    traitsSi: ["සමගිය", "සාධාරණ", "සෞන්දර්යාත්මක"],
    behaviourEn: ["diplomacy", "partner-oriented", "beauty-seeking"],
    behaviourSi: ["රාජ්‍යතාන්ත්‍රික", "සහකාර කේන්ද්‍රීය", "සුන්දරත්වය සොයයි"],
    nameToneEn: ["balanced syllables", "pleasant roman", "graceful"],
    nameToneSi: ["සමතුලිත අකුරු", "මනෝහර රෝමන්", "ශෝභන"],
  },
  Scorpio: {
    traitsEn: ["intense", "loyal depth", "transformative"],
    traitsSi: ["ගැඹුරු", "විශ්වාසී ගැඹුර", "පරිවර්තනීය"],
    behaviourEn: ["private strength", "focused will", "protective"],
    behaviourSi: ["පුද්ගලික ශක්තිය", "එකඟ කැමැත්ත", "ආරක්ෂක"],
    nameToneEn: ["strong consonants", "depth of meaning", "memorable"],
    nameToneSi: ["ශක්තිමත් ව්‍යංජන", "ගැඹුරු අර්ථ", "මතක රැඳෙන"],
  },
  Sagittarius: {
    traitsEn: ["expansive", "honest", "philosophical"],
    traitsSi: ["විස්තීර්ණ", "අවංක", "දාර්ශනික"],
    behaviourEn: ["seeker of meaning", "optimistic travel mind", "teacher spark"],
    behaviourSi: ["අර්ථ සොයන්නා", "ශුභවාදී ගමන් මනස", "ගුරු බව"],
    nameToneEn: ["open vowels", "wisdom/light meaning", "international-friendly"],
    nameToneSi: ["විවෘත ස්වර", "ප්‍රඥා/ආලෝක අර්ථ", "ජාත්‍යන්තරව පහසු"],
  },
  Capricorn: {
    traitsEn: ["disciplined", "ambitious", "responsible"],
    traitsSi: ["විනයගරුක", "උසස් අරමුණු", "වගකීම්සහගත"],
    behaviourEn: ["long-game planner", "quiet authority", "duty-first"],
    behaviourSi: ["දිගු කාල සැලසුම්", "නිහඬ අධිකාරය", "වගකීම මුල්"],
    nameToneEn: ["solid structure", "respectable", "not frivolous"],
    nameToneSi: ["දැඩි ව්‍යුහය", "ගෞරවනීය", "සැහැල්ලු නොවන"],
  },
  Aquarius: {
    traitsEn: ["inventive", "humanitarian", "independent"],
    traitsSi: ["නව්‍ය", "මානවහිතවාදී", "ස්වාධීන"],
    behaviourEn: ["future-minded", "friendly detachment", "group ideals"],
    behaviourSi: ["අනාගත මනස", "මිත්‍රශීලී නිදහස", "සමූහ පරමාදර්ශ"],
    nameToneEn: ["modern", "unique but pronounceable", "idea-led meaning"],
    nameToneSi: ["නවීන", "අනන්‍ය නමුත් උච්චාරණය පහසු", "අදහස් අර්ථ"],
  },
  Pisces: {
    traitsEn: ["compassionate", "imaginative", "empathic"],
    traitsSi: ["කරුණාවන්ත", "කල්පනාශීලී", "සහානුභූතික"],
    behaviourEn: ["artistic feel", "spiritual lean", "absorbent emotions"],
    behaviourSi: ["කලාත්මක හැඟීම", "ආධ්‍යාත්මික නැඹුරුව", "හැඟුම් අවශෝෂණය"],
    nameToneEn: ["fluid sound", "gentle meaning", "poetic but usable"],
    nameToneSi: ["ගලා යන ශබ්දය", "මෘදු අර්ථ", "කාව්‍යමය නමුත් භාවිතයට සුදුසු"],
  },
};

/** Moon nakshatra flavour (light touch — complements lagna). */
const NEKATHA_FLAVOUR: Record<
  string,
  { en: string; si: string; toneEn: string; toneSi: string }
> = {
  Ashwini: {
    en: "quick healer energy",
    si: "ඉක්මන් සුව කිරීමේ බලය",
    toneEn: "swift bright names",
    toneSi: "ඉක්මන් දීප්තිමත් නම්",
  },
  Bharani: {
    en: "creative restraint & rebirth",
    si: "නිර්මාණාත්මක සීමා හා නැවත ඉපදීම",
    toneEn: "strong but elegant",
    toneSi: "ශක්තිමත් නමුත් අලංකාර",
  },
  Krittika: {
    en: "cutting clarity & ambition",
    si: "පැහැදිලි කැපුම් හා අභිලාෂය",
    toneEn: "sharp clear forms",
    toneSi: "තියුණු පැහැදිලි ආකාර",
  },
  Rohini: {
    en: "growth, beauty, speech charm",
    si: "වර්ධනය, සුන්දරත්වය, කථා චමත්කාරය",
    toneEn: "beautiful flowing names",
    toneSi: "සුන්දර ගලා යන නම්",
  },
  Mrigashira: {
    en: "seeking mind, gentle chase",
    si: "සොයන මනස, මෘදු පසුපස යාම",
    toneEn: "curious light names",
    toneSi: "කුතුහලය ඇති සැහැල්ලු නම්",
  },
  Ardra: {
    en: "storm then insight",
    si: "කුණාටුවෙන් පසු තීක්ෂ්ණ බුද්ධිය",
    toneEn: "memorable intensity",
    toneSi: "මතක රැඳෙන තීව්‍රතාව",
  },
  Punarvasu: {
    en: "renewal & optimism",
    si: "නැවත ලැබීම හා ශුභවාදය",
    toneEn: "hopeful returning light",
    toneSi: "බලාපොරොත්තු සහිත ආලෝකය",
  },
  Pushya: {
    en: "nourishing virtue",
    si: "පෝෂණීය ගුණය",
    toneEn: "kind auspicious names",
    toneSi: "දයාබර මංගල නම්",
  },
  Ashlesha: {
    en: "keen intuition, wrap-around care",
    si: "තීක්ෂ්ණ අනුභූතිය, වටා රැකීම",
    toneEn: "subtle deep meanings",
    toneSi: "සියුම් ගැඹුරු අර්ථ",
  },
  Magha: {
    en: "ancestral dignity",
    si: "පෙළපත් ගෞරවය",
    toneEn: "regal respectful names",
    toneSi: "රාජකීය ගෞරවනීය නම්",
  },
  "Purva Phalguni": {
    en: "art & enjoyment",
    si: "කලාව හා භුක්තිය",
    toneEn: "graceful artistic",
    toneSi: "ශෝභන කලාත්මක",
  },
  "Uttara Phalguni": {
    en: "contracts & helpful alliances",
    si: "ගිවිසුම් හා උපකාරී සන්ධාන",
    toneEn: "reliable friendly",
    toneSi: "විශ්වාසදායක මිත්‍රශීලී",
  },
  Hasta: {
    en: "skilled hands, craft mind",
    si: "දක්ෂ අත්, ශිල්ප මනස",
    toneEn: "clever neat names",
    toneSi: "දක්ෂ පිරිසිදු නම්",
  },
  Chitra: {
    en: "design & brilliance",
    si: "නිර්මාණය හා දීප්තිය",
    toneEn: "sparkling distinctive",
    toneSi: "දිදුලන අනන්‍ය",
  },
  Swati: {
    en: "independent breeze",
    si: "ස්වාධීන සුළං",
    toneEn: "airy modern names",
    toneSi: "වාතීය නවීන නම්",
  },
  Vishakha: {
    en: "goal-focused determination",
    si: "ඉලක්ක කේන්ද්‍රීය නිශ්චය",
    toneEn: "purposeful strong",
    toneSi: "අරමුණු සහිත ශක්තිමත්",
  },
  Anuradha: {
    en: "devotion & friendship",
    si: "භක්තිය හා මිත්‍රත්වය",
    toneEn: "warm loyal meanings",
    toneSi: "උණුසුම් විශ්වාසී අර්ථ",
  },
  Jyeshtha: {
    en: "elder responsibility",
    si: "වැඩිහිටි වගකීම",
    toneEn: "protective dignified",
    toneSi: "ආරක්ෂක ගෞරවනීය",
  },
  Mula: {
    en: "root-seeking truth",
    si: "මුල් සොයන සත්‍යය",
    toneEn: "deep honest meanings",
    toneSi: "ගැඹුරු අවංක අර්ථ",
  },
  "Purva Ashadha": {
    en: "invincible optimism",
    si: "අපරාජිත ශුභවාදය",
    toneEn: "victorious bright",
    toneSi: "ජයග්‍රාහී දීප්තිමත්",
  },
  "Uttara Ashadha": {
    en: "lasting achievement",
    si: "ස්ථිර ජයග්‍රහණය",
    toneEn: "enduring respectable",
    toneSi: "ස්ථිර ගෞරවනීය",
  },
  Shravana: {
    en: "listening & learning",
    si: "ශ්‍රවණය හා ඉගෙනීම",
    toneEn: "wise clear speech names",
    toneSi: "ප්‍රඥාවන්ත පැහැදිලි නම්",
  },
  Dhanishta: {
    en: "rhythm & fame spark",
    si: "රිද්මය හා කීර්ති දීප්තිය",
    toneEn: "musical memorable",
    toneSi: "සංගීතමය මතක රැඳෙන",
  },
  Shatabhisha: {
    en: "healing & unconventional mind",
    si: "සුවය හා අසම්මත මනස",
    toneEn: "modern unique heal-tone",
    toneSi: "නවීන අනන්‍ය සුව නාදය",
  },
  "Purva Bhadrapada": {
    en: "fiery idealism",
    si: "ගිනිමය පරමාදර්ශවාදය",
    toneEn: "visionary bold",
    toneSi: "දර්ශනීය ධෛර්යවත්",
  },
  "Uttara Bhadrapada": {
    en: "deep wisdom & calm depth",
    si: "ගැඹුරු ප්‍රඥාව හා සන්සුන් ගැඹුර",
    toneEn: "serene meaningful",
    toneSi: "සන්සුන් අර්ථවත්",
  },
  Revati: {
    en: "nurturing completion",
    si: "පෝෂණීය සම්පූර්ණත්වය",
    toneEn: "gentle complete names",
    toneSi: "මෘදු සම්පූර්ණ නම්",
  },
};

export type PersonaChartSlice = {
  lagna: { rashi: string; rashiSinhala: string };
  chandra: {
    rashi: string;
    rashiSinhala: string;
    nekatha: string;
    nekathaSpoken?: string;
    pada: number;
  };
};

export function buildHoroscopePersona(
  chart: PersonaChartSlice,
): HoroscopePersonaBrief {
  const lagna = chart.lagna.rashi;
  const meta = RASHI[lagna];
  const persona = RASHI_PERSONA[lagna] ?? RASHI_PERSONA.Leo;
  const flavour =
    NEKATHA_FLAVOUR[chart.chandra.nekatha] ??
    ({
      en: "moon-mind colour",
      si: "චන්ද්‍ර මනස් වර්ණය",
      toneEn: "balanced modern names",
      toneSi: "සමබර නවීන නම්",
    } as const);

  const traitsEn = [...persona.traitsEn];
  const traitsSi = [...persona.traitsSi];
  const behaviourEn = [...persona.behaviourEn, flavour.en];
  const behaviourSi = [...persona.behaviourSi, flavour.si];
  const nameToneEn = [...persona.nameToneEn, flavour.toneEn];
  const nameToneSi = [...persona.nameToneSi, flavour.toneSi];

  const summaryEn = [
    `Lagna ${lagna} (${meta?.element ?? "—"} / lord ${meta?.lord ?? "—"}) suggests a temperament of ${traitsEn.join(", ")}.`,
    `Moon in ${chart.chandra.rashi} — ${chart.chandra.nekatha} pada ${chart.chandra.pada} colours behaviour: ${behaviourEn.slice(0, 3).join("; ")}.`,
    `Prefer name tones: ${nameToneEn.join("; ")}. Align meaning with virtue that fits this nature — not flattery or doom.`,
  ].join(" ");

  const summarySi = [
    `ලග්නය ${chart.lagna.rashiSinhala} (${meta?.element ?? "—"} / අධිපති ${meta?.lord ?? "—"}) — ගති: ${traitsSi.join(", ")}.`,
    `චන්ද්‍ර ${chart.chandra.rashiSinhala} — ${chart.chandra.nekathaSpoken ?? chart.chandra.nekatha} පාද ${chart.chandra.pada}: ${behaviourSi.slice(0, 3).join("; ")}.`,
    `නාම නාදය: ${nameToneSi.join("; ")}. අර්ථය මෙම ස්වභාවයට ගැලපෙන ගුණ සමඟ — අතිශයෝක්තිය හෝ භයානක කියවීම් නොවේ.`,
  ].join(" ");

  return {
    lagnaRashi: lagna,
    lagnaRashiSi: chart.lagna.rashiSinhala,
    chandraRashi: chart.chandra.rashi,
    chandraRashiSi: chart.chandra.rashiSinhala,
    nekatha: chart.chandra.nekatha,
    nekathaSi: chart.chandra.nekathaSpoken ?? chart.chandra.nekatha,
    pada: chart.chandra.pada,
    lagnaLord: meta?.lord ?? "",
    element: meta?.element ?? "",
    traitsEn,
    traitsSi,
    behaviourEn,
    behaviourSi,
    nameToneEn,
    nameToneSi,
    summaryEn,
    summarySi,
  };
}

/** Prompt block injected into every personality agent. */
export function horoscopePersonaPromptBlock(
  persona: HoroscopePersonaBrief | undefined,
): string {
  if (!persona) {
    return `HOROSCOPE PERSONA: not available (manual letters / no birth chart). Still score for readability, memorability, modern generation fit, meaning language, religion, and country.`;
  }
  return `HOROSCOPE PERSONA (from Kendraya — guide temperament, not fate):
${persona.summaryEn}

Traits: ${persona.traitsEn.join(", ")}
Behaviour lean: ${persona.behaviourEn.join("; ")}
Preferred name tone: ${persona.nameToneEn.join("; ")}

SI brief: ${persona.summarySi}

NAME MUST feel suitable for this kind of person — meaning and sound should echo the predicted temperament/behaviour in a respectful, modern way.`;
}
