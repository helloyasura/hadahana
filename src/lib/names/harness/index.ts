/**
 * Naming Agent Harness
 *
 * Top-level orchestrator over the LangGraph multi-personality graph:
 * 1. Select personality roster (ensemble vs single)
 * 2. Inject letter + country + religion + usage + horoscope persona
 * 3. Run LangGraph fan-out → critic_merge → factor_align
 * 4. Fall back to seed pairs (still factor-scored) if no API key / graph failure
 */

import { applyDeterministicFactors, sortByAlignment } from "@/lib/names/factor-align";
import { getNamingGraph } from "@/lib/names/harness/graph";
import type {
  NamingHarnessContext,
  NamingHarnessResult,
} from "@/lib/names/harness/types";
import { pairFallbackNames } from "@/lib/names/name-pipeline";
import type { NamingPersonalityId } from "@/lib/names/personalities";

export type { NamingHarnessContext, NamingHarnessResult };

export function selectPersonalities(
  mode: NamingPersonalityId | "ensemble",
  country: NamingHarnessContext["country"],
): NamingPersonalityId[] {
  if (mode !== "ensemble") return [mode];
  if (country === "lk") {
    return [
      "athurudaya",
      "sinhala_language",
      "sinhala_literature",
      "multi_religion",
      "meaning_weaver",
      "family_harmony",
    ];
  }
  return [
    "diaspora",
    "multicultural",
    "sinhala_language",
    "multi_religion",
    "meaning_weaver",
    "family_harmony",
  ];
}

function scoreSeedFallback(ctx: NamingHarnessContext) {
  const raw = pairFallbackNames(
    ctx.firstLetters,
    ctx.middleLetters,
    ctx.primary,
    ctx.gender,
    ctx.targetCount,
    ctx.personalities[0],
    ctx.country,
    ctx.letterSource,
  );
  return sortByAlignment(
    applyDeterministicFactors(raw, {
      persona: ctx.horoscopePersona,
      country: ctx.country,
      nameLanguage: ctx.input.nameLanguage,
      religion: ctx.input.religionContext,
    }),
  );
}

export async function runNamingHarness(
  ctx: NamingHarnessContext,
): Promise<NamingHarnessResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      names: scoreSeedFallback(ctx),
      personalitiesUsed: ctx.personalities,
      source: "seed",
      framework: "seed",
      graphTrace: ["harness:seed-fallback-no-api-key", "factor_align:deterministic"],
      horoscopePersona: ctx.horoscopePersona,
    };
  }

  try {
    const graph = getNamingGraph();
    const result = await graph.invoke({
      ctx,
      activePersonality: null,
      batches: [],
      merged: [],
      graphTrace: ["harness:start"],
    });
    const names = result.merged?.length
      ? result.merged
      : scoreSeedFallback(ctx);
    return {
      names,
      personalitiesUsed: ctx.personalities,
      source:
        ctx.personalities.length > 1 ? "langgraph-ensemble" : "langgraph",
      framework: "langgraph",
      graphTrace: result.graphTrace ?? ["harness:done"],
      horoscopePersona: ctx.horoscopePersona,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      names: scoreSeedFallback(ctx),
      personalitiesUsed: ctx.personalities,
      source: "seed",
      framework: "seed",
      graphTrace: [
        `harness:error:${message.slice(0, 120)}`,
        "factor_align:deterministic",
      ],
      horoscopePersona: ctx.horoscopePersona,
    };
  }
}
