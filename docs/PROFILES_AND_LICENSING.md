# Profiles and 20-day Hadahana trial

## Product interpretation

Visitors may generate a **limited preview** without an account. Everything beyond
that preview (full printable chart, server PDF preview/download, naming,
compatibility, predictions, dosha, auspicious times, panchanga and AI assistant)
requires both sign-in and a live LUMS trial/license. Tools are locked before the
first horoscope is generated. An existing saved horoscope can be reopened instead.

LUMS is the only identity, database and license authority. There is **no new
Hadahana user database, container, queue or scheduler**.

- The same email/password works in the LUMS customer portal. It is not automatic
  cross-domain SSO: the portal asks the customer to sign in separately.
- Registration atomically creates a COMPANY_USER, individual HADAHANA company
  license and profile, with exactly **20 × 24 hours** from registration.
- A guest's generated birth snapshot is encrypted in an httpOnly cookie for 24
  hours. Signup attaches it in the same LUMS transaction; sign-in attaches it for
  an active existing customer. Successful attachment clears the pending cookie.
- The durable profile stores birth inputs (maximum 100 deduplicated horoscopes),
  not AI output or calculated predictions. Opening/downloading recomputes the
  chart from those inputs. Algorithm updates can therefore change predictions.
- Expiry/suspension never stops sign-in/profile access. Saved birth details remain
  visible, but full horoscope/feature APIs return 402 until renewed in LUMS.

## Server enforcement and privacy

Every non-public feature route calls `requireFeature` before doing work, including
all GET variants. Only `/api/places` (birth-form presets), `/api/cast` (preview), and
account operations are public. Authenticated `/api/cast` calculates, saves and
returns a full chart only after checking the current LUMS license. Exports look up
the horoscope **inside the signed-in user's saved set**, never by arbitrary user
or company IDs. Print buttons recheck `/api/access` before opening the browser
print dialog; PDF continues to use the existing browser Save as PDF workflow.

Sessions contain the user's LUMS JWT inside AES-256-GCM encrypted/authenticated,
httpOnly, SameSite=Lax cookies, Secure in production, scoped to `/hadahana`, with
24-hour cookie expiry. JWT validity and current license status are rechecked with
LUMS for every protected request. No license keys, LUMS admin secrets, payment data
or JWTs are returned to browser JavaScript. Mutations require JSON and a custom
header, rejecting cross-site Fetch Metadata requests; no CORS permission is added.
No new analytics captures names, credentials or birth details.

LUMS timeouts/outages **fail closed** for full features. Public previews continue.
Missing configuration still builds; profiles return a safe unavailable response,
and guest previews do not create a pending cookie until configuration is valid.
Already displayed/saved output cannot be recalled after expiry. No website can
prevent screenshots or browser printing of its public preview; it is deliberately
limited and contains no complete printable chart.

## Deployment (review required: merging deploys production)

1. Merge/deploy the paired LUMS PR **first**, including its additive migration.
   PR #39 is already merged into the base used here. Trial-start notifications and
   existing expiry alerts use that Customer Desk infrastructure.
2. In Hadahana's GitHub **droplet environment**, add `SESSION_SECRET` (at least 32
   random characters, preferably 32+ random bytes encoded as hex). Do not reuse a
   LUMS JWT secret or any existing key. Do not paste it into chat.
3. Set GitHub droplet variable `LUMS_API_URL` only if overriding the default
   `https://lums.ervanta.com/api`. No new LUMS secret or server-to-server key is
   needed. The CD passes both runtime values; neither is baked into the image.
4. Merge this Hadahana PR. CD refreshes only these new profile settings and the
   image pin in the existing Hadahana `.env`, keeping its OpenAI settings intact.
5. Test a new account, same credentials in LUMS `/portal`, profile persistence,
   server PDF and one paid renewal in an approved test environment. Do not
   expire or otherwise change a live customer license just to test.

No changes to nginx, other compose projects, GitHub secrets or the live droplet
were performed while developing this feature. Rotating SESSION_SECRET signs out
all Hadahana sessions and discards any still-pending guest previews.

## Before public rollout / known follow-ups

- **Email verification / password recovery:** the current LUMS backend has no
  reusable active verification/password-reset flow (its schema has legacy widget
  verification tables). This release does not send new customer email. Trials are
  one per normalized email, not per person; aliases/new emails can obtain another.
  Add verified ownership + recovery and stronger abuse controls before broad paid
  promotion. Existing LUMS accounts tied to another product are not silently
  reassigned; support must link those customers or they use a different email.
- **Paid price:** Yasura must choose the HADAHANA price and configure an active
  LUMS package with its own LemonSqueezy variant and positive catalog price.
  The existing portal renew flow defaults to 12 months. The new SKU refuses the
  unrelated global variant, caller-defined price and non-12-month duration. No
  price was invented and no live payment was attempted. Until configured, the
  portal gives a clear unavailable message rather than billing a wrong product.
- **Data policy:** agree retention/deletion/export/privacy terms for personal
  birth data. Profiles currently show the saved snapshots; edits are made by
  generating another horoscope. Self-service deletion/password editing are not
  included in this initial implementation.
- **Rate limiting:** LUMS has bounded process-local signup/login limits per
  socket IP and normalized-email hash. The Hadahana server shares an IP; 100
  attempts/15 minutes from that IP and 10/email can limit legitimate volume.
  Use a trusted proxy or shared limiter if scaling beyond one process.

## Validation

`npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, and
`npm run test:account`. `npm run test:profile` starts isolated local Next.js and a
mock LUMS, uses Chrome at `/usr/bin/google-chrome` (override CHROME_PATH), checks
preview -> signup -> saved chart -> export -> profile -> expiry -> expired login
at 1280 and 390 pixels, and checks every feature API denies guest/expired users.
Screenshots default to `/workspace/hadahana-profile-shots/`.

The mock integration fixture never uses production, sends email, or takes money.
LUMS unit tests cover the real account/trial service separately; production DB
migration and a real payment must still be verified in staging before rollout.
