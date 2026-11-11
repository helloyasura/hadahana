"use client";
import { useEffect, useRef, useState } from "react";
import type { CalculationConfig } from "@/lib/astrology/config";
import type { ProChartResult } from "./Chart";
import {
  RASHIS,
  positionInfo,
  studioHouse,
  type StudioBody,
} from "@/lib/pro/studio";
import { errorMessage, proRequest } from "./client";
export type TransitOverlay = {
  natal: ProChartResult;
  bodies: StudioBody[];
  instant: string;
  calculation: CalculationConfig;
};
export default function TransitDesk({
  result,
  ready,
  config,
  onOverlay,
}: {
  result?: ProChartResult;
  ready: boolean;
  config: CalculationConfig;
  onOverlay: (overlay: TransitOverlay | null) => void;
}) {
  const [natal, setNatal] = useState<ProChartResult>(),
    [instant, setInstant] = useState(() =>
      new Date().toISOString().slice(0, 16),
    ),
    [overlay, setOverlay] = useState<TransitOverlay>(),
    [planet, setPlanet] = useState("Jupiter"),
    [target, setTarget] = useState(0),
    [days, setDays] = useState(90),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const generation = useRef(0);
  useEffect(
    () => () => {
      generation.current++;
    },
    [],
  );
  async function calculate(ingress = false) {
    const run = ++generation.current;
    setBusy(true);
    setMessage("");
    try {
      const from = new Date(`${instant}:00Z`).toISOString();
      if (ingress) {
        const r = await proRequest<{
          entry: { instant: string; retrograde: boolean } | null;
        }>("/transits", {
          action: "ingress",
          from,
          to: new Date(Date.parse(from) + days * 86400000).toISOString(),
          planet,
          target,
          config,
        });
        if (run === generation.current)
          setMessage(
            r.entry
              ? `${planet} → ${RASHIS[target]} · ${new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Colombo", dateStyle: "medium", timeStyle: "long" }).format(new Date(r.entry.instant))} (Asia/Colombo) · ${r.entry.retrograde ? "Retrograde" : "Direct"}`
              : "මෙම පරාසයේ ප්‍රවේශයක් හමු නොවීය / No entry detected in this range.",
          );
      } else {
        if (!natal)
          throw new Error("පළමුව ජන්ම සටහන රඳවන්න / Pin a natal chart first");
        const r = await proRequest<{ bodies: StudioBody[]; instant: string }>(
          "/transits",
          { action: "sky", instant: from, config },
        );
        if (run === generation.current) {
          const next = { ...r, natal, calculation: config };
          setOverlay(next);
          onOverlay(next);
        }
      }
    } catch (e) {
      if (run === generation.current) setMessage(errorMessage(e));
    } finally {
      if (run === generation.current) setBusy(false);
    }
  }
  return (
    <section className="pro-card studio-worksheet studio-transit-desk">
      <p className="pro-eyebrow">NATAL + GOCHARA · INGRESS SEARCH</p>
      <h2>ජන්ම හා ගෝචර අහස</h2>
      <div className="studio-actions">
        <button
          className="pro-secondary"
          disabled={!result || !ready || busy}
          onClick={() => {
            setNatal(result);
            setOverlay(undefined);
            onOverlay(null);
            setMessage(
              "ජන්ම සටහන මතකයේ රඳවා ඇත / Natal pinned in memory only.",
            );
          }}
        >
          මෙම සටහන ජන්ම ලෙස රඳවන්න
        </button>
        <button
          className="pro-text-button"
          onClick={() => {
            setOverlay(undefined);
            onOverlay(null);
          }}
        >
          ගෝචර ආවරණය ඉවත් කරන්න
        </button>
      </div>
      <p className="pro-small">
        {natal
          ? `${natal.native.date} ${natal.native.timeLocal} · ${natal.native.timezone}`
          : "පළමුව උපන් දිනය/වේලාව සකසා Pin කරන්න."}{" "}
        · {config.ayanamsa} / {config.nodes} nodes. නව ගණන ක්‍රමයක් තේරූ විට
        නැවත Pin කරන්න. D1 wheel පමණි; දඹ පැහැය ගෝචරය, නිල් ජන්මය.
      </p>
      <div className="pro-field-grid">
        <label>
          ගෝචර මොහොත · UTC
          <input
            aria-label="Transit UTC instant"
            type="datetime-local"
            value={instant}
            onChange={(e) => setInstant(e.target.value)}
          />
        </label>
        <button
          className="pro-button"
          disabled={!natal || busy}
          onClick={() => calculate()}
        >
          ගෝචරය පෙන්වන්න
        </button>
      </div>
      {overlay && (
        <div className="pro-table-wrap">
          <table>
            <thead>
              <tr>
                <th>ගෝචර ග්‍රහයා</th>
                <th>රාශිය</th>
                <th>ජන්ම ලග්නයෙන් භාවය · Whole sign</th>
              </tr>
            </thead>
            <tbody>
              {overlay.bodies.map((b) => {
                const p = positionInfo(b.longitude);
                return (
                  <tr key={b.name}>
                    <td>
                      {b.label} {b.retrograde ? "℞" : ""}
                    </td>
                    <td>
                      {RASHIS[p.sign]} {p.degree.toFixed(4)}°
                    </td>
                    <td>
                      {studioHouse(
                        b.longitude,
                        overlay.natal.lagna.longitudeExact ??
                          overlay.natal.lagna.longitude,
                        "whole-sign",
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <details>
        <summary>රාශි ප්‍රවේශය සොයන්න / Rashi ingress</summary>
        <div className="pro-field-grid">
          <label>
            ග්‍රහයා
            <select
              aria-label="Ingress planet"
              value={planet}
              onChange={(e) => setPlanet(e.target.value)}
            >
              {[
                "Sun",
                "Moon",
                "Mars",
                "Mercury",
                "Jupiter",
                "Venus",
                "Saturn",
                "Rahu",
                "Ketu",
              ].map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
          </label>
          <label>
            රාශිය
            <select
              aria-label="Ingress rashi"
              value={target}
              onChange={(e) => setTarget(+e.target.value)}
            >
              {RASHIS.map((r, i) => (
                <option key={r} value={i}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          <label>
            සෙවීමේ දින (1–366)
            <input
              aria-label="Ingress days"
              type="number"
              min="1"
              max="366"
              value={days}
              onChange={(e) => setDays(+e.target.value)}
            />
          </label>
        </div>
        <button
          className="pro-secondary"
          disabled={busy || days < 1 || days > 366}
          onClick={() => calculate(true)}
        >
          පළමු ප්‍රවේශය සොයන්න
        </button>
        <p className="pro-small">
          ඉහත UTC මොහොතෙන් ඉදිරියට. Direct හා retrograde ප්‍රවේශ සොයයි. පැයක
          නියැදීම, හමු වූ සීමාව තත්පර 1කට සීමා කරයි. පැයකට අඩු station-grazing
          නැවත පිවිසුම් මඟහැරිය හැක; අනන්ත කාලයක් සඳහා සහතිකයක් නොවේ.
        </p>
      </details>
      {message && (
        <p role="status" className="pro-notice">
          {message}
        </p>
      )}
    </section>
  );
}
