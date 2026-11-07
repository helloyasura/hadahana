/**
 * OpenAI tool-calling loop — senior SL athurudaya agent.
 */

import OpenAI from "openai";
import { AGENT_TOOL_DEFS, runAgentTool } from "@/lib/agent/tools";

export type AgentMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

export type BirthContext = {
  date: string;
  time: string;
  placeId?: string;
  placeName?: string;
  latitude?: number;
  longitude?: number;
  gender?: string;
  nativeName?: string;
};

const SYSTEM_SI_EN = `You are a senior Sri Lankan Handahana / Kendraya athurudaya assistant inside Handahana Studio.

CRITICAL RULES:
1. NEVER invent planetary longitudes, nekatha, pada, dasha dates, or Rahu Kalaya. Always call the provided tools first.
2. Prefer Sinhala for the main answer; add a short English summary when helpful. If the user writes in English, answer in English with Sinhala key terms.
3. Structure serious readings as:
   - ගණනය / Computed facts (from tools)
   - නිරීක්ෂණ / Findings
   - උපදෙස් / Practical guidance (naming, studies, career/staff, muhurta)
   - අවදානම් / Caveats (not fixed fate; verify with elder athurudaya for marriage/medical)
4. For studies/education: weigh 4th/5th/9th bhava, Mercury, Jupiter, and current/coming dasha — as tendencies only.
5. For career/livelihood/staff: 10th/6th/2nd, dasha lords — tendencies only.
6. For Nam Thebima: use nam_thebima; stress phonetic start; multi-letter Tara sets; avoid Rahu Kalaya for ceremony.
7. When using search_knowledge, cite the returned file paths.
8. Be calm, precise, and culturally grounded in Sri Lankan practice (Lahiri, whole-sign, Nam Thebima).
9. If birth details are in the session context, reuse them in tool calls unless the user overrides.`;

export async function runAthurudayaAgent(input: {
  messages: AgentMessage[];
  birth?: BirthContext | null;
  topic?: string | null;
}) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is not configured. Add it to .env.local (never commit the key).",
    );
  }

  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
  const client = new OpenAI({ apiKey });

  const contextBlock = input.birth
    ? `\n\n[Session birth context]\n${JSON.stringify(input.birth)}\nUse these values for tool calls unless the user gives different details.`
    : "";

  const topicBlock = input.topic
    ? `\n\n[Requested topic focus]: ${input.topic}`
    : "";

  type Msg =
    | OpenAI.Chat.Completions.ChatCompletionMessageParam
    | OpenAI.Chat.Completions.ChatCompletionToolMessageParam;

  const messages: Msg[] = [
    { role: "system", content: SYSTEM_SI_EN + contextBlock + topicBlock },
    ...input.messages.map((m) => ({
      role: m.role as "user" | "assistant" | "system",
      content: m.content,
    })),
  ];

  const toolCallsLog: Array<{ name: string; args: string; ok: boolean }> = [];
  const maxHops = 8;

  for (let hop = 0; hop < maxHops; hop++) {
    const completion = await client.chat.completions.create({
      model,
      messages,
      tools: AGENT_TOOL_DEFS.map((t) => ({
        type: "function" as const,
        function: {
          name: t.name,
          description: t.description,
          parameters: t.parameters,
        },
      })),
      tool_choice: "auto",
      temperature: 0.3,
    });

    const choice = completion.choices[0];
    const msg = choice.message;
    messages.push(msg);

    const calls = msg.tool_calls;
    if (!calls?.length) {
      return {
        ok: true as const,
        reply: msg.content ?? "",
        model,
        toolCalls: toolCallsLog,
        finishReason: choice.finish_reason,
      };
    }

    for (const call of calls) {
      if (call.type !== "function" || !("function" in call)) continue;
      const name = call.function.name;
      const args = call.function.arguments || "{}";
      try {
        const result = await runAgentTool(name, args);
        toolCallsLog.push({ name, args, ok: true });
        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify(result).slice(0, 120000),
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        toolCallsLog.push({ name, args, ok: false });
        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify({ error: message }),
        });
      }
    }
  }

  return {
    ok: true as const,
    reply:
      "ගණනය දිගටම කරමින් සිටියදී සීමාවට ළඟා විය. කෙටියෙන් නැවත අසන්න. / Tool loop limit reached — please ask a narrower question.",
    model,
    toolCalls: toolCallsLog,
    finishReason: "tool_loop_limit",
  };
}
