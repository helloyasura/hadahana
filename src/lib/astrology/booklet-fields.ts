/**
 * Traditional Sri Lankan කේන්ද්‍ර පොත් fields
 * (ගණ / යෝනි / නාඩි / වෘක්ෂ / පක්ෂි / භූත / ගෝත්‍ර / වර්ණ / රජ්ජු …).
 */

import { RASHI } from "./sinhala-names";

export const SIGN_ORDER = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
] as const;

const GANA_SI: Record<"Deva" | "Manushya" | "Rakshasa", string> = {
  Deva: "දේව",
  Manushya: "මනුෂ්‍ය",
  Rakshasa: "රාක්ෂස",
};

const GANA: Array<"Deva" | "Manushya" | "Rakshasa"> = [
  "Deva",
  "Manushya",
  "Rakshasa",
  "Manushya",
  "Deva",
  "Manushya",
  "Deva",
  "Deva",
  "Rakshasa",
  "Rakshasa",
  "Manushya",
  "Manushya",
  "Deva",
  "Rakshasa",
  "Deva",
  "Rakshasa",
  "Deva",
  "Rakshasa",
  "Rakshasa",
  "Manushya",
  "Manushya",
  "Deva",
  "Rakshasa",
  "Rakshasa",
  "Manushya",
  "Manushya",
  "Deva",
];

const YONI_EN = [
  "Ashwa",
  "Gaja",
  "Mesha",
  "Sarpa",
  "Sarpa",
  "Shwani",
  "Marjara",
  "Mesha",
  "Marjara",
  "Mushaka",
  "Mushaka",
  "Gau",
  "Mahisha",
  "Vyaghra",
  "Mahisha",
  "Vyaghra",
  "Mriga",
  "Mriga",
  "Shwani",
  "Vanara",
  "Nakula",
  "Vanara",
  "Simha",
  "Ashwa",
  "Simha",
  "Gau",
  "Gaja",
];

const YONI_SI: Record<string, string> = {
  Ashwa: "අශ්වයා",
  Gaja: "ඇතා",
  Mesha: "බැටළුවා",
  Sarpa: "සර්පයා",
  Shwani: "බල්ලා",
  Marjara: "බළලා",
  Mushaka: "මීයා",
  Gau: "ගවයා",
  Mahisha: "මීහරකා",
  Vyaghra: "කොටියා",
  Mriga: "මුවා",
  Vanara: "වඳුරා",
  Nakula: "මුගටියා",
  Simha: "සිංහයා",
};

/** Nadi by nakshatra index 0–26 */
const NADI: Array<"Adi" | "Madhya" | "Antya"> = [
  "Adi",
  "Madhya",
  "Antya",
  "Adi",
  "Madhya",
  "Antya",
  "Adi",
  "Madhya",
  "Antya",
  "Adi",
  "Madhya",
  "Antya",
  "Adi",
  "Madhya",
  "Antya",
  "Adi",
  "Madhya",
  "Antya",
  "Adi",
  "Madhya",
  "Antya",
  "Adi",
  "Madhya",
  "Antya",
  "Adi",
  "Madhya",
  "Antya",
];

const NADI_SI = { Adi: "ආදි", Madhya: "මධ්‍ය", Antya: "අන්ත්‍ය" };

/** Simplified classical attribute rows used on SL booklet pages. */
const ATTR: Array<{
  vruksha: string;
  pakshi: string;
  bhuta: string;
  gothra: string;
  varna: string;
  linga: string;
  rajju: string;
}> = [
  { vruksha: "කුක්කුට", pakshi: "වායෝ", bhuta: "පෘථිවි", gothra: "මරීචි", varna: "ක්ෂත්‍රිය", linga: "නපුංසක", rajju: "පාද" },
  { vruksha: "අඹ", pakshi: "ගාන්ධාර", bhuta: "පෘථිවි", gothra: "අත්‍රි", varna: "ම්ලේච්ඡ", linga: "ස්ත්‍රී", rajju: "කටි" },
  { vruksha: "උක්", pakshi: "පෘථිවි", bhuta: "තේජෝ", gothra: "අංගිරස", varna: "බ්‍රාහ්මණ", linga: "පුරුෂ", rajju: "නාභි" },
  { vruksha: "පළොල්", pakshi: "ජල", bhuta: "පෘථිවි", gothra: "පුලස්ත්‍ය", varna: "ශූද්‍ර", linga: "පුරුෂ", rajju: "කටි" },
  { vruksha: "කොහොඹ", pakshi: "ආකාශ", bhuta: "පෘථිවි", gothra: "පුලහ", varna: "සේවක", linga: "නපුංසක", rajju: "ශිරෝ" },
  { vruksha: "කරඬ", pakshi: "ජල", bhuta: "ජල", gothra: "ක්‍රතු", varna: "ම්ලේච්ඡ", linga: "ස්ත්‍රී", rajju: "කටි" },
  { vruksha: "වැල්", pakshi: "වායෝ", bhuta: "ජල", gothra: "වසිෂ්ඨ", varna: "වෛශ්‍ය", linga: "පුරුෂ", rajju: "පාද" },
  { vruksha: "අත්තික්කා", pakshi: "ගාන්ධාර", bhuta: "ජල", gothra: "භෘගු", varna: "ක්ෂත්‍රිය", linga: "පුරුෂ", rajju: "කටි" },
  { vruksha: "නුග", pakshi: "පෘථිවි", bhuta: "ජල", gothra: "මරීචි", varna: "ම්ලේච්ඡ", linga: "ස්ත්‍රී", rajju: "නාභි" },
  { vruksha: "වට", pakshi: "ආකාශ", bhuta: "ආකාශ", gothra: "අත්‍රි", varna: "ශූද්‍ර", linga: "පුරුෂ", rajju: "ශිරෝ" },
  { vruksha: "පළොල්", pakshi: "ජල", bhuta: "ආකාශ", gothra: "අංගිරස", varna: "බ්‍රාහ්මණ", linga: "ස්ත්‍රී", rajju: "කටි" },
  { vruksha: "නා", pakshi: "වායෝ", bhuta: "ආකාශ", gothra: "පුලස්ත්‍ය", varna: "ක්ෂත්‍රිය", linga: "පුරුෂ", rajju: "පාද" },
  { vruksha: "ඇඹිල්ල", pakshi: "ගාන්ධාර", bhuta: "වායු", gothra: "පුලහ", varna: "වෛශ්‍ය", linga: "පුරුෂ", rajju: "කටි" },
  { vruksha: "කොස්", pakshi: "පෘථිවි", bhuta: "වායු", gothra: "ක්‍රතු", varna: "සේවක", linga: "නපුංසක", rajju: "නාභි" },
  { vruksha: "අරළු", pakshi: "ආකාශ", bhuta: "වායු", gothra: "වසිෂ්ඨ", varna: "ම්ලේච්ඡ", linga: "ස්ත්‍රී", rajju: "කටි" },
  { vruksha: "නෙල්ලි", pakshi: "ජල", bhuta: "තේජෝ", gothra: "භෘගු", varna: "ම්ලේච්ඡ", linga: "පුරුෂ", rajju: "පාද" },
  { vruksha: "බක්මී", pakshi: "වායෝ", bhuta: "තේජෝ", gothra: "මරීචි", varna: "ම්ලේච්ඡ", linga: "පුරුෂ", rajju: "කටි" },
  { vruksha: "කරඬ", pakshi: "ගාන්ධාර", bhuta: "තේජෝ", gothra: "අත්‍රි", varna: "සේවක", linga: "නපුංසක", rajju: "ශිරෝ" },
  { vruksha: "නාග", pakshi: "පෘථිවි", bhuta: "වායු", gothra: "අංගිරස", varna: "ම්ලේච්ඡ", linga: "ස්ත්‍රී", rajju: "කටි" },
  { vruksha: "වැල්", pakshi: "ආකාශ", bhuta: "වායු", gothra: "පුලස්ත්‍ය", varna: "බ්‍රාහ්මණ", linga: "පුරුෂ", rajju: "පාද" },
  { vruksha: "පනා", pakshi: "ජල", bhuta: "වායු", gothra: "පුලහ", varna: "ක්ෂත්‍රිය", linga: "පුරුෂ", rajju: "නාභි" },
  { vruksha: "කහට", pakshi: "වායෝ", bhuta: "ආකාශ", gothra: "ක්‍රතු", varna: "ම්ලේච්ඡ", linga: "නපුංසක", rajju: "කටි" },
  { vruksha: "කදුරු", pakshi: "ගාන්ධාර", bhuta: "ආකාශ", gothra: "වසිෂ්ඨ", varna: "ශූද්‍ර", linga: "ස්ත්‍රී", rajju: "ශිරෝ" },
  { vruksha: "කදුරු", pakshi: "පෘථිවි", bhuta: "ආකාශ", gothra: "භෘගු", varna: "ම්ලේච්ඡ", linga: "පුරුෂ", rajju: "කටි" },
  { vruksha: "අත්තික්කා", pakshi: "ආකාශ", bhuta: "පෘථිවි", gothra: "මරීචි", varna: "බ්‍රාහ්මණ", linga: "පුරුෂ", rajju: "පාද" },
  { vruksha: "කරඬ", pakshi: "ජල", bhuta: "පෘථිවි", gothra: "අත්‍රි", varna: "ක්ෂත්‍රිය", linga: "ස්ත්‍රී", rajju: "නාභි" },
  { vruksha: "මදුරු", pakshi: "වායෝ", bhuta: "පෘථිවි", gothra: "අංගිරස", varna: "ශූද්‍ර", linga: "පුරුෂ", rajju: "කටි" },
];

const LUNAR_MONTH_SI = [
  "බක්",
  "වෙසක්",
  "පොසොන්",
  "ඇසල",
  "නිකිණි",
  "බිනර",
  "වප්",
  "ඉල්",
  "උඳුවප්",
  "දුරුතු",
  "නවම්",
  "මැදින්",
];

const RITU_BY_SIGN = [
  "වසන්ත",
  "වසන්ත",
  "ග්‍රීෂ්ම",
  "ග්‍රීෂ්ම",
  "වර්ෂා",
  "වර්ෂා",
  "ශරත්",
  "ශරත්",
  "හේමන්ත",
  "හේමන්ත",
  "ශිශිර",
  "ශිශිර",
];

const WEEKDAY_SHORT = [
  "රවි",
  "සඳු",
  "කුජ",
  "බුධ",
  "ගුරු",
  "ශුක්‍ර",
  "ශනි",
];

const PADA_SI = ["එක", "දෙක", "තුන", "හතර"];

export function signIndex(name: string): number {
  const i = SIGN_ORDER.indexOf(name as (typeof SIGN_ORDER)[number]);
  return i >= 0 ? i : 0;
}

export function shakaYear(ceYear: number): number {
  return ceYear - 78;
}

export function ayanaSi(sunLon: number): string {
  const x = ((sunLon % 360) + 360) % 360;
  // Uttarayana roughly Capricorn→Cancer (270–90), else Dakshinayana
  return x >= 270 || x < 90 ? "උත්තරායනය" : "දක්ෂිණායනය";
}

export function rituSi(sunSignIdx: number): string {
  return RITU_BY_SIGN[((sunSignIdx % 12) + 12) % 12];
}

export function lunarMonthSi(moonLon: number): string {
  // Approximate SL lunar month from moon sign (classical almanacs differ)
  const idx = Math.floor((((moonLon % 360) + 360) % 360) / 30);
  return LUNAR_MONTH_SI[idx];
}

export function weekdayShortSi(jsDay: number): string {
  return WEEKDAY_SHORT[((jsDay % 7) + 7) % 7];
}

export function padaWord(pada: number): string {
  const i = Math.min(4, Math.max(1, pada)) - 1;
  return PADA_SI[i];
}

export function nakshatraBookletAttrs(index1to27: number) {
  const i = ((index1to27 - 1) % 27 + 27) % 27;
  const gana = GANA[i];
  const yoniEn = YONI_EN[i];
  const nadi = NADI[i];
  const a = ATTR[i];
  return {
    ganaSi: GANA_SI[gana],
    yoniSi: YONI_SI[yoniEn] ?? yoniEn,
    nadiSi: NADI_SI[nadi],
    vrukshaSi: a.vruksha,
    pakshiSi: a.pakshi,
    bhutaSi: a.bhuta,
    gothraSi: a.gothra,
    varnaSi: a.varna,
    lingaSi: a.linga,
    rajjuSi: a.rajju,
  };
}

export function splitDms(dms: string): {
  bhaga: string;
  kala: string;
  vikala: string;
} {
  const m = dms.match(
    /(\d+)\s*°\s*(\d+)\s*['′]\s*([\d.]+)\s*["″]?/,
  );
  if (!m) return { bhaga: "—", kala: "—", vikala: "—" };
  return { bhaga: m[1], kala: m[2], vikala: Number(m[3]).toFixed(0) };
}

export function lonParts(lon: number): {
  bhaga: number;
  kala: number;
  vikala: number;
} {
  const inSign = (((lon % 360) + 360) % 360) % 30;
  const bhaga = Math.floor(inSign);
  const mf = (inSign - bhaga) * 60;
  const kala = Math.floor(mf);
  const vikala = Math.round((mf - kala) * 60);
  return { bhaga, kala, vikala };
}

export function horaDivision(lon: number): { signSi: string; lordSi: string } {
  const sign = Math.floor((((lon % 360) + 360) % 360) / 30);
  const deg = (((lon % 360) + 360) % 360) % 30;
  const odd = sign % 2 === 0; // Aries=0 odd in 1-based
  const firstSun = odd; // odd signs: first 15° Sun
  const sunHalf = deg < 15;
  const lord =
    (firstSun && sunHalf) || (!firstSun && !sunHalf) ? "Sun" : "Moon";
  const horaSign = lord === "Sun" ? sign : (sign + 1) % 12; // display lagna sign usually
  void horaSign;
  return {
    signSi: RASHI[SIGN_ORDER[sign]]?.sinhala ?? SIGN_ORDER[sign],
    lordSi: lord === "Sun" ? "රවි" : "චන්ද්‍ර",
  };
}

export function drekkanaDivision(lon: number): {
  signSi: string;
  lordSi: string;
} {
  const sign = Math.floor((((lon % 360) + 360) % 360) / 30);
  const deg = (((lon % 360) + 360) % 360) % 30;
  const third = Math.min(2, Math.floor(deg / 10));
  const drekSign = (sign + third * 4) % 12;
  const lord = RASHI[SIGN_ORDER[drekSign]]?.lord ?? "—";
  const lordSi =
    {
      Sun: "රවි",
      Moon: "චන්ද්‍ර",
      Mars: "කුජ",
      Mercury: "බුධ",
      Jupiter: "ගුරු",
      Venus: "ශුක්‍ර",
      Saturn: "ශනි",
    }[lord] ?? lord;
  return {
    signSi: RASHI[SIGN_ORDER[drekSign]]?.sinhala ?? SIGN_ORDER[drekSign],
    lordSi,
  };
}

export function navamsaDivision(lon: number): {
  signSi: string;
  lordSi: string;
  signIndex: number;
} {
  const sign = Math.floor((((lon % 360) + 360) % 360) / 30);
  const degInSign = (((lon % 360) + 360) % 360) % 30;
  const pada = Math.min(8, Math.floor(degInSign / (30 / 9)));
  const movable = new Set([0, 3, 6, 9]);
  const fixed = new Set([1, 4, 7, 10]);
  let start: number;
  if (movable.has(sign)) start = sign;
  else if (fixed.has(sign)) start = (sign + 8) % 12;
  else start = (sign + 4) % 12;
  const idx = (start + pada) % 12;
  const lord = RASHI[SIGN_ORDER[idx]]?.lord ?? "—";
  const lordSi =
    {
      Sun: "රවි",
      Moon: "චන්ද්‍ර",
      Mars: "කුජ",
      Mercury: "බුධ",
      Jupiter: "ගුරු",
      Venus: "ශුක්‍ර",
      Saturn: "ශනි",
    }[lord] ?? lord;
  return {
    signIndex: idx,
    signSi: RASHI[SIGN_ORDER[idx]]?.sinhala ?? SIGN_ORDER[idx],
    lordSi,
  };
}

export function dwadashamsaDivision(lon: number): {
  signSi: string;
  lordSi: string;
} {
  const sign = Math.floor((((lon % 360) + 360) % 360) / 30);
  const deg = (((lon % 360) + 360) % 360) % 30;
  const part = Math.min(11, Math.floor(deg / 2.5));
  const idx = (sign + part) % 12;
  const lord = RASHI[SIGN_ORDER[idx]]?.lord ?? "—";
  const lordSi =
    {
      Sun: "රවි",
      Moon: "චන්ද්‍ර",
      Mars: "කුජ",
      Mercury: "බුධ",
      Jupiter: "ගුරු",
      Venus: "ශුක්‍ර",
      Saturn: "ශනි",
    }[lord] ?? lord;
  return {
    signSi: RASHI[SIGN_ORDER[idx]]?.sinhala ?? SIGN_ORDER[idx],
    lordSi,
  };
}

export function trimshamsaDivision(lon: number): { signSi: string } {
  const sign = Math.floor((((lon % 360) + 360) % 360) / 30);
  const deg = (((lon % 360) + 360) % 360) % 30;
  const odd = sign % 2 === 0;
  // Parashara odd: 0-5 Mars, 5-10 Sat, 10-18 Jup, 18-25 Mer, 25-30 Venus
  // even: reverse Venus…Mars
  let lordSignOffset: number;
  if (odd) {
    if (deg < 5) lordSignOffset = 0; // Mars → Aries-like mapping use Mars signs
    else if (deg < 10) lordSignOffset = 9; // Saturn
    else if (deg < 18) lordSignOffset = 8; // Jupiter
    else if (deg < 25) lordSignOffset = 2; // Mercury
    else lordSignOffset = 1; // Venus
  } else {
    if (deg < 5) lordSignOffset = 1;
    else if (deg < 12) lordSignOffset = 2;
    else if (deg < 20) lordSignOffset = 8;
    else if (deg < 25) lordSignOffset = 9;
    else lordSignOffset = 0;
  }
  // Show trimshamsa as the lord's primary sign for booklet brevity
  const idx = lordSignOffset;
  return { signSi: RASHI[SIGN_ORDER[idx]]?.sinhala ?? SIGN_ORDER[idx] };
}

/** SL-common exaltation / debilitation / own-sign by rashi index (Mesha=0). */
const BALAYA_EXALT: Record<string, number> = {
  Sun: 0,
  Moon: 1,
  Mars: 9,
  Mercury: 5,
  Jupiter: 3,
  Venus: 11,
  Saturn: 6,
  Rahu: 1,
  Ketu: 7,
};
const BALAYA_DEB: Record<string, number> = {
  Sun: 6,
  Moon: 7,
  Mars: 3,
  Mercury: 11,
  Jupiter: 9,
  Venus: 5,
  Saturn: 0,
  Rahu: 7,
  Ketu: 1,
};
const BALAYA_OWN: Record<string, number[]> = {
  Sun: [4],
  Moon: [3],
  Mars: [0, 7],
  Mercury: [2, 5],
  Jupiter: [8, 11],
  Venus: [1, 6],
  Saturn: [9, 10],
};

const RASHI_IDX: Record<string, number> = {
  Aries: 0,
  Taurus: 1,
  Gemini: 2,
  Cancer: 3,
  Leo: 4,
  Virgo: 5,
  Libra: 6,
  Scorpio: 7,
  Sagittarius: 8,
  Capricorn: 9,
  Aquarius: 10,
  Pisces: 11,
};

export function grahaBalayaSi(p: {
  name?: string;
  sign?: string;
  exalted: boolean;
  debilitated: boolean;
  own_sign: boolean;
  moolatrikona?: boolean;
}): string {
  const idx =
    p.sign != null ? (RASHI_IDX[p.sign] ?? -1) : -1;
  const name = p.name ?? "";
  const exalted = p.exalted || (idx >= 0 && BALAYA_EXALT[name] === idx);
  const debilitated =
    p.debilitated || (idx >= 0 && BALAYA_DEB[name] === idx);
  const own =
    p.own_sign || (idx >= 0 && (BALAYA_OWN[name] ?? []).includes(idx));
  if (exalted) return "උච්ච";
  if (debilitated) return "නීච";
  if (p.moolatrikona) return "මූලත්‍රිකෝණ";
  if (own) return "ස්වක්ෂේත්‍ර";
  return "සම";
}

export function grahaGathiSi(retrograde: boolean): string {
  return retrograde ? "වක්‍ර / නිවෘත" : "—";
}

export function genderBookletSi(
  gender?: "male" | "female" | "unspecified",
): { roleSi: string; genderSi: string } {
  if (gender === "female")
    return { roleSi: "කුමරිය", genderSi: "ස්ත්‍රී" };
  if (gender === "male") return { roleSi: "කුමරු", genderSi: "පුරුෂ" };
  return { roleSi: "දරුවා", genderSi: "—" };
}

export function formatIshta(
  sunriseIso: string | undefined,
  birthIso: string,
): { hours: string; minutes: string; seconds: string } {
  if (!sunriseIso) return { hours: "—", minutes: "—", seconds: "—" };
  const ms = new Date(birthIso).getTime() - new Date(sunriseIso).getTime();
  // The caller must supply the most recent sunrise, not a future one.
  if (!Number.isFinite(ms) || ms < 0) return { hours: "—", minutes: "—", seconds: "—" };
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return {
    hours: String(h).padStart(2, "0"),
    minutes: String(m).padStart(2, "0"),
    seconds: String(s).padStart(2, "0"),
  };
}

export function amPmSi(timeHm: string): string {
  const [hh, mm] = timeHm.split(":").map(Number);
  if (Number.isNaN(hh)) return timeHm;
  if (hh < 12) return `පෙ.ව. ${hh}.${String(mm ?? 0).padStart(2, "0")}`;
  if (hh === 12) return `ප.ව. 12.${String(mm ?? 0).padStart(2, "0")}`;
  return `ප.ව. ${hh - 12}.${String(mm ?? 0).padStart(2, "0")}`;
}
