# Modern Name Studio: source-linked, culture-aware names

## Catalogue expansion

The public suggest/reshuffle endpoints use only the audited catalogue: no model
creates names, suffixes or meanings, and legacy unfiltered seeds are not a fallback.
Expanded from **77 to 496 unique records**, with **447 sourced readings** and
**49 review-only records** (excluded by default). “Sourced” is evidence for the
stated reading, not certification of full-name etymology or current popularity.

| Editorial culture | Records |
|---|---:|
| sinhala | 215 |
| international | 92 |
| tamil | 85 |
| arabic | 104 |

Gender: **263 male, 215 female, 18 unisex**. Evidence: **109 lexical,
273 name-reference, 65 explicitly derived, 49 unverified**. Era: **386 modern,
91 timeless, 19 traditional**. Culture is not religion; compatibility tags overlap:

| Preference | Male | Female | Unisex | Total | Sourced | Review-only |
|---|---:|---:|---:|---:|---:|---:|
| buddhist | 102 | 98 | 11 | 211 | 176 | 35 |
| hindu | 69 | 56 | 6 | 131 | 130 | 1 |
| christian | 58 | 34 | 1 | 93 | 81 | 12 |
| islamic | 62 | 43 | 2 | 107 | 105 | 2 |
| secular | 146 | 143 | 16 | 305 | 270 | 35 |

These are catalogue counts, not counts after gender/letter/traditional filters.
The Sinhala culture bucket is largest. Some nondevotional Sinhala lexical names
are shared with Hindu/neutral contexts; those labels do not identify any bearer.

## Preferences, safety gates and letters

- Buddhist/Sinhala is the explicit, changeable default, never inferred from a
  chart, account, location or person. Other choices: Hindu/Tamil,
  Christian/Catholic, Muslim, Neutral/modern. Legacy `interfaith` permits all
  contexts; `unspecified` normalizes to the product default.
- **Both** first and middle names must pass gender, culture, letter and evidence
  gates before scoring. Clear deity/biblical names are confined to their contexts:
  Mahesh, Mohan, Manoj, Mukund, Pavan, Kavish, Ravish and Bharath are not default
  Buddhist names. Matthew/Noah are not labelled neutral to fill a gap.
- Review-only meanings require explicit opt-in, carry a warning, and receive a
  score penalty. Traditional names likewise require a separate opt-in.
- Nakshatra/pada selection is preserved. The existing explicit base-consonant
  allowance is retained: e.g. a පි selection may also allow another ප vowel form.
  The UI distinguishes exact-syllable counts from these permitted base matches.
  This is not permission to change a consonant: **ට ≠ ත, ළ ≠ ල**.
- No sourced Buddhist boy entry for **ට/ටි** was found in the checked references.
  This is a catalogue gap, not a claim that such names cannot exist. No invented
  filler is added. The UI lists matches under **other letters already allowed**;
  with only rare letters it honestly asks the family to consult before broadening.
  It does not silently add a new starting letter. See [all-letter coverage](NAMES_COVERAGE.md).
- Cards show Sinhala, Roman spelling, both meanings, religion/era tags, reference
  links, and explicit root-derived or unverified notices. Profile/sign-in and
  licensing guards remain unchanged. Responses are private/no-store.

## Sources and confidence

Each record includes an HTTPS `source`; compounds may include `supportingSources`.
`meaningBasis` separates **lexical**, **name-reference**, **derived**, and
**unverified**. A valid dictionary root is not proof of an entire coined name's
history. Proposed root readings say “derived from …”; no guessed flattering
full-name meaning is presented as established. Sinhala spellings, transliterations,
compatibility and syllable estimates still warrant native-language review.

References consulted include:
- [Kosha Sanskrit dictionaries](https://kosha.sanskrit.today/), hosting Apte,
  Monier-Williams and other dictionaries. Examples: [mihira](https://kosha.sanskrit.today/word/sa/mihira),
  [kavindra](https://kosha.sanskrit.today/word/sa/kavIndra), [pavitra](https://kosha.sanskrit.today/word/sa/pavitra).
- [Pali pamoda](https://dictionary.buddhistdoor.net/details/pamoda-2/) and
  [pamudita](https://www.wisdomlib.org/definition/pamudita). Root evidence is
  distinguished from shortened modern name forms.
- Sinhala [Madura මිහි](https://www.maduraonline.com/?find=මිහි),
  [මිතු](https://www.maduraonline.com/?find=මිතු),
  [ළහිරු](https://www.maduraonline.com/?find=ළහිරු), and
  [අනගි](https://www.maduraonline.com/?find=අනගි).
- University of Madras Tamil Lexicon, [Madurai Tamil dictionary](https://dt.madurai.io/விடி),
  and exact-name attestations such as [Vidiyan](https://tamil.zone/tamil-name-finder/vidiyan/).
- [Behind the Name](https://www.behindthename.com/), including Arabic, Hebrew,
  Greek, Latin and international name references. Submitted entries and commercial
  FirstCry/Bachpan/MoonAstro attestations are weaker than dictionaries and retain
  their actual links; they are not official usage evidence.
- Arabic lexical references where required, e.g. [شفاء](https://en.wiktionary.org/wiki/شفاء)
  for Shifa and [يمنى](https://en.wiktionary.org/wiki/يمنى) for Yumna.

**472 unique active primary/supporting URLs were checked.** The HTTP audit returned
467 successful pages, three provider 403s (Bachpan Janeesh/Ravish and review-only
Wisdomlib Madhumitha), and two timeouts (Clara/Joshua). Alternate public fetches
read Bachpan and Clara/Joshua. A blocked fetch is not proof of a missing page;
Madhumitha remains review-only. HTTP success alone is not semantic verification.
The semantic review corrected Arabic Hana/Lina/Sami/Hamid/Zahra homonym links,
Nadia's unsupported “tender” gloss (reference says “announcement/call”), Imran's
unsupported “prosperity” gloss, and empty Sanskrit pages. Parked Quranicnames
URLs were discarded. Lahiru uses the actual **ළහිරු** dictionary spelling; Sithija
and Ishara were moved to review instead of asserting uncertain origins.

There is **no official 2026 Sri Lankan newborn popularity dataset used here**.
Modern/timeless/traditional are editorial style tags (`editorial-unranked`,
`usageVerified:false`), not measured popularity. Janeesh/ජනීෂ් and
Vidiyan/විදියන් guide sound/style; adult-name attestation cannot prove newborn
frequency. Legacy Moran/Mokan/Mohinda/Peresha/Novin/Malith/Pasindu glosses remain
unapproved; this does not declare the real names invalid.

## Review-queue decisions

Eight requested entries now have **qualified root readings** (`derived`), not
claims that a historical full-name etymology is certified:

| Name | Qualified reading | Evidence |
|---|---|---|
| Janeesh / ජනීෂ් | Derived from janesa (jana + isa): lord of people, king; modern name spelling. | [reference 1](https://kosha.sanskrit.today/word/sa/janeza) · [reference 2](https://www.bachpan.com/meaning-of-janeesh.aspx) |
| Vidiyan / විදියන් | Derived reading from Tamil vidi: dawn; not an established Sanskrit/Pali etymology. | [reference 1](https://dt.madurai.io/விடி) · [reference 2](https://tamil.zone/tamil-name-finder/vidiyan/) |
| Mihin / මිහින් | Derived from Sinhala mihi: earth; modern name-form, not a certified historical full-name etymology. | [reference 1](https://www.maduraonline.com/?find=%E0%B6%B8%E0%B7%92%E0%B7%84%E0%B7%92) |
| Mithum / මිතුම් | Derived from Sinhala mitu: friend; not a claim that the name means loving-kindness. | [reference 1](https://www.maduraonline.com/?find=%E0%B6%B8%E0%B7%92%E0%B6%AD%E0%B7%94) |
| Pavith / පවිත් | Derived from pavitra: pure; shortened name-form | [reference 1](https://kosha.sanskrit.today/word/sa/pavitra) · [reference 2](https://www.moonastro.com/babyname/baby%20name%20pavith%20meaning.aspx) |
| Pinsara / පින්සර | Derived root reading: Sinhala pin (merit) + sara (essence) | [reference 1](https://www.maduraonline.com/?find=merit) · [reference 2](https://kosha.sanskrit.today/word/sa/sAra) |
| Ravindu / රවිඳු | Derived from ravi + indu: sun + moon; Sinhala compound reading. | [reference 1](https://kosha.sanskrit.today/word/sa/ravi) · [reference 2](https://kosha.sanskrit.today/word/sa/indu) |
| Kavindu / කවිඳු | Derived reading of kavindra (kavi + indra): chief of poets; proposed Sinhala adaptation. | [reference 1](https://kosha.sanskrit.today/word/sa/kavIndra) · [reference 2](https://kosha.sanskrit.today/word/sa/kavi) · [reference 3](https://kosha.sanskrit.today/word/sa/indra) |

Vidiyan's proposed Tamil **vidi/dawn** reading does **not** assert Sanskrit/Pali
origin or that the user's විදියන් spelling is an exact Tamil retroflex
transcription. Mithum derives from Sinhala **මිතු/friend**, not invented
“loving-kindness”. Pinsara's “merit + essence” is a proposed root reading, not
an established “full of merit” etymology. Kavindu is a proposed Sinhala adaptation
of **kavindra**, not a rule for inventing arbitrary suffixes.

Still review-only: **Mineth, Minula, Pinith, Pamith, Pulith, Tishan, Monica,
Malani**. Similar-sounding roots do not resolve them. Monica has uncertain
etymology; Malani is not silently equated to Malini. Their source/attestation
links remain visible, but meanings are unverified. A further 41 expanded entries
are likewise review-only. Full current list:

Aaron, Alan, Anthony, Anudi, Ayomi, Damsari, Dilhani, Dinithi, Dulani, Dulith, Elena, Imasha, Iresha, Ishara, Jacob, James, Janudi, Julia, Julian, Leah, Madhumitha, Malani, Malsha, Mariam, Methmi, Mineth, Minoli, Minula, Miyusi, Monica, Naduni, Nimshi, Oliver, Owen, Pamith, Pinith, Pulith, Ravishan, Rithika, Ruqayya, Sajith, Sandali, Sanjana, Savin, Senuri, Sithija, Tishan, Vishmi, Yoshini.

## Ranking and varied results

Hard gates precede ranking. Pair weights remain:
- 30% letter fit: exact primary 100; allowed alternate/base 80;
- 30% mean modernity: modern 88, timeless 68, traditional 30; +6 for existing
  spellings ending `-eesh/-ish/-ith/-th/-yan/-n/-ra`, +4 for estimated 2–4
  syllables, capped at 100;
- 25% deterministic readability (Roman length, vowels, awkward clusters);
- 15% religion fit (100 only after both names pass the gate);
- subtract 15 for explicitly opted-in uncertain readings.

The suffix bonus never creates names. Request-specific jitter is at most four
points. Rank lightweight candidate references, then round-robin first-name
**variant groups** before constructing the requested narratives. Mihira/Mihiru,
Piumi/Piyumi, Pramod/Pamod and Sasini/Shashini do not inflate first-name diversity.
The fixture now returns **25 distinct first names** with default gates, not twenty
recombinations of ten first names. The [top 20 fixture](NAMES_FIXTURE.md) records a
fixed variation; UI reshuffles intentionally vary.

The client remembers up to 2048 shown pair keys plus rejected parts within the
component session. Generation excludes them; reshuffle preserves the untouched
part and recomputes all meanings/tags/scores from canonical records. Finite-pool
exhaustion returns 409, not repeats or invented names. Changing preferences clears
results/history; this is not permanent cross-device exclusion.

## Payload and droplet budget

Four compact static chunks in `src/lib/names/catalogue-data/` total **77,797 bytes**
plus the existing core catalogue. These are imported only by server routes; the
browser receives requested result records, not the catalogue. No runtime source
fetching, vector index, model request or new dependency. Readability was extracted
into a tiny pure helper so curated ranking need not load LangChain.

A deliberately broad all-context/both-gender request creates only 200 result
narratives. Box measurement: about281ms, ~15.2MiB incremental heap (GC-dependent),
~496KB JSON for200 results. Tests enforce <96MiB heap delta and <768,000-byte
payload. These are local measurements, not a production memory guarantee; the
2GB droplet still needs normal concurrency limits and existing PDF budgets.

## Reshuffle 400: two confirmed failures

1. **Production persistence permissions** (read-only inspection): `handahana-web`
   ran as uid 100 / gid 101; `/var/lib/handahana` was root:root mode 755 and not
   writable. Reshuffle wrote a mandatory downvote before returning a replacement.
   The resulting EACCES was caught and misreported as **400 Bad Request**.
   A local real-HTTP test reproduces the same EACCES/400 with an unwritable
   feedback path even with a small valid pool.
2. **Contract mismatch**: generation publicly allows 200 names, while reshuffle
   accepted a pool of at most 80. The UI sent the entire result array. The local
   baseline generated 100 names and its real reshuffle endpoint returned 400
   with a Zod `pool` size error.

Fixes:

- Fixed non-root image uid/gid **1001:1001**, with its data directory provisioned.
- A network-isolated, read-only-root-filesystem, memory-capped one-shot Compose
  init repairs **only Hadahana's named data volume**, including existing root-owned
  volumes, before web startup. It never touches LUMS/HomeOS/other host paths.
- No live permission mutation was performed for this PR. Merge/deployment will
  execute the scoped migration through the normal pipeline.
- Optional feedback-write failure no longer breaks a valid replacement: return
  the replacement with `feedbackSaved:false` and a user-visible warning, retaining
  session-level exclusions. Standalone feedback writes report **503**, not 400,
  with no filesystem details. No false “saved” success is shown.
- Shared bounded reshuffle schema accepts the public 200-name legacy pool and
  only requires part identities, not every narrative/scoring field. The new UI
  sends compact exclusions rather than a full pool. Still reject >200 pool rows,
  invalid fields or requests above 768,000 encoded bytes.
- Existing sign-in/license/feature guards remain. Responses are private/no-store;
  feedback responses no longer expose filesystem debug paths or raw event/session
  history.

## Verification

- `verify-name-quality.mts`: culture/gender gates, exact/base letters, religion
  leakage, traditional/review opt-ins, first-name diversity, score and exclusions,
  fixed-part preservation, reshuffle schemas/boundaries.
- `verify-name-catalogue.mts`: ≥400 records, source/basis integrity, five cultures
  × two genders, all 108 padas' unique letters, eight resolved/eight pending queue
  assertions, 25 distinct fixture first names, ranker-score equivalence, worst-case
  bounded payload/heap.
- `verify-names-ui.mjs`: isolated mock LUMS plus real Next.js at 390/1280px,
  both baseline 400 reproductions, resilient reshuffle during feedback outage,
  culture invalidation, varied regeneration, scarcity text, derived/review evidence,
  guest protection and refreshed screenshots. No production account or model API.
- CI runs lint, typecheck, unit/regression tests and production build, plus a
  non-root offline Chromium/Sinhala PDF smoke and real Compose volume migration.
  The migration fixture is **nonempty**: Docker otherwise copies image directory
  ownership onto an empty mounted volume, invalidating the root-owned simulation.
  It checks old data survives and uid 1001 can write/rename/read. No Docker daemon
  exists on the box, so that image/migration validation is CI-only.

No live production changes or deployment were made. Yasura merges the PR himself.
