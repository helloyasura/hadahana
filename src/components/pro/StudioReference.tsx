"use client";
import { useEffect, useRef, useState, type RefObject } from "react";
import { BHAVA, GRAHA, RASHI } from "@/lib/astrology/sinhala-names";
import { NEKATHA_TABLE } from "@/lib/astrology/nakath-akshara";
import { withBasePath } from "@/lib/base-path";
import type { Preset } from "@/lib/pro/store";
import type { ProChartResult } from "./Chart";
export default function StudioReference({
  inputRef,
  result,
  presets,
  onJump,
  onSelect,
  onClose,
}: {
  inputRef: RefObject<HTMLInputElement | null>;
  result?: ProChartResult;
  presets: Preset[];
  onJump: (utc: string) => void;
  onSelect: (name: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState(""),
    [date, setDate] = useState("");
  const panel = useRef<HTMLElement>(null);
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    inputRef.current?.focus();
    return () => before?.focus();
  }, [inputRef]);
  const local = (utc: string) =>
    new Intl.DateTimeFormat("en-GB", {
      timeZone: result?.native.timezone || "Asia/Colombo",
      dateStyle: "medium",
    }).format(new Date(utc));
  const entries = [
    {
      id: "drishti",
      title: "පරාශර දෘෂ්ටි / Parashari aspects",
      category: "ක්‍රම / Method",
      text: "සියලු සාම්ප්‍රදායික ග්‍රහයන්: 7; කුජ / Mars: 4,7,8; ගුරු / Jupiter: 5,7,9; ශනි / Saturn: 3,7,10. Directed, sign-based. රාහු/කේතු හා Lagna ඇතුළත් නැත. Degree mode: 0/60/90/120/180° ± orb.",
      select: "",
    },
    ...(result?.vimshottari.mahaDashas.map((d) => ({
      id: `dasha-${d.startUtc}`,
      title: `${d.lordSinhala} · ${d.lord}`,
      category: "දශා / Dasha",
      text: `Vimshottari · ${local(d.startUtc)} — ${local(d.endUtc)} · ${result.native.timezone}`,
      select: "",
    })) ?? []),
    ...Object.entries(GRAHA).map(([en, p]) => ({
      id: `planet-${en}`,
      title: `${p.sinhala} · ${en}`,
      category: "ග්‍රහ / Planet",
      text: `${p.spoken} · ${p.nature}${result?.navagraha.find((b) => b.graha === en) ? ` · ${result.navagraha.find((b) => b.graha === en)!.rashiSinhala} · ${result.navagraha.find((b) => b.graha === en)!.degreeInRashi}` : ""}`,
      select: en,
    })),
    ...Object.entries(RASHI).map(([en, r]) => ({
      id: `sign-${en}`,
      title: `${r.sinhala} · ${en}`,
      category: "රාශි / Rashi",
      text: `අධිපති / Lord: ${r.lord} · ${r.element}`,
      select: "",
    })),
    ...NEKATHA_TABLE.map((n) => ({
      id: `nak-${n.index}`,
      title: `${n.spoken} · ${n.english}`,
      category: "නැකත් / Nakshatra",
      text: `${n.sinhala} · අධිපති / Lord: ${n.lord} · ${(((n.index - 1) * 360) / 27).toFixed(2)}°–${((n.index * 360) / 27).toFixed(2)}° · පාද: ${n.padas.map((p, i) => `${i + 1} ${p.sinhala} (${p.roman})`).join(" / ")}`,
      select: "",
    })),
    ...Object.entries(BHAVA).map(([n, h]) => ({
      id: `house-${n}`,
      title: `භාව ${n} · ${h.sinhala}`,
      category: "භාව / House",
      text: `${h.sanskrit} · ${h.themes}`,
      select: "",
    })),
    ...presets.map((p) => ({
      id: p.id,
      title: `${p.name} v${p.version}`,
      category: "සුරැකි ක්‍රම / Preset",
      text: `${p.config.ayanamsa} · ${p.config.nodes} nodes · Vimshottari ${p.config.dasaYearDays}d`,
      select: "",
    })),
    ...(result
      ? [
          {
            id: "yoga-kalsarpa",
            title: "කාලසර්ප / Kalsarpa yoga",
            category: "යෝග / Yoga",
            text: `${result.yogas.kalsarpaPresent ? "Present" : "Not present"} · ${result.yogas.kalsarpaVerdict} · ග්‍රහයන් රාහු–කේතු අක්ෂයේ එක් පැත්තකද යන engine පරීක්ෂාව. පාසල් අනුව අර්ථකථන වෙනස් වේ.`,
            select: "",
          },
        ]
      : []),
  ];
  const words = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const found = entries.filter((e) =>
    words.every((w) =>
      `${e.title} ${e.category} ${e.text}`.toLocaleLowerCase().includes(w),
    ),
  );
  return (
    <div
      className="studio-reference-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="studio-ref-title"
        className="pro-card studio-reference"
        onKeyDown={(e) => {
          if (e.key !== "Tab") return;
          const elements = panel.current?.querySelectorAll<HTMLElement>(
            "button, input, a[href], select, textarea, summary",
          );
          if (!elements?.length) return;
          const first = elements[0],
            last = elements[elements.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }}
      >
        <div className="studio-chart-heading">
          <div>
            <p className="pro-eyebrow">THE PRACTITIONER’S DESK</p>
            <h2 id="studio-ref-title">අත්පොත හා ක්ෂණික සෙවීම</h2>
          </div>
          <button
            aria-label="Close reference"
            className="pro-secondary"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <label>
          ග්‍රහ, රාශි, නැකත්, භාව, ක්‍රම සොයන්න
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="උදා: Saturn / සෙනසුරු / Ashwini / wealth"
          />
        </label>
        <p role="status" className="pro-small">
          {found.length} ප්‍රතිඵල · යොමු: පවතින Hadahana සම්ප්‍රදායික වගු.
          ගණ/යෝනි/නාඩි හා මිත්‍රත්ව වගු තවම ඇතුළත් නැත.
        </p>
        <div className="studio-ref-results">
          {found.map((e) => (
            <article key={e.id}>
              <small className="pro-eyebrow">{e.category}</small>
              <h3>{e.title}</h3>
              <p>{e.text}</p>
              {e.select && (
                <button
                  className="pro-text-button"
                  onClick={() => {
                    onSelect(e.select);
                    onClose();
                  }}
                >
                  සටහනේ තෝරන්න →
                </button>
              )}
            </article>
          ))}
          {!found.length && <p>ගැළපෙන යොමු නැත / No matches</p>}
        </div>
        {result && (
          <details className="studio-dasha" open>
            <summary>විම්ශෝත්තරී දශා කාලරේඛාව / Dasha timeline</summary>
            <p className="pro-small">
              මෙම සටහනේ චන්ද්‍ර ස්ඵුටය අනුව. පළමු මහා දශාව උපන් මොහොතට කපා ඇත.
              කාල කලාපය: {result.native.timezone}.
            </p>
            <label>
              දිනයට යන්න / Find period
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </label>
            <ol>
              {result.vimshottari.mahaDashas.map((d) => {
                const hit =
                  date &&
                  date >=
                    new Date(d.startUtc).toLocaleDateString("en-CA", {
                      timeZone: result.native.timezone,
                    }) &&
                  date <
                    new Date(d.endUtc).toLocaleDateString("en-CA", {
                      timeZone: result.native.timezone,
                    });
                return (
                  <li
                    className={hit ? "studio-row-selected" : ""}
                    key={d.startUtc}
                  >
                    <b>
                      {d.lordSinhala} · {d.lord} {hit ? "← තෝරාගත් දිනය" : ""}
                    </b>
                    <span>
                      {local(d.startUtc)} — {local(d.endUtc)}
                    </span>
                    <button
                      className="pro-text-button"
                      onClick={() => {
                        onJump(d.startUtc);
                        onClose();
                      }}
                    >
                      ආරම්භයේ අහස බලන්න ↗
                    </button>
                  </li>
                );
              })}
            </ol>
            <p className="pro-small">
              මෙම ක්‍රියාව වැඩ සටහනේ දිනය වෙනස් කරයි. උපන් මොහොතේ භුක්තිය:{" "}
              {result.vimshottari.currentAntardashaAtBirth?.antarLord || "—"}.
              සම්පූර්ණ භුක්ති/අන්තර browser මීළඟ අනුවාදයට.
            </p>
          </details>
        )}
        <div className="studio-actions">
          <a href={withBasePath("/")}>සාමාන්‍ය වැඩබිම / පංචාංග tab ↗</a>
          <a href={withBasePath("/pro")}>සේවාලාභී සටහන් ↗</a>
        </div>
      </section>
    </div>
  );
}
