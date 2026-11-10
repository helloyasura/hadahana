# Hadahana verified profiles

Deploy the companion LUMS email-verification PR **first**, then this Hadahana PR. Both merges deploy production. Configure and test LUMS SMTP before merging either: missing mail configuration prevents new signup verification and legacy-member verification. No new client secrets or Hadahana secrets are introduced. Existing server-only `SESSION_SECRET` and `LUMS_API_URL` are still required.

- Guest horoscope generation stays public. Signup sends the pending horoscope to LUMS and requests an emailed six-digit code. No account session, license or trial exists until verification succeeds.
- Enter or paste the code (10-minute expiry). The encrypted HttpOnly challenge cookie is scoped to `/hadahana` and never becomes an account session. Birth data stays in the existing encrypted pending cookie until saved successfully, including invalid-code/retry/refresh flows.
- After verification, LUMS issues the normal session token server-to-server. Hadahana seals it into its existing session cookie, fetches the authoritative profile and idempotently saves any pending birth details. The trial begins at verification, not at initial signup.
- Existing unverified trial users sign in with their existing password, verify once, and retain saved horoscopes and original trial/license dates. Old unverified session tokens no longer unlock features. Generic responses do not reveal whether an email is registered; existing members should sign in rather than register again.
- No OTP or address is added to analytics; the account panel remains `data-ph-no-capture`. Errors/status updates, focus, numeric keyboard, paste and one-time-code autocomplete are accessible and bilingual. Resend has a 60-second UI cooldown, enforced independently in LUMS.

## Register button fix

The selected tab used only `active`, dropping the shared `ghost` button base. It had **zero padding**, no rounded border and a different font/line-height compared to the adjacent sign-in tab. Both tabs now always retain `ghost`, add `active` as a modifier, expose `aria-pressed`, use intrinsic wrapping flex sizing, a 48px minimum touch target, consistent padding and 1.9 line height. Noto Sans Sinhala was already loaded by the layout; explicit fallback and generous line boxes preserve vowel signs. Shared workspace buttons also receive the safer line height.

## Local verification

`npm test`, `npm run test:account`, `npm run typecheck`, `npm run build`, `npm run lint`, `npm run test:profile`.

`test:profile` starts local Next.js plus a mock LUMS fixture, never production or SMTP. It covers 1280/390 Sinhala signup/code UI, no session before code verification, invalid/reused codes, paste support, preserved horoscope, all feature guards, downloads, ownership, trial expiry, cookie tampering and outages. The fixture code is a test-only constant, never a production bypass.

Screenshots: `/workspace/hadahana-otp-shots/button-before-{1280,390}.png`, `button-after-{1280,390}.png`, `button-detail-after-{1280,390}.png`, `verify-code-{1280,390}.png` plus active/expired profile/studio captures.

LUMS owns OTP hashing, five-attempt lockout, persistent hourly email/IP quotas, single-use transactions, legacy verification, audit privacy and one-time verified-email trial claims. See its `docs/HADAHANA_EMAIL_VERIFICATION.md` for migration/SMTP details and deployment caveats. Password reset/session revocation remains a separate follow-up; it is not implemented by this PR. CD permission fix PR #6 and the parallel favicon changes are untouched.
