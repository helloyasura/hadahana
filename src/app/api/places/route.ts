import { NextResponse } from "next/server";
import {
  PLACE_PRESETS,
  listPlacesGrouped,
  searchPlaces,
} from "@/lib/astrology/places";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const grouped = searchParams.get("grouped") === "1";

  if (q) {
    return NextResponse.json({
      ok: true,
      count: searchPlaces(q, 60).length,
      places: searchPlaces(q, 60).map(serialize),
    });
  }

  if (grouped) {
    const g = listPlacesGrouped();
    return NextResponse.json({
      ok: true,
      count: PLACE_PRESETS.length,
      hospitals: g.hospitals.map(serialize),
      cities: g.cities.map(serialize),
      towns: g.towns.map(serialize),
    });
  }

  return NextResponse.json({
    ok: true,
    count: PLACE_PRESETS.length,
    places: PLACE_PRESETS.map(serialize),
  });
}

function serialize(p: (typeof PLACE_PRESETS)[number]) {
  return {
    id: p.id,
    label: p.label,
    labelSi: p.labelSi ?? null,
    kind: p.kind,
    district: p.district ?? null,
    latitude: p.latitude,
    longitude: p.longitude,
    timezone: p.timezone,
    address: p.address ?? null,
    notes: p.notes ?? null,
  };
}
