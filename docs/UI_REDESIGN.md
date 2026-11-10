# Hadahana · Celestial Atlas

A screen-only visual refresh inspired by a future celestial observatory: ink-blue space, glass surfaces, cyan/violet light, warm lunar gold, a custom lotus crest, and a decorative zodiac/navagraha atlas. The atlas is artwork, not calculated birth data.

## Implementation

- `src/app/cosmic.scss`: Sass tokens, glass/focus mixins, responsive layouts, staggered entrances, constellation stroke drawing, orbital animation, hover/press feedback, result and loading motion.
- `src/components/CosmicVisuals.tsx`: inline SVG artwork and an IntersectionObserver reveal enhancement. No animation library, canvas loop, remote image, or extra runtime dependency.
- `Space Grotesk` and `Noto Sans Sinhala` are self-hosted through `next/font`. All existing Sinhala/English feature text, nine tools, API payloads, and base-path handling remain.
- Birth details have a second, convenient cast button, so mobile users do not have to scroll back to the hero after filling fields.
- A screen-only skin leaves traditional white-paper charts and the existing A4/print modes intact.

## Motion and access

- `prefers-reduced-motion` disables animations, transitions, and smooth scrolling.
- The language-aware pause/resume control freezes decorative motion and immediately reveals entry content.
- Scroll content remains visible when JavaScript or IntersectionObserver is unavailable.
- Native buttons, visible keyboard focus, a skip link, pressed state, a loading status, and language updates support assistive technology.
- Mobile limits orbit animation to three planets; no continuous JavaScript animation or large filters run.

## Verification

```sh
npm ci
npm run lint
npm run typecheck
npm test
NEXT_PUBLIC_BASE_PATH=/hadahana npm run build
NEXT_PUBLIC_BASE_PATH=/hadahana npm start -- --hostname 127.0.0.1 --port 3456
# in a separate shell (or omit CHROME_PATH for an installed Playwright browser):
CHROME_PATH=/usr/bin/google-chrome-stable npm run test:ui
```

`npm test` groups the existing credential-free chart, factor-alignment, feedback, nakath, and naming regression scripts. `tsx` is pinned through the lockfile rather than downloaded ad hoc. The obsolete Next 16 `next lint` command was replaced with ESLint; three pre-existing unused declarations were removed without changing calculations or naming behavior.

`test:ui` uses an isolated headless Chromium context, never a signed-in desktop session. It checks both 1280px and 390px: all nine tabs, real chart casting, seed/fallback naming and selection, compatibility, nakath date scanning, panchanga, server PDF preview, white charts, print visibility, motion controls, language switching, no horizontal overflow, and no browser errors. It also checks keyboard skip navigation and no-JS content visibility.

Screenshots and the JSON report default to `/workspace/hadahana-redesign-shots/`. Override `UI_BASE_URL`, `UI_SHOTS_DIR`, or `CHROME_PATH` as needed. Key views: `1280-hero-si.png`, `390-hero-si.png`, `1280-names.png`, `390-names.png`, `1280-chart.png`, `390-chart.png`, and the two `*-home-full.png` files.

The separate `npm run verify:agent` integration test needs an OpenAI API key. It is not part of credential-free tests; no production key is copied into this checkout. The AI UI and endpoint contract are unchanged, but live model generation must be checked separately with an authorized test key.

## Deployment boundary

This change does not edit workflows, Docker/host networking, nginx, ports, secrets, or other apps. **Merging to `main` triggers the existing automatic production deployment.** Review the PR before merging.
