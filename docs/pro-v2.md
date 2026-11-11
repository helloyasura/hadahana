# Pro v2 conventions and verification

Depends on visual studio PR #21. No production environment or ephemeris change.

## Timing and exact navamsa
- Vimshottari uses the existing Ketu/Venus/Sun/Moon/Mars/Rahu/Jupiter/Saturn/Mercury
  order and 7/20/6/10/7/18/16/19/17 years (120 total). Reference convention:
  Brihat Parashara Hora Shastra, Dasha of Planets / Vimshottari subdivisions.
- Bhukti and pratyantara are proportional subdivisions of the **full** parent,
  anchored before birth when necessary, then clipped to birth. Never subdivide
  a remaining balance as if it were an entire mahadasha.
- Nine mahadashas including the birth balance are shown; half-open boundaries
  [start,end) and both 360-day and 365.25-day years are tested. Date jump is
  explicitly UTC noon; table timestamps use the chart's IANA zone.
- Studio-only engine longitude doubles are now preserved additively as `longitudeExact`.
  D9 maps full precision using longitude*9 modulo 360 (the existing engine's
  direct navamsa convention), rather than six-decimal display rounding. Old
  consumer responses remain byte-identical; old saved charts fall back to their recorded longitudes. This is as exact as
  the installed ephemeris, not an independent astronomical accuracy claim.
- D9 remains a symbolic chart. D1 dignity/retrograde flags remain labelled D1.

## Natal + gochara / ingress
- Pin a calculated chart in browser memory, then request geocentric sidereal sky
  at an explicit UTC instant. Orange outer markers overlay blue natal points on
  D1 only. Transit houses are whole-sign from natal Lagna; no transit Lagna or
  automatic event predictions are implied. Changing calculation convention clears
  the pin, avoiding mixed-ayanamsa overlays. Nothing is saved without chart consent.
- Existing WASM ephemeris is sampled with selected ayanamsa and mean/true nodes.
  Each synchronous calculation selects its own sidereal state (no async state leak).
- Ingress searches are bounded to 366 days, hourly samples and bisection to a
  <=1-second bracket. Forward and retrograde entries and zodiac wrap are tested.
  Brief station-grazing excursions shorter than a sample can be missed; no-result
  means no entry *detected in that range*, not an absolute assertion.
- Solver tests include independent synthetic forward/retrograde functions and
  real ephemeris positions on both sides of a calculated Sun ingress. These test
  the solver, not independent astronomical calibration of the inherited engine.

## Integrated consultation tools
- `/pro/tools` is separately protected and uses the existing Sri Lankan/Lahiri
  daily/matching engines, **not the studio preset**. This fixed convention is
  displayed before inputs/results. Input/result data is ephemeral, no consumer
  login is required in addition to the Pro session, and no real email is sent.
- Panchanga: civil date, coordinates and IANA zone; sunrise-day tithi/vara,
  nakshatra/yoga/karana, sunrise/sunset and Rahu/Yamaganda/Gulika. Unsupported polar
  windows are not silently fabricated by the Panchanga view. Explicitly reset
  the engine to Lahiri to avoid inheriting a preceding chart's Raman/KP setting.
- Porondam: reuse existing preliminary rules. Rajju and Vedha placeholders are
  excluded from Pro results; the incomplete engine's percent/10-point aggregate
  is deliberately not displayed. Several other rules are simplified, prominently
  disclosed, not a full classical 10/20-porondam verdict or marriage advice.
- Nakath/muhurta: 1–31 inclusive days and an existing event category; returns a
  ranked **day shortlist**, not final auspicious clock times. Existing inherited
  rules/caveats are in `event-categories.ts`, `event-nakath.ts`, `muhurta.ts`.
  Failed days can be skipped; requested/returned counts are shown. If the inherited
  muhurta engine lacks solar windows it may use its 06:00–18:00 weekday-eighth
  approximation; the UI discloses this and requires independent confirmation.

## Private saved charts and comparison
- `/pro/clients`: search Sinhala/English label, tags, notes and Lagna; newest
  first; edit private labels/tags/notes; select two snapshots side by side.
  Each snapshot shows its own recorded method, timezone and birth time so mixed
  methods are never silently presented as equivalent. Charts are not recalculated
  on viewing and historical presets remain immutable.
- Studio save requires an explicit client-consent checkbox and an active Pro
  entitlement; the server validates and recalculates from inputs, rather than
  trusting posted planetary results. Metadata limits: 100-character label,
  10 unique 30-character tags and 6,000-character notes. No automatic saving.
- Existing encrypted Pro client storage, tenant checks, 90-day retention and
  100-chart cap are reused. Old client records receive display-only defaults;
  no bulk mutation of historical results. Existing export/delete remain available.
- Per-client notes are separate from an astrologer's profile-level method notes.
  Private metadata never enters public share-link responses. Client comparisons
  are display tools, not relationship/outcome scores.

## Expanded reference library and yoga candidates
- `/pro/reference` and Ctrl/Cmd+K include seven-planet sign dignities and deep
  exaltation degrees, directed natural friendships, compact traditional karaka
  notes, sign/house references, and the existing 27-star Gana/Yoni/pada tables.
  Gana/Yoni data was extracted unchanged from `porondam.ts` into a shared pure
  table, not independently promoted to a complete matching verdict.
- Source pages opened and checked during implementation:
  - https://vedicpupil.in/library/books/brihat-parashara-hora-shastra/chapter-3
    (12–13 significations, 49–50 exaltation, 55 natural friendship; edition
    numbering can differ). Own-sign lords match existing Hadahana RASHI data.
  - https://navapanchangam.com/learn/chart_foundations/natural-planetary-friendship
    (the seven-planet row table; asymmetric Moon/Mercury relation is tested).
  - https://vedicpupil.in/library/books/brihat-parashara-hora-shastra/chapter-75
    (1–2, five Mahapurusha formations).
  - https://nidarshanavedh.com/blog/yogas/gaja-kesari-yoga/
    (basic Moon-kendra Gajakesari vs stricter classical qualifications).
- Yoga table is **D1 whole-sign geometric candidate detection**, irrespective of
  D9/equal-house display: Ruchaka, Bhadra, Hamsa, Malavya, Shasha (own/exalted
  sign plus kendra), and basic Gajakesari (Jupiter 1/4/7/10 from Moon).
  Combustion/debility cautions are shown. These are not fully qualified yogas:
  benefic support, strength, cancellations, Moon condition and other school-
  dependent conditions require manual assessment. No outcome predictions/scores.
- Rahu/Ketu dignities/friendships and Deity/Nadi tables are not supplied: conventions
  need additional source review. Natural friendship is not temporary/fivefold.

## Strength calculations deliberately deferred
The dependency exposes an Ashtakavarga result type, but there are no independently
validated known-chart values established for this integration. Generic total-sum
invariants or agreement with the same implementation would not independently
validate a chart. Shadbala requires multiple strength components/conventions and
known reference outputs. Neither Shadbala nor Ashtakavarga scores are exposed until
those fixtures and tolerances exist. Dignity flags/reference tables are **not**
misrepresented as those strength calculations.

## PR #26 CI cold-start fix
The failing Panchanga job timed out while launching `/usr/bin/google-chrome`
(before PDF contents/assertions ran): the production renderer's 10-second Chrome
startup limit was too short on the cold shared GitHub runner. The non-production
`CI=true` path now allows 30 seconds to launch and 60 seconds overall. Production
always retains 10-second startup / 25-second total limits, even with `CI=true`.
The one-browser concurrency cap, bounded queue, offline isolation, page deadlines,
font/geometry/escaping/security assertions and process cleanup are unchanged.
Policy tests explicitly cover production/CI combinations and finite deadlines.
