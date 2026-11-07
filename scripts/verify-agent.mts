import { config } from "dotenv";
config({ path: ".env.local" });

import { runAthurudayaAgent } from "../src/lib/agent/athurudaya";

const result = await runAthurudayaAgent({
  birth: {
    date: "2026-11-04",
    time: "07:46",
    placeId: "asiri-kandy",
    gender: "male",
    nativeName: "Son",
  },
  topic: "studies",
  messages: [
    {
      role: "user",
      content:
        "මේ දරුවාට ඉගෙනුම් පැත්තෙන් සහ නම් තැබීමේ අකුරු ගැන කෙටියෙන් කියන්න. ගණනය කරලා පමණයි කථා කරන්න.",
    },
  ],
});

console.log(
  JSON.stringify(
    {
      ok: result.ok,
      model: result.model,
      tools: result.toolCalls.map((t) => t.name),
      replyPreview: result.reply.slice(0, 800),
    },
    null,
    2,
  ),
);
