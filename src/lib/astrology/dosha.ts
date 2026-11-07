import type { castKendraya } from "./kendraya";

type Chart = Awaited<ReturnType<typeof castKendraya>>;

/** Kuja / Manglik houses commonly used in SL matching: 1,2,4,7,8,12 from Lagna (and sometimes Chandra). */
const KUJA_HOUSES = new Set([1, 2, 4, 7, 8, 12]);

export function analyzeDoshaYoga(chart: Chart) {
  const mars = chart.navagraha.find((g) => g.graha === "Mars");
  const moon = chart.navagraha.find((g) => g.graha === "Moon");
  const jupiter = chart.navagraha.find((g) => g.graha === "Jupiter");
  const sun = chart.navagraha.find((g) => g.graha === "Sun");

  const kujaFromLagna = mars ? KUJA_HOUSES.has(mars.bhava) : false;
  const moonHouse = moon?.bhava ?? 0;
  // Chandra kuja: mars house counted from moon sign as house 1
  let kujaFromChandra = false;
  if (mars && moon) {
    const offset = ((mars.bhava - moon.bhava + 12) % 12) + 1;
    kujaFromChandra = KUJA_HOUSES.has(offset);
  }

  const gajaKesari =
    Boolean(jupiter && moon) &&
    [1, 4, 7, 10].includes(
      ((jupiter!.bhava - moon!.bhava + 12) % 12) + 1,
    );

  const budhaAditya =
    Boolean(sun) &&
    chart.navagraha.some(
      (g) => g.graha === "Mercury" && g.rashi === sun!.rashi,
    );

  return {
    kujaDosha: {
      fromLagna: kujaFromLagna,
      fromChandra: kujaFromChandra,
      present: kujaFromLagna || kujaFromChandra,
      marsHouseFromLagna: mars?.bhava ?? null,
      noteEn:
        "Kuja dosha needs careful matching; mutual Kuja or cancellations can neutralize. Confirm with full charts.",
      noteSi:
        "කුජ දෝෂය පොරොන්දම්වලදී සැලකිලිවත්ව බලන්න. දෙදෙනාටම තිබේ නම් හෝ භංග තිබේ නම් බලපෑම අඩු විය හැක.",
    },
    kalsarpa: chart.yogas,
    yogas: [
      {
        id: "gaja_kesari",
        nameEn: "Gaja Kesari (screen)",
        nameSi: "ගජකේසරී (පරීක්ෂා)",
        present: gajaKesari,
        detail: "Moon–Jupiter in kendra from each other",
      },
      {
        id: "budha_aditya",
        nameEn: "Budha-Aditya (screen)",
        nameSi: "බුධාදිත්‍ය (පරීක්ෂා)",
        present: budhaAditya,
        detail: "Sun and Mercury in same rashi",
      },
    ],
    moonHouse,
  };
}
