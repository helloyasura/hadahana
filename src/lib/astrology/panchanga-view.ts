import type { getPanchanga } from "./panchanga";
import type { Lang } from "../i18n";
export type PanchangaData = Awaited<ReturnType<typeof getPanchanga>>;
export type AlmanacRow = { label: string; value: string; detail?: string };
const glossary: Record<string, string> = {};
function words(en: string, si: string) { en.split("|").forEach((word, i) => { glossary[word] = si.split("|")[i]; }); }
words("Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday", "ඉරිදා|සඳුදා|අඟහරුවාදා|බදාදා|බ්‍රහස්පතින්දා|සිකුරාදා|සෙනසුරාදා");
words("Pratipada|Dwitiya|Tritiya|Chaturthi|Panchami|Shashthi|Saptami|Ashtami|Navami|Dashami|Ekadashi|Dwadashi|Trayodashi|Chaturdashi|Purnima|Amavasya", "පෑළවිය|දියවක|තියවක|ජලවක|විසේනිය|සැටවක|සතවක|අටවක|නවවක|දසවක|එකොළොස්වක|දොළොස්වක|තෙළෙස්වක|තුදුස්වක|පසළොස්වක|අමාවක");
words("Ashwini|Bharani|Krittika|Rohini|Mrigashira|Ardra|Punarvasu|Pushya|Ashlesha|Magha|Purva Phalguni|Uttara Phalguni|Hasta|Chitra|Swati|Vishakha|Anuradha|Jyeshtha|Mula|Purva Ashadha|Uttara Ashadha|Shravana|Dhanishta|Shatabhisha|Purva Bhadrapada|Uttara Bhadrapada|Revati", "අස්විද|බෙරණ|කැති|රෙහෙණ|මුවසිරස|අද|පුනාවස|පුෂ|අස්ලිස|මා|පුවපල්|උත්‍රපල්|හත|සිත|සා|විසා|අනුර|දෙට|මුල|පුවසල|උත්‍රසල|සුවණ|දෙනට|සියාවස|පුවපුටුප|උත්‍රපුටුප|රේවතී");
words("Vishkumbha|Priti|Ayushman|Saubhagya|Shobhana|Atiganda|Sukarma|Dhriti|Shula|Ganda|Vriddhi|Dhruva|Vyaghata|Harshana|Vajra|Siddhi|Vyatipata|Variyana|Parigha|Shiva|Siddha|Sadhya|Shubha|Shukla|Brahma|Indra|Vaidhriti", "විෂ්කුම්භ|ප්‍රීති|ආයුෂ්මන්|සෞභාග්‍ය|ශෝභන|අතිගණ්ඩ|සුකර්ම|ධෘති|ශූල|ගණ්ඩ|වෘද්ධි|ධ්‍රුව|ව්‍යාඝාත|හර්ෂණ|වජ්‍ර|සිද්ධි|ව්‍යතීපාත|වරියාන|පරිඝ|ශිව|සිද්ධ|සාධ්‍ය|ශුභ|ශුක්ල|බ්‍රහ්ම|ඉන්ද්‍ර|වෛධෘති");
words("Bava|Balava|Kaulava|Taitila|Garaja|Vanija|Vishti|Shakuni|Chatushpada|Naga|Kimstughna|Shukla Paksha|Krishna Paksha", "බව|බාලව|කෞලව|තෛතිල|ගරජ|වණිජ|විෂ්ටි|ශකුනි|චතුෂ්පාද|නාග|කිංස්තුඝ්න|ශුක්ල පක්ෂය|කෘෂ්ණ පක්ෂය");
function name(value: unknown, lang: Lang) { return typeof value === "string" ? (lang === "si" ? glossary[value] || value : value) : "—"; }
function record(value: unknown): Record<string, unknown> { return value && typeof value === "object" ? value as Record<string, unknown> : {}; }
function localEnd(value: unknown, timezone: string) {
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value))) return "";
  // Include the local date: an end may be on the following day, not this calendar day.
  return new Intl.DateTimeFormat("en-GB", { timeZone: timezone, day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(value));
}
export function panchangaRows(data: PanchangaData, lang: Lang) {
  const si = lang === "si";
  const p = record(data.panchang);
  const limbs: AlmanacRow[] = [{ label: si ? "වාරය / Weekday" : "Weekday / Vara", value: name(record(data.vara).english, lang) }];
  for (const [key, en, sinhala] of [["tithi", "Tithi", "තිථිය"], ["nakshatra", "Nakshatra", "නැකත"], ["yoga", "Yoga", "යෝගය"], ["karana", "Karana", "කරණය"]]) {
    const limb = record(p[key]); const end = localEnd(limb.ends_at, data.timezone);
    limbs.push({ label: si ? `${sinhala} / ${en}` : en, value: name(limb.name, lang), detail: end ? `${si ? "අවසානය" : "Ends"}: ${end}` : undefined });
  }
  if (p.paksha) limbs.push({ label: si ? "පක්ෂය / Paksha" : "Paksha", value: name(p.paksha, lang) });
  const sun: AlmanacRow[] = [
    { label: si ? "සූර්යෝදය / Sunrise" : "Sunrise", value: data.sunriseSunset.sunriseLocal || "—" },
    { label: si ? "සූර්යාස්තය / Sunset" : "Sunset", value: data.sunriseSunset.sunsetLocal || "—" },
  ];
  const periods: AlmanacRow[] = ([
    [si ? "රාහු කාලය / Rahu Kalaya" : "Rahu Kalaya", data.inauspiciousLocal.rahuKalaya],
    [si ? "යමගණ්ඩය / Yamaganda" : "Yamaganda", data.inauspiciousLocal.yamaganda],
    [si ? "ගුලික කාලය / Gulika" : "Gulika", data.inauspiciousLocal.gulika],
  ] as const).map(([label, period]) => ({ label, value: period?.start && period?.end ? `${period.start} – ${period.end}` : "—" }));
  return { limbs, sun, periods };
}
