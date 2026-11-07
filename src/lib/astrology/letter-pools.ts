/** Layer C naming pools — lagna & weekday (Laksara tradition). */

export const WEEKDAY_LETTERS: Record<number, string[]> = {
  // JS getDay(): 0 Sun … 6 Sat
  0: ["අ", "ඉ", "උ", "එ", "ඔ"],
  1: ["ය", "ර", "ල", "ව", "ශ", "ෂ", "ස", "හ", "ළ"],
  2: ["ක", "ඛ", "ග", "ඝ", "ඬ"],
  3: ["ට", "ඨ", "ඩ", "ඪ", "ණ"],
  4: ["ත", "ථ", "ද", "ධ", "න"],
  5: ["ච", "ඡ", "ජ", "ඣ", "ඤ"],
  6: ["ප", "ඵ", "බ", "භ", "ම"],
};

export const LAGNA_LETTERS: Record<string, string[]> = {
  Aries: ["අ", "ආ", "ශ"],
  Taurus: ["ඉ", "ඊ", "උ", "ෂ"],
  Gemini: ["ඌ", "ඍ", "ඎ", "ස"],
  Cancer: ["ග", "ඝ", "එ", "හ"],
  Leo: ["ඓ", "ඔ", "ඖ", "ළ"],
  Virgo: ["අං", "අඃ"],
  Libra: ["ක", "ඛ", "ග", "ඝ", "ඞ"],
  Scorpio: ["ච", "ඡ", "ජ", "ඣ", "ඤ"],
  Sagittarius: ["ට", "ඨ", "ඩ", "ඪ", "ණ"],
  Capricorn: ["ත", "ථ", "ධ", "ද", "න"],
  Aquarius: ["ප", "ඵ", "බ", "භ", "ම"],
  Pisces: ["ය", "ර", "ල", "ව"],
};

export function weekdayIndexFromYmd(date: string, time: string): number {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  // Approximate civil weekday in Asia/Colombo using UTC+5:30 offset
  const utc = Date.UTC(y, m - 1, d, hh - 5, mm - 30);
  return new Date(utc).getUTCDay();
}
