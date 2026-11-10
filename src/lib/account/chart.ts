import { castKendraya } from "../astrology/kendraya";
import { analyzeDoshaYoga } from "../astrology/dosha";
import { buildPalapala } from "../astrology/palapala";
import { buildSatahana } from "../astrology/satahana";
import type { BirthBody } from "../astrology/birth-schema";
export async function fullChart(birth: BirthBody) {
  const [chart, satahana] = await Promise.all([castKendraya(birth), buildSatahana(birth)]);
  return { ok: true, chart, satahana, dosha: analyzeDoshaYoga(chart), palapala: buildPalapala(chart) };
}
