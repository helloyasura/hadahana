"use client";

import { useMemo, useState, useTransition } from "react";
import type { Lang } from "@/lib/i18n";
import {
  EVENT_CATEGORIES,
  type EventCategoryId,
} from "@/lib/astrology/event-categories";
import { placePayload, type PlaceFormValue } from "@/components/PlaceFields";
import { apiUrl } from "@/lib/base-path";

type BirthPayload = {
  date: string;
  time: string;
  placeId?: string;
  placeName?: string;
  latitude?: number;
  longitude?: number;
  gender?: string;
  nativeName?: string;
  timezone?: string;
};

type Mode = "catalogue" | "check" | "scan";

type NakathOption = {
  english: string;
  sinhala: string;
  spoken: string;
  index: number;
  eventFit: "prefer" | "ok" | "avoid";
  tara: { classKey: string; classSinhala: string };
  score: number;
  reasonsEn: string[];
  reasonsSi: string[];
};

type DateRow = {
  date: string;
  weekdayEn: string;
  weekdaySi: string;
  dayNakshatra: NakathOption;
  suitable: boolean;
  grade: string;
  rahuKalaya?: { start: string; end: string };
  summaryEn: string;
  summarySi: string;
};

function todayYmd(): string {
  return new Date().toISOString().slice(0, 10);
}

function plusDays(ymd: string, n: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().slice(0, 10);
}

export function NakathFinder({
  lang,
  birth,
  place,
  hasChart,
}: {
  lang: Lang;
  birth: BirthPayload;
  place: PlaceFormValue;
  hasChart: boolean;
}) {
  const [eventId, setEventId] = useState<EventCategoryId>("marriage");
  const [mode, setMode] = useState<Mode>("scan");
  const [pickDate, setPickDate] = useState(todayYmd());
  const [fromDate, setFromDate] = useState(todayYmd());
  const [toDate, setToDate] = useState(plusDays(todayYmd(), 30));
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const eventMeta = useMemo(
    () => EVENT_CATEGORIES.find((e) => e.id === eventId)!,
    [eventId],
  );

  function run() {
    if (!hasChart && (!birth.date || !birth.time)) {
      setError(
        lang === "si"
          ? "පළමුව කේන්ද්‍ර උපන් විස්තර ඇතුළත් කරන්න."
          : "Enter birth details (cast chart) first.",
      );
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const body: Record<string, unknown> = {
          birth: {
            ...birth,
            ...placePayload(place),
          },
          eventId,
          mode,
          ...placePayload(place),
        };
        if (mode === "check") body.date = pickDate;
        if (mode === "scan") {
          body.fromDate = fromDate;
          body.toDate = toDate;
          body.limit = 25;
        }
        const res = await fetch(apiUrl("/api/nakath/suitable"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const json = await res.json();
        if (!json.ok) throw new Error(json.error || "failed");
        setResult(json);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  }

  const bringIn = (result?.bringIn as NakathOption[] | undefined) ?? [];
  const options = (result?.options as NakathOption[] | undefined) ?? [];
  const dates = (result?.dates as DateRow[] | undefined) ?? [];
  const day = result?.day as DateRow | undefined;
  const native = result?.native as
    | { janmaNekatha: string; janmaNekathaSi: string }
    | undefined;

  return (
    <div className="nakath-finder stack">
      <header className="nakath-finder-head">
        <h3>
          {lang === "si"
            ? "අවස්ථාව අනුව යෝග්‍ය නැකත් / දින"
            : "Suitable nakath / dates by event"}
        </h3>
        <p className="muted">
          {lang === "si"
            ? "ඔබේ කේන්ද්‍ර ජන්ම නැකතට අනුව අවස්ථාවක් තෝරා, දිනයක් පරීක්ෂා කරන්න හෝ කාල පරාසයකින් යෝග්‍ය දින සොයන්න."
            : "Pick an event category for your chart’s janma nakshatra — check a date you choose, or scan a range for suitable days."}
        </p>
      </header>

      <div className="name-grid">
        <label>
          <span>{lang === "si" ? "අවස්ථාව / කාණ්ඩය" : "Event category"}</span>
          <select
            value={eventId}
            onChange={(e) => setEventId(e.target.value as EventCategoryId)}
          >
            {EVENT_CATEGORIES.map((e) => (
              <option key={e.id} value={e.id}>
                {lang === "si" ? e.si : e.en}
              </option>
            ))}
          </select>
          <span className="muted name-count-hint">
            {lang === "si" ? eventMeta.blurbSi : eventMeta.blurbEn}
          </span>
        </label>

        <label>
          <span>{lang === "si" ? "ක්‍රමය" : "Mode"}</span>
          <select value={mode} onChange={(e) => setMode(e.target.value as Mode)}>
            <option value="catalogue">
              {lang === "si"
                ? "යෝග්‍ය නැකත් ලැයිස්තුව (ගෙන එන්න)"
                : "List suitable nakaths (bring in)"}
            </option>
            <option value="check">
              {lang === "si" ? "දිනයක් තෝරා පරීක්ෂා කරන්න" : "Pick a date to check"}
            </option>
            <option value="scan">
              {lang === "si"
                ? "කාල පරාසයකින් යෝග්‍ය දින සොයන්න"
                : "Find relevant dates in a range"}
            </option>
          </select>
        </label>

        {mode === "check" ? (
          <label>
            <span>{lang === "si" ? "දිනය" : "Date"}</span>
            <input
              type="date"
              value={pickDate}
              onChange={(e) => setPickDate(e.target.value)}
            />
          </label>
        ) : null}

        {mode === "scan" ? (
          <>
            <label>
              <span>{lang === "si" ? "සිට" : "From"}</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </label>
            <label>
              <span>{lang === "si" ? "දක්වා" : "To"}</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </label>
          </>
        ) : null}
      </div>

      <button
        type="button"
        className="primary"
        disabled={pending}
        onClick={run}
      >
        {pending
          ? lang === "si"
            ? "සොයමින්…"
            : "Searching…"
          : mode === "scan"
            ? lang === "si"
              ? "යෝග්‍ය දින සොයන්න"
              : "Find suitable dates"
            : mode === "check"
              ? lang === "si"
                ? "දිනය පරීක්ෂා කරන්න"
                : "Check this date"
              : lang === "si"
                ? "යෝග්‍ය නැකත් පෙන්වන්න"
                : "Show suitable nakaths"}
      </button>

      {error ? <p className="error">{error}</p> : null}

      {native ? (
        <p className="muted">
          {lang === "si" ? "ජන්ම නැකත" : "Janma nakshatra"}:{" "}
          <strong>
            {native.janmaNekathaSi} / {native.janmaNekatha}
          </strong>
          {" · "}
          {lang === "si" ? eventMeta.si : eventMeta.en}
        </p>
      ) : null}

      {day ? (
        <article className={`nakath-day-card grade-${day.grade}`}>
          <h4>
            {day.date} ·{" "}
            {lang === "si" ? day.weekdaySi : day.weekdayEn} ·{" "}
            {day.grade}
          </h4>
          <p>
            {lang === "si"
              ? day.dayNakshatra.spoken
              : day.dayNakshatra.english}{" "}
            · {lang === "si" ? "ලකුණු" : "score"} {day.dayNakshatra.score} · tara{" "}
            {lang === "si"
              ? day.dayNakshatra.tara.classSinhala
              : day.dayNakshatra.tara.classKey}
          </p>
          <p className="muted">
            {lang === "si" ? day.summarySi : day.summaryEn}
          </p>
          {day.rahuKalaya ? (
            <p className="muted">
              {lang === "si" ? "රාහු කාලය" : "Rahu Kalaya"}:{" "}
              {day.rahuKalaya.start} – {day.rahuKalaya.end}
            </p>
          ) : null}
        </article>
      ) : null}

      {dates.length ? (
        <div className="nakath-dates">
          <h4>
            {lang === "si" ? "යෝග්‍ය දින (ශ්‍රේණිගත)" : "Dated options (ranked)"}
          </h4>
          <ul className="nakath-date-list">
            {dates.map((d) => (
              <li
                key={d.date}
                className={`nakath-date-row${d.suitable ? " suitable" : ""}`}
              >
                <div>
                  <strong>
                    {d.date}
                    {d.suitable ? " ✓" : ""}
                  </strong>
                  <span className="muted">
                    {" "}
                    · {lang === "si" ? d.weekdaySi : d.weekdayEn} · {d.grade} ·{" "}
                    {d.dayNakshatra.score}
                  </span>
                  <p>
                    {lang === "si"
                      ? d.dayNakshatra.spoken
                      : d.dayNakshatra.english}{" "}
                    (
                    {lang === "si"
                      ? d.dayNakshatra.tara.classSinhala
                      : d.dayNakshatra.tara.classKey}
                    )
                  </p>
                  {d.rahuKalaya ? (
                    <p className="muted">
                      Rahu {d.rahuKalaya.start}–{d.rahuKalaya.end}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  className="ghost"
                  onClick={() => {
                    setMode("check");
                    setPickDate(d.date);
                  }}
                >
                  {lang === "si" ? "මෙය පරීක්ෂාවට" : "Check this"}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {bringIn.length ? (
        <div className="nakath-bring-in">
          <h4>
            {lang === "si"
              ? "ගෙන එන්න — යෝග්‍ය නැකත්"
              : "Bring in — suitable nakaths"}
          </h4>
          <ul className="nakath-chip-list">
            {bringIn.slice(0, 14).map((n) => (
              <li key={n.english} className={`fit-${n.eventFit}`}>
                <strong>{lang === "si" ? n.spoken : n.english}</strong>
                <span>
                  {n.score} ·{" "}
                  {lang === "si" ? n.tara.classSinhala : n.tara.classKey}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {mode === "catalogue" && options.length ? (
        <details className="nakath-all">
          <summary>
            {lang === "si"
              ? "සියලු 27 නැකත් ලකුණු"
              : "All 27 nakshatra scores"}
          </summary>
          <ul className="plain">
            {options.map((n) => (
              <li key={n.english}>
                {lang === "si" ? n.spoken : n.english} — {n.score} (
                {n.eventFit}) ·{" "}
                {lang === "si" ? n.tara.classSinhala : n.tara.classKey}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}
