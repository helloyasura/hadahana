"use client";
import { useState } from "react";
import { referenceEntries } from "@/lib/pro/references";
import { YOGA_DEFINITIONS } from "@/lib/pro/yogas";
import Shell from "./Shell";
const entries = [
  ...referenceEntries(),
  ...YOGA_DEFINITIONS.map((y) => ({
    id: `yoga-${y.name}`,
    title: y.name,
    category: "යෝග / Yoga candidate",
    text: `${y.rule}. Geometry only; strength, cancellations and other classical qualifications require manual review.`,
    select: "",
  })),
];
export default function ReferenceLibrary() {
  const [query, setQuery] = useState("");
  const words = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean),
    rows = entries.filter((r) =>
      words.every((w) =>
        `${r.title} ${r.category} ${r.text}`.toLocaleLowerCase().includes(w),
      ),
    );
  return (
    <Shell active="reference">
      <div className="pro-page-title">
        <div>
          <p className="pro-eyebrow">PRACTITIONER REFERENCE LIBRARY</p>
          <h1>ජෝතිෂ යොමු පුස්තකාලය</h1>
          <p className="pro-muted">
            ඔබගේ අධ්‍යයනයට යොමුවක් · ප්‍රතිඵල සහතිකයක් නොවේ.
          </p>
        </div>
      </div>
      <section className="pro-card">
        <label>
          යොමු සොයන්න
          <input
            aria-label="Search reference library"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Sun / උච්ච / friend / Gana / Hamsa"
          />
        </label>
        <p role="status" className="pro-small">
          {rows.length} යොමු
        </p>
        <p className="pro-small">
          සම්ප්‍රදාය: BPHS seven-planet dignity හා directed natural friendship;
          node dignities නොදක්වයි. Gana/Yoni යනු පවතින Hadahana මූලික SL
          matching වගුය. Deity/Nadi වගු හා සම්පූර්ණ strength scores තවම
          source/fixture තහවුරු කර නැත.
        </p>
        <div className="studio-reference-grid">
          {rows.map((r) => (
            <article key={r.id}>
              <p className="pro-eyebrow">{r.category}</p>
              <h2>{r.title}</h2>
              <p>{r.text}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="pro-card studio-worksheet">
        <h2>මූලාශ්‍ර හා සීමා / Sources</h2>
        <ul>
          <li>
            <a
              href="https://vedicpupil.in/library/books/brihat-parashara-hora-shastra/chapter-3"
              target="_blank"
              rel="noreferrer"
            >
              BPHS Chapter 3: 12–13 significations, 49–50 exaltation, 55
              friendship
            </a>
          </li>
          <li>
            <a
              href="https://vedicpupil.in/library/books/brihat-parashara-hora-shastra/chapter-75"
              target="_blank"
              rel="noreferrer"
            >
              BPHS Chapter 75.1–2: Pancha Mahapurusha
            </a>
          </li>
          <li>
            <a
              href="https://navapanchangam.com/learn/chart_foundations/natural-planetary-friendship"
              target="_blank"
              rel="noreferrer"
            >
              Seven-planet natural friendship table and asymmetry
            </a>
          </li>
          <li>
            <a
              href="https://nidarshanavedh.com/blog/yogas/gaja-kesari-yoga/"
              target="_blank"
              rel="noreferrer"
            >
              Gajakesari: basic Moon-kendra rule vs stricter qualifications
            </a>
          </li>
        </ul>
        <p className="pro-small">
          පිටපත්/පරිවර්තන අනුව chapter/verse අංක වෙනස් විය හැක. Sign-level
          dignity table යනු Shadbala ගණනයක් නොවේ. Natural friendship directed ය;
          temporary/fivefold නොවේ. ස්වාධීන chart-reference අගයන් තහවුරු නොකර
          Shadbala/Ashtakavarga නොපෙන්වයි.
        </p>
      </section>
    </Shell>
  );
}
