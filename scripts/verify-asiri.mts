import { castKendraya, namThebimaOnly } from "../src/lib/astrology/kendraya";
import { computeMuhurta } from "../src/lib/astrology/muhurta";
import { getPanchanga } from "../src/lib/astrology/panchanga";
import { analyzeDoshaYoga } from "../src/lib/astrology/dosha";
import { buildPalapala } from "../src/lib/astrology/palapala";
import { matchPorondam } from "../src/lib/astrology/porondam";

const birth = {
  date: "2026-11-04",
  time: "07:46",
  placeId: "asiri-kandy",
  gender: "male" as const,
  nativeName: "Son",
};

async function main() {
  const chart = await castKendraya(birth);
  const nam = await namThebimaOnly(birth);
  const muhurta = await computeMuhurta({
    date: birth.date,
    placeId: birth.placeId,
  });
  const panchanga = await getPanchanga({
    date: birth.date,
    placeId: birth.placeId,
  });
  const dosha = analyzeDoshaYoga(chart);
  const palapala = buildPalapala(chart);
  const porondam = await matchPorondam(birth, {
    date: "1995-06-15",
    time: "10:30",
    placeId: "colombo",
    gender: "female",
  });

  const tithi = panchanga.panchang?.tithi;
  const summary = {
    lagna: chart.lagna.rashi,
    chandra: `${chart.chandra.nekatha} p${chart.chandra.pada}`,
    primary: `${nam.namThebima.primaryAksharaSinhala}/${nam.namThebima.primaryAksharaRoman}`,
    letters: nam.namThebima.letterSet.allRecommendedSinhala,
    rahu: `${muhurta.rahuKalaya.start}-${muhurta.rahuKalaya.end} (${muhurta.rahuKalaya.source})`,
    tithi:
      typeof tithi === "object" && tithi !== null
        ? ((tithi as { name?: string }).name ?? tithi)
        : tithi,
    kuja: dosha.kujaDosha.present,
    housesFilled: palapala.houses.filter((h) => !h.empty).length,
    porondam: `${porondam.score}/${porondam.max}`,
  };
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
