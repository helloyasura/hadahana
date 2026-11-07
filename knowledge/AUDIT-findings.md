# Audit findings — previous study + parked agent

Auditor scope: research pack under `projects/kendraya-handahana-research` and parked prototype `/home/ubuntu/kendraya-handahana`.

Severity: **blocker** (wrong letters/math) · **major** (incomplete tradition) · **minor** (docs/UX).

| ID | Sev | Finding | Fix status |
| --- | --- | --- | --- |
| A1 | blocker | Parked agent uses පුවපල් pada1 as **මෝ**; Laksara SL table is **මො**. Long-ō vs short-o changes suggested names. | Fix in parked agent + research notes |
| A2 | major | Agent returns **one** primary letter only. Tradition offers **several** letters via Tara subha classes + lagna/weekday pools. | Spec in `07-…md`; agent must expand `namThebima` |
| A3 | major | No **complete Handahana palapala** structure (lagna phala, bhava narrative, yogas beyond kalsarpa, kuja check, muhurta). Chart dump ≠ reading. | Spec in `07-…md`; Stage 2 |
| A4 | major | Research earlier under-emphasized multi-letter naming; read as “single letter only.” | Fixed by `07-…md` |
| A5 | major | Shravana / Purva Ashadha syllable **variants** still unresolved — no canonical pick enforced in code. | Document; auditor flags divergence |
| A6 | minor | Sample English names hard-coded only for `Mo`; other syllables get generic hint. | Stage 2 |
| A7 | minor | Venus dasha years in Vimshottari classical table = 20; engine balance uses fractional remainder (OK) but UI must not say “Venus is 16y.” | Document carefully |
| A8 | minor | No automated regression that Laksara table == code table. | Auditor tool + fixture |
| A9 | minor | Cloud path vs intended `Documents/dev` — risk of editing wrong tree. | LOCATION.md |
| A10 | info | Early build before research gate — process issue, not math. | Parked; research-first restored |

## Validation fixture (Asiri Kandy)

- Input: 2026-11-04 07:46 Asia/Colombo, Asiri Kandy  
- Expect Moon: Purva Phalguni / පුවපල් pada **1**  
- Expect primary: **මො** (not මෝ)  
- Expect letter **set** includes primary + sampath/kshema/sadhaka/maitri/parama-maitri syllables  
- Expect Lagna Scorpio for complete reading context  

## Auditor agent role

Separate project `handahana-auditor` reviews implementations against this checklist and the knowledge pack. It does not replace a human athurudaya; it catches table/math/process defects.
