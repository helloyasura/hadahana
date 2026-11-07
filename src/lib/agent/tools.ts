/**
 * MCP-shaped tool adapters over Handahana calc engines + RAG.
 * Same handlers can later be exposed via a real MCP stdio server.
 */

import { z } from "zod";
import { castKendraya, namThebimaOnly, type BirthInput } from "@/lib/astrology/kendraya";
import { matchPorondam } from "@/lib/astrology/porondam";
import { computeMuhurta } from "@/lib/astrology/muhurta";
import { getPanchanga } from "@/lib/astrology/panchanga";
import { buildSatahana } from "@/lib/astrology/satahana";
import { analyzeDoshaYoga } from "@/lib/astrology/dosha";
import { buildPalapala } from "@/lib/astrology/palapala";
import { searchKnowledge } from "@/lib/agent/rag";

const birthZod = z.object({
  date: z.string(),
  time: z.string(),
  placeId: z.string().optional(),
  placeName: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  timezone: z.string().optional(),
  gender: z.enum(["male", "female", "unspecified"]).optional(),
  nativeName: z.string().optional(),
});

export const AGENT_TOOL_DEFS = [
  {
    type: "function" as const,
    name: "cast_kendraya",
    description:
      "Cast a Sri Lankan Kendraya (Lahiri, Swiss Ephemeris, whole-sign). Use BEFORE any chart interpretation.",
    parameters: {
      type: "object",
      properties: {
        date: { type: "string", description: "YYYY-MM-DD" },
        time: { type: "string", description: "HH:MM local" },
        placeId: { type: "string", description: "e.g. asiri-kandy" },
        placeName: { type: "string" },
        latitude: { type: "number" },
        longitude: { type: "number" },
        gender: { type: "string", enum: ["male", "female", "unspecified"] },
        nativeName: { type: "string" },
      },
      required: ["date", "time"],
      additionalProperties: false,
    },
  },
  {
    type: "function" as const,
    name: "nam_thebima",
    description:
      "Compute Nam Thebima multi-letter set from Moon pada + Tara + lagna/weekday.",
    parameters: {
      type: "object",
      properties: {
        date: { type: "string" },
        time: { type: "string" },
        placeId: { type: "string" },
        gender: { type: "string", enum: ["male", "female", "unspecified"] },
        nativeName: { type: "string" },
      },
      required: ["date", "time"],
      additionalProperties: false,
    },
  },
  {
    type: "function" as const,
    name: "build_satahana",
    description: "Build traditional කේන්ද්‍ර සටහන payload (Rashi + Navamsa + tables).",
    parameters: {
      type: "object",
      properties: {
        date: { type: "string" },
        time: { type: "string" },
        placeId: { type: "string" },
        gender: { type: "string" },
        nativeName: { type: "string" },
      },
      required: ["date", "time"],
      additionalProperties: false,
    },
  },
  {
    type: "function" as const,
    name: "match_porondam",
    description: "Dasa Porondam match between two births.",
    parameters: {
      type: "object",
      properties: {
        personA: { type: "object", additionalProperties: true },
        personB: { type: "object", additionalProperties: true },
      },
      required: ["personA", "personB"],
      additionalProperties: false,
    },
  },
  {
    type: "function" as const,
    name: "compute_muhurta",
    description: "Rahu Kalaya / Yamaganda / Gulika for a date and place.",
    parameters: {
      type: "object",
      properties: {
        date: { type: "string" },
        placeId: { type: "string" },
      },
      required: ["date"],
      additionalProperties: false,
    },
  },
  {
    type: "function" as const,
    name: "get_panchanga",
    description: "Daily panchanga limbs for muhurta decisions.",
    parameters: {
      type: "object",
      properties: {
        date: { type: "string" },
        placeId: { type: "string" },
      },
      required: ["date"],
      additionalProperties: false,
    },
  },
  {
    type: "function" as const,
    name: "analyze_palapala_dosha",
    description: "12-bhava palapala scaffold + Kuja/yoga screens from a cast chart.",
    parameters: {
      type: "object",
      properties: {
        date: { type: "string" },
        time: { type: "string" },
        placeId: { type: "string" },
        gender: { type: "string" },
        nativeName: { type: "string" },
      },
      required: ["date", "time"],
      additionalProperties: false,
    },
  },
  {
    type: "function" as const,
    name: "search_knowledge",
    description:
      "RAG search over Sri Lankan Handahana research (naming, porondam, muhurta, craft notes). Always cite paths returned.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string" },
        k: { type: "number" },
      },
      required: ["query"],
      additionalProperties: false,
    },
  },
];

function asBirth(raw: unknown): BirthInput {
  return birthZod.parse(raw);
}

export async function runAgentTool(
  name: string,
  argsJson: string,
): Promise<unknown> {
  const args = argsJson ? JSON.parse(argsJson) : {};
  switch (name) {
    case "cast_kendraya":
      return castKendraya(asBirth(args));
    case "nam_thebima":
      return namThebimaOnly(asBirth(args));
    case "build_satahana":
      return buildSatahana(asBirth(args));
    case "match_porondam": {
      const a = asBirth(args.personA);
      const b = asBirth(args.personB);
      return matchPorondam(a, b);
    }
    case "compute_muhurta":
      return computeMuhurta({
        date: String(args.date),
        placeId: args.placeId,
      });
    case "get_panchanga":
      return getPanchanga({
        date: String(args.date),
        placeId: args.placeId,
      });
    case "analyze_palapala_dosha": {
      const chart = await castKendraya(asBirth(args));
      return {
        palapala: buildPalapala(chart),
        dosha: analyzeDoshaYoga(chart),
        vimshottari: chart.vimshottari,
        lagna: chart.lagna,
        chandra: chart.chandra,
      };
    }
    case "search_knowledge":
      return searchKnowledge(String(args.query ?? ""), Number(args.k ?? 6));
    default:
      return { error: `Unknown tool: ${name}` };
  }
}
