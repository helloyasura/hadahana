# Challenging periods — transparent traditional rules (v1)

This is an opt-in **පලාපල → අරිෂ්ට / දෝෂ කාල** sub-view, not the horoscope
view or paper/PDF. The main chart/export pipeline is deliberately unchanged.
There is no new PDF download in this version. The view requires a signed-in
profile, an active trial/license and a saved horoscope; the server checks its
ownership. Guest previews never contain the report. Private responses are no-store.

## Scope and limitations

These are traditional Sri Lankan/Vedic sign-based timing indicators, not verified
predictions of harm, health, death, marriage outcomes or financial losses. Schools
differ. A qualified astrologer should review the entire chart, exceptions,
aspects, strength, yogas and personal context. A label is **not** a probability.
No urgency or claim that a ritual fixes a problem is appropriate.

Window: two calendar years before the report date through ten calendar years
ahead; never before birth. Periods are half-open `[start, end)`. Ongoing rows
are highlighted; past/current/upcoming filters are available. Concurrent
indicators are separate rows, not added into a purported overall risk score.
Dates are rendered in **Asia/Colombo**, explicitly labelled. UTC remains internal.

Window edges (including birth) **clip** a period; ≤ / ≥ and the clipped-window
notice mean the date/duration is only the part visible in this report, not a
claim about its actual ingress/egress. Retrograde exits and re-entries remain
separate rows. A newborn cannot have two years of post-birth history.

## 1. Vimshottari

Use the same natal sidereal Moon, nakshatra sequence and 365.25-day years as
`vimshottari.ts`. PR #11's fix is on the main revision used as this branch's base
(`974ed45`). Reconstruct the *full* first mahadasha start before birth from the
elapsed nakshatra fraction. Each antardasha lasts `mahaYears * antarYears / 120`
and begins in the mahadasha lord's order. Do not compress nine antardashas into
the balance remaining at birth. Iterate this way for subsequent mahadashas too.
Only show periods after birth and within the report window.

Each maha/antar segment is flagged if **either** lord has at least one condition:

- Functional-malefic screening: owns 3, 6 or 11 from Lagna, **unless it also owns
  1, 5 or 9**. This explicit mixed-lord exception avoids calling e.g. Libra's
  Saturn a functional malefic. This is a simplified convention, not a complete
  school-specific classification table.
- Owns 6, 8 or 12 (dusthana connection, not necessarily overall malefic status).
- Occupies natal 6, 8 or 12.
- Natal debilitation or combustion, using the existing chart engine's flags.

Ownership is whole-sign from Lagna using classical sign lords (no Rahu/Ketu
sign ownership). Nodes may be flagged for occupancy or existing dignity flags;
node dignity is school-dependent. Display all involved owned/occupied houses
and the specific triggering reasons. No cancellation (neecha-bhanga, viparita
raja yoga, vedha etc.) is inferred; dusthana connections can have mixed or
constructive readings. This is why every row is guidance for review, not a verdict.

**Intensity, app heuristic**: count displayed triggering conditions across both
lords (including both roles when the same lord rules maha and antar): 1 = low,
2–3 = medium, 4+ = high. It measures rule overlap, not astronomical strength,
severity or certainty. It is an application choice, **not a classical formula**.

## 2. Transits

Existing Swiss Ephemeris WASM service, **Lahiri**, geocentric sidereal longitude;
Rahu is the **mean node**, Ketu exactly opposite, matching `computeChart`.
A synchronous scan after setting Lahiri prevents another request from changing
the shared sidereal mode midway. No new ephemeris dependency or external API.

Sample every six hours; detect any whole-sign change and bisect to within one
second. The selected slow planets cannot normally cross a sign and return in
six hours; this algorithm is not intended for fast Moon/ascendant transits.
All retrograde sign re-entries found by the scan are retained. Only anonymous
geocentric intervals are cached, bounded to one date-window key (no birth data).
Natal chart ayanamsa is currently Lahiri as the app defaults; the UI does not
expose alternative ayanamsas for this view. The API explicitly rejects saved
non-Lahiri charts rather than mixing two ayanamsas.

Count inclusively from the **natal Moon sign**:

| Rule | Houses/signs | App intensity |
| --- | --- | --- |
| Sade Sati / සෙනසුරු ඒරාෂ්ටක | Saturn 12, 1, 2 | medium at 12/2; high at 1 |
| Ashtama Shani | Saturn 8 | high |
| Kantaka Shani | Saturn 4, 7, 10 | medium |
| Ashtama Guru | Jupiter 8 | low |

Kantaka terminology varies: some schools use only 4; this app explicitly uses
the broader 4/7/10 definition. Sade Sati phases are separate sign intervals,
not an invented fixed 7.5-year duration. Saturn in 8 is not labelled Sade Sati.

Rahu/Ketu occupying the natal Moon **or Lagna sign**: medium. This is a
whole-sign contact, **not an exact degree conjunction**; show which reference
was contacted. No extra severity is inferred if both references coincide.
Transit intensities above are transparent product heuristics, not a classical
numerical danger scale. No combining with dashas into a risk forecast.

## 3. Children, static doshas and optional practices

Under 12 (365.25-day age convention) show a gentle **බාලාරිෂ්ට** tradition note.
Do **not** diagnose Balarishta or calculate longevity. Normal child care and
medical advice take priority. Existing static Kuja/Dosha/Yoga content remains in
its existing tab; no new marriage-oriented Kuja claim is added to a child's report.

Every row offers optional, non-commercial practices: Bodhi puja, pirith, dana,
the classical weekday of each seven-day planet as an optional symbolic day for
dana/service (Sun–Sunday through Saturn–Saturday; no invented node weekday),
and graha shanti/mantra only if compatible with the person's faith and with
trusted guidance. Gem/colour/day prescriptions require individual review;
**no automatic gemstone, expense, fasting or child ritual prescription**.
These are calming cultural practices, not guaranteed cures or substitutes for
practical/medical/financial help. Different planets do not justify inventing
mandatory paid remedies.

## References and differing conventions

The implementation follows the explicitly stated rules above rather than
claiming one universal Sri Lankan consensus. Background reading:

- [Functional benefic/malefic lordship](https://www.vedicplanet.com/jyotish/learn-jyotish/functional-benefic-and-malefic-planets/)
- [BPHS ch.34 discussion: mixed lordship and no classical numeric score](https://parasara.net/learn/bphs-ch34-yogakarakas-kendra-trikona-3-6-11-2-8-12-planets-inner-qualities-l177)
- [Saturn periods and variable Kantaka usage](https://getskybond.com/learn/doshas/shani-dhaiya/)
- [Sade Sati vs Ashtama](https://askveda.org/learn/vedic-astrology/saturn-transits-sade-sati/)
- [Why textual names differ](https://navapanchangam.com/learn/timing/saturn-transit-houses-what-the-books-support)
- [Swiss Ephemeris programmer documentation](https://www.astro.com/swisseph/swephprg.htm)

These references explain traditional conventions; they are not evidence of
scientific predictive validity. Broad node contacts and eighth-Jupiter screening
are deliberately specified sign-based indicators, not a comprehensive judgement.

## Validation and operational cost

`verify-dosha-periods.mts` checks anchored antardashas, later mahadashas,
retrograde re-entry, one-second ingress brackets against Swiss positions,
reference houses, child/adult handling, clipping, durations, cache determinism
and mixed lordship. `verify-dosha-ui.mjs` runs against local mock LUMS only:
390/1280 views, guest/expiry/ownership denial, no-store responses, current filter,
overflow and keyboard skip-link. The birth fixture is unnamed; no customer data
or services are contacted. No production deployment or new background job.
