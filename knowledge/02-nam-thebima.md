# Nam Thebima — naming letters in Sinhala culture

## Why letters matter in Handahana

The calling name is treated as a lifelong **mantra**. Traditional teaching (and modern SL guides such as GoodVibes / Laksara) says the first **phonetic** syllable should harmonize with the child’s lunar birth frequency — the **Janma Nekatha pada**.

Spelling language (Sinhala vs English) does not matter; **sound** does. Middle names and surnames are usually free.

## Three classical methods (ranked)

From older Handahana naming notes and Laksara’s cultural summary:

| Rank | Method | Quality |
| --- | --- | --- |
| 1 (best) | **Janma Nekatha + Pada** → Nakath Akshara | Requires full chart / Moon longitude |
| 2 | **Lagna** letter sets | Needs exact time + place |
| 3 (crudest) | **Weekday** letter sets | No chart |

Experienced practice: prefer **pada syllables**; optionally check they also sit well with lagna / weekday / family-name vedha.

## How pada letters are found

1. Compute sidereal Moon longitude (Lahiri).  
2. Nekatha index = floor(lon / 13°20′) + 1.  
3. Pada = floor((lon % 13°20′) / 3°20′) + 1.  
4. Look up the 108-syllable table (see `03-nekatha-akshara-table.md`).

Moon spends ~1 day in a nekatha and ~6 hours in a pada → **hospital minute** matters near borders (**sandhi**).

## Extra Sinhala naming filters (advanced / rural)

Documented in Sinhala cultural writing (e.g. Laksara / shabda-shastra notes):

1. **Subha vs asubha nekatha classes relative to Janma**  
   - Favour syllables from related “friendly” nekatha classes (janma, sampath, kshema, sadhaka, mitra, parama mitra)  
   - Avoid vipath / pratyari / vadha class letters when picky  
2. **Gana of the name’s mātrā pattern** (laghu/guru triples → bhumi/deva/… results)  
3. **Akshara class** — prefer divya / manushya starting letters over apaya  
4. **Akshara vedha** with parents/siblings’ name vowels  
5. **Practical speech** — easy to pronounce; otherwise “correct” gana can fail socially  

Stage-1 note: many modern parents stop at **primary pada syllable**. A full athurudaya agent should support both “simple” and “strict” modes.

## Ceremony timing

- Nam Thebima itself needs a **Subha Nekatha**.  
- **Rahu Kalaya** is avoided for the naming moment.  
- Ritual forms vary: paper reading, whispering into the ear, family elder announcement.

## Worked research check — your son

| Field | Value |
| --- | --- |
| Birth | 2026-11-04 07:46 Asia/Colombo |
| Place | Asiri Hospital Kandy ≈ 7.2744°N, 80.61115°E |
| Engine check | Swiss Ephemeris + Lahiri |
| Chandra | Leo / සිංහ |
| Janma Nekatha | Purva Phalguni / පුවපල් (පුබා) |
| Pada | 1 |
| Primary akshara | **මො / Mo** (Laksara: පුවපල් පාද 1 = මො; not මෝ) |
| Letter set | Primary මො + Tara subha secondary letters (see `07-…md`) |
| Lagna (context) | Scorpio / වෘශ්චික — does **not** override pada letters |
| Sandhi risk | Low in this computation (~0.9° inside pada) |

This is a research verification, not Stage-2 product output.
