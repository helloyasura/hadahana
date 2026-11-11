# Pro request and consultation cases

Stacked on the Pro studio/v2 work (#21–#26). No production deployment and no
customer contact. No new astrology engine or OCR/AI extraction.

## Existing intake, now continued rather than copied

`/pro/links` creates an opaque, expiring/max-use/revocable intake link tied to a
versioned preset. `/pro/api/public/[token]` already required birth details and
`pro-v1` consent and retained a private Client record under the link's owner.
`/pro/clients` also contains manually saved Studio charts. Both are surfaced in
`/pro/cases`, with incoming/archive source, search, status and owner assignment.
Dashboard and archive records now have an “investigate” continuation link.

New intake asks for a birth date, time and place (named place plus explicit
coordinates/timezone); unsure-of-time is recorded, and an empty unsure time is
**provisional 12:00**, not an inferred birth time. Older API callers with explicit
coordinates/timezone remain compatible. No customer name/email is required.
An optional question and a separately consented birth-document upload accompany
the request. Submit consent explicitly describes retained investigation/report use.
For legacy cases, the astrologer must reconfirm the service/privacy consent before
issuing a final report; the final-review checkbox includes that confirmation.

## Case workflow

- New / in progress / waiting for customer / completed. “Waiting” does not message
  anyone. Assignment is only to the current owner, never to another tenant.
- Custom named service types based on reading, marriage, nakath, naming and
  difficult-period checklists. Checklists are human prompts, not completion claims.
- Case Studio starts from the customer's birth input and original manifest config,
  not from a newly changed global profile. Dasha/bhukti/antara, gochara/ingress,
  yoga candidates and Ctrl+K reference stay in that workspace. Panchanga,
  porondam and nakath receive the case input; partner details must be entered
  and consent checked by the astrologer. Side-by-side comparison only lists
  charts owned by the same astrologer and labels each original method.
- Explicit state save stores the effective civil minute, location, full Studio
  settings, selected body, dasha browser selection/date, transit natal input,
  rendered transit instant (separate from an unsubmitted input), consultation
  inputs and comparison chart ID. Restore pauses live/playback, reruns the same
  engine and restores the frame rather than silently advancing it to “now”.
  Temporary tool search-result messages and open panels are not an audit record;
  pin conclusions before leaving. Existing standalone tool routes still work.
- Findings contain editable evidence/caveats and a restorable state. Private notes
  are distinct. Timeline records explicit saves, pins, service/status/assignment,
  reports, document actions and time locks, bounded to the last 100 actions.
- Career (2/6/10/11), marriage (2/7/11) and difficult-period (1/6/8/12) evidence
  panels collect **current Studio frame D1 whole-sign** house lords/occupants and
  the chosen date's Vimshottari path. Traditional seven-planet sign ownership is
  reused from `references.ts` (#26, documented BPHS conventions). These house
  groups are common consultation prompts, not exhaustive doctrine or predictions.
  Equal-bhava/D9 selections do not redefine this explicitly labelled D1 panel.
  Gochara is the last _rendered_ overlay, with its own UTC instant; it is not
  silently treated as the date-jump instant. No automated marriage/career forecast.

## Documents and rectification

JPEG/PNG/WebP or an unencrypted PDF, source limit 2MiB, PDF limit 1–4 pages.
MIME allowlist + magic-byte check + strict canonical base64 + decoder validation;
no SVG/HTML. Sharp re-encodes raster pages to PNG, strips EXIF/GPS/XMP/profiles,
limits decoded pixels to 16MP and output dimensions to 1600px. Raw images are
not retained. Poppler converts PDFs to raster previews; **the raw PDF, embedded
scripts/files/links and original PDF metadata are never stored or served**.
PDF helpers use fixed local paths, no interpolated shell input, a 256MiB virtual
memory limit, an 8-second kill deadline and bounded output. One conversion at a
time per module instance; no unbounded upload queue. Output cap 1.5MB binary per
document. Conversion temporaries live in a private temporary directory and are
removed in `finally`. Docker adds `poppler-utils`; no external conversion service.

The zoom/rotate/page viewer sits alongside the chart on desktop and stacks on
mobile. The astrologer manually enters stated Lagna, planet signs and optional
Vimshottari lord/balance; there is no OCR. Compare uses **D1 sidereal signs** and
actual balance duration in days, with a labelled 360/365.25 document convention
and ±1.5-day rounding tolerance. A mismatch is not proof the time is wrong:
check ayanamsa, nodes, bhava, year convention and document rounding first.

Case Birth-mode scrubbing is ±2h with one-minute increments (or use the time input
to set another centre). Live-mode sky replay retains its wider span. Changes
update the comparison. A lock requires an explicit hypothesis reason and manual
confirmation, a completed valid chart, no active transit overlay, and the original
date/location/timezone. The server recalculates/validates the civil time. The
original Client input is never modified. The case stores original/corrected
inputs and the reason, with original → corrected in the timeline. A lock is an
astrologer's hypothesis, not an automatically rectified/certified birth time.

## Reports and privacy boundaries

Editable Sinhala/English templates plus pinned findings; sandboxed HTML preview
and branded server PDF using the existing offline, JS-disabled, bounded renderer.
Saved draft and reviewed final versions are immutable snapshots (up to 8),
including their original branding and findings (up to 10). Removing/editing a
current finding never rewrites an earlier report. Private notes/checklist/timeline,
source documents and contact identity are not automatically included in PDFs.

A final version needs an explicit review/consent confirmation. A successful final
PDF export marks it issued **to the astrologer**, not delivered to the customer.
Only then can the case be completed. No automatic email, public report endpoint
or bearer report-sharing token is created. The astrologer controls the download
and subsequent delivery. Draft/final exports remain available after licence expiry,
consistent with existing read/export/delete access; edits require an active licence.

Everything uses the existing AES-256-GCM Pro store and owner/session isolation.
Additive lazy migration adds cases to old Client records without changing any
saved calculation config/result. Existing 90-day Client retention and explicit
client deletion cascade to case data, sanitized document, findings and versions.
Private/no-store/no-referrer headers apply. CSRF guards, actual streamed-byte
limits, bounded rates, per-case optimistic revisions and foreign comparison-ID
checks protect writes. No customer documents/data are sent to analytics/AI.
Pilot limits remain 100 client records and 15MiB total encrypted JSON plaintext;
images can reach the capacity limit earlier and return a bounded error. This is
not a scalable document-management system or a cryptographically signed audit log.

## Tests / next iterations

`npm run test:pro:cases`: lifecycle gates, tenant checks, revision conflicts,
immutable evidence, escaping/private-note exclusion, snapshots, checklists/lords,
document differences, rectification audit, EXIF stripping and encrypted migration.
`npm run test:pro:cases:ui`: synthetic LUMS/OTP (no bypass), consented image/PDF
intake, type/page/byte rejection, cross-owner denial, real Sinhala PDF/fonts,
restore, time lock, responsive screenshots, expired-licence export and deletion.
The latter runs in the Panchanga CI job with fonts/Poppler installed.

Deferred: team/shared assignment, arbitrary custom checklist editing, automated
rectification-window search, OCR/AI suggestions, HEIC/multi-image documents,
original PDF download, document/chart screenshot pinning, public secure report
links/expiry/revocation/receipt confirmation, automatic delivery, full report
layout editor and scalable encrypted object storage. Validated shadbala and
ashtakavarga remain deferred from v2; no unvalidated strengths were introduced.
