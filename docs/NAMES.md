# Modern Name Studio: meaning-first, culture-aware catalogue

## Why this changes the old generator

The old public path combined free-form model output and a tiny, untagged seed
pool. Its offline Buddhist fixture could return Moses/Mohan/Mahesh alongside
unsupported meanings such as “Moran = skilled”, “Mokan = strong” and
“ටිෂාන් = keen”. A soft religion score did not prevent incompatible suggestions.
A short spelling was treated as evidence of current-generation usage, without
actual birth-registration statistics. Reshuffling could reintroduce the same
unfiltered seeds and stale meanings.

The public suggest/reshuffle path now uses **only the auditable catalogue** in
`src/lib/names/catalogue.ts`. No model invents names, suffixes or meanings, and
no unreviewed model output can pass a soft score. The legacy harness/seed files
remain for compatibility and their existing unit tests, but are not a fallback
for these two public endpoints. There are no new runtime dependencies or paid
calls. The UI no longer claims agent deliberation, live popularity verification
or horoscope-derived personality evidence for these curated suggestions.
Obsolete family/personality/web-verification controls have been replaced by
focused letter, culture, traditional-style and meaning-review controls.

## Preferences and hard gates

- Default: **Buddhist / Sinhala** as an explicit, changeable product preference,
  never inferred from a name, place, birth chart or account identity.
- Hindu / Tamil; Christian / Catholic; Muslim; Neutral / modern.
- API `interfaith` remains compatible with older clients; it permits the full
  tagged range. Legacy `unspecified` normalizes to the Buddhist product default.
- Both first **and** middle names must pass gender, letter and cultural gates.
  Religion tags are editorial compatibility labels, not exclusive ownership or
  claims about actual people. Shared non-devotional lexical names may fit several
  traditions. Clearly devotional deity/biblical forms are restricted to their
  tagged contexts. E.g. Mahesh/Mohan/Manoj/Mukund are not Buddhist suggestions;
  Matthew/Noah are not neutral or Buddhist suggestions. Pavan's source explicitly
  links it to Vayu, so this conservative catalogue restricts it to Hindu context.
- Names with unverified meanings are excluded unless the user explicitly selects
  **review-only** names. Their meaning remains “unverified”; no attractive gloss
  is substituted. These provisional cultural tags also need human review.
- Traditional names are excluded by default. The separate traditional toggle
  admits them with substantially lower modernity scores.
- Do not pad a scarce list. Return fewer results and a friendly exhaustion note;
  show letters with no reviewed matches. In particular, no sourced Buddhist boy
  entry is currently approved for retroflex **ට/ටි**. Do not silently use **ත/ති**.
- Existing nakshatra/pada selection and vowel-marked-to-base-consonant allowance
  are preserved. The UI explicitly explains this allowance. Sinhala spelling,
  Roman spelling, meanings, source links, cultural tags and era are visible.

## Sources and confidence

Each record has a source URL, plain Sinhala/English gloss, gender, culture, era,
syllable estimate and `meaningStatus`. `sourced` means the stated lexical/name
reading has a reference, **not** that an academic onomastician has certified
all spellings, religious suitability or newborn usage. Dictionary meanings of
ordinary roots are distinguished from uncertain full-name etymology. Sinhala
adaptations and explicit lexical readings still warrant a native speaker's
final review.

References opened/audited during this work:

- [Kosha: Mihira](https://kosha.sanskrit.today/word/sa/mihira),
  [pranita](https://kosha.sanskrit.today/word/sa/praNIta), and
  [Mukunda](https://kosha.sanskrit.today/word/sa/mukunda): hosted Apte,
  Monier-Williams and other Sanskrit dictionaries. Common lexical sense is
  stated; no personality prediction is inferred from a word.
- [Pali pamoda](https://dictionary.buddhistdoor.net/details/pamoda-2/) and
  [pamudita](https://www.wisdomlib.org/definition/pamudita): joy/delight and
  delighted. Pamod is identified as a name form of the lexical root, not a newly
  generated Sanskrit/Pali compound.
- [Pravin/Praveen](https://www.behindthename.com/name/pravin),
  [Milan](https://www.behindthename.com/name/milan),
  [Pavana](https://www.behindthename.com/name/pavana),
  [Mithun](https://www.behindthename.com/name/mithun/submitted), and
  [Muditha/Mudith](https://parenting.firstcry.com/baby-names/meaning-of-muditha/).
  Submitted-name entries and commercial secondary references are weaker evidence
  than dictionaries and are labelled by their actual links, not called official.
  Milan explicitly uses the **Slavic “dear/gracious” reading**, not an invented
  Sinhala interpretation. Mudith is a documented spelling variant.
- [University of Madras Tamil Lexicon: kavin](https://dsal.uchicago.edu/cgi-bin/app/tamil-lex_query.py?qs=%E0%AE%95%E0%AE%B5%E0%AE%BF%E0%AE%A9%E0%AF%8D&searchhws=yes),
  [Tamil in/iniya](https://dt.madurai.io/%E0%AE%87%E0%AE%A9%E0%AF%8D),
  [Malar](https://www.behindthename.com/name/malar/submitted): beauty, sweet,
  flower. Tamil culture is not itself evidence of a person's religion.
- [Madura lamp](https://www.maduraonline.com/?find=lamp),
  [sweet](https://www.maduraonline.com/?find=sweet),
  [lotus](https://www.maduraonline.com/?find=lotus): explicit Sinhala lexical
  root readings for Pahan, Mihiri and Piumi. The source does not establish a
  unique full-name etymology or newborn popularity.
- Individual Behind the Name references for Christian/Arabic names are stored
  with each record. A 45-page reference audit caught missing/ambiguous links;
  these were corrected or moved to review. No source establishes a name's actual
  bearer's religion.

There is **no reliable official 2026 Sri Lankan newborn-name frequency dataset
used here**. “Modern”, “timeless” and “traditional” are editorial style tags;
`popularity: editorial-unranked` and `usageVerified: false` are intentional.
Existing adults/sports rosters do not prove what parents name newborns in 2026.
The user examples **Janeesh / ජනීෂ්** and **Vidiyan / විදියන්** guide *sound/style*,
not invented etymologies or a claim about origin.

## Ranking and variety

Hard gates run before ranking and never get overridden by likes or an AI score.
Pair score:

- 30% starting-letter match: exact primary prefix 100; permitted alternate/base 80;
- 30% mean modernity: modern 88, timeless 68, traditional 30, +6 for documented
  existing spellings ending in `-eesh/-ish/-ith/-th/-yan/-n/-ra`, +4 for an
  estimated 2–4 syllables, capped at 100;
- 25% existing deterministic readability (Roman length/vowels/awkward clusters);
- 15% religion fit (100 only after both names pass the compatibility gate);
- subtract 15 for an explicitly opted-in, uncertain-meaning pair.

The suffix bonus never constructs a name or implies Sanskrit/Pali origin.
A maximum four-point request-specific ordering jitter adds variety among similarly
scored names. Round-robin across first names avoids twenty nearly identical
suggestions. No identical first/middle and no duplicate full pair.

The client sends up to 2,048 previously shown pair keys, and replaced-part keys,
for this component session. Regeneration excludes those pairs. Reshuffle keeps
the untouched part and rebuilds *all* meanings/tags/scores from canonical records;
it cannot retain a stale combined meaning. It excludes visible/history pairs and
rejected parts. Finite-pool exhaustion returns a helpful **409**, not a duplicate
or invented name. Changing letters/culture/toggles invalidates results and resets
this local session history; constraints for an existing result are frozen.
History is not a permanent cross-device “never again” promise.

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

## Human review queue

Not shown by default: **Janeesh, Vidiyan, Mineth, Mihin, Minula, Mithum, Pavith,
Pinith, Pinsara, Pamith, Pulith, Tishan, Monica, Ravindu, Kavindu, Malani**.
Reasons: unestablished full-name derivations, uncertain old compound readings,
or conflicting etymologies. Do not infer meanings from fashionable suffixes.
Janeesh/Vidiyan are style references, not proof of religious meaning.

Legacy entries **Moran, Mokan, Mohinda, Peresha, Novin, Malith, Pasindu** are not
approved in the new default catalogue. Their old glosses lack adequate evidence
(or conflict with other sources). This does not mean the real names are invalid;
it means the application should not confidently publish those meanings.
Mohan/Mahesh/Manoj are not intrinsically bad names: their devotional connotations
and traditional style are now explicit and gated instead of mixed into every list.
A Sinhala/Tamil language specialist and parents should review transliterations,
era judgements, compound readings and compatibility before broadening coverage.

## Tests

`verify-name-quality.mts`: five cultural contexts × two genders, letter/base
rules, scarce retroflex letters, no devotional leakage, sourced/review gate,
traditional opt-in, duplicate checks, diverse first names, non-repeating history,
part preservation, schema evolution and 100/201-row boundary.

`verify-names-ui.mjs`: isolated local mock LUMS + real Next.js at 390/1280px;
reproduces both baseline 400s, checks successful reshuffle despite unavailable
feedback, five culture API filters, changed-culture invalidation, regeneration
history, guest protection and screenshots. No production account or AI service.

CI runs lint, typecheck and the unit/regression suite. [The before/after fixture comparison](NAMES_FIXTURE.md) records 20 pairs without a private birth date or name.

CI adds an actual Docker smoke: simulate an existing root-owned named volume,
run the Compose init, then verify uid 1001 can atomically write/rename/read feedback.
The box has no Docker daemon; actual image migration validation runs in CI.
