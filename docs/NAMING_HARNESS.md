# Naming Agent Harness (LangChain + LangGraph)

Name Studio ensemble is orchestrated by a **LangGraph agent harness** under `src/lib/names/harness/`.

## Why

Ad-hoc `Promise.all` personality calls lacked a clear orchestration boundary. The harness gives:

- Explicit multi-agent fan-out / merge graph
- Shared letter guards (base consonant rule, surname block)
- Horoscope personality / behaviour brief injected into every specialist
- Multi-factor suitability scoring (factor_align critic)
- Seed fallback when OpenAI is unavailable or a node fails
- Traceable `graphTrace` for debugging which personalities ran

## Graph

```
START
  └─ fan_out (Send × each personality)
       └─ personality_agent  (ChatOpenAI JSON, letter-filtered, persona-aware)
            └─ critic_merge  (dedupe + letter re-check + seed top-up)
                 └─ factor_align  (horoscope + readability + memory + modern + meaning + religion + country)
                      └─ END
```

Usage verification (current-generation web lists) runs **after** the graph in `suggestModernNames` and boosts `modernGenerationFit`.

## Horoscope persona

`buildHoroscopePersona()` (from lagna + Moon/nekatha) produces a temperament & behaviour brief. Every personality agent receives it so proposed meanings/sounds suit the kind of person the chart tends to describe (not fate).

## Suitability factors (0–100)

| Factor | Intent |
| --- | --- |
| horoscopePersonalityFit | Name suits predicted temperament / behaviour |
| readability | Easy to read aloud (SI + roman) |
| memorability | Easy to remember |
| modernGenerationFit | Current-generation feel (+ usage verify boost) |
| meaningLanguageFit | Clear meaning in family’s language preference |
| religionFit | Respectful of faith / secular / interfaith context |
| countryFit | Living-country school / passport practicality |

Composite score blends weighted factors with the agent’s own score; ranking prefers primary letter, usage hits, then horoscope fit.

## Personalities (ensemble)

| Country | Agents |
| --- | --- |
| Sri Lanka | athurudaya, sinhala_language, sinhala_literature, multi_religion, meaning_weaver, family_harmony |
| Diaspora | diaspora, multicultural, sinhala_language, multi_religion, meaning_weaver, family_harmony |

Single-personality mode still uses the same graph with one `Send`.

## User feedback learning

Like / dislike signals persist in `data/name-feedback.json` (override with `NAME_FEEDBACK_DB_PATH`):

- `POST /api/names/feedback` — up/down on `full` | `first` | `middle`
- `POST /api/names/reshuffle` — downvote the marked part, then randomize a replacement first/middle and recombine
- `GET /api/names/feedback` — rating table + learning snapshot

Generation loads the learning snapshot into every personality prompt and re-ranks with `applyLearningToNames` (boost uprated first names, demote / filter downrated ones).

## Entry points

- Public API: `suggestModernNames()` → `runNamingHarness()`
- Graph: `getNamingGraph()` / `buildNamingGraph()`
- Persona: `src/lib/names/horoscope-persona.ts`
- Factors: `src/lib/names/factor-align.ts`
- Feedback: `src/lib/names/feedback-store.ts`, `src/lib/names/reshuffle.ts`
- Shared guards: `src/lib/names/name-pipeline.ts`
