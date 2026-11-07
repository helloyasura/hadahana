/**
 * Modern Sinhala / Sri Lankan name seeds by starting akshara (phonetic).
 * Used to ground AI suggestions and as offline fallback.
 */

import {
  aksharaKey,
  expandLettersWithBase,
  nameMatchesLetter,
} from "@/lib/names/sinhala-base";

export type SeedName = {
  sinhala: string;
  roman: string;
  gender: "male" | "female" | "unisex";
  meaningSi: string;
  meaningEn: string;
  startsWith: string; // sinhala akshara key
};

export {
  aksharaKey,
  expandLettersWithBase,
  sinhalaBaseAkshara,
} from "@/lib/names/sinhala-base";

export const SEED_NAMES: SeedName[] = [
  // මො / Mo
  { sinhala: "මොහාන්", roman: "Mohan", gender: "male", meaningSi: "මායාවන්ත / ආකර්ෂණීය", meaningEn: "Charming, attractive", startsWith: "මො" },
  { sinhala: "මොහිත්", roman: "Mohith", gender: "male", meaningSi: "මායාවෙන් යුත් / රසවත්", meaningEn: "Enchanting", startsWith: "මො" },
  { sinhala: "මොහින්ද", roman: "Mohinda", gender: "male", meaningSi: "මහින්ද රජුගේ නාමයානුකූල", meaningEn: "Related to Mahinda", startsWith: "මො" },
  { sinhala: "මොනීෂා", roman: "Monisha", gender: "female", meaningSi: "ඥානවත් ස්ත්‍රී", meaningEn: "Wise woman", startsWith: "මො" },
  { sinhala: "මොරාන්", roman: "Moran", gender: "male", meaningSi: "දක්ෂ / දක්ෂතාව", meaningEn: "Skilled / adept", startsWith: "මො" },
  { sinhala: "මොසේස්", roman: "Moses", gender: "male", meaningSi: "දිව්‍ය නායක නාමය (ජාත්‍යන්තර)", meaningEn: "International biblical form", startsWith: "මො" },
  { sinhala: "මොනාලි", roman: "Monali", gender: "female", meaningSi: "මනෝහරී", meaningEn: "Pleasing, beautiful", startsWith: "මො" },
  { sinhala: "මොනිකා", roman: "Monica", gender: "female", meaningSi: "උපදේශක / ජාත්‍යන්තර නම", meaningEn: "Advisor / international form", startsWith: "මො" },
  { sinhala: "මොහන්දාස්", roman: "Mohandas", gender: "male", meaningSi: "මෝහන්දාස් ගාන්ධි නාමයානුකූල", meaningEn: "Servant of Mohan", startsWith: "මො" },
  { sinhala: "මොකාන්", roman: "Mokan", gender: "male", meaningSi: "ශක්තිමත්", meaningEn: "Strong", startsWith: "මො" },
  // ම / Ma (also valid when chart letter is මො / මෝ — base consonant rule)
  { sinhala: "මලිත්", roman: "Malith", gender: "male", meaningSi: "මල් මෙන් මෘදු", meaningEn: "Gentle as a flower", startsWith: "ම" },
  { sinhala: "මනෝජ්", roman: "Manoj", gender: "male", meaningSi: "මනසින් උපන්", meaningEn: "Born of the mind", startsWith: "ම" },
  { sinhala: "මධුෂා", roman: "Madusha", gender: "unisex", meaningSi: "මී පැණි වැනි", meaningEn: "Sweet as honey", startsWith: "ම" },
  { sinhala: "මනූෂා", roman: "Manusha", gender: "female", meaningSi: "මනුෂ්‍යත්වය", meaningEn: "Humaneness", startsWith: "ම" },
  { sinhala: "මහේෂ්", roman: "Mahesh", gender: "male", meaningSi: "මහා ඉශ්වර", meaningEn: "Great lord", startsWith: "ම" },
  { sinhala: "මාලනි", roman: "Malani", gender: "female", meaningSi: "මල් මාලා", meaningEn: "Garland", startsWith: "ම" },
  { sinhala: "මිහිරි", roman: "Mihiri", gender: "female", meaningSi: "මිහිරි / මධුර", meaningEn: "Sweet / pleasant", startsWith: "ම" },
  { sinhala: "මිනෙත්", roman: "Mineth", gender: "male", meaningSi: "මිණි ඇස", meaningEn: "Gem-eyed", startsWith: "ම" },
  { sinhala: "මෙත්මි", roman: "Methmi", gender: "female", meaningSi: "මෛත්‍රී", meaningEn: "Loving-kindness", startsWith: "ම" },
  { sinhala: "මධුර", roman: "Madhura", gender: "unisex", meaningSi: "මධුර", meaningEn: "Sweet", startsWith: "ම" },
  // ය / Ya
  { sinhala: "යසිත්", roman: "Yasith", gender: "male", meaningSi: "කීර්තිමත්", meaningEn: "Famous, glorious", startsWith: "ය" },
  { sinhala: "යසාස්", roman: "Yasas", gender: "male", meaningSi: "කීර්තිය", meaningEn: "Fame", startsWith: "ය" },
  { sinhala: "යශෝධා", roman: "Yashodha", gender: "female", meaningSi: "කීර්තිය ලබන", meaningEn: "One who attains fame", startsWith: "ය" },
  { sinhala: "යමුනා", roman: "Yamuna", gender: "female", meaningSi: "ශුද්ධ ගඟ", meaningEn: "Sacred river", startsWith: "ය" },
  // ර / Ra
  { sinhala: "රවිඳු", roman: "Ravindu", gender: "male", meaningSi: "සූර්යයා වැනි", meaningEn: "Like the sun", startsWith: "ර" },
  { sinhala: "රංගන", roman: "Rangana", gender: "male", meaningSi: "නර්තන / ක්‍රීඩාව", meaningEn: "Play / performance", startsWith: "ර" },
  { sinhala: "රසිකා", roman: "Rasika", gender: "female", meaningSi: "රසඥ", meaningEn: "Connoisseur", startsWith: "ර" },
  { sinhala: "රන්මිණී", roman: "Ranmini", gender: "female", meaningSi: "රන් මැණික්", meaningEn: "Golden gem", startsWith: "ර" },
  // ප / Pa
  { sinhala: "පසිඳු", roman: "Pasindu", gender: "male", meaningSi: "ප්‍රසිද්ධ", meaningEn: "Renowned", startsWith: "ප" },
  { sinhala: "පවන්", roman: "Pawan", gender: "male", meaningSi: "සුළං / පවිත්‍ර", meaningEn: "Wind / pure", startsWith: "ප" },
  { sinhala: "පියුමි", roman: "Piyumi", gender: "female", meaningSi: "පියුම් මල", meaningEn: "Lotus", startsWith: "ප" },
  { sinhala: "පෙරේෂා", roman: "Peresha", gender: "unisex", meaningSi: "ප්‍රේමණීය", meaningEn: "Beloved", startsWith: "පෙ" },
  // ත / Tha
  { sinhala: "තරිඳු", roman: "Tharindu", gender: "male", meaningSi: "තරු වැනි", meaningEn: "Like a star", startsWith: "ත" },
  { sinhala: "තිෂාන්", roman: "Thishan", gender: "male", meaningSi: "තීක්ෂ්ණ", meaningEn: "Sharp / keen", startsWith: "ති" },
  { sinhala: "තරුණි", roman: "Tharuni", gender: "female", meaningSi: "තරුණ ස්ත්‍රී", meaningEn: "Young woman", startsWith: "ත" },
  { sinhala: "තිෂානි", roman: "Thishani", gender: "female", meaningSi: "තීක්ෂ්ණ බුද්ධිය", meaningEn: "Keen intellect", startsWith: "ති" },
  // බ / Ba
  { sinhala: "බිමල්", roman: "Bimal", gender: "male", meaningSi: "පවිත්‍ර", meaningEn: "Pure", startsWith: "බි" },
  { sinhala: "බන්දු", roman: "Bandu", gender: "male", meaningSi: "බැඳුණු මිත්‍ර", meaningEn: "Bound friend", startsWith: "බ" },
  { sinhala: "බිනාරි", roman: "Binari", gender: "female", meaningSi: "සංගීතමය", meaningEn: "Musical", startsWith: "බි" },
  // ට / Ta
  { sinhala: "ටිෂාන්", roman: "Tishan", gender: "male", meaningSi: "තීක්ෂ්ණ", meaningEn: "Keen", startsWith: "ටි" },
  { sinhala: "ටනිෂා", roman: "Tanisha", gender: "female", meaningSi: "අභිලාෂී", meaningEn: "Ambition", startsWith: "ට" },
  // නො / No
  { sinhala: "නොවින්", roman: "Novin", gender: "male", meaningSi: "නව ආලෝකය", meaningEn: "New light", startsWith: "නො" },
  // ච / Cha
  { sinhala: "චමත්", roman: "Chamath", gender: "male", meaningSi: "සුන්දර", meaningEn: "Beautiful", startsWith: "ච" },
  { sinhala: "චතුරි", roman: "Chathuri", gender: "female", meaningSi: "දක්ෂ", meaningEn: "Skilful", startsWith: "ච" },
  // ක / Ka
  { sinhala: "කවිඳු", roman: "Kavindu", gender: "male", meaningSi: "කවිත්වය", meaningEn: "Poetic gift", startsWith: "ක" },
  { sinhala: "කවින්දි", roman: "Kavindi", gender: "female", meaningSi: "කවි ගුණ", meaningEn: "Poetic quality", startsWith: "ක" },
  // ස / Sa
  { sinhala: "සචින්", roman: "Sachin", gender: "male", meaningSi: "ශුද්ධ", meaningEn: "Pure", startsWith: "ස" },
  { sinhala: "සචිනි", roman: "Sachini", gender: "female", meaningSi: "ශුද්ධා", meaningEn: "Pure one", startsWith: "ස" },
  // අ / A
  { sinhala: "අරුණ", roman: "Aruna", gender: "male", meaningSi: "උදාව", meaningEn: "Dawn", startsWith: "අ" },
  { sinhala: "අනුෂ්කා", roman: "Anushka", gender: "female", meaningSi: "කිරණ", meaningEn: "Ray of light", startsWith: "අ" },
];

export function seedsForLetters(
  letters: string[],
  gender: "male" | "female" | "unisex" | "unspecified",
): SeedName[] {
  const expanded = expandLettersWithBase(letters);
  return SEED_NAMES.filter((n) => {
    const hit = expanded.some((L) =>
      nameMatchesLetter(n.sinhala, n.roman, L),
    );
    if (!hit) return false;
    if (gender === "unspecified" || gender === "unisex") return true;
    return n.gender === gender || n.gender === "unisex";
  });
}
