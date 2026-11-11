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
