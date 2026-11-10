# Usage analytics (PostHog Cloud + Google Analytics 4)

Both providers are optional and independent. The app works unchanged with missing variables. These **public browser identifiers are GitHub Actions variables, not secrets**; never use a PostHog personal API key or an OpenAI key here.

## Setup

1. Create a PostHog Cloud project. In project settings copy the **project API key** (`phc_…`) and ingestion host (`https://us.i.posthog.com` for US, `https://eu.i.posthog.com` for EU).
2. Create a GA4 property and Web data stream. Copy its **Measurement ID** (`G-…`). **Turn off Enhanced Measurement** for the stream (especially form interactions, site search, outbound clicks and automatic pageviews). The app emits explicit, sanitized events instead. Do not enable Google Signals, user-provided data, ads personalization, session replay, surveys, or a second analytics tag/GTM container.
3. In this GitHub repository: **Settings → Secrets and variables → Actions → Variables**, add:

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog project API key (optional) |
| `NEXT_PUBLIC_POSTHOG_HOST` | Ingestion host (optional, US default) |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | GA4 Web Measurement ID (optional) |

The CD `build-and-push` job is not scoped to the `droplet` environment. Set these at **repository level**, even if duplicate variables also exist in `droplet`. `.github/workflows/cd.yml` passes `vars.NEXT_PUBLIC_*` as Docker build arguments; the Dockerfile exposes them before `next build`. Deployment targets, SSH settings and nginx are unchanged.

4. Merge the PR to build/deploy. Changing variables requires another production build; setting runtime container env alone is not enough. Missing/empty values disable the corresponding provider. Setting only GA or only PostHog is supported. The optional host falls back to `https://us.i.posthog.com`.
5. Open the production app and explicitly accept analytics. Use PostHog Activity and GA4 Realtime to verify. In GA4 Events you can mark important outcomes as key events, and register event-scoped dimensions (e.g. `tool`, `product_slug`, `step`, `method`) as needed. No dashboards/accounts are created by this PR.

## Consent and privacy

- Before accepting, **neither analytics provider is initialized or requested**. Declining keeps the whole app usable. Do Not Track (`1` or `yes`) overrides acceptance. A small banner has equal Accept/Decline buttons; **Analytics preferences** lets visitors change the decision later. The choice is stored as `hadahana.analytics-consent.v1` in localStorage (separate per app). Storage denial fails closed.
- Only activity after consent is counted; there is no pre-consent event queue or backfill. Revoking unloads GA by reloading the page and opts PostHog out; analytics cookies scoped to the app are expired. Browser privacy/ad blockers may reduce counts. This is opt-in product measurement, not a billing/audit ledger or exact unique-person count.
- No names, email, passwords, user/auth tokens, messages, birth date/time/place, chart/name results or form contents are sent. Search reports only length (capped at 100) and result count, never search text. Routes are canonicalized against known pages/products; raw URLs, query strings, order IDs, referrers and arbitrary anchors are discarded. The PostHog **project API key** is preserved on the event as `properties.token` (this is required for ingestion and is not a user token), along with SDK envelope fields such as `$insert_id`, `$time`, `$lib`/`$lib_version`, session IDs, and sanitized `$set`/`$set_once` for identify.
- PostHog autocapture is **restricted to explicitly marked safe, non-form UI surfaces**, click-only, with all DOM text and attributes masked; its outbound event properties are allowlisted again. Replay, surveys, heatmaps, performance/network capture, feature flags and campaign/referrer collection are disabled. Standard device/anonymous/session IDs still exist after consent. Providers inevitably receive the network request/IP; review retention, region, privacy notice and legal requirements before enabling them.
- GA sends explicit pageviews and named events with sanitized page location and no referrer. Keep GA Enhanced Measurement off as described above so server-side stream settings cannot add unwanted automatic capture.
- Internal IDs may be sent only through `identifyUser` after a successful real auth response. Never pass email/name as an ID, hash PII, or use an auth token. Reset identity on logout.

## Events

Every event includes an `app` dimension (`hadahana` or `ervanta`) so both apps can share a provider project without mixing their usage.

`page_view` is GA4's event; PostHog uses `$pageview`. PostHog also emits privacy-filtered `$autocapture` clicks on safe surfaces.

- `tool_opened` (`tool`): all nine workspace tabs: `chart`, `nam`, `palapala`, `porondam`, `muhurta`, `panchanga`, `dosha`, `agent`, `export`.
- `tool_used` (`tool`): calculation/request/export/print attempts; reading chart/palapala/dosha tabs with a generated chart also counts usage.
- `chart_generated`: successful chart calculation (no birth/chart payload).
- `name_suggestions_requested`: a validated request; `name_suggestions_generated` (`method: ai | fallback`) records the actual engine outcome. Seed results are `fallback`, LangGraph/OpenAI results are `ai`.
- `compatibility_calculated`, `nakath_calculated` (`tool: muhurta | finder`), `panchanga_calculated`: successful calculations.
- `agent_message_sent`: request only, never its text or reply.
- `chart_exported` (`mode: json`), `chart_printed` (`mode`, `paper`), `language_changed` (`language: si | en`).
- Initial and Next.js pathname changes produce a canonical `/hadahana` pageview, never raw query/hash values. Workspace tabs are events, not fake pageviews.

### Authentication

Hadahana has **no login, signup or user account flow**. It remains anonymous. No fake login or registration events/identity have been added.

## Local verification

Use **dummy** `phc_test` / `G-TEST123` identifiers only and intercept/fulfill all vendor requests in an isolated browser; never test against production identifiers. Verify: zero vendor requests before consent, after decline, under DNT and with empty keys; expected named events and route changes after acceptance; no form/query/PII payloads; preferences persist and withdrawal stops collection. `track(event, props)` fans out to both providers and silently ignores disabled/declined/DNT states.

Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`. Browser acceptance checks and their result are recorded in the PR description.
