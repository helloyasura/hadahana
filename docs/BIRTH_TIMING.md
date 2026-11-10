# Birth-day and Vimshottari conventions

## Civil date versus sunrise day

The civil date/time remains the submitted local calendar date/time. The
astrological weekday (vara) and ishta kala use the most recent **actual local
sunrise**. Before today's sunrise, calculate yesterday's sunrise at the same
coordinates; do not subtract a fixed 24 hours from today's sunrise. At sunrise
itself the new vara starts and elapsed time is zero. Midnight does not reset
ishta kala. Missing sunrise is shown as unavailable, not a fabricated zero.

The Sinhala `ශුද්ධ සූර්යෝදයාදි` sentence uses the sunrise weekday; the civil
birth narrative keeps the civil weekday. Both weekdays are explicitly labelled
on screen and in the PDF. Hours/minutes/seconds are clock units, not ghati/pala
(the current UI does not display traditional ghati units).

Tithi, nakshatra, yoga and karana belong to the **birth instant**, not to the
previous sunrise's opening limb. The containing interval is selected from the
appropriate sunrise-to-sunrise sequence. An interval continuing past sunrise
gets its ending time from the following day's sequence. Birth hora similarly
uses the containing day/night interval, without falling back to the first hora.
Weekday-based secondary naming suggestions also use the sunrise vara; primary
Moon-pada naming letters and all planetary/lagna calculations are unchanged.

## Dasha arithmetic and audit finding

Use sidereal Moon longitude at birth, span = 360/27 degrees:

```
elapsedFraction = (longitude - nakshatraIndex * span) / span
balanceYears = (1 - elapsedFraction) * lordYears
```

The existing **365.25-day solar year** convention is retained. Display months
are equal twelfths of that year (30.4375 days); residual days round to the nearest
whole day with overflow carried. Full-precision values, not four-decimal table
labels, drive the display and all UTC period boundaries. This is an explicit
application convention, not a claim that every Sri Lankan almanac uses it.

The reported zero-month example is **not a month truncation defect**. The
anonymous regression fixture yields Moon longitude 134.62870474152317 degrees,
elapsed fraction 0.0971528556142367 and 18.056942887715266 Venus years remaining:

- 365.25-day year / 30.4375-day month: **18y 0m 21d**, 6595.298389738 days.
- 360-day savana year / 30-day month: **18y 0m 20d**, 6500.499439577 days.

Neither convention yields 18y 8m 21d. Do not alter the ephemeris or force eight
months to match a handwritten value. A synthetic eight-month fixture guards
against genuine month truncation. The anonymous birth fixture also protects
unchanged Libra lagna (~14 degrees 09 minutes) and Purva Phalguni pada 1.

A real related bug was found in the dependency's **antardasha** calculation:
it divided only the remaining mahadasha into nine compressed sub-periods,
restarting the first at birth. We now backdate the full first mahadasha by the
elapsed nakshatra fraction, calculate its full sub-periods, remove those already
elapsed and clip the running period to birth for the remaining-period table.
Both chart APIs share this calculation. All major period boundaries remain
unchanged; the first mahadasha's sub-period boundaries are corrected.

## Sources and checks

- https://jyotishya.date/learn/vimshottari-dasha/ — remaining nakshatra arc,
  solar/savana options, and the error of starting first sub-periods at birth.
- https://www.livepanditji.com/blog/what-day-was-i-born-hindu-vaar-sunrise/ —
  civil weekday versus sunrise vara; birth limbs are read at the birth instant.
- Installed `vpv-panchangam/dist/calculations/dasha.js` — upstream uses 365.25
  days/year; `computeAntardashas` incorrectly uses remaining `md.years`.

Run `npm test` for anonymous fixture, exact sunrise, immediately before/after
sunrise, midnight, date rollover, leap day, nonzero months, dasha continuity,
shared-API agreement and unchanged lagna. `npm run test:pdf` covers all paper
sizes, embedded Sinhala, escaping, portrait/landscape and render limits.

No migrations, account changes, secret changes or production access needed.
Existing saved horoscopes are recalculated when reopened/downloaded.
