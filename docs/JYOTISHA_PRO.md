# ජෝතිෂ Pro — private pilot v1

## Status / launch gate

Implemented inside Hadahana, isolated under `/pro` (production base path: `/hadahana/pro`).
No DNS, nginx, new repository, production deployment or changes to consumer/LUMS tables.
The native/WASM engine packages are server-externalized and their assets explicitly traced to
avoid Next bundling WASM into an unusable relative browser asset URL in server calculations.
This is **not ready for public/paid launch**: the companion LUMS Pro backend must be
reviewed, merged/deployed and configured first. The real client is wired to that backend;
missing configuration, unavailable endpoints or invalid responses still fail closed (503),
not a local mock trial.
No production mock, backdoor account or automatic customer messaging exists.

**Swiss Ephemeris AGPL obligations or an appropriate professional/commercial licence
must be resolved before any paid launch.** A LUMS customer licence does not cover this.
Practitioner presets are self-authored, not independently certified or an accuracy upgrade.
See https://www.astro.com/swisseph/swephprg.htm and the research Page.

## URLs and boundaries

- `/pro/login`, `/pro/register`: separate passwordless email-OTP identity flows.
- `/pro`: profile and private client snapshots; export/delete remains available after licence expiry.
- `/pro/presets`: append-only named versions; cloning always creates a new immutable row.
- `/pro/links`: generate/revoke links pinned to a preset ID; random 256-bit token shown once.
- `/pro/s/<token>`: public consent form and one-time response; no public historical report lookup.
- All API routes are also under `/pro/api/*`, inside the Pro session cookie path.
- `jyotisha_pro_session` / `jyotisha_pro_verification`: host-only, HttpOnly, SameSite=Strict,
  Secure in production, path `${NEXT_PUBLIC_BASE_PATH}/pro`. Consumer cookies are ignored.
- JSON mutations require exact configured Origin, custom header and JSON Content-Type.
  This is the existing double-CSRF barrier (Origin + non-simple request), tightened to strict origin.
- All owner access is server-authorized; client/preset/link IDs are never authority on their own.
  No consumer birth records are copied into Pro.

## Environment (names, never values in source/logs)

Required to enable the pilot:

- `PRO_STORAGE_KEY`: independent random secret, minimum 32 characters; AES-256-GCM storage key.
- `PRO_DATA_PATH`: persistent private encrypted file; Compose uses `/var/lib/handahana/jyotisha-pro.enc`.
- `PRO_PUBLIC_ORIGIN`: exact browser origin, e.g. `https://ervanta.com` (no path/trailing slash).
- `PRO_LUMS_API_URL`: HTTPS API base **including `/api`**, without `/jyotisha-pro`.
- `PRO_LUMS_SERVICE_KEY`: independent scoped server-to-server Pro credential, minimum 32 characters;
  must match LUMS. `PRO_OTP_HASH_KEY` belongs on LUMS only, never Hadahana/browser.
- `PRO_TRUST_PROXY`: default `0`. Only use `1` after the existing reverse proxy is confirmed to
  overwrite `X-Real-IP`, never pass a caller-supplied value. With `0`, IP buckets are intentionally
  shared across the small private pilot. Per-email/per-link/global limits still apply.
- Existing `NEXT_PUBLIC_BASE_PATH` stays unchanged.

Compose forwards these variables but does **not** provision them. Existing deployment bootstrap
preserves non-consumer keys in the droplet `.env`; set through the approved deployment-secret
process before enabling Pro. No secrets were created or changed by this PR. In future prefer
separate Pro credentials/storage volume and a separately deployed app at `pro.ervanta.com`.
Never rotate the storage key without an explicit decrypt/re-encrypt migration and tested backup.

## Real LUMS Pro integration — fail-closed

`src/lib/pro/lums.ts` calls the isolated endpoints implemented by [LUMS #42](https://github.com/helloyasura/lums/pull/42).
Do not point it at consumer `/hadahana` auth. No upstream implementation is stubbed in this
client. Tests still use a synthetic mock transport, never real LUMS, SMTP, users or emails.

Every call sends `Authorization: Bearer PRO_LUMS_SERVICE_KEY`; production requires HTTPS,
redirects are forbidden, requests time out after 10 seconds, and responses are not cached.
Start/verify optionally forward a valid `x-jyotisha-pro-client-ip` from `requestIdentity`;
this is accepted upstream only after service-key authentication. With `PRO_TRUST_PROXY=0`,
no supplied public forwarded header is trusted; LUMS applies its socket-peer IP bucket.
LUMS 429 status is preserved for user retry. Network/config/schema errors remain 503.

1. `POST /api/jyotisha-pro/auth/start`
   - Input: `{ email, intent: "login"|"register", audience: "JYOTISHA_PRO" }`.
   - Output: `{ challengeId }` (opaque 256-bit token, exactly 64 lowercase hex characters).
   - Separate Pro identity/OTP tables; HMAC-hashed code, 10-minute TTL, 60-second resend
     cooldown, 3 email requests/hour, persisted IP/challenge limits, five failed attempts,
     constant-time comparison, generic start response, supersession and atomic single use.
2. `POST /api/jyotisha-pro/auth/verify`
   - Input: `{ challengeId, code, audience: "JYOTISHA_PRO" }`.
   - Output: `{ audience: "JYOTISHA_PRO", verified: true, subject: "<Pro UUID>", email }`.
   - Successful verified signup **atomically issues the one-time 20-day JYOTISHA_PRO trial**.
     A durable normalized-email claim prevents another trial after deletion/key rotation.
     Existing Pro identity login reuses its subject and never resets the trial; consumer
     User/JWT/cookies never authenticate this endpoint.
   - Locally pending cookies hold only a 256-bit token. Local attempts are committed before
     the remote call, maximum five; success consumes the encrypted pending record.
3. `POST /api/jyotisha-pro/entitlement`
   - Input: `{ subject, product: "JYOTISHA_PRO", trialDays: 20 }`.
   - Output: `{ product: "JYOTISHA_PRO", active: boolean, expiresAt: ISO-UTC, kind: "trial"|"paid" }`.
   - **Read-only** status lookup. Registration confirms it after upstream verification;
     it does not create or extend any trial. UUID/audience/product/expiry response checks
     and current server-side entitlement enforce fail-closed access.
   - Finite company expiry is required; generic one-time/null-expiry licences are inactive.
     `paid` reflects extension beyond original trial, not payment-settlement proof.

LUMS adds four new Pro tables plus new SKU/licence-owner catalog rows with an additive-only
migration; this Hadahana branch needs **no SQL migration** and keeps its existing separate
encrypted Pro file. Trial start, expiry and renewal follow existing Customer Desk events.
No paid checkout/pricing commitment is added. Renew the linked Pro Company with a finite term.

Merge/deploy **LUMS first**, configure its `PRO_LUMS_SERVICE_KEY`, `PRO_OTP_HASH_KEY` and existing
`SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`; then configure
Hadahana's API base/shared key/storage/origin and merge this PR. LUMS #41 was unmerged when
implemented; the companion includes its identical sensitive-mail/privacy safeguards, so no
hard #41 merge dependency, but working TLS SMTP is mandatory. Retain both additive model/
migration sets if resolving conflicts with #41. No real email/production data smoke test was run.

## Shared calculation engine

`castKendraya(input, config?)` is the one consumer/Pro engine. `config.ts` validates settings and
rejects unsupported values. Consumer callers remain unchanged. A synthetic **pre-refactor full
output SHA-256 fixture** plus deep equality checks prove default consumer output is unchanged.

Supported: Lahiri, Raman, **KP New** (not KP Old); mean/true nodes (Ketu exactly opposite selected
Rahu); fixed 365.25/360-day Vimshottari year; years/months/days or decimal balance display;
whole-sign houses; existing versioned Sinhala v1 syllable table.

True Chitra and other house/name-letter tables are visibly unavailable: do not relabel Lahiri
as True Chitra or provide untested alternatives. An authored school's table requires provenance,
permission and tests first. The UI offers only one validated house/table choice in v1.

Sunrise uses the existing binding's altitude-crossing solver: disc centre vs upper limb,
standard fixed refraction on/off (34 arcmin), solar semidiameter 16 arcmin, zero elevation and
unobstructed standard horizon. This is **not** Swiss `SE_BIT_HINDU_RISING`, weather-corrected or
terrain-aware sunrise. Consumer threshold remains untouched (-0.8333° for its default; matched exactly in the Pro manifest). For non-default conventions only
sunrise-derived weekday/name-letter preference changes, not the birth instant. A Pro manifest
records preceding sunrise, full config/hash, engine ID, preset version and exact chart result.
Dasa balance display affects presentation only; period endpoints retain full precision.

The native sidereal setting is stateful. Each chart resets its mode, true-node calculations reset
it immediately before their synchronous critical section, no await occurs within that section,
and mixed-mode concurrent regression tests compare against isolated results. No global mode is
left to chance. This depends on the locked vpv 1.0.0 internal pure helpers; upgrade only with tests.

The inherited consumer engine truncates seconds to minutes; Pro explicitly accepts minute-level
birth times only. Historical Sri Lankan offset rules use `Asia/Colombo`. Pro rejects detected
nonexistent/repeated clock readings around nearby 15/30/60/120-minute changes rather than silently
resolving them; explicit occurrence selection is future work. Inputs limited to 1900–today and
latitudes ±65°; no rectification, comparison sweeps, forecast/rule editor, PDF or paid marketplace
is added. Existing consumer horoscope paper/PDF stays separate and unchanged.

## Data/storage/migrations

The repo uses atomic file storage for name feedback; Pro follows that approach **in a new encrypted
file**, not the consumer store. Schema v1 has separate accounts, sessions, verification challenges,
presets, links, clients and rate-bucket collections. **No SQL migrations or LUMS DB changes**.
First successful request initializes v1 automatically; no destructive migration of existing data.

The JSON envelope is AES-256-GCM (purpose-bound AAD), directory mode 0700, file mode 0600, random
atomic temp+rename. Cross-process exclusive directory lock prevents lost updates and use-count
races. Lock waits fail at 3 seconds; crash-left locks require stopping the app and confirming no
writer before manually removing only `<PRO_DATA_PATH>.lock`. Never auto-steal a live writer's lock.
Corrupt/unknown-version/key-mismatch stores fail closed, never reset to an empty DB. One persistent
local filesystem and low-volume private pilot only: **not multi-host/serverless storage**.

No new heavy dependency or unbounded cache. Hard pilot caps: 500 accounts, 50 preset versions/owner,
100 links/owner, 100 retained clients/owner, 500 pending challenges, 5,000 expiring rate buckets,
15 MiB serialized data / 16 MiB encrypted-file read guard. Client snapshots consume this budget;
quota failure is deliberate, not silent data loss. Export/delete before capacity; move to a proper
transactional DB before widening the pilot. Presets immutable even before first use (stronger than
required), never silently changed when profile/defaults change.

OTP: 30 auth requests/shared-or-trusted-IP per 15 minutes, 3 sends/email/hour, 5 verify attempts.
Public: 120 page/API reads/IP per 10 minutes, 6 calculations/link per 10 minutes, 30 calculations
globally per 10 minutes. Workspace: 60 mutations/owner per 10 minutes. Expiry/maxUses/revocation
checked server-side. Uses reserved **before** calculation; failures count. Final save rechecks
revocation/expiry; resource exhaustion cannot create unlimited free retries. No browser pool,
background worker, polling, transit sweep or new service on the shared 1-vCPU/2-GB droplet.

## Privacy/retention/operational gates

Public form: no name/contact/sex collected; only date/time, coordinates and IANA zone. Explicit
consent identifies the receiving astrologer, includes guardian permission and 90-day retention.
Client record contains consent notice version, timestamp, immutable chart/method snapshot. No
public client-list/report access, no tokens stored plaintext. Astrologer can export and delete
records even with expired licence. Profile contact is private, qualifications self-declared;
public display name/logo may change, but saved calculation methods do not. Raster embedded logos
only (no remote tracking pixels), 20-KB UI limit / 30-KB server envelope.

Pro routes are no-store/noindex/no-referrer, frame-blocked; browser analytics/replay is suppressed
for all Pro paths, even if consumer consent was accepted. Application errors are generic and no
birth-data logging is added. **Before deployment verify reverse-proxy/APM/access-log redaction for
`/hadahana/pro/s/*` and `/hadahana/pro/api/public/*`; URLs contain capability tokens.** No nginx
changes made. Disable third-party session replay/proxy body capture for Pro. Treat link tokens as
secrets: deliberate copy/share only, no automatic email/Slack/customer messaging.

Expired client rows are purged lazily on the next successful store transaction (not a timed job).
Deleted rows disappear from the live file but backups must expire within 30 days or follow a tested
crypto-erasure process; operator must document/approve that schedule before pilot launch. Explain
that backup copies can remain up to that duration in privacy policy/consent before real use.
Stop the app for consistent encrypted backups; keep storage key separately secured. Legal review,
controller/processor terms, consent/right-to-delete workflow, independent practitioner fixtures,
load benchmark and upstream licensing remain rollout gates. Existing Compose resource limits stay
unchanged; no live droplet tests or deployments were performed.

## Validation

- `npm run lint`, `npm run typecheck`, `npm test`, `NEXT_PUBLIC_BASE_PATH=/hadahana npm run build`.
- `npm run test:pro`: consumer snapshot parity, supported settings, sunrise ordering, true-node
  opposition, dasa dates, unsupported rejection, mixed-preset concurrency, historical clock
  ambiguity/gap checks, encryption/corruption/atomic use limits/rates, missing LUMS fails closed.
- `npm run test:pro:ui`: local mock-LUMS + real Next server and Chrome; separate OTP/session,
  consumer-cookie denial, CSRF, tenant ID attacks, pinned versions, consent, maxUses concurrency,
  revoke, inactive entitlement, export/delete after expiry, logout; synthetic data only.
- Screenshots at 390 and 1280 pixels: login, registration, dashboard, preset editor, link generator,
  public consent page and public result. Default `/workspace/jyotisha-pro-shots/`; override
  `PRO_SCREENSHOTS_DIR`. Local harness uses installed Playwright and `/usr/bin/google-chrome`.
