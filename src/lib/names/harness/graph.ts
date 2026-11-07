/**
 * LangGraph multi-personality naming graph.
 *
 * Flow:
 *   START → fan_out (Send per personality)
 *        → personality_agent (parallel)
 *        → critic_merge
 *        → factor_align  (horoscope + readability + memory + modern + meaning + religion + country)
 *        → END
 *
 * Letter safety is enforced in each personality node + critic.
 */

import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import {
  Annotation,
  END,
  START,
  StateGraph,
  Send,
} from "@langchain/langgraph";
import {
  applyDeterministicFactors,
  refineFactorsWithLlm,
  sortByAlignment,
} from "@/lib/names/factor-align";
import { horoscopePersonaPromptBlock } from "@/lib/names/horoscope-persona";
import { learningPromptBlock } from "@/lib/names/reshuffle";
import {
  LIVING_COUNTRIES,
  countryHint,
  personalityById,
  type NamingPersonalityId,
} from "@/lib/names/personalities";
import { seedsForLetters } from "@/lib/names/seed-pool";
import type { SuggestedName } from "@/lib/names/types";
import {
  criticMerge,
  interestLabel,
  languageLabel,
  makePart,
  nameResponseSchema,
  pairFallbackNames,
  religionLabel,
  resolvePartStart,
} from "@/lib/names/name-pipeline";
import type { NamingHarnessContext } from "@/lib/names/harness/types";

export const NamingGraphState = Annotation.Root({
  ctx: Annotation<NamingHarnessContext>,
  /** Set by Send() for each parallel personality worker */
  activePersonality: Annotation<NamingPersonalityId | null>({
    reducer: (_left, right) => right,
    default: () => null,
  }),
  batches: Annotation<SuggestedName[]>({
    reducer: (left, right) => left.concat(right),
    default: () => [],
  }),
  merged: Annotation<SuggestedName[]>({
    reducer: (_left, right) => right,
    default: () => [],
  }),
  graphTrace: Annotation<string[]>({
    reducer: (left, right) => left.concat(right),
    default: () => [],
  }),
});

export type NamingGraphStateType = typeof NamingGraphState.State;

function fanOutPersonalities(state: NamingGraphStateType): Send[] {
  return state.ctx.personalities.map(
    (p) =>
      new Send("personality_agent", {
        ctx: state.ctx,
        activePersonality: p,
        batches: [],
        merged: [],
        graphTrace: [],
      }),
  );
}

async function personalityAgentNode(
  state: NamingGraphStateType,
): Promise<Partial<NamingGraphStateType>> {
  const personality = state.activePersonality;
  if (!personality) {
    return { graphTrace: ["personality_agent:skip-null"] };
  }
  const ctx = state.ctx;
  const agent = personalityById(personality);
  const country = LIVING_COUNTRIES.find((c) => c.id === ctx.country)!;
  const g =
    ctx.gender === "male" || ctx.gender === "female"
      ? ctx.gender
      : "unspecified";
  const firstSeeds = seedsForLetters(ctx.firstLetters, g).slice(0, 8);
  const middleSeeds = seedsForLetters(ctx.middleLetters, g).slice(0, 8);

  const prompt = `You are the "${agent.en}" naming agent (${agent.role}) for Handahana Studio.

${agent.systemExtra}

LIVING COUNTRY: ${country.en} / ${country.si}
COUNTRY STYLE: ${countryHint(ctx.country)}
NAME LANGUAGE PREFERENCE: ${languageLabel(ctx.input.nameLanguage)}
RELIGION / FAITH CONTEXT: ${religionLabel(ctx.input.religionContext)}
LETTER SOURCE: ${ctx.letterSource === "manual" ? "USER-ENTERED MANUAL LETTERS (not from chart)" : "KENDRAYA CHART LETTERS"}
FRAMEWORK: LangGraph multi-agent harness — you are one specialist node.

${horoscopePersonaPromptBlock(ctx.horoscopePersona)}

${ctx.learning ? learningPromptBlock(ctx.learning) : "USER FEEDBACK LEARNING: none yet."}

SUITABILITY TARGETS (weave into why* fields; a later factor_align critic will score these):
- Match horoscope personality & predicted personal behaviour
- High readability (easy to read aloud in Sinhala + roman)
- High memorability (easy for family & schoolmates to remember)
- Modern generation feel (usable by today's parents, not archaic-only)
- Meaning built clearly in the language(s) this family uses
- Religion / faith context respected
- Living-country practical fit (school, passport, peers)

${ctx.currentUsageSample ? `${ctx.currentUsageSample}\nPrefer names that feel current for this country & language (not archaic-only), while staying letter-safe.\n` : ""}
HARD RULES:
1. Propose exactly ${ctx.perCount} distinct FULL given names — each must have FIRST name + MIDDLE name (no surnames).
2. FIRST name first syllable MUST match one of: ${ctx.firstLetters.join(", ")}
   Sinhala rule: a vowel-marked letter also allows its BASE consonant
   (e.g. මො / මෝ → also ම so මලිත්, මනෝජ්, මිහිරි are valid).
3. MIDDLE name first syllable MUST match one of: ${ctx.middleLetters.join(", ")}
4. Primary / preferred first letter: ${ctx.primary} (${ctx.primaryRoman || "—"}). Prefer many first names from this (exact OR base consonant).
5. Child gender: ${ctx.gender}
6. Always give BOTH sinhala AND roman for first and middle.
7. First and middle must be different words; flow well together when spoken.
8. For living country != Sri Lanka, roman forms must be easy for local schools.
9. Family:
   Mother: ${ctx.input.motherName || "—"}
   Father: ${ctx.input.fatherName || "—"}
   Siblings: ${(ctx.input.siblingNames || []).join(", ") || "—"}
   Mother interests: ${interestLabel(ctx.input.interestsMother) || "—"}
   Father interests: ${interestLabel(ctx.input.interestsFather) || "—"}
   Shared hopes: ${ctx.input.sharedHopes || "—"}
10. Do not duplicate sibling given names.
11. Avoid negative/slang meanings in ${country.en}.
12. Honour religion context without inventing false religious requirements.
13. In whySi/whyEn, briefly say how the name suits the horoscope persona temperament when a persona is present.
14. JSON only:
{"names":[{"first":{"sinhala","roman","startsWith"},"middle":{"sinhala","roman","startsWith"},"meaningSi","meaningEn","whySi","whyEn","familyFitSi","familyFitEn","countryFitSi","countryFitEn","score"}]}

First-name seeds: ${JSON.stringify(firstSeeds.map((s) => ({ sinhala: s.sinhala, roman: s.roman })))}
Middle-name seeds: ${JSON.stringify(middleSeeds.map((s) => ({ sinhala: s.sinhala, roman: s.roman })))}
`;

  const llm = new ChatOpenAI({
    model: ctx.model,
    temperature: 0.75,
    apiKey: process.env.OPENAI_API_KEY,
    modelKwargs: { response_format: { type: "json_object" } },
  });

  let out: SuggestedName[] = [];
  try {
    const res = await llm.invoke([
      new SystemMessage(
        "You are one specialist agent in a LangGraph naming ensemble. Output valid JSON only. Always return first+middle name pairs. Never break letter rules.",
      ),
      new HumanMessage(prompt),
    ]);
    const raw =
      typeof res.content === "string"
        ? res.content
        : JSON.stringify(res.content);
    const parsed = nameResponseSchema.parse(JSON.parse(raw));
    for (const n of parsed.names) {
      const firstStart = resolvePartStart(n.first, ctx.firstLetters);
      const middleStart = resolvePartStart(n.middle, ctx.middleLetters);
      if (!firstStart || !middleStart) continue;
      if (
        n.first.roman.trim().toLowerCase() ===
        n.middle.roman.trim().toLowerCase()
      ) {
        continue;
      }
      let score = n.score ?? (firstStart === ctx.primary ? 84 : 70);
      if (score > 0 && score <= 10) score = Math.round(score * 10);
      score = Math.min(100, Math.max(0, score));
      const first = makePart(
        n.first.sinhala,
        n.first.roman,
        firstStart,
        ctx.primary,
      );
      const middle = makePart(
        n.middle.sinhala,
        n.middle.roman,
        middleStart,
        ctx.primary,
      );
      out.push({
        sinhala: `${first.sinhala} ${middle.sinhala}`,
        roman: `${first.roman} ${middle.roman}`,
        first,
        middle,
        startsWith: firstStart,
        isPrimaryLetter: first.isPrimaryLetter,
        meaningSi: n.meaningSi,
        meaningEn: n.meaningEn,
        whySi: n.whySi,
        whyEn: n.whyEn,
        familyFitSi: n.familyFitSi,
        familyFitEn: n.familyFitEn,
        countryFitSi: n.countryFitSi ?? `${country.si} ජීවිතයට ගැලපේ.`,
        countryFitEn: n.countryFitEn ?? `Fits life in ${country.en}.`,
        agentId: agent.id,
        agentLabelSi: agent.si,
        agentLabelEn: agent.en,
        score,
        letterSource: ctx.letterSource,
      });
    }
  } catch {
    out = pairFallbackNames(
      ctx.firstLetters,
      ctx.middleLetters,
      ctx.primary,
      ctx.gender,
      Math.min(4, ctx.perCount),
      personality,
      ctx.country,
      ctx.letterSource,
    );
  }

  return {
    batches: out,
    graphTrace: [`personality:${personality}:${out.length}`],
  };
}

function criticMergeNode(
  state: NamingGraphStateType,
): Partial<NamingGraphStateType> {
  const ctx = state.ctx;
  let merged = criticMerge(
    state.batches,
    ctx.primary,
    ctx.firstLetters,
    ctx.middleLetters,
    ctx.targetCount + 8,
  );
  if (merged.length < ctx.targetCount) {
    merged = criticMerge(
      [
        ...merged,
        ...pairFallbackNames(
          ctx.firstLetters,
          ctx.middleLetters,
          ctx.primary,
          ctx.gender,
          ctx.targetCount,
          ctx.personalities[0],
          ctx.country,
          ctx.letterSource,
        ),
      ],
      ctx.primary,
      ctx.firstLetters,
      ctx.middleLetters,
      ctx.targetCount + 8,
    );
  }
  return {
    merged: merged.slice(0, ctx.targetCount + 4),
    graphTrace: [`critic_merge:${merged.length}`],
  };
}

/**
 * factor_align critic: score every candidate on horoscope personality,
 * readability, memorability, modern fit, meaning language, religion, country.
 */
async function factorAlignNode(
  state: NamingGraphStateType,
): Promise<Partial<NamingGraphStateType>> {
  const ctx = state.ctx;
  let scored = applyDeterministicFactors(state.merged, {
    persona: ctx.horoscopePersona,
    country: ctx.country,
    nameLanguage: ctx.input.nameLanguage,
    religion: ctx.input.religionContext,
  });
  scored = await refineFactorsWithLlm(scored, {
    persona: ctx.horoscopePersona,
    country: ctx.country,
    nameLanguage: ctx.input.nameLanguage,
    religion: ctx.input.religionContext,
    model: ctx.model,
  });
  const ranked = sortByAlignment(scored).slice(0, ctx.targetCount);
  return {
    merged: ranked,
    graphTrace: [
      `factor_align:${ranked.length}:persona=${ctx.horoscopePersona ? ctx.horoscopePersona.lagnaRashi : "none"}`,
    ],
  };
}

/** Compiled LangGraph naming ensemble. */
export function buildNamingGraph() {
  const graph = new StateGraph(NamingGraphState)
    .addNode("personality_agent", personalityAgentNode)
    .addNode("critic_merge", criticMergeNode)
    .addNode("factor_align", factorAlignNode)
    .addConditionalEdges(START, fanOutPersonalities, ["personality_agent"])
    .addEdge("personality_agent", "critic_merge")
    .addEdge("critic_merge", "factor_align")
    .addEdge("factor_align", END);
  return graph.compile();
}

let cachedGraph: ReturnType<typeof buildNamingGraph> | null = null;

export function getNamingGraph() {
  // Avoid stale graph shapes during Turbopack HMR in development.
  if (process.env.NODE_ENV !== "production") {
    return buildNamingGraph();
  }
  if (!cachedGraph) cachedGraph = buildNamingGraph();
  return cachedGraph;
}
