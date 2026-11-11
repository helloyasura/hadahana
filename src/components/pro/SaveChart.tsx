"use client";
import { useState } from "react";
import type { CalculationConfig } from "@/lib/astrology/config";
import type { ProChartResult } from "./Chart";
import { withBasePath } from "@/lib/base-path";
import { errorMessage, proRequest } from "./client";
export default function SaveChart({
  result,
  config,
  ready,
}: {
  result: ProChartResult;
  config: CalculationConfig;
  ready: boolean;
}) {
  const [label, setLabel] = useState("ජන්ම සටහන"),
    [tags, setTags] = useState(""),
    [notes, setNotes] = useState(""),
    [consent, setConsent] = useState(false),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  async function save() {
    setBusy(true);
    setMessage("");
    try {
      await proRequest("/charts", {
        label,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        notes,
        consent,
        config,
        input: {
          date: result.native.date,
          time: result.native.timeLocal.slice(0, 5),
          latitude: result.native.latitude,
          longitude: result.native.longitude,
          timezone: result.native.timezone,
        },
      });
      setMessage("පෞද්ගලික සටහන සුරැකුණි / Chart saved privately.");
      setConsent(false);
    } catch (e) {
      setMessage(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="pro-card studio-worksheet studio-save-chart">
      <p className="pro-eyebrow">PRIVATE CLIENT RECORD · 90-DAY RETENTION</p>
      <h2>මෙම ජන්ම සටහන සුරකින්න</h2>
      <p className="pro-small">
        {result.native.date} {result.native.timeLocal} ·{" "}
        {result.native.timezone}. ගණනය server එකේ නැවත තහවුරු කර සුරකියි.
        පැතිකඩේ interpretation rules වෙනුවට වෙනම සේවාලාභී සටහන්.
      </p>
      <div className="pro-field-grid">
        <label>
          පුද්ගලික නම / ලේබලය
          <input
            aria-label="Client chart label"
            maxLength={100}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
        </label>
        <label>
          Tags · comma-separated
          <input
            aria-label="Client chart tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
        </label>
      </div>
      <label>
        පුද්ගලික සේවාලාභී සටහන්
        <textarea
          aria-label="Client chart notes"
          maxLength={6000}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </label>
      <label className="studio-check">
        <input
          aria-label="Consent to save client chart"
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
        />
        මෙම උපන් දත්ත හා සටහන් සුරැකීමට සේවාලාභියාගේ කැමැත්ත ලබා ඇත. දින 90කින්
        ස්වයංක්‍රීයව ඉවත් වේ.
      </label>
      <div className="studio-actions">
        <button
          className="pro-button"
          disabled={!ready || !consent || busy || !label.trim()}
          onClick={save}
        >
          සේවාලාභී සටහන සුරකින්න
        </button>
        <a href={withBasePath("/pro/clients")}>සුරැකි සටහන් හා සැසඳීම →</a>
      </div>
      {message && (
        <p role="status" className="pro-notice">
          {message}
        </p>
      )}
    </section>
  );
}
