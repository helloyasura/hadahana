import { requireFeature } from "@/lib/account/server";
import { NextResponse } from "next/server";
import {
  INTERESTS,
  LIVING_COUNTRIES,
  NAMING_PERSONALITIES,
  NAME_LANGUAGE_OPTIONS,
  RELIGION_OPTIONS,
} from "@/lib/names/personalities";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const denied = await requireFeature(req); if (denied) return denied;
  return NextResponse.json({
    ok: true,
    countries: LIVING_COUNTRIES,
    personalities: NAMING_PERSONALITIES.map((p) => ({
      id: p.id,
      si: p.si,
      en: p.en,
      role: p.role,
    })),
    interests: INTERESTS,
    religions: RELIGION_OPTIONS,
    nameLanguages: NAME_LANGUAGE_OPTIONS,
    framework: {
      id: "langgraph",
      si: "LangGraph agent harness — බහු පෞරුෂ නාම නියෝජිත ජාලය",
      en: "LangGraph agent harness — multi-personality naming graph",
    },
    ensembleNoteSi:
      "Ensemble = LangGraph harness මත සිංහල භාෂා/සාහිත්‍ය + බහු ආගමික + අනෙකුත් නියෝජිතයන් සමාන්තරව ධාවනය කර critic මගින් ඒකාබද්ධ කරයි; වත්මන් රටේ නාම භාවිතය web සත්‍යාපනය කරයි.",
    ensembleNoteEn:
      "Ensemble runs Sinhala language/literature + multi-religion agents in parallel on a LangGraph harness, merges via critic, then verifies current-generation usage for the living country.",
  });
}
