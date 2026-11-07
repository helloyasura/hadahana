# Handahana Studio — Agentic Athurudaya Brainstorm

## Goal

Make the app behave like a careful senior Sri Lankan **athurudaya**: not a chatbot that invents planets, but an agent that **computes first**, **retrieves classical/SL practice notes**, then **writes bilingual findings** (SI/EN) on naming, education, career tendencies, muhurta, porondam, and dasha timing.

## Non‑negotiable rules

1. **Numbers are deterministic.** Lagna, nekatha, pada, dasha, Rahu Kalaya come only from Swiss/Lahiri engines — never from the LLM.
2. **Language is SI + EN.** Default Sinhala; English on request or side‑by‑side findings.
3. **No absolute fate.** Phrase as tendencies, timing windows, and classical screens; keep medical/legal disclaimers.
4. **Secrets stay out of git.** `OPENAI_API_KEY` only in `.env.local` / platform secrets. Rotate any key pasted in chat.
5. **Cite sources** when RAG retrieves research chunks (file + section).

## What “real athurudaya work” means here

| Workflow | Calc tools | Agent adds |
| --- | --- | --- |
| Nam Thebima | `nam_thebima`, `satahana` | Multi‑letter set explanation, name sound coaching, ceremony muhurta |
| Full Handahana / palapala | `cast`, `satahana`, `dosha` | 12‑bhava reading narrative, dignity, yogas |
| Education / studies | cast + dasha + RAG | House 4/5/9 reading, Mercury/Jupiter timing, study windows |
| Career / staff / livelihood | cast + dasha + RAG | House 10/6/2, dasha lords, caution flags |
| Marriage / porondam | `porondam` + both charts | Score narrative, Kuja screen, what to verify with elder |
| Muhurta | `muhurta`, `panchanga` | Avoid windows, prefer Subha, naming day plan |
| Decision support | all tools + RAG | Structured “findings → options → risks → next check” |

## Architecture (chosen)

```
UI (SI/EN chat + chart context)
        │
        ▼
Next.js /api/agent/chat  ── OpenAI Responses / Agents loop
        │
        ├── Tools (MCP-shaped adapters)
        │     cast_kendraya · nam_thebima · match_porondam
        │     compute_muhurta · get_panchanga · build_satahana
        │     search_knowledge (RAG)
        │
        └── Knowledge corpus
              kendraya-handahana-research/** + studio docs
              chunk → embed (OpenAI) → retrieve top‑k
              (fallback: lexical BM25 if embeddings fail)
```

### Why this shape

- **OpenAI agent + tools** matches “agentic” decisioning without replacing ephemeris.
- **MCP-shaped tool layer** can later expose the same tools as a real MCP server (`stdio` / HTTP) for Cursor or other hosts.
- **RAG** grounds SL naming rules, porondam screens, and house themes in our research — not generic Western astrology.

### Alternatives set aside (for now)

| Option | Why not first |
| --- | --- |
| Pure ChatGPT with pasted chart JSON | Hallucinates degrees; no tool loop |
| Separate hosted Agent SDK only | Extra deploy surface; Studio already needs in-app chat |
| Full vector DB (Pinecone etc.) | Overkill; start with local JSON index + embeddings cache |
| Fine-tuned model | Costly; tools + RAG give control faster |

## Agent persona (system)

Senior Sri Lankan Handahana practitioner:

- Speaks Sinhala by default; English when asked.
- Always calls calc tools before conclusions.
- Structures answers: **ගණනය / Chart facts → නිරීක්ෂණ / Findings → උපදෙස් / Guidance → අවදානම් / Caveats**.
- For studies/career: ties to bhava + dasha + nakath; never guarantees results.
- Refuses medical diagnosis / legal certainty.

## MCP tool catalogue (v1)

| Tool | Input | Output |
| --- | --- | --- |
| `cast_kendraya` | birth | full chart JSON |
| `nam_thebima` | birth | letter set + guidance |
| `build_satahana` | birth | printable satahana payload |
| `match_porondam` | A + B births | 10‑fold score |
| `compute_muhurta` | date + place | Rahu/Yamaganda/Gulika |
| `get_panchanga` | date + place | tithi/yoga/karana… |
| `search_knowledge` | query, k | ranked chunks + paths |
| `analyze_topic` | birth + topic enum | optional orchestrated multi-tool (server-side) |

Topics enum: `naming | studies | career | marriage | health_screen | general_palapala | muhurta`.

## RAG plan

1. Ingest `kendraya-handahana-research/{knowledge,sources,questions,*.md}` + `docs/`.
2. Chunk ~800–1200 chars with overlap; store `{id, path, text, embedding?}`.
3. Query: embed question → cosine top‑k (k=6); always return citations.
4. Rebuild index via `npm run knowledge:index`.

## Safety / product ethics

- Label AI text as **සහායක අර්ථකථනය** (assistant interpretation), not a guru’s sealed verdict.
- Separate **computed facts** (green) from **AI findings** (amber) in UI.
- Log tool calls (no API keys) for audit.
- Rate-limit agent endpoint.

## Implementation phases

**P0 (this pass):** tools + local RAG + OpenAI agent chat in Studio UI; birth context auto-attached.  
**P1:** true MCP stdio server; streaming UI; topic presets (අධ්‍යාපනය / රැකියා / නම් තැබීම).  
**P2:** session memory, PDF findings export, auditor agent cross-check.  
**P3:** evals against fixed Asiri Kandy fixtures (letter මො, Scorpio lagna).

## Success criteria

- Ask “මේ ලමයාට ඉගෙනුම් පැත්තෙන් මොනවද කියන්නේ?” → agent calls `cast_kendraya` + `search_knowledge`, returns SI findings with house/dasha citations, no invented longitudes.
- Ask for naming → uses `nam_thebima`, primary **මො**, multi-letter set, muhurta caution.
- Key never appears in git history.
