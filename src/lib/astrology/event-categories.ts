/**
 * Event-category catalogue for suitable-nakath finder (client-safe).
 * Scoring / ephemeris live in event-nakath.ts (server only).
 */

export type EventCategoryId =
  | "marriage"
  | "engagement"
  | "naming"
  | "housewarming"
  | "business_start"
  | "job_start"
  | "travel"
  | "education"
  | "vehicle"
  | "property_buy"
  | "medical"
  | "general";

export type EventCategory = {
  id: EventCategoryId;
  en: string;
  si: string;
  blurbEn: string;
  blurbSi: string;
  prefer: string[];
  avoid: string[];
  avoidJanmaTara?: boolean;
};

export const EVENT_CATEGORIES: EventCategory[] = [
  {
    id: "marriage",
    en: "Marriage / wedding",
    si: "මංගල උත්සවය",
    blurbEn: "Wedding muhurta — prefer stable, friendly nakshatras.",
    blurbSi: "මංගල මුහුර්ත — ස්ථිර, මෛත්‍රී නැකත් වඩාත් යෝග්‍යයි.",
    prefer: [
      "Rohini",
      "Mrigashira",
      "Magha",
      "Uttara Phalguni",
      "Hasta",
      "Swati",
      "Anuradha",
      "Uttara Ashadha",
      "Uttara Bhadrapada",
      "Revati",
    ],
    avoid: ["Bharani", "Krittika", "Ardra", "Ashlesha", "Jyeshtha", "Mula"],
    avoidJanmaTara: true,
  },
  {
    id: "engagement",
    en: "Engagement / betrothal",
    si: "ගිවිස ගැනීම",
    blurbEn: "Promise / ring ceremony — harmonious nakshatras.",
    blurbSi: "ගිවිසුම් / මුදු උත්සවය — සමගි නැකත්.",
    prefer: [
      "Rohini",
      "Mrigashira",
      "Punarvasu",
      "Pushya",
      "Hasta",
      "Swati",
      "Anuradha",
      "Shravana",
      "Revati",
    ],
    avoid: ["Bharani", "Ardra", "Ashlesha", "Jyeshtha", "Mula"],
  },
  {
    id: "naming",
    en: "Nam Thebima / naming",
    si: "නම් තැබීම",
    blurbEn: "Baby naming — subha tara + soft naming nakshatras.",
    blurbSi: "ළදරු නම් තැබීම — සුභ තාරා සහ මෘදු නැකත්.",
    prefer: [
      "Ashwini",
      "Rohini",
      "Mrigashira",
      "Punarvasu",
      "Pushya",
      "Hasta",
      "Chitra",
      "Swati",
      "Anuradha",
      "Shravana",
      "Revati",
    ],
    avoid: ["Bharani", "Ardra", "Ashlesha", "Magha", "Jyeshtha", "Mula"],
  },
  {
    id: "housewarming",
    en: "Housewarming / graha pravesha",
    si: "ගෙවල් ඇතුළුවීම",
    blurbEn: "Entering a new home — earthy, fixed-friendly nakshatras.",
    blurbSi: "නව නිවසට ඇතුළුවීම — ස්ථිර / පෝෂණීය නැකත්.",
    prefer: [
      "Rohini",
      "Mrigashira",
      "Uttara Phalguni",
      "Hasta",
      "Chitra",
      "Anuradha",
      "Uttara Ashadha",
      "Shravana",
      "Uttara Bhadrapada",
      "Revati",
    ],
    avoid: ["Bharani", "Krittika", "Ardra", "Ashlesha", "Magha", "Mula"],
  },
  {
    id: "business_start",
    en: "Business start",
    si: "ව්‍යාපාර ආරම්භය",
    blurbEn: "Opening shop / company — growth and siddhi nakshatras.",
    blurbSi: "වෙළඳසැල / සමාගම ආරම්භය — වර්ධන / සිද්ධි නැකත්.",
    prefer: [
      "Ashwini",
      "Rohini",
      "Punarvasu",
      "Pushya",
      "Uttara Phalguni",
      "Hasta",
      "Chitra",
      "Swati",
      "Anuradha",
      "Uttara Ashadha",
      "Shravana",
      "Dhanishta",
      "Revati",
    ],
    avoid: ["Bharani", "Ardra", "Ashlesha", "Jyeshtha", "Mula"],
  },
  {
    id: "job_start",
    en: "New job / first day",
    si: "රැකියා ආරම්භය",
    blurbEn: "Joining work — supportive, steady nakshatras.",
    blurbSi: "රැකියාවට එක්වීම — උපකාරී ස්ථිර නැකත්.",
    prefer: [
      "Ashwini",
      "Rohini",
      "Punarvasu",
      "Pushya",
      "Hasta",
      "Anuradha",
      "Uttara Ashadha",
      "Shravana",
      "Dhanishta",
      "Revati",
    ],
    avoid: ["Bharani", "Ardra", "Ashlesha", "Jyeshtha", "Mula"],
  },
  {
    id: "travel",
    en: "Travel / journey",
    si: "ගමන් / චාරිකා",
    blurbEn: "Starting a trip — movable / swift nakshatras.",
    blurbSi: "ගමනක් ආරම්භය — චල / ඉක්මන් නැකත්.",
    prefer: [
      "Ashwini",
      "Punarvasu",
      "Pushya",
      "Hasta",
      "Swati",
      "Anuradha",
      "Shravana",
      "Dhanishta",
      "Shatabhisha",
      "Revati",
    ],
    avoid: ["Bharani", "Krittika", "Ardra", "Ashlesha", "Magha", "Mula"],
    avoidJanmaTara: true,
  },
  {
    id: "education",
    en: "Education / exams start",
    si: "අධ්‍යාපන / විභාග ආරම්භය",
    blurbEn: "Learning, courses, exams — Mercury-friendly nakshatras.",
    blurbSi: "ඉගෙනීම, පාඨමාලා, විභාග — බුධ හිතකර නැකත්.",
    prefer: [
      "Ashwini",
      "Mrigashira",
      "Punarvasu",
      "Pushya",
      "Hasta",
      "Chitra",
      "Swati",
      "Anuradha",
      "Shravana",
      "Revati",
    ],
    avoid: ["Bharani", "Ardra", "Ashlesha", "Jyeshtha", "Mula"],
  },
  {
    id: "vehicle",
    en: "Vehicle purchase / first ride",
    si: "වාහන මිලදී / පළමු ගමන",
    blurbEn: "Buying or first driving a vehicle.",
    blurbSi: "වාහනයක් මිලදී ගැනීම හෝ පළමු ධාවනය.",
    prefer: [
      "Ashwini",
      "Rohini",
      "Mrigashira",
      "Pushya",
      "Hasta",
      "Chitra",
      "Swati",
      "Anuradha",
      "Shravana",
      "Dhanishta",
      "Revati",
    ],
    avoid: ["Bharani", "Ardra", "Ashlesha", "Jyeshtha", "Mula"],
  },
  {
    id: "property_buy",
    en: "Property / land purchase",
    si: "දේපළ / ඉඩම් මිලදී",
    blurbEn: "Buying land or property — fixed / fruitful nakshatras.",
    blurbSi: "ඉඩම් හෝ දේපළ මිලදී — ස්ථිර / ඵලදායී නැකත්.",
    prefer: [
      "Rohini",
      "Uttara Phalguni",
      "Hasta",
      "Anuradha",
      "Uttara Ashadha",
      "Uttara Bhadrapada",
      "Revati",
    ],
    avoid: ["Bharani", "Ardra", "Ashlesha", "Magha", "Jyeshtha", "Mula"],
  },
  {
    id: "medical",
    en: "Medical / treatment start",
    si: "වෛද්‍ය / ප්‍රතිකාර ආරම්භය",
    blurbEn: "Starting treatment — healing-friendly; avoid harsh nakshatras.",
    blurbSi: "ප්‍රතිකාර ආරම්භය — සුව නැකත්; තද නැකත් වළකින්න.",
    prefer: [
      "Ashwini",
      "Rohini",
      "Punarvasu",
      "Pushya",
      "Hasta",
      "Anuradha",
      "Shravana",
      "Shatabhisha",
      "Revati",
    ],
    avoid: [
      "Bharani",
      "Krittika",
      "Ardra",
      "Ashlesha",
      "Magha",
      "Jyeshtha",
      "Mula",
    ],
  },
  {
    id: "general",
    en: "General auspicious work",
    si: "සාමාන්‍ය සුභ කටයුතු",
    blurbEn: "Any ordinary shubha work — broad favourable set.",
    blurbSi: "සාමාන්‍ය සුභ කටයුතු — පුළුල් යෝග්‍ය කට්ටලය.",
    prefer: [
      "Ashwini",
      "Rohini",
      "Mrigashira",
      "Punarvasu",
      "Pushya",
      "Uttara Phalguni",
      "Hasta",
      "Chitra",
      "Swati",
      "Anuradha",
      "Uttara Ashadha",
      "Shravana",
      "Dhanishta",
      "Uttara Bhadrapada",
      "Revati",
    ],
    avoid: ["Bharani", "Ardra", "Ashlesha", "Jyeshtha", "Mula"],
  },
];

export function eventById(id: EventCategoryId): EventCategory {
  const hit = EVENT_CATEGORIES.find((e) => e.id === id);
  if (!hit) throw new Error(`Unknown event category: ${id}`);
  return hit;
}

export function listEventCategories() {
  return EVENT_CATEGORIES.map((e) => ({
    id: e.id,
    en: e.en,
    si: e.si,
    blurbEn: e.blurbEn,
    blurbSi: e.blurbSi,
  }));
}
