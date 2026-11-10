"use client";

import { DoshaPeriods } from "@/components/DoshaPeriods";
import { AccountPanel } from "@/components/AccountPanel";
import type { Profile } from "@/lib/account/types";
import { track } from "@/lib/analytics";
import { useEffect, useState, useTransition } from "react";
import {
  AstralWheel,
  CosmicMark,
  RevealObserver,
} from "@/components/CosmicVisuals";
import { DEFAULT_LANG, FEATURE_MATRIX, t, type Lang } from "@/lib/i18n";
import {
  KendrayaSatahana,
  type SatahanaData,
} from "@/components/KendrayaSatahana";
import { AthurudayaAgent } from "@/components/AthurudayaAgent";
import { NameStudio } from "@/components/NameStudio";
import { NakathFinder } from "@/components/NakathFinder";
import { PanchangaView } from "@/components/PanchangaView";
import type { PanchangaData } from "@/lib/astrology/panchanga-view";
import type { PanchangaInput } from "@/lib/astrology/panchanga-schema";
import { PdfPanel } from "@/components/PdfPanel";
import {
  PlaceFields,
  emptyPlaceForm,
  placePayload,
  type PlaceFormValue,
} from "@/components/PlaceFields";
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
  const [profile, setProfile] = useState<Profile | null>(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const [preview, setPreview] = useState<Record<string, unknown> | null>(null);
  useEffect(() => {
    async function refresh() {
      try {
        const j = await fetch(apiUrl("/api/account"), { cache: "no-store" }).then(r => r.json());
        if (j.ok) { if (j.pendingVerification) setAccountOpen(true); setProfile(j.profile); if (!j.profile?.license.active) setCastData(null); }
        else { setProfile(null); setCastData(null); }
      } catch { setProfile(null); setCastData(null); }
    }
    void refresh();
    const timer = window.setInterval(refresh, 60000);
    const id = new URLSearchParams(window.location.search).get("horoscope");
    if (id) void openHoroscope(id);
    return () => window.clearInterval(timer);
  }, []);
  const [lang, setLang] = useState<Lang>(DEFAULT_LANG);
  const [motionPaused, setMotionPaused] = useState(false);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  const [tab, setTab] = useState<Tab>("chart");
  const [predictionView, setPredictionView] = useState<"summary" | "periods">("summary");
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
  const [muhurtaData, setMuhurtaData] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [panchangaData, setPanchangaData] = useState<PanchangaData | null>(null);
  const [panchangaInput, setPanchangaInput] = useState<PanchangaInput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const chart = castData?.chart as Record<string, unknown> | undefined;
  const dosha = castData?.dosha as Record<string, unknown> | undefined;
  const palapala = castData?.palapala as Record<string, unknown> | undefined;
  const satahana = castData?.satahana as SatahanaData | undefined;
  const nam = chart?.namThebima as Record<string, unknown> | undefined;
  const letterSet = nam?.letterSet as Record<string, unknown> | undefined;

  const unlocked = !!profile?.license.active && !!castData?.horoscopeId;
  async function openHoroscope(id: string) {
    try {
      const j = await fetch(apiUrl(`/api/horoscopes/${encodeURIComponent(id)}`), { cache: "no-store" }).then(r => r.json());
      if (!j.ok) throw new Error(j.error);
      if (j.birth) {
        const b = j.birth;
        setBirth({ nativeName: b.nativeName || "", date: b.date, time: b.time, gender: b.gender || "unspecified", place: { placeId: b.placeId || "", placeName: b.placeName || "", latitude: String(b.latitude ?? ""), longitude: String(b.longitude ?? ""), useCustomCoords: b.latitude != null && b.longitude != null } });
      }
      setCastData(j); setPreview(null); setTab("chart");
      document.getElementById("workspace-results")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch(e) { setError(e instanceof Error ? e.message : "Unable to open horoscope"); }
  }
  function changeProfile(next: Profile | null) {
    setProfile(next);
    if (!next?.license.active) { setCastData(null); setTab("chart"); setPorondamData(null); setMuhurtaData(null); setPanchangaData(null); }
  }
  function gate() {
    if (unlocked) return true;
    setError(!castData && !preview ? (lang === "si" ? "පළමුව හඳහනක් සාදන්න." : "Generate your horoscope first.") : !profile ? (lang === "si" ? "ඉදිරියට යාමට ලියාපදිංචි වන්න." : "Create a profile or sign in to continue.") : "Buy or renew your license in LUMS to continue.");
    if (castData || preview) setAccountOpen(true);
    return false;
  }
  function runCast() {
    track("tool_used", { tool: "chart" });
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(apiUrl("/api/cast"), {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Hadahana-Action": "1" },
          body: JSON.stringify(toPayload(birth)),
        });
        const json = await res.json();
        if (!json.ok) throw new Error(json.error || t(lang, "error"));
        setCastData(json.preview ? null : json);
        setPreview(json.preview || null);
        if (json.preview) { setAccountOpen(true); window.setTimeout(() => document.querySelector(".horoscope-preview")?.scrollIntoView({ behavior: "smooth", block: "start" }), 80); }
        if (json.horoscopeId) {
          const account = await fetch(apiUrl("/api/account"), { cache: "no-store" }).then(r => r.json());
          if (account.ok) setProfile(account.profile);
        }
        track("chart_generated");
        setTab("chart");
      } catch (e) {
        setError(e instanceof Error ? e.message : t(lang, "error"));
      }
    });
  }

  function runPorondam() {
    if (!gate()) return;
    track("tool_used", { tool: "porondam" });
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(apiUrl("/api/porondam"), {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Hadahana-Action": "1" },
          body: JSON.stringify({
            personA: toPayload(birth),
            personB: toPayload(partner),
          }),
        });
        const json = await res.json();
        if (!json.ok) throw new Error(json.error || t(lang, "error"));
        setPorondamData(json);
        track("compatibility_calculated");
        setTab("porondam");
      } catch (e) {
        setError(e instanceof Error ? e.message : t(lang, "error"));
      }
    });
  }

  function runMuhurta() {
    if (!gate()) return;
    track("tool_used", { tool: "muhurta" });
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(apiUrl("/api/muhurta"), {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Hadahana-Action": "1" },
          body: JSON.stringify({
            date: birth.date,
            ...placePayload(birth.place),
          }),
        });
        const json = await res.json();
        if (!json.ok) throw new Error(json.error || t(lang, "error"));
        setMuhurtaData(json);
        track("nakath_calculated", { tool: "muhurta" });
        setTab("muhurta");
      } catch (e) {
        setError(e instanceof Error ? e.message : t(lang, "error"));
      }
    });
  }

  function runPanchanga() {
    if (!gate()) return;
    track("tool_used", { tool: "panchanga" });
    setError(null);
    startTransition(async () => {
      try {
        const input = { date: birth.date, ...placePayload(birth.place) };
        const res = await fetch(apiUrl("/api/panchanga"), {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Hadahana-Action": "1" },
          body: JSON.stringify(input),
        });
        const json = await res.json();
        if (!json.ok) throw new Error(json.error || t(lang, "error"));
        setPanchangaData(json);
        setPanchangaInput(input);
        track("panchanga_calculated");
        setTab("panchanga");
      } catch (e) {
        setError(e instanceof Error ? e.message : t(lang, "error"));
      }
    });
  }

  return (
    <div
      className="workspace"
      data-motion={motionPaused ? "paused" : "playing"}
    >
      <RevealObserver />
      <div className="profile-shortcuts no-print"><button className="ghost" type="button" onClick={() => { setAccountOpen(!accountOpen); window.setTimeout(() => document.getElementById("account-panel")?.scrollIntoView({ behavior: "smooth" }), 50); }}>{profile ? (lang === "si" ? "මගේ පැතිකඩ" : "My profile") : (lang === "si" ? "ලියාපදිංචිය / ඇතුළු වීම" : "Sign in / create profile")} ↗</button><a href={apiUrl("/profile")}>{lang === "si" ? "පැතිකඩ පිටුව" : "Profile page"}</a></div>
      <a className="skip-link" href="#birth-details">
        {lang === "si" ? "උපන් විස්තර වෙත" : "Skip to birth details"}
      </a>
      <div className="starfield" aria-hidden="true" />
      <div className="studio-nav no-print">
        <a href="#" className="studio-wordmark" aria-label="Handahana Studio">
          <CosmicMark />
          <span>
            HADAHANA
            <small>{lang === "si" ? "හඳහන ස්ටූඩියෝ" : "ASTRAL STUDIO"}</small>
          </span>
        </a>
        <a className="studio-nav-link" href="#workspace-tools">
          {lang === "si" ? "ජ්‍යොතිෂ මෙවලම්" : "Explore the studio"}
          <span aria-hidden="true"> ↗</span>
        </a>
        <button
          type="button"
          className="motion-toggle"
          aria-pressed={motionPaused}
          onClick={() => setMotionPaused(!motionPaused)}
        >
          {motionPaused
            ? lang === "si"
              ? "චලන සක්‍රිය කරන්න"
              : "Resume motion"
            : lang === "si"
              ? "චලන නවත්වන්න"
              : "Pause motion"}
        </button>
      </div>
      <header className="hero">
        <div className="hero-inner">
          <p className="eyebrow">
            <span className="status-dot" />{" "}
            {lang === "si"
              ? "පුරාණ ප්‍රඥාව · නව හැකියාවන්"
              : "ANCIENT WISDOM · NEW POSSIBILITIES"}
          </p>
          <p className="lang-switch" role="group" aria-label="Language">
            <button
              type="button"
              className={lang === "si" ? "active" : ""}
              aria-pressed={lang === "si"}
              data-analytics-safe="true" onClick={() => { setLang("si"); track("language_changed", { language: "si" }); }}
            >
              සිංහල
            </button>
            <button
              type="button"
              className={lang === "en" ? "active" : ""}
              aria-pressed={lang === "en"}
              data-analytics-safe="true" onClick={() => { setLang("en"); track("language_changed", { language: "en" }); }}
            >
              English
            </button>
          </p>
          <h1 className="brand">{t(lang, "brand")}</h1>
          <p className="tagline">{t(lang, "tagline")}</p>
          <div className="hero-cta">
            <button
              type="button"
              className="primary"
              onClick={runCast}
              disabled={pending}
            >
              {pending ? t(lang, "casting") : t(lang, "cast")}
            </button>
            <button
              type="button"
              className="ghost"
              onClick={runMuhurta}
              disabled={pending || !unlocked}
            >
              {t(lang, "tabMuhurta")}
            </button>
          </div>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <AstralWheel />
          <span className="orbit-label orbit-label-top">
            CELESTIAL ATLAS / 2050
          </span>
          <span className="orbit-label orbit-label-bottom">
            නවග්‍රහ · NAVAGRAHA
          </span>
        </div>
        <div className="hero-baseline" aria-hidden="true">
          <span>01 — 09 / COSMIC EXPLORATION</span>
          <span>✧</span>
          <span>TRADITION, REIMAGINED</span>
        </div>
      </header>

      <section
        className="panel birth-panel reveal"
        id="birth-details"
        aria-labelledby="birth-title"
      >
        <div className="section-heading">
          <div>
            <span className="section-index" aria-hidden="true">
              01 / YOUR ORIGIN
            </span>
            <h2 id="birth-title">{t(lang, "birthDetails")}</h2>
          </div>
          <CosmicMark />
        </div>
        <div className="grid-form">
          <label>
            <span>{t(lang, "name")}</span>
            <input
              value={birth.nativeName}
              onChange={(e) =>
                setBirth({ ...birth, nativeName: e.target.value })
              }
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
        <div className="birth-actions">
          <button
            type="button"
            className="primary"
            onClick={runCast}
            disabled={pending}
          >
            {pending ? t(lang, "casting") : t(lang, "cast")}
            <span aria-hidden="true"> ↗</span>
          </button>
          <span aria-hidden="true">✧</span>
        </div>
        {error ? (
          <p className="error" role="alert">
            {error}
          </p>
        ) : null}
      </section>

      <section
        className="features reveal"
        id="workspace-tools"
        aria-labelledby="features-title"
      >
        <div className="section-heading">
          <div>
            <span className="section-index" aria-hidden="true">
              02 / THE POSSIBILITIES
            </span>
            <h2 id="features-title">{t(lang, "features")}</h2>
          </div>
          <span className="section-symbol" aria-hidden="true">
            ✧
          </span>
        </div>
        <ul>
          {FEATURE_MATRIX.map((f, index) => (
            <li key={f.id}>
              <span className="feature-index" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span>{lang === "si" ? f.si : f.en}</span>
            </li>
          ))}
        </ul>
      </section>

      {preview && <section className="panel horoscope-preview no-print" aria-label="Horoscope preview"><span className="section-index">YOUR FIRST GLIMPSE</span><h2>{lang === "si" ? "ඔබේ හඳහන සූදානම්" : "Your horoscope is ready"} ✦</h2><div className="preview-signs"><div><small>LAGNA / ලග්නය</small><strong>{String((preview.lagna as Record<string, unknown>)?.rashi || "—")}</strong></div><div><small>MOON / චන්ද්‍ර</small><strong>{String((preview.chandra as Record<string, unknown>)?.rashi || "—")}</strong></div></div><p>{lang === "si" ? "සම්පූර්ණ හඳහන, මුද්‍රණය සහ සියලු මෙවලම් සඳහා ඉහත පැතිකඩක් සාදන්න." : "Create a profile above to save this horoscope and unlock the full chart, downloads and every studio tool. Your preview is kept for 24 hours on this browser."}</p></section>}
      {(accountOpen || profile) && <AccountPanel profile={profile} onProfile={changeProfile} lang={lang} hasPreview={!!preview} onOpen={id => { void openHoroscope(id); }} />}
      {!unlocked && <p className="studio-lock no-print" role="status">{lang === "si" ? "පළමුව හඳහන සාදන්න. සියලු මෙවලම් සඳහා පැතිකඩක් සහ ක්‍රියාකාරී බලපත්‍රයක් අවශ්‍යයි." : "Generate a horoscope first. Studio tools require sign-in and an active trial or license."}</p>}
      <nav className="tabs reveal" aria-label="Workspace tabs">
        {TABS.map((tabItem) => (
          <button
            key={tabItem.id}
            type="button"
            className={tab === tabItem.id ? "active" : ""}
            aria-pressed={tab === tabItem.id}
            aria-controls="workspace-results"
            data-analytics-safe="true"
            disabled={tabItem.id !== "chart" && !unlocked}
            onClick={() => { setTab(tabItem.id); track("tool_opened", { tool: tabItem.id }); if (castData && ["chart", "palapala", "dosha"].includes(tabItem.id)) track("tool_used", { tool: tabItem.id }); }}
          >
            {t(lang, tabItem.key)}
          </button>
        ))}
      </nav>

      <main className="results" id="workspace-results" aria-busy={pending}>
        {pending ? (
          <div className="cosmic-loading no-print" role="status">
            <span aria-hidden="true" />
            {t(lang, "casting")}
          </div>
        ) : null}
        <div key={tab} className="result-reveal">
          {unlocked || tab === "chart" ? <>
          {!satahana &&
          !chart &&
          tab !== "porondam" &&
          tab !== "muhurta" &&
          tab !== "panchanga" &&
          tab !== "nam" ? (
            <div className="empty-state">
              <CosmicMark />
              <p className="empty">
                {lang === "si"
                  ? "කේන්ද්‍රය සාදා ප්‍රතිඵල බලන්න."
                  : "Cast a Kendraya to see results."}
              </p>
            </div>
          ) : null}

          {tab === "chart" && satahana ? (
            <div className="stack satahana-host">
              <PdfPanel lang={lang} horoscopeId={castData?.horoscopeId ? String(castData.horoscopeId) : undefined} />
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
              <nav className="prediction-options" aria-label="පලාපල / Predictions">
                <button type="button" aria-pressed={predictionView === "summary"} onClick={() => setPredictionView("summary")}>පලාපල සාරාංශය / Summary</button>
                <button type="button" aria-pressed={predictionView === "periods"} onClick={() => setPredictionView("periods")}>අරිෂ්ට / දෝෂ කාල · Challenging periods</button>
              </nav>
              {predictionView === "periods" ? <DoshaPeriods key={String(castData?.horoscopeId)} horoscopeId={String(castData?.horoscopeId)} /> : <>
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
                {(palapala.houses as Array<Record<string, unknown>>).map(
                  (h) => (
                    <article key={String(h.bhava)}>
                      <h4>
                        {String(h.bhava)}. {String(h.sinhala || h.sanskrit)}
                      </h4>
                      <p className="muted">{String(h.themes)}</p>
                      <p>
                        {(
                          h.occupants as Array<{
                            grahaSinhala: string;
                            graha: string;
                          }>
                        )
                          .map((o) =>
                            lang === "si" ? o.grahaSinhala : o.graha,
                          )
                          .join(", ") || (lang === "si" ? "හිස්" : "empty")}
                      </p>
                    </article>
                  ),
                )}
              </div>
              </>}
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
              <button
                type="button"
                className="primary"
                onClick={runPorondam}
                disabled={pending}
              >
                {t(lang, "match")}
              </button>
              {porondamData ? (
                <>
                  <p className="score">
                    {String(porondamData.score)} / {String(porondamData.max)} (
                    {String(porondamData.percent)}%)
                  </p>
                  <ul className="plain">
                    {(
                      porondamData.points as Array<Record<string, unknown>>
                    ).map((p) => (
                      <li key={String(p.id)}>
                        {p.ok ? "✓" : "✗"}{" "}
                        {lang === "si" ? String(p.nameSi) : String(p.nameEn)} —{" "}
                        {String(p.detail)}
                      </li>
                    ))}
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
              <button
                type="button"
                className="primary"
                onClick={runMuhurta}
                disabled={pending}
              >
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
                    · {String(muhurtaData.sunrise)} –{" "}
                    {String(muhurtaData.sunset)}
                  </p>
                  <div className="kv-row">
                    <div>
                      <h3>{t(lang, "rahu")}</h3>
                      <p>
                        {
                          (
                            muhurtaData.rahuKalaya as {
                              start: string;
                              end: string;
                            }
                          ).start
                        }{" "}
                        –{" "}
                        {
                          (
                            muhurtaData.rahuKalaya as {
                              start: string;
                              end: string;
                            }
                          ).end
                        }
                      </p>
                    </div>
                    <div>
                      <h3>Yamaganda / යමගණ්ඩ</h3>
                      <p>
                        {
                          (
                            muhurtaData.yamaganda as {
                              start: string;
                              end: string;
                            }
                          ).start
                        }{" "}
                        –{" "}
                        {
                          (
                            muhurtaData.yamaganda as {
                              start: string;
                              end: string;
                            }
                          ).end
                        }
                      </p>
                    </div>
                    <div>
                      <h3>Gulika / ගුලික</h3>
                      <p>
                        {
                          (muhurtaData.gulika as { start: string; end: string })
                            .start
                        }{" "}
                        –{" "}
                        {
                          (muhurtaData.gulika as { start: string; end: string })
                            .end
                        }
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
              <button
                type="button"
                className="primary"
                onClick={runPanchanga}
                disabled={pending}
              >
                {t(lang, "tabPanchanga")}
              </button>
              {panchangaData ? <>
                <PanchangaView data={panchangaData} lang={lang} />
                <PdfPanel lang={lang} panchanga={panchangaInput || undefined} />
              </> : null}
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
                {(dosha.kujaDosha as { fromLagna: boolean }).fromLagna
                  ? "✓"
                  : "✗"}
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
                    ? String(
                        (chart.yogas as { kalsarpaVerdict: string })
                          .kalsarpaVerdict,
                      )
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
              <PdfPanel lang={lang} horoscopeId={castData?.horoscopeId ? String(castData.horoscopeId) : undefined} />
            </div>
          ) : null}
          </> : null}
        </div>
      </main>

      <footer className="foot">
        <div className="footer-signature" aria-hidden="true">
          <CosmicMark />
          <span>HADAHANA / ASTRAL STUDIO</span>
          <span>✧</span>
        </div>
        <p>{t(lang, "disclaimer")}</p>
      </footer>
    </div>
  );
}
