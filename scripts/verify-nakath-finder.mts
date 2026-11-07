import {
  catalogueForEvent,
  checkEventDate,
  scanEventDates,
} from "../src/lib/astrology/event-nakath";
import { findNekatha } from "../src/lib/astrology/nakath-akshara";

async function main() {
  const birth = {
    date: "2021-11-11",
    time: "07:29",
    placeId: "kandy",
    gender: "male" as const,
    nativeName: "Asiri",
  };

  const check = await checkEventDate({
    birth,
    eventId: "marriage",
    date: "2026-11-07",
  });
  if (!check.day.dayNakshatra.english) throw new Error("check missing nakath");

  const scan = await scanEventDates({
    birth,
    eventId: "naming",
    fromDate: "2026-11-07",
    toDate: "2026-11-21",
    limit: 8,
  });
  if (!scan.dates.length) throw new Error("scan returned no dates");

  const janma = findNekatha(check.native.janmaNekatha);
  const cat = catalogueForEvent(janma.index, "business_start");
  if (!cat.bringIn.length) throw new Error("no bring-in nakaths");

  console.log(
    JSON.stringify(
      {
        ok: true,
        janma: check.native,
        check: {
          date: check.day.date,
          nakath: check.day.dayNakshatra.english,
          grade: check.day.grade,
          score: check.day.dayNakshatra.score,
          suitable: check.day.suitable,
        },
        scanTop: scan.dates.slice(0, 5).map((d) => ({
          date: d.date,
          nakath: d.dayNakshatra.english,
          grade: d.grade,
          score: d.dayNakshatra.score,
          suitable: d.suitable,
        })),
        bringInBusiness: cat.bringIn.slice(0, 6).map((n) => n.english),
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
