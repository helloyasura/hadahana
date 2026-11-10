# Server-rendered horoscope PDFs

The chart and Export tabs now offer **View / Download PDF** (Sinhala / English),
A4 / A5 / Letter / Legal and portrait / landscape. View creates one private blob;
the embedded preview, full-window preview and download reuse those exact bytes.
Mobile PDF viewers vary, so there are explicit open/download fallbacks.
The old JSON download button, handler, label, attachment response and raw export
preview are removed. `GET /api/horoscopes/:id?download=1` returns 410; the normal
JSON endpoint remains necessary to hydrate an owned saved horoscope in the app.

## Rendering and safety

`GET /api/horoscopes/:id/pdf?size=A4&orientation=portrait` returns an inline PDF;
`&download=1` returns an attachment with a sanitized filename.
It requires a fresh LUMS session, active trial/license, generated horoscope and
ownership of the requested record (same checks as other licensed features).
It recomputes the report from the **server-side saved birth record**. No client
HTML, remote images, external URLs or client-computed chart data are accepted.
All fields are HTML-escaped; SVG geometry is fixed. JavaScript and service workers
are disabled. The isolated context is offline, every request is aborted, and a
restrictive CSP is embedded in the HTML. Output is private/no-store, nosniff and
same-origin frame/resource protected. Birth data is never logged or written to
a server PDF cache. Do not add external assets or analytics to this template.

Renderer: `playwright-core` with system Chromium and Noto Sans Sinhala. Chromium's
HarfBuzz shaping handles Sinhala conjuncts and combining marks in HTML and SVG;
the PDF embeds the font. PDFKit/react-pdf would be smaller but complex-script
shaping is not reliably equivalent, and raster screenshots lose searchable text.
A dedicated light print template replaces the old responsive screen DOM, timeout-
based `window.print()` and single-page transform. The old reproduction showed
extremely small charts/tables and compressed/uneven text on one A4 page. The new
report uses readable multipage flow, non-splitting rows, repeated table headings,
vector charts and numbered footers. It intentionally does not squeeze the entire
horoscope onto one page or retain the old booklet imposition modes.

## Small-droplet resource budget

- One browser/render at a time per Node process; at most two waiting jobs.
- Queue wait capped at 12 seconds, render/launch capped at 25 seconds; launch has
  its own 10-second deadline. Full queue responds 503 with Retry-After.
- Every page/context/browser is closed even on errors; no idle Chrome process.
- 8 render attempts per user / 10 minutes, bounded/pruned in-memory limiter;
  429 includes Retry-After. Invalid options/authorization do not consume quota.
- Chromium uses disable-dev-shm-usage, a 128 MiB JS heap hint and one renderer
  process hint. These flags are not hard memory limits.
- Compose hard-caps this app to **768 MiB**, no extra swap, **0.5 CPU**, 128 PIDs,
  protecting other apps on the shared 1-vCPU/2-GiB droplet. This does not prove the
  existing total host workload has spare capacity: review before production merge.
- Docker installs system Chromium + only the Sinhala font package, no bundled
  Playwright browser or full Noto collection. Production runs as existing non-root
  `nextjs`. Chrome sandbox is disabled for container portability; the fixed,
  escaped, scriptless, offline document is therefore an important security boundary.
- Local sample: one A4 render 628 ms; peak summed process-tree RSS 1120.4 MiB
  (shared libraries counted per process), proportional RSS/PSS 361.9 MiB; Chromium
  alone 945.0 MiB summed RSS / 240.2 MiB PSS. Private process-tree memory 247.4 MiB.
  This measures a local Google Chrome + test runner, **not** the whole Next server
  or Alpine container; production figures must be validated before rollout.
- No Docker/Podman/BuildKit executable or Docker socket is available on the test
  box. A Docker build and exact before/after image size were **not measured**.
  Published Alpine v3.22 packages alone list Chromium 117.4 MiB compressed /
  263 MiB installed, Sinhala fonts 13.7 / 33.5 MiB, plus transitive libraries.
  These are package references, not a prediction of the final image size.
  A new PR-only CI job builds both base and PR images, records exact sizes in
  the Actions summary and smoke-tests offline Chromium/Sinhala under the caps.
  This job has no publishing/deploy step. CD is unchanged; production deploy
  still happens only on main. Review the image-job result before merging.

For multiple replicas/processes, replace the in-memory limiter and semaphore
with shared admission control; don't increase workers on this small host.
No new secrets, database changes, services or droplet configuration are needed.

## Verification

```
npm ci
npm run lint
npm run typecheck
npm test
npm run test:account
CHROMIUM_PATH=/usr/bin/google-chrome npm run test:profile
CHROMIUM_PATH=/usr/bin/google-chrome npm run test:pdf
CHROMIUM_PATH=/usr/bin/google-chrome npm run test:pdf:ui
NEXT_PUBLIC_BASE_PATH=/hadahana npm run build
```

PDF tests require local Chromium, Noto Sans Sinhala, `pdfinfo`, `pdftoppm`,
`pdffonts` and `pdftotext` (Poppler). `PDF_SHOTS_DIR` overrides artifacts, default
`/workspace/hadahana-pdf-shots`. Tests use only a local mock LUMS. They cover all
four sizes/dimensions, landscape, fonts, escaping, SVG, queue/rate limits,
anonymous/expired/wrong-owner/cross-site requests, removed JSON export, download,
and Sinhala/English UI at 390/1280 without horizontal overflow. Page 1 is rendered
for every size; pages 1–2 for A4 and A5 are available for visual inspection.

The profile/PDF browser fixtures complete the email-code verification flow before
requesting licensed PDFs. Tests never send real email.

## Panchanga report

The Panchanga tab uses bilingual cards (weekday, tithi, nakshatra, yoga, karana,
paksha, sunrise/sunset) and a readable inauspicious-period list instead of the last
raw JSON dump. End times include their local calendar date and timezone; unavailable
values display a dash. The existing library supplies the sunrise almanac values.
The calculation API remains JSON for the application; no JSON file export is offered.

`POST /api/panchanga/pdf?size=A4&orientation=portrait` accepts the same date/place
input as `/api/panchanga` (JSON with `X-Hadahana-Action: 1`). It recomputes the
Panchanga on the server, returning a private inline PDF (`&download=1` for an
attachment). No saved-chart id is needed for this daily almanac, but sign-in,
active trial/license and at least one generated horoscope are still required.
The same Chromium renderer, single-render queue, timeout and **shared** 8-per-user
PDF budget protect both report types. The UI previews/downloads the same blob.

Input validation rejects unknown properties, impossible dates, dates outside
1900–2100, invalid timezone names, unknown presets, unpaired or out-of-range
coordinates, and PDF bodies over 4 KiB. Custom coordinates are supported, including
explicit zero coordinates. Empty saved coordinate fields no longer override a
selected preset with 0°N, 0°E. The preview uses the date/place snapshot of the visible
calculation, not subsequently edited birth form values.

Additional local checks:

```sh
CHROMIUM_PATH=/usr/bin/google-chrome npm run test:panchanga
npm run test:panchanga:ui
```

`PANCHANGA_SHOTS_DIR` overrides `/workspace/hadahana-panchanga-shots`. The unit/render
suite checks strict validation, missing values, Sinhala/English output, escaping,
all component source files for JSON dumps, and all four sizes in both orientations
using `pdfinfo`, embedded Sinhala fonts and `pdftoppm` page-one PNGs. The mock-LUMS
browser suite checks every workspace tab for raw JSON, the new preview/download,
selected A5 landscape on mobile, 1280/390 layouts, auth/license/chart gates,
cross-site requests, input/body limits, and the shared PDF rate limit.
