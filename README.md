# හඳහන ස්ටූඩියෝ · Handahana Studio

Repo: [`helloyasura/hadahana`](https://github.com/helloyasura/hadahana) · Live: `https://ervanta.com/hadahana`

Complete Sri Lankan **Kendraya / Handahana** workspace for jyotishiya workflows.

**Preferred languages: Sinhala + English** (UI defaults to Sinhala).

Deploy notes: [`docs/DEPLOY.md`](docs/DEPLOY.md).

## Features

- Kendraya cast — Lahiri ayanamsa, Swiss Ephemeris (via `vpv-panchangam`), whole-sign houses
- Nam Thebima — multi-letter sets (pada + Tara subha/asubha + lagna/weekday)
- Full palapala scaffold (12 bhava)
- Vimshottari maha / antar
- Dasa Porondam matching
- Muhurta · Rahu Kalaya · Yamaganda · Gulika (ephemeris-backed)
- Daily Panchanga
- Dosha / yoga screens (Kuja, Kalsarpa, Gaja Kesari…)
- Sri Lanka hospital / town presets (incl. Asiri Kandy)
- Print / JSON export — **A4 layouts**: single page, full multi-page, print book/booklet, charts-only (+ landscape / Letter)
- **Agentic Name Studio** — multi-personality ensemble (~20 names), living-country style, family interests; Kendraya letters mandatory

## Quick start

```bash
npm install
cp .env.example .env.local   # add OPENAI_API_KEY (never commit)
npm run dev
```

Open http://localhost:3000 (or the port you choose).

Default fixture: son born **2026-11-04 07:46** at **Asiri Hospital Kandy**.

### Athurudaya AI agent

- Tab **ආතුරුදය AI** — calc-first OpenAI agent with tools + RAG over `knowledge/`
- Tools: cast, nam, satahana, porondam, muhurta, panchanga, palapala/dosha, `search_knowledge`
- MCP-shaped stdio sketch: `npm run mcp:handahana`
- Architecture notes: `docs/AGENTIC_BRAINSTORM.md`

**Security:** rotate any API key that was pasted in chat; keep keys only in `.env.local` / platform secrets.

### Name Studio (agentic)

On **Nam Thebima**:

1. Choose letter source — **Chart letters** (from cast Kendraya) or **Manual letters** (separate option; type first/middle starting aksharas yourself)
2. Enter mother / father / siblings and shared hopes
3. Pick **living country** (LK keeps Sinhala-home style; AU/UK/US… switch diaspora-friendly roman forms)
4. Choose living country, **name language**, and optional **religion / faith** context
5. Choose a naming agent or **Ensemble** (recommended — includes Sinhala language, literature/writer, multi-religion)
6. Optionally **verify against current-generation names** via web for that country + language
7. Generate ~20 **first + middle** letter-safe names → **Pick this** for a favourite

**Agent harness:** Ensemble runs on **LangChain + LangGraph** (`src/lib/names/harness/`) — personalities fan out in parallel, a critic merges letter-safe pairs, then usage verification boosts current-generation fits.

Personalities: Traditional Athurudaya · Diaspora-friendly · Multicultural bridge · Meaning weaver · Family harmony · **Sinhala language expert** · **Sinhala literature & writer** · **Multi-religion naming expert**.

Verify: `npm run verify:names` (chart මො pairs + manual මො/ර → ස/ක + base consonant + LangGraph harness).

## API

| Route | Method | Body |
| --- | --- | --- |
| `/api/cast` | POST | birth details → chart + dosha + palapala |
| `/api/nam` | POST | birth → Nam Thebima only |
| `/api/names/suggest` | POST | birth + family + `livingCountry` + personality → ~20 names |
| `/api/names/meta` | GET | countries, personalities, interests |
| `/api/porondam` | POST | `{ personA, personB }` |
| `/api/muhurta` | POST | `{ date, placeId }` |
| `/api/panchanga` | POST | `{ date, placeId }` |
| `/api/places` | GET | SL presets |

Birth body fields: `date`, `time`, `placeId` (or lat/lon), optional `nativeName`, `gender`, `ayanamsa`.

## Stack

Next.js · TypeScript · Tailwind · Zod · Swiss Ephemeris WASM

## Note

Shows tendencies and timing — not fixed fate. Confirm marriage / medical decisions with a qualified athurudaya.
