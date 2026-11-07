import { NextResponse } from "next/server";
import { z } from "zod";
import { birthSchema } from "@/lib/astrology/birth-schema";
import {
  eventById,
  listEventCategories,
  type EventCategoryId,
} from "@/lib/astrology/event-categories";
import {
  catalogueForEvent,
  checkEventDate,
  scanEventDates,
} from "@/lib/astrology/event-nakath";
import { castKendraya } from "@/lib/astrology/kendraya";
import { findNekatha } from "@/lib/astrology/nakath-akshara";

export const runtime = "nodejs";
export const maxDuration = 120;

const eventIdSchema = z.enum([
  "marriage",
  "engagement",
  "naming",
  "housewarming",
  "business_start",
  "job_start",
  "travel",
  "education",
  "vehicle",
  "property_buy",
  "medical",
  "general",
]);

const schema = z
  .object({
    birth: birthSchema,
    eventId: eventIdSchema,
    /** check = one date; scan = find dates in range; catalogue = nakath options only */
    mode: z.enum(["check", "scan", "catalogue"]).default("catalogue"),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    fromDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    toDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    limit: z.number().int().min(1).max(60).optional(),
    placeId: z.string().optional(),
    placeName: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    timezone: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.mode === "check" && !val.date) {
      ctx.addIssue({
        code: "custom",
        message: "date is required when mode is check",
        path: ["date"],
      });
    }
    if (val.mode === "scan") {
      if (!val.fromDate || !val.toDate) {
        ctx.addIssue({
          code: "custom",
          message: "fromDate and toDate are required when mode is scan",
          path: ["fromDate"],
        });
      }
    }
  });

export async function GET() {
  return NextResponse.json({
    ok: true,
    events: listEventCategories(),
    modes: [
      {
        id: "catalogue",
        en: "List suitable nakaths for the event (bring-in options)",
        si: "අවස්ථාවට යෝග්‍ය නැකත් ලැයිස්තුව",
      },
      {
        id: "check",
        en: "Check a date you pick",
        si: "ඔබ තෝරන දිනය පරීක්ෂා කරන්න",
      },
      {
        id: "scan",
        en: "Find relevant dates in a range",
        si: "කාල පරාසයකින් යෝග්‍ය දින සොයන්න",
      },
    ],
  });
}

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const eventId = body.eventId as EventCategoryId;
    const place = {
      placeId: body.placeId,
      placeName: body.placeName,
      latitude: body.latitude,
      longitude: body.longitude,
      timezone: body.timezone,
    };

    if (body.mode === "catalogue") {
      const chart = await castKendraya(body.birth);
      const janma = findNekatha(chart.chandra.nekatha);
      const cat = catalogueForEvent(janma.index, eventId);
      return NextResponse.json({
        ok: true,
        mode: "catalogue",
        native: {
          janmaNekatha: janma.english,
          janmaNekathaSi: janma.spoken,
          janmaIndex: janma.index,
        },
        event: eventById(eventId),
        bringIn: cat.bringIn,
        options: cat.options,
      });
    }

    if (body.mode === "check") {
      const result = await checkEventDate({
        birth: body.birth,
        eventId,
        date: body.date!,
        ...place,
      });
      return NextResponse.json({ ok: true, mode: "check", ...result });
    }

    const result = await scanEventDates({
      birth: body.birth,
      eventId,
      fromDate: body.fromDate!,
      toDate: body.toDate!,
      limit: body.limit,
      ...place,
    });
    return NextResponse.json({ ok: true, mode: "scan", ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
