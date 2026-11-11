# Jyotisha Pro — visual astrologer studio (v1)

Entry: `/hadahana/pro/studio` when deployed with the existing basePath. Existing
Pro sessions and active LUMS entitlement are required for calculations. No new
production environment variables, dependencies, ephemeris or deployment steps.

## Practitioner brainstorm and prioritisation

A Sri Lankan/Vedic manual consultation typically needs:

1. Inspect precise sidereal graha/lagna positions, rashi/bhava, nakshatra/pada,
   retrogression and dignity without losing the chart.
2. Switch between the familiar Sinhala square and a continuous zodiac wheel;
   compare D1 and navamsa and make the chosen calculation convention explicit.
3. Test birth-time sensitivity, alternate ayanamsas and nodes, inspect the sky
   at another moment, and preserve each practitioner's repeatable method.
4. Quickly look up sign lords/elements, nakshatra lords/pada syllables, house
   significations and chart factors in both Sinhala and English.
5. Browse dasha timing and capture private interpretation/source notes alongside
   a printable worksheet.
6. Next: full bhukti/antara navigation, panchanga by place/date, gochara over
   natal positions, ingress finder, side-by-side comparisons, a searchable
   tagged client archive and source-reviewed dignity/friendship/karaka tables.
7. Later: curated yoga explanations, porondam/muhurta integration, shadbala and
   ashtakavarga only after verifying the engine's conventions and test fixtures.

The first five are the working core here. The last two are a deliberate v2
backlog, not disabled controls or invented calculations.

## Implemented

- Protected studio page and CSRF/origin-protected, rate-limited, licensed API.
- Existing `castKendraya` engine and configured mean/true-node correction. The
  repo already uses Swiss WASM indirectly through `vpv-panchangam`; this PR adds
  no ephemeris dependency or change to its outstanding licensing considerations.
- SVG wheel with twelve rashis, 27 labelled nakshatras, 108 pada ticks, exact
  sidereal longitude ticks/leader lines and selectable, keyboard-focusable
  planet markers. Selected outgoing aspects are drawn behind the planets.
- Sinhala square uses the existing `SouthIndianChart`, grouped by chosen bhava.
- Current sky refreshes each minute; ±30-day hour scrubber and 6-hour steps
  every six seconds during play. Date/time/coordinates/IANA-zone birth inputs.
  Ambiguous/skipped historical civil times are rejected by the existing guard.
- Lahiri/Raman/KP New, mean/true nodes, whole-sign/equal visual bhava, sign-based
  Parashari or degree-aspect rules, 0–15° orbs for degree aspects only, body/ring
  visibility, D1/D9, Vimshottari year length and balance-display settings.
- Private interpretation notes (plain text, not executable custom code).
- Account settings persisted in existing encrypted Pro storage; immutable named
  preset versions can carry studio settings. Older profiles receive additive
  defaults, old presets and share links keep their original calculation config.
- Ctrl/Cmd+K searchable reference drawer: chart planets, rashis/lords/elements,
  nakshatras/lords/pada syllables, houses/themes, aspects, dashas, presets and the
  Kalsarpa engine verdict.
  Search is local and is not sent to analytics or third parties.
- Mahadasha timeline, date lookup, birth antardasha and an explicit action to
  view the sky at a period's start. Dates label the chart's IANA timezone.
- Worksheet/table with calculation provenance, private notes and browser
  print/PDF styles. Responsive layout, focus trap and reduced-motion support.

## Important semantic boundaries

- D9 positions are **symbolic divisional coordinates**, not the physical sky.
  D9 nakshatra/pada labels describe those mapped coordinates. Dignity and
  retrogression flags remain explicitly labelled D1; no D9 strength is invented.
- Equal houses start at the ascendant and affect only studio visual house
  assignments. Share links still use the existing whole-sign engine config;
  the UI states this. Other bhava/house systems are not offered.
- Parashari aspects are directed sign-based graha drishti; all classical grahas
  have seventh, Mars adds fourth/eighth, Jupiter fifth/ninth, Saturn third/tenth.
  Nodes and Lagna are excluded as school-dependent. Orb applies only to the
  separate degree-aspect mode (0/60/90/120/180 degrees).
- The wheel is Aries-fixed, clockwise, not a planetarium or horizon projection.
  Dense labels use staggered radii; exact position is the outer tick, not the
  label radius. All positions are also accessible in the table.
- Birth-mode scrubbing advances **civil local hours**. Live-mode scrubbing uses
  actual elapsed hours. Location/birth input is ephemeral and is not persisted.
- Notes are profile-private; creating a preset snapshots them privately. Public
  share-link metadata continues to expose only the calculation config.
- No new client chart saving/search, transit overlay, ingress calculation,
  shadbala, ashtakavarga, friendship/deity/gana/yoni/nadi tables or executable
  rule language is claimed. Existing basic Panchanga is linked via its workspace,
  not integrated into this Pro calculation convention yet.

## Validation

- `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`
- `npm run test:pro:studio:ui`: isolated temporary encrypted data, local-only
  synthetic LUMS HTTP fixture, real app auth/cookies/route protection; no auth
  bypass is compiled into the app and no real email/LUMS service is contacted.
- Browser test covers signed-out redirects, CSRF, invalid dates/zones, expired
  entitlement, tenant isolation, profile/preset persistence, wheel/square/D9,
  body/ring controls, reference search, playback and mobile overflow.
- Captures: `/workspace/artifacts/pro-studio-{desktop,mobile}.png`, square and
  reference variants, plus a printable worksheet PDF. Override directory with
  `PRO_SCREENSHOTS_DIR` and Playwright module with `PRO_PLAYWRIGHT_MODULE`.
