import { NextResponse } from "next/server";
import { requireFeature } from "@/lib/account/server";
export async function GET(req: Request) { return await requireFeature(req) || NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } }); }
