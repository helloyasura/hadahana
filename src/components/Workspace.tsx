"use client";

import { useState, useTransition } from "react";
import { DEFAULT_LANG, FEATURE_MATRIX, t, type Lang } from "@/lib/i18n";
import {
  KendrayaSatahana,
  type SatahanaData,
} from "@/components/KendrayaSatahana";
import { AthurudayaAgent } from "@/components/AthurudayaAgent";
import { NameStudio } from "@/components/NameStudio";
import { NakathFinder } from "@/components/NakathFinder";
import { PrintControls } from "@/components/PrintControls";
import {
  PlaceFields,
  emptyPlaceForm,
  placePayload,
  type PlaceFormValue,
} from "@/components/PlaceFields";
import {
  runPrint,
  type PrintMode,
  type PrintPaper,
} from "@/lib/print-modes";
import { apiUrl } from "@/lib/base-path";

type Tab =
  | "chart"
  | "nam"
  | "palapala"
  | "porondam"
  | "muhurta"
  | "panchanga"
  | "dosha"
  | "agent"
  | "export";

type BirthForm = {
  nativeName: string;
  date: string;
  time: string;
  place: PlaceFormValue;
  gender: "male" | "female" | "unspecified";
};

const DEFAULT_BIRTH: BirthForm = {
  nativeName: "",
  date: "2026-11-04",
  time: "07:46",
  place: {
    ...emptyPlaceForm("asiri-kandy", "7.2744", "80.61115"),
    placeName: "907 Peradeniya Rd, Mulgampola, Kandy",
  },
  gender: "male",
};

const TABS: Array<{ id: Tab; key: Parameters<typeof t>[1] }> = [
  { id: "chart", key: "tabChart" },
  { id: "nam", key: "tabNam" },
  { id: "palapala", key: "tabPalapala" },
  { id: "porondam", key: "tabPorondam" },
  { id: "muhurta", key: "tabMuhurta" },
  { id: "panchanga", key: "tabPanchanga" },
  { id: "dosha", key: "tabDosha" },
  { id: "agent", key: "tabAgent" },
  { id: "export", key: "tabExport" },
];

function toPayload(f: BirthForm) {
  return {
    nativeName: f.nativeName || undefined,
    date: f.date,
    time: f.time,
    gender: f.gender,
    ...placePayload(f.place),
  };
}

function placeLabels(lang: Lang) {
  return {
    place: t(lang, "place"),
    search: t(lang, "placeSearch"),
    address: t(lang, "placeAddress"),
    customCoords: t(lang, "placeCustomCoords"),
    latitude: t(lang, "latitude"),
    longitude: t(lang, "longitude"),
    hospitals: t(lang, "hospitals"),
    cities: t(lang, "cities"),
    towns: t(lang, "towns"),
  };
}

export function Workspace() {
  const [lang, setLang] = useState<Lang>(DEFAULT_LANG);
  const [tab, setTab] = useState<Tab>("chart");
  const [birth, setBirth] = useState<BirthForm>(DEFAULT_BIRTH);
  const [partner, setPartner] = useState<BirthForm>({
    ...DEFAULT_BIRTH,
    date: "1995-06-15",
    time: "10:30",
    place: emptyPlaceForm("colombo", "6.9271", "79.8612"),
    gender: "female",
    nativeName: "",
  });
  const [castData, setCastData] = useState<Record<string, unknown> | null>(
    null,
  );
  const [porondamData, setPorondamData] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [muhurtaData, setMuhurtaData] = useState<Record<string, unknown> | null>(
    null,
  );
  const [panchangaData, setPanchangaData] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [printMode, setPrintMode] = useState<PrintMode>("single");
  const [printPaper, setPrintPaper] = useState<PrintPaper>("A4");

  const chart = castData?.chart as Record<string, unknown> | undefined;
  const dosha = castData?.dosha as Record<string, unknown> | undefined;
  const palapala = castData?.palapala as Record<string, unknown> | undefined;
  const satahana = castData?.satahana as SatahanaData | undefined;
  const nam = chart?.namThebima as Record<string, unknown> | undefined;
  const letterSet = nam?.letterSet as Record<string, unknown> | undefined;

  function runCast() {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(apiUrl("/api/cast"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(toPayload(birth)),
        });
        const json = await res.json();
        if (!json.ok) throw new Error(json.error || t(lang, "error"));
        setCastData(json);
        setTab("chart");
      } catch (e) {
        setError(e instanceof Error ? e.message : t(lang, "error"));
      }
    });
  }

  function runPorondam() {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(apiUrl("/api/porondam"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            personA: toPayload(birth),
            personB: toPayload(partner),
          }),
        });
        const json = await res.json();
        if (!json.ok) throw new Error(json.error || t(lang, "error"));
        setPorondamData(json);
        setTab("porondam");
      } catch (e) {
        setError(e instanceof Error ? e.message : t(lang, "error"));
      }
    });
  }

  function runMuhurta() {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(apiUrl("/api/muhurta"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: birth.date,
            ...placePayload(birth.place),
          }),
        });
        const json = await res.json();
        if (!json.ok) throw new Error(json.error || t(lang, "error"));
        setMuhurtaData(json);
        setTab("muhurta");
      } catch (e) {
        setError(e instanceof Error ? e.message : t(lang, "error"));
      }
    });
  }

  function runPanchanga() {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(apiUrl("/api/panchanga"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: birth.date,
            ...placePayload(birth.place),
          }),
        });
        const json = await res.json();
        if (!json.ok) throw new Error(json.error || t(lang, "error"));
        setPanchangaData(json);
        setTab("panchanga");
      } catch (e) {
        setError(e instanceof Error ? e.message : t(lang, "error"));
      }
    });
  }

  function downloadJson() {
    if (!castData) return;
    const blob = new Blob([JSON.stringify(castData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `handahana-${birth.date}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="workspace">
      <header className="hero">
        <div className="hero-inner">
          <p className="lang-switch" role="group" aria-label="Language">
            <button
              type="button"
              className={lang === "si" ? "active" : ""}
              onClick={() => setLang("si")}
            >
              සිංහල
            </button>
            <button
              type="button"
              className={lang === "en" ? "active" : ""}
              onClick={() => setLang("en")}
            >
              English
            </button>
          </p>
          <h1 className="brand">{t(lang, "brand")}</h1>
          <p className="tagline">{t(lang, "tagline")}</p>
          <div className="hero-cta">
            <button type="button" className="primary" onClick={runCast} disabled={pending}>
              {pending ? t(lang, "casting") : t(lang, "cast")}
            </button>
            <button type="button" className="ghost" onClick={runMuhurta} disabled={pending}>
              {t(lang, "tabMuhurta")}
            </button>
          </div>
        </div>
        <div className="hero-visual" aria-hidden />
      </header>

      <section className="panel birth-panel">
        <h2>{t(lang, "birthDetails")}</h2>
        <div className="grid-form">
          <label>
            <span>{t(lang, "name")}</span>
            <input
              value={birth.nativeName}
              onChange={(e) => setBirth({ ...birth, nativeName: e.target.value })}
            />
          </label>
          <label>
            <span>{t(lang, "date")}</span>
            <input
              type="date"
              value={birth.date}
              onChange={(e) => setBirth({ ...birth, date: e.target.value })}
            />
          </label>
          <label>
            <span>{t(lang, "time")}</span>
            <input
              type="time"
              value={birth.time}
              onChange={(e) => setBirth({ ...birth, time: e.target.value })}
            />
          </label>
          <label>
            <span>{t(lang, "gender")}</span>
            <select
              value={birth.gender}
              onChange={(e) =>
                setBirth({
                  ...birth,
                  gender: e.target.value as BirthForm["gender"],
                })
              }
            >
              <option value="male">{t(lang, "male")}</option>
              <option value="female">{t(lang, "female")}</option>
              <option value="unspecified">{t(lang, "unspecified")}</option>
            </select>
          </label>
        </div>
        <PlaceFields
          lang={lang}
          value={birth.place}
          onChange={(place) => setBirth({ ...birth, place })}
          labels={placeLabels(lang)}
        />
        {error ? <p className="error">{error}</p> : null}
      </section>

      <section className="features">
        <h2>{t(lang, "features")}</h2>
        <ul>
          {FEATURE_MATRIX.map((f) => (
            <li key={f.id}>{lang === "si" ? f.si : f.en}</li>
          ))}
        </ul>
      </section>

      <nav className="tabs" aria-label="Workspace tabs">
        {TABS.map((tabItem) => (
          <button
            key={tabItem.id}
            type="button"
            className={tab === tabItem.id ? "active" : ""}
            onClick={() => setTab(tabItem.id)}
          >
            {t(lang, tabItem.key)}
          </button>
        ))}
      </nav>

      <main className="results">
        {!satahana &&
        !chart &&
        tab !== "porondam" &&
        tab !== "muhurta" &&
        tab !== "panchanga" &&
        tab !== "nam" ? (
          <p className="empty">
            {lang === "si"
              ? "කේන්ද්‍රය සාදා ප්‍රතිඵල බලන්න."
              : "Cast a Kendraya to see results."}
          </p>
        ) : null}

        {tab === "chart" && satahana ? (
          <div className="stack satahana-host">
            <PrintControls
              lang={lang}
              mode={printMode}
              paper={printPaper}
              onModeChange={setPrintMode}
              onPaperChange={setPrintPaper}
            />
            <KendrayaSatahana data={satahana} />
          </div>
        ) : null}

        {tab === "nam" ? (
          <div className="stack">
            {nam ? (
              <>
                <p className="primary-letter">
                  {t(lang, "primaryLetters")}:{" "}
                  <strong>
                    {String(nam.primaryAksharaSinhala)} /{" "}
                    {String(nam.primaryAksharaRoman)}
                  </strong>
                </p>
                <p>
                  {t(lang, "secondaryLetters")}:{" "}
                  {(
                    letterSet?.allRecommendedSinhala as string[] | undefined
                  )?.join(" · ")}
                </p>
                <p>
                  {t(lang, "especiallyGood")}:{" "}
                  {(letterSet?.especiallyGood as string[] | undefined)?.join(
                    " · ",
                  ) || "—"}
                </p>
                <p>
                  {t(lang, "avoidLetters")}:{" "}
                  {(
                    (letterSet?.avoidTara as Array<{
                      nekathaSpoken: string;
                    }>) ?? []
                  )
                    .map((x) => x.nekathaSpoken)
                    .join(" · ")}
                </p>
                <ul className="plain">
                  {(nam.guidance as string[] | undefined)?.map((g) => (
                    <li key={g}>{g}</li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="muted">
                {lang === "si"
                  ? "කේන්ද්‍ර අකුරු සඳහා කේන්ද්‍රය සාදන්න. නැතහොත් පහත Name Studio හි 'අතින් අකුරු' භාවිතා කරන්න."
                  : "Cast a Kendraya for chart letters, or use Manual letters in Name Studio below."}
              </p>
            )}
            <NameStudio
              lang={lang}
              hasChart={Boolean(nam)}
              birth={{
                date: birth.date,
                time: birth.time,
                gender: birth.gender,
                nativeName: birth.nativeName,
                ...placePayload(birth.place),
              }}
            />
          </div>
        ) : null}

        {tab === "palapala" && palapala ? (
          <div className="stack">
            <ul className="plain">
              {(
                (lang === "si"
                  ? palapala.summarySi
                  : palapala.summaryEn) as string[]
              )?.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
            <div className="bhava-grid">
              {(palapala.houses as Array<Record<string, unknown>>).map((h) => (
                <article key={String(h.bhava)}>
                  <h4>
                    {String(h.bhava)}. {String(h.sinhala || h.sanskrit)}
                  </h4>
                  <p className="muted">{String(h.themes)}</p>
                  <p>
                    {(h.occupants as Array<{ grahaSinhala: string; graha: string }>)
                      .map((o) => (lang === "si" ? o.grahaSinhala : o.graha))
                      .join(", ") || (lang === "si" ? "හිස්" : "empty")}
                  </p>
                </article>
              ))}
            </div>
          </div>
        ) : null}

        {tab === "porondam" ? (
          <div className="stack">
            <h3>{t(lang, "partner")}</h3>
            <div className="grid-form">
              <label>
                <span>{t(lang, "date")}</span>
                <input
                  type="date"
                  value={partner.date}
                  onChange={(e) =>
                    setPartner({ ...partner, date: e.target.value })
                  }
                />
              </label>
              <label>
                <span>{t(lang, "time")}</span>
                <input
                  type="time"
                  value={partner.time}
                  onChange={(e) =>
                    setPartner({ ...partner, time: e.target.value })
                  }
                />
              </label>
            </div>
            <PlaceFields
              lang={lang}
              value={partner.place}
              onChange={(place) => setPartner({ ...partner, place })}
              labels={placeLabels(lang)}
            />
            <button type="button" className="primary" onClick={runPorondam} disabled={pending}>
              {t(lang, "match")}
            </button>
            {porondamData ? (
              <>
                <p className="score">
                  {String(porondamData.score)} / {String(porondamData.max)} (
                  {String(porondamData.percent)}%)
                </p>
                <ul className="plain">
                  {(porondamData.points as Array<Record<string, unknown>>).map(
                    (p) => (
                      <li key={String(p.id)}>
                        {p.ok ? "✓" : "✗"}{" "}
                        {lang === "si" ? String(p.nameSi) : String(p.nameEn)} —{" "}
                        {String(p.detail)}
                      </li>
                    ),
                  )}
                </ul>
              </>
            ) : null}
          </div>
        ) : null}

        {tab === "muhurta" ? (
          <div className="stack">
            <NakathFinder
              lang={lang}
              birth={toPayload(birth)}
              place={birth.place}
              hasChart={Boolean(castData)}
            />
            <hr className="nakath-divider" />
            <h4>
              {lang === "si"
                ? "දෛනික රාහු / යමගණ්ඩ / ගුලික"
                : "Daily Rahu / Yamaganda / Gulika"}
            </h4>
            <button type="button" className="primary" onClick={runMuhurta} disabled={pending}>
              {lang === "si"
                ? "උපන් දිනයේ මුහුර්ත කවුළු"
                : "Muhurta windows for birth date"}
            </button>
            {muhurtaData ? (
              <>
                <p>
                  {lang === "si"
                    ? String(muhurtaData.weekdaySi)
                    : String(muhurtaData.weekdayEn)}{" "}
                  · {String(muhurtaData.sunrise)} – {String(muhurtaData.sunset)}
                </p>
                <div className="kv-row">
                  <div>
                    <h3>{t(lang, "rahu")}</h3>
                    <p>
                      {
                        (muhurtaData.rahuKalaya as { start: string; end: string })
                          .start
                      }{" "}
                      –{" "}
                      {
                        (muhurtaData.rahuKalaya as { start: string; end: string })
                          .end
                      }
                    </p>
                  </div>
                  <div>
                    <h3>Yamaganda / යමගණ්ඩ</h3>
                    <p>
                      {
                        (muhurtaData.yamaganda as { start: string; end: string })
                          .start
                      }{" "}
                      –{" "}
                      {
                        (muhurtaData.yamaganda as { start: string; end: string })
                          .end
                      }
                    </p>
                  </div>
                  <div>
                    <h3>Gulika / ගුලික</h3>
                    <p>
                      {
                        (muhurtaData.gulika as { start: string; end: string }).start
                      }{" "}
                      –{" "}
                      {(muhurtaData.gulika as { start: string; end: string }).end}
                    </p>
                  </div>
                </div>
                <p>
                  {lang === "si"
                    ? String(muhurtaData.namingAdviceSi)
                    : String(muhurtaData.namingAdviceEn)}
                </p>
              </>
            ) : null}
          </div>
        ) : null}

        {tab === "panchanga" ? (
          <div className="stack">
            <button type="button" className="primary" onClick={runPanchanga} disabled={pending}>
              {t(lang, "tabPanchanga")}
            </button>
            {panchangaData ? (
              <pre className="json-block">
                {JSON.stringify(
                  {
                    vara: panchangaData.vara,
                    panchang: panchangaData.panchang,
                    sunriseSunset: panchangaData.sunriseSunset,
                    inauspiciousLocal: panchangaData.inauspiciousLocal,
                  },
                  null,
                  2,
                )}
              </pre>
            ) : null}
          </div>
        ) : null}

        {tab === "dosha" && dosha ? (
          <div className="stack">
            <p>
              Kuja:{" "}
              {(dosha.kujaDosha as { present: boolean }).present
                ? lang === "si"
                  ? "පවතී"
                  : "present"
                : lang === "si"
                  ? "නැත"
                  : "not flagged"}{" "}
              (Lagna{" "}
              {(dosha.kujaDosha as { fromLagna: boolean }).fromLagna ? "✓" : "✗"}
              , Chandra{" "}
              {(dosha.kujaDosha as { fromChandra: boolean }).fromChandra
                ? "✓"
                : "✗"}
              )
            </p>
            <ul className="plain">
              {(dosha.yogas as Array<Record<string, unknown>>).map((y) => (
                <li key={String(y.id)}>
                  {y.present ? "✓" : "✗"}{" "}
                  {lang === "si" ? String(y.nameSi) : String(y.nameEn)} —{" "}
                  {String(y.detail)}
                </li>
              ))}
            </ul>
            {chart?.yogas ? (
              <p>
                Kalsarpa:{" "}
                {(chart.yogas as { kalsarpaPresent: boolean }).kalsarpaPresent
                  ? String((chart.yogas as { kalsarpaVerdict: string }).kalsarpaVerdict)
                  : lang === "si"
                    ? "නැත"
                    : "not present"}
              </p>
            ) : null}
          </div>
        ) : null}

        {tab === "agent" ? (
          <AthurudayaAgent
            lang={lang}
            birth={{
              date: birth.date,
              time: birth.time,
              gender: birth.gender,
              nativeName: birth.nativeName,
              ...placePayload(birth.place),
            }}
          />
        ) : null}

        {tab === "export" ? (
          <div className="stack">
            <PrintControls
              lang={lang}
              mode={printMode}
              paper={printPaper}
              onModeChange={setPrintMode}
              onPaperChange={setPrintPaper}
              disabled={!satahana}
            />
            <button
              type="button"
              className="ghost"
              onClick={() => {
                if (!satahana) return;
                setTab("chart");
                window.setTimeout(
                  () => runPrint(printMode, printPaper),
                  250,
                );
              }}
              disabled={!satahana}
            >
              {lang === "si"
                ? "කේන්ද්‍ර ටැබය විවෘත කර මුද්‍රණය"
                : "Open chart tab & print"}
            </button>
            <button
              type="button"
              className="ghost"
              onClick={downloadJson}
              disabled={!castData}
            >
              {t(lang, "json")}
            </button>
            {satahana ? (
              <p className="muted">
                {lang === "si"
                  ? "එක් පිටුව / බහු-පිටු / පොත් / චාර්ට් පමණි — A4 සඳහා සැකසූ මුද්‍රණ ආකාර."
                  : "Single page, multi-page, print book, or charts-only — A4-tuned layouts."}
              </p>
            ) : null}
            {castData ? (
              <pre className="json-block">
                {JSON.stringify(
                  {
                    native: chart?.native,
                    lagna: chart?.lagna,
                    chandra: chart?.chandra,
                    namThebima: nam,
                  },
                  null,
                  2,
                )}
              </pre>
            ) : null}
          </div>
        ) : null}
      </main>

      <footer className="foot">
        <p>{t(lang, "disclaimer")}</p>
      </footer>
    </div>
  );
}
