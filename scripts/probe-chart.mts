import { computeChart } from "vpv-panchangam";

const raw = await computeChart(
  {
    date: "2026-11-04",
    time: "07:46",
    latitude: 7.2744,
    longitude: 80.61115,
    timezone: "Asia/Colombo",
    ayanamsa: "lahiri",
  },
  "en",
);

const keys = Object.keys(raw);
console.log("top keys", keys);
console.log(
  "planet sample",
  JSON.stringify((raw.planets_data as unknown[])[0], null, 2),
);
console.log("d9", JSON.stringify(raw.d9_chart, null, 2)?.slice(0, 800));
console.log("d9_asc", raw.d9_asc_sign);
console.log("dasha_antar sample", JSON.stringify(raw.dasha_antar?.[0], null, 2)?.slice(0, 600));
console.log("houses?", (raw as { houses?: unknown }).houses);
console.log("asc", raw.ascendant);
