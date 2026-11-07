import type { castKendraya } from "./kendraya";
import { BHAVA } from "./sinhala-names";

type Chart = Awaited<ReturnType<typeof castKendraya>>;

/**
 * Structured Handahana palapala scaffold — 12-bhava reading outline
 * for athurudaya review (not auto-fated narrative).
 */
export function buildPalapala(chart: Chart) {
  const houses = Array.from({ length: 12 }, (_, i) => {
    const h = i + 1;
    const meta = BHAVA[h];
    const occupants = chart.navagraha.filter((g) => g.bhava === h);
    return {
      bhava: h,
      sanskrit: meta?.sanskrit ?? `Bhava ${h}`,
      sinhala: meta?.sinhala ?? "",
      themes: meta?.themes ?? "",
      occupants: occupants.map((g) => ({
        graha: g.graha,
        grahaSinhala: g.grahaSinhala,
        rashi: g.rashi,
        rashiSinhala: g.rashiSinhala,
        nekatha: g.nekathaSpoken,
        pada: g.pada,
        dignity: [
          g.exalted ? "exalted" : null,
          g.debilitated ? "debilitated" : null,
          g.ownSign ? "own" : null,
          g.retrograde ? "retrograde" : null,
          g.combust ? "combust" : null,
          g.vargottama ? "vargottama" : null,
        ].filter(Boolean),
      })),
      empty: occupants.length === 0,
      readingHintsEn: [
        occupants.length
          ? `${occupants.map((o) => o.graha).join(", ")} in house ${h} colour this life area.`
          : `House ${h} empty — look to its lord and aspects.`,
        meta?.themes ? `Themes: ${meta.themes}.` : "",
      ].filter(Boolean),
      readingHintsSi: [
        occupants.length
          ? `${h} වන භාවේ ${occupants.map((o) => o.grahaSinhala).join(", ")}.`
          : `${h} වන භාවය හිස් — අධිපති සහ දෘෂ්ටි බලන්න.`,
        meta?.sinhala ? `තේමා: ${meta.themes}.` : "",
      ].filter(Boolean),
    };
  });

  const strengthNotes = chart.navagraha
    .filter((g) => g.exalted || g.debilitated || g.ownSign || g.vargottama)
    .map((g) => ({
      graha: g.graha,
      grahaSinhala: g.grahaSinhala,
      flags: {
        exalted: g.exalted,
        debilitated: g.debilitated,
        ownSign: g.ownSign,
        vargottama: g.vargottama,
      },
    }));

  return {
    native: chart.native,
    lagna: chart.lagna,
    chandra: chart.chandra,
    summaryEn: [
      `Lagna ${chart.lagna.rashi}; Moon in ${chart.chandra.rashi} (${chart.chandra.nekatha} pada ${chart.chandra.pada}).`,
      `Current maha at birth: ${chart.vimshottari.balanceAtBirth?.lord ?? "—"}.`,
      "Read houses with lordship, aspects, and dasha — letters alone are not Handahana.",
    ],
    summarySi: [
      `ලග්නය ${chart.lagna.rashiSinhala}; චන්ද්‍ර ${chart.chandra.rashiSinhala} (${chart.chandra.nekathaSpoken} පාද ${chart.chandra.pada}).`,
      `උපතේ මහා දසා: ${chart.vimshottari.balanceAtBirth?.lordSinhala ?? "—"}.`,
      "භාව, අධිපති, දෘෂ්ටි සහ දසා සමඟ කියවන්න — අකුරු පමණක් හඳහන නොවේ.",
    ],
    houses,
    dignityHighlights: strengthNotes,
    dasha: chart.vimshottari,
    yogas: chart.yogas,
    varga: chart.varga,
  };
}
