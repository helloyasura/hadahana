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
