import { GANA, YONI } from "./nakshatra-attributes";
import { findNekatha, NEKATHA_TABLE } from "./nakath-akshara";
import { castKendraya, type BirthInput } from "./kendraya";
import { rashiLabel } from "./sinhala-names";

const TARA = [
  "janma",
  "sampath",
  "vipath",
  "kshema",
  "pratyari",
  "sadhaka",
  "vadha",
  "maitri",
  "parama_maitri",
] as const;

const TARA_SI: Record<(typeof TARA)[number], string> = {
  janma: "ජන්ම",
  sampath: "සම්පත්",
  vipath: "විපත්",
  kshema: "ක්ෂේම",
  pratyari: "ප්‍රත්‍යාරි",
  sadhaka: "සාධක",
  vadha: "වධ",
  maitri: "මෛත්‍රී",
  parama_maitri: "පරම මෛත්‍රී",
};

const FAVOUR_TARA = new Set([
  "janma",
  "sampath",
  "kshema",
  "sadhaka",
  "maitri",
  "parama_maitri",
]);

const YONI_ENEMY: Array<[string, string]> = [
  ["Ashwa", "Mahisha"],
  ["Gaja", "Simha"],
  ["Mesha", "Vanara"],
  ["Sarpa", "Nakula"],
  ["Shwani", "Mriga"],
  ["Marjara", "Mushaka"],
  ["Gau", "Vyaghra"],
];

function taraFromTo(fromIndex: number, toIndex: number) {
  const dist = ((toIndex - fromIndex + 27) % 27);
  const key = TARA[dist % 9];
  return { dist, key, sinhala: TARA_SI[key], favourable: FAVOUR_TARA.has(key) };
}

function yoniOk(a: string, b: string): boolean {
  if (a === b) return true;
  return !YONI_ENEMY.some(
    ([x, y]) => (x === a && y === b) || (x === b && y === a),
  );
}

function rashiFriends(a: string, b: string): "friend" | "neutral" | "enemy" {
  const lordA = rashiLabel(a).lord;
  const lordB = rashiLabel(b).lord;
  if (lordA === lordB) return "friend";
  const friends: Record<string, string[]> = {
    Sun: ["Moon", "Mars", "Jupiter"],
    Moon: ["Sun", "Mercury"],
    Mars: ["Sun", "Moon", "Jupiter"],
    Mercury: ["Sun", "Venus"],
    Jupiter: ["Sun", "Moon", "Mars"],
    Venus: ["Mercury", "Saturn"],
    Saturn: ["Mercury", "Venus"],
  };
  const enemies: Record<string, string[]> = {
    Sun: ["Venus", "Saturn"],
    Moon: [],
    Mars: ["Mercury"],
    Mercury: ["Moon"],
    Jupiter: ["Mercury", "Venus"],
    Venus: ["Sun", "Moon"],
    Saturn: ["Sun", "Moon", "Mars"],
  };
  if (friends[lordA]?.includes(lordB)) return "friend";
  if (enemies[lordA]?.includes(lordB)) return "enemy";
  return "neutral";
}

export async function matchPorondam(a: BirthInput, b: BirthInput) {
  const [ca, cb] = await Promise.all([castKendraya(a), castKendraya(b)]);
  const na = findNekatha(ca.chandra.nekatha);
  const nb = findNekatha(cb.chandra.nekatha);
  const ab = taraFromTo(na.index, nb.index);
  const ba = taraFromTo(nb.index, na.index);

  const ganaA = GANA[na.index];
  const ganaB = GANA[nb.index];
  const ganaOk =
    ganaA === ganaB ||
    (ganaA === "Deva" && ganaB === "Manushya") ||
    (ganaB === "Deva" && ganaA === "Manushya");

  const yoniA = YONI[na.index];
  const yoniB = YONI[nb.index];
  const yoniMatch = yoniOk(yoniA, yoniB);

  const rashiRel = rashiFriends(ca.chandra.rashi, cb.chandra.rashi);

  // Simplified Mahendra: count from female→male in classical lists often used;
  // here we mark favourable if tara from A→B is sampath/kshema/sadhaka/maitri/parama.
  const mahendraOk = ["sampath", "kshema", "sadhaka", "maitri", "parama_maitri"].includes(
    ab.key,
  );

  // Stree deergha (simplified): male star count from female ≥ 13 often cited as good
  const streeDeerghaOk = ab.dist >= 13;

  // Vasya simplified: same moon element or friendly lords
  const vasyaOk = rashiRel !== "enemy";

  // Rajju / Vedha — placeholder structural flags (full tables are large);
  // we expose nekatha pair + warn to verify with classical tables.
  const samePada = ca.chandra.pada === cb.chandra.pada && na.index === nb.index;

  const points = [
    {
      id: "nekath",
      nameEn: "Nekath Porondama",
      nameSi: "නැකත් පොරොන්දම",
      ok: ab.favourable || ba.favourable,
      detail: `A→B ${ab.sinhala} (${ab.key}), B→A ${ba.sinhala} (${ba.key})`,
    },
    {
      id: "gana",
      nameEn: "Gana",
      nameSi: "ගණ",
      ok: ganaOk,
      detail: `${ganaA} × ${ganaB}`,
    },
    {
      id: "mahendra",
      nameEn: "Mahendra",
      nameSi: "මහේන්ද්‍ර",
      ok: mahendraOk,
      detail: `Offset ${ab.dist} → ${ab.key}`,
    },
    {
      id: "stree_deergha",
      nameEn: "Stree Deergha",
      nameSi: "ස්ත්‍රී දීර්ඝ",
      ok: streeDeerghaOk,
      detail: `Count ${ab.dist}`,
    },
    {
      id: "yoni",
      nameEn: "Yoni",
      nameSi: "යෝනි",
      ok: yoniMatch,
      detail: `${yoniA} × ${yoniB}`,
    },
    {
      id: "rashi",
      nameEn: "Rashi",
      nameSi: "රාශි",
      ok: ca.chandra.rashi === cb.chandra.rashi || rashiRel !== "enemy",
      detail: `${ca.chandra.rashi} × ${cb.chandra.rashi}`,
    },
    {
      id: "rashi_adhipathi",
      nameEn: "Rashi Adhipathi",
      nameSi: "රාශ්‍යාධිපති",
      ok: rashiRel !== "enemy",
      detail: rashiRel,
    },
    {
      id: "vasya",
      nameEn: "Vasya / Vashya",
      nameSi: "වශ්‍ය",
      ok: vasyaOk,
      detail: rashiRel,
    },
    {
      id: "rajju",
      nameEn: "Rajju (screen)",
      nameSi: "රජ්ජු (පූර්ව පරීක්ෂා)",
      ok: !samePada,
      detail: samePada
        ? "Same nekatha + same pada — traditionally careful"
        : "No same-pada collision; verify full rajju table with elder athurudaya",
    },
    {
      id: "vedha",
      nameEn: "Vedha (screen)",
      nameSi: "වේධ (පූර්ව පරීක්ෂා)",
      ok: ab.key !== "vadha" && ba.key !== "vadha",
      detail: "Vadha-class tara avoided in either direction (simplified screen)",
    },
  ];

  const score = points.filter((p) => p.ok).length;

  return {
    personA: {
      name: ca.native.name,
      nekatha: na.spoken,
      pada: ca.chandra.pada,
      rashi: ca.chandra.rashi,
    },
    personB: {
      name: cb.native.name,
      nekatha: nb.spoken,
      pada: cb.chandra.pada,
      rashi: cb.chandra.rashi,
    },
    score,
    max: points.length,
    percent: Math.round((score / points.length) * 100),
    points,
    notes: [
      "Dasa Porondam core (10). Yoni & Rajju weigh heavily even if total looks fine.",
      "Rajju/Vedha here are screening aids — confirm with classical tables before marriage decisions.",
      "Also review both full kendrayas and Kuja dosha cancellation.",
      "දස පොරොන්දම් මූලිකයි. යෝනි/රජ්ජු විශේෂයෙන් බලන්න.",
    ],
    nekathaTableSize: NEKATHA_TABLE.length,
  };
}
