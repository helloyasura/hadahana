"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  BODIES,
  divisionalLongitude,
  positionInfo,
  RASHIS,
  NAKSHATRAS,
  studioHouse,
  studioSettingsSchema,
  type StudioBody,
  type StudioSettings,
} from "@/lib/pro/studio";
import { splitDashaYears } from "@/lib/astrology/vimshottari";
import type { CalculationConfig } from "@/lib/astrology/config";
import type { Preset } from "@/lib/pro/store";
import type { ProChartResult } from "./Chart";
import { SouthIndianChart } from "@/components/SouthIndianChart";
import { errorMessage, proRequest } from "./client";
import Shell from "./Shell";
import {
  caseStudioSchema,
  shiftCivilClock,
  type CaseStudioState,
} from "@/lib/pro/cases";
import StudioWheel, { bodyDescription } from "./StudioWheel";
import StudioReference from "./StudioReference";
import DashaBrowser from "./DashaBrowser";
import SaveChart from "./SaveChart";
import YogaDesk from "./YogaDesk";
import TransitDesk, { type TransitOverlay } from "./TransitDesk";

export function zonedClock(ms: number, timezone: string) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(ms)
      .map((p) => [p.type, p.value]),
  );
  return {
    date: `${p.year}-${p.month}-${p.day}`,
    time: `${p.hour}:${p.minute}`,
  };
}
const defaults = studioSettingsSchema.parse({});
function Frame({
  embedded,
  children,
}: {
  embedded: boolean;
  children: React.ReactNode;
}) {
  return embedded ? (
    <div className="pro-case-studio">{children}</div>
  ) : (
    <Shell active="studio">{children}</Shell>
  );
}
export default function Studio({
  embedded = false,
  initialState,
  onState,
}: {
  embedded?: boolean;
  initialState?: CaseStudioState;
  onState?: (
    state: CaseStudioState,
    result: ProChartResult | undefined,
    transits: StudioBody[],
  ) => void;
}) {
  const [settings, setSettings] = useState<StudioSettings>(
    initialState?.settings ?? defaults,
  );
  const [loaded, setLoaded] = useState(false),
    [presets, setPresets] = useState<Preset[]>([]);
  const [resultConfig, setResultConfig] = useState<CalculationConfig>(
    defaults.calculation,
  );
  const [dashaState, setDashaState] = useState(initialState?.dasha);
  const [transitState, setTransitState] = useState(initialState?.transit);
  const [computedKey, setComputedKey] = useState("");
  const [overlay, setOverlay] = useState<TransitOverlay | null>(null);
  const [workingResult, setResult] = useState<ProChartResult>(),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false),
    [saving, setSaving] = useState(false),
    [revision, setRevision] = useState(0);
  const result = overlay?.natal ?? workingResult;
  const [live, setLive] = useState(!initialState),
    [now, setNow] = useState(() => Date.now()),
    [offset, setOffset] = useState(0),
    [playing, setPlaying] = useState(false);
  const [birth, setBirth] = useState({
    date: initialState?.input.date ?? "2000-01-01",
    time: initialState?.input.time ?? "12:00",
  });
  const [location, setLocation] = useState({
    latitude: String(initialState?.input.latitude ?? 6.9271),
    longitude: String(initialState?.input.longitude ?? 79.8612),
    timezone: initialState?.input.timezone ?? "Asia/Colombo",
  });
  const [selected, setSelected] = useState(initialState?.selected ?? "Moon"),
    [name, setName] = useState("මගේ දෘශ්‍ය ක්‍රමය");
  const [referenceOpen, setReferenceOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    let cancelled = false;
    proRequest<{ studio: StudioSettings; presets: Preset[] }>("/workspace")
      .then((d) => {
        if (!cancelled) {
          setSettings(
            initialState?.settings ??
              studioSettingsSchema.parse(d.studio ?? {}),
          );
          setPresets(d.presets);
          setLoaded(true);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(errorMessage(e));
      });
    return () => {
      cancelled = true;
    };
  }, [initialState]);
  useEffect(() => {
    if (!live) return;
    const t = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(t);
  }, [live]);
  useEffect(() => {
    if (!playing) return;
    const t = setInterval(
      () =>
        setOffset((v) =>
          embedded && !live
            ? v >= 2
              ? -2
              : v + 1 / 60
            : v >= 720
              ? -720
              : v + 6,
        ),
      6000,
    );
    return () => clearInterval(t);
  }, [playing, embedded, live]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setReferenceOpen(true);
        requestAnimationFrame(() => searchRef.current?.focus());
      }
      if (e.key === "Escape") setReferenceOpen(false);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  const clock = useMemo(() => {
    try {
      if (live) return zonedClock(now + offset * 3600000, location.timezone);
      return shiftCivilClock(birth, offset);
    } catch {
      return null;
    }
  }, [live, now, offset, birth, location.timezone]);
  const calculationKey = JSON.stringify(settings.calculation);
  const requestedKey = JSON.stringify({ clock, location, calculationKey });
  useEffect(() => {
    const parsed = caseStudioSchema.safeParse({
      input: {
        ...clock,
        latitude: Number(location.latitude),
        longitude: Number(location.longitude),
        timezone: location.timezone,
      },
      settings,
      selected,
      dasha: dashaState,
      transit: transitState,
    });
    if (loaded && parsed.success)
      onState?.(
        parsed.data,
        computedKey === requestedKey && !pending && !error ? result : undefined,
        overlay?.bodies ?? [],
      );
  }, [
    loaded,
    clock,
    location,
    settings,
    selected,
    dashaState,
    transitState,
    onState,
    result,
    pending,
    error,
    computedKey,
    requestedKey,
    overlay,
  ]);
  useEffect(() => {
    setOverlay(null);
  }, [calculationKey]);
  useEffect(() => {
    if (!loaded) return;
    let cancelled = false;
    setPending(true);
    setError("");
    const timer = setTimeout(async () => {
      try {
        if (!clock || !location.latitude.trim() || !location.longitude.trim())
          throw new Error(
            "දිනය, වේලාව හා ස්ථානය තහවුරු කරන්න. / Check date, time and location.",
          );
        const r = await proRequest<{ result: ProChartResult }>("/studio", {
          input: {
            ...clock,
            latitude: Number(location.latitude),
            longitude: Number(location.longitude),
            timezone: location.timezone,
          },
          config: JSON.parse(calculationKey),
        });
        if (!cancelled) {
          setResult(r.result);
          setComputedKey(requestedKey);
          setResultConfig(JSON.parse(calculationKey));
          setRevision((v) => v + 1);
        }
      } catch (e) {
        if (!cancelled) {
          setError(errorMessage(e));
          setPlaying(false);
        }
      } finally {
        if (!cancelled) setPending(false);
      }
    }, 450);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [loaded, clock, location, calculationKey, requestedKey]);
  function change<K extends keyof StudioSettings>(
    key: K,
    value: StudioSettings[K],
  ) {
    setSettings((s) => ({ ...s, [key]: value }));
    setRevision((v) => v + 1);
    setNotice("සැකසුම් වෙනස් විය · තවම සුරැකී නැත / Unsaved changes");
  }
  function calculation<K extends keyof CalculationConfig>(
    key: K,
    value: CalculationConfig[K],
  ) {
    change("calculation", { ...settings.calculation, [key]: value });
  }
  async function save(preset = false) {
    setSaving(true);
    setNotice("");
    try {
      await proRequest(
        "/workspace",
        preset
          ? {
              action: "preset",
              name,
              config: settings.calculation,
              studio: settings,
            }
          : { action: "studio", settings },
      );
      if (preset) {
        const d = await proRequest<{ presets: Preset[] }>("/workspace");
        setPresets(d.presets);
      }
      setNotice(
        preset ? "නව ක්‍රම අනුවාදය සුරැකුණි." : "පැතිකඩට සැකසුම් සුරැකුණි.",
      );
    } catch (e) {
      setNotice(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }
  const allBodies: StudioBody[] = result
    ? [
        ...result.navagraha.map((p) => ({
          name: p.graha,
          label: p.grahaSinhala,
          longitude: divisionalLongitude(
            p.longitudeExact ?? p.longitude,
            settings.division,
          ),
          retrograde: p.retrograde,
          dignity: `${p.exalted ? "උච්ච / Exalted" : p.debilitated ? "නීච / Debilitated" : p.ownSign ? "ස්වක්ෂේත්‍ර / Own sign" : "සාමාන්‍ය / Other"}${p.combust ? " · අස්ත / Combust" : ""} (D1)`,
        })),
        {
          name: "Lagna",
          label: "ලග්නය",
          longitude: divisionalLongitude(
            result.lagna.longitudeExact ?? result.lagna.longitude,
            settings.division,
          ),
          retrograde: false,
          dignity: "Ascendant",
        },
      ]
    : [];
  const bodies = allBodies.filter((b) =>
    settings.bodies.includes(b.name as (typeof BODIES)[number]),
  );
  const asc = result
    ? divisionalLongitude(
        result.lagna.longitudeExact ?? result.lagna.longitude,
        settings.division,
      )
    : 0;
  const active = bodies.find((b) => b.name === selected);
  const cells = Array.from({ length: 12 }, (_, i) => ({
    houseNum: i + 1,
    isLagna: i === 0,
    glyphs: bodies
      .filter(
        (b) =>
          b.name !== "Lagna" &&
          studioHouse(b.longitude, asc, settings.houses) === i + 1,
      )
      .map((b) => b.label),
  }));
  function jump(utc: string) {
    setBirth(zonedClock(Date.parse(utc), location.timezone));
    setLive(false);
    setOffset(0);
    setPlaying(false);
  }
  return (
    <Frame embedded={embedded}>
      <div className="pro-page-title">
        <div>
          <p className="pro-eyebrow">THE ASTROLOGER’S STUDIO · 01</p>
          <h1>ග්‍රහ මණ්ඩල වැඩබිම</h1>
          <p className="pro-muted">
            ඔබගේ දැනුම. ඔබගේ ක්‍රමය. සජීවී දෘශ්‍ය අත්දැකීමක්.
          </p>
        </div>
        <div className="studio-actions">
          <button
            className="pro-secondary"
            onClick={() => {
              setReferenceOpen((v) => !v);
              requestAnimationFrame(() => searchRef.current?.focus());
            }}
          >
            සොයන්න / යොමුව <kbd>⌘ K</kbd>
          </button>
          <button
            className="pro-button"
            disabled={!loaded || saving}
            onClick={() => save()}
          >
            සැකසුම් සුරකින්න
          </button>
        </div>
      </div>
      {notice && (
        <p role="status" className="pro-notice">
          {notice}
        </p>
      )}
      {error && (
        <p role="alert" className="pro-notice">
          {error}{" "}
          {result &&
            "පහත දැක්වෙන්නේ අවසන් සාර්ථක සටහනයි / Last successful chart."}
        </p>
      )}
      {!loaded ? (
        <p>වැඩබිම පූරණය වෙමින්…</p>
      ) : (
        <>
          <section className="pro-card studio-clock">
            <div className="studio-actions">
              <button
                className={live ? "pro-button" : "pro-secondary"}
                aria-pressed={live}
                onClick={() => {
                  setLive((v) => !v);
                  setNow(Date.now());
                  setOffset(0);
                  setPlaying(false);
                }}
              >
                ●{" "}
                {live
                  ? offset
                    ? "අහස / Sky replay"
                    : "සජීවී අහස / Live"
                  : "ජන්ම සටහන / Birth"}
              </button>
              <span className="pro-small">
                {live
                  ? "සෑම මිනිත්තුවකම යාවත්කාලීන වේ"
                  : "උපන් ප්‍රදේශයේ සිවිල් වේලාව"}{" "}
                · {location.timezone}
              </span>
            </div>
            <div className="studio-inputs">
              <label>
                දිනය / Date
                <input
                  type="date"
                  min="1800-01-01"
                  max="2200-12-31"
                  value={live ? (clock?.date ?? "") : birth.date}
                  disabled={live}
                  onChange={(e) => {
                    setBirth({ ...birth, date: e.target.value });
                    setOffset(0);
                  }}
                />
              </label>
              <label>
                වේලාව / Time
                <input
                  type="time"
                  value={live ? (clock?.time ?? "") : birth.time}
                  disabled={live}
                  onChange={(e) => {
                    setBirth({ ...birth, time: e.target.value });
                    setOffset(0);
                  }}
                />
              </label>
              <label>
                අක්ෂාංශ / Latitude
                <input
                  type="number"
                  min="-89"
                  max="89"
                  step="any"
                  value={location.latitude}
                  onChange={(e) =>
                    setLocation({ ...location, latitude: e.target.value })
                  }
                />
              </label>
              <label>
                දේශාංශ / Longitude
                <input
                  type="number"
                  min="-180"
                  max="180"
                  step="any"
                  value={location.longitude}
                  onChange={(e) =>
                    setLocation({ ...location, longitude: e.target.value })
                  }
                />
              </label>
              <label>
                කාල කලාපය / IANA zone
                <input
                  value={location.timezone}
                  onChange={(e) =>
                    setLocation({ ...location, timezone: e.target.value })
                  }
                />
              </label>
            </div>
            <div className="studio-scrubber">
              <button
                className="pro-secondary"
                aria-pressed={playing}
                onClick={() => setPlaying((v) => !v)}
              >
                {playing ? "Ⅱ නවත්වන්න" : "▷ කාල චලනය"}
              </button>
              <label>
                කාල වෙනස · {offset > 0 ? "+" : ""}
                {Number(offset.toFixed(4))} h{" "}
                {embedded ? "· minute precision / මිනිත්තුව" : ""}
                <input
                  aria-label="Time offset in hours"
                  type="range"
                  min={embedded && !live ? -2 : -720}
                  max={embedded && !live ? 2 : 720}
                  step={embedded && !live ? 1 / 60 : 1}
                  value={offset}
                  onChange={(e) => {
                    setOffset(+e.target.value);
                    setPlaying(false);
                  }}
                />
              </label>
              <button
                className="pro-text-button"
                onClick={() => {
                  setOffset(0);
                  setNow(Date.now());
                  setPlaying(false);
                }}
              >
                යළි සකසන්න
              </button>
            </div>
            <p className="pro-small">
              {embedded && !live
                ? "±2 පැය · Play: තත්පර 6කට මිනිත්තුවක්. "
                : "±30 දින · Play: තත්පර 6කට පැය 6ක්. "}{" "}
              ජන්ම ක්‍රමයේ සිවිල් පැය; සජීවී ක්‍රමයේ සැබෑ ගතවූ පැය.
            </p>
          </section>
          <div className="studio-grid">
            <section className="pro-card studio-canvas" aria-busy={pending}>
              <div className="studio-chart-heading">
                <div>
                  <p className="pro-eyebrow">
                    {settings.division === 1
                      ? "SIDEREAL LONGITUDES"
                      : "NAVAMSA · SYMBOLIC DIVISION"}
                  </p>
                  <h2>
                    {result?.native.date ?? clock?.date} ·{" "}
                    {result?.native.timeLocal ?? clock?.time}
                  </h2>
                </div>
                <span role="status" className="pro-pill">
                  {pending
                    ? "ගණනය වෙමින්…"
                    : `D${settings.division} · ${(overlay?.calculation ?? settings.calculation).ayanamsa}`}
                </span>
              </div>
              {pending && result && (
                <p role="status" className="pro-small">
                  යාවත්කාලීන වන තෙක් අවසන් සාර්ථක සටහන පෙන්වයි / Showing last
                  successful chart while updating.
                </p>
              )}
              <div className="studio-actions">
                <button
                  aria-pressed={settings.layout === "wheel"}
                  className="pro-secondary"
                  onClick={() => change("layout", "wheel")}
                >
                  ◎ රාශි චක්‍රය
                </button>
                <button
                  aria-pressed={settings.layout === "square"}
                  className="pro-secondary"
                  onClick={() => change("layout", "square")}
                >
                  ▧ සිංහල කේන්ද්‍රය
                </button>
                <select
                  aria-label="Divisional chart"
                  value={settings.division}
                  onChange={(e) => change("division", +e.target.value as 1 | 9)}
                >
                  <option value="1">D1 · රාශි</option>
                  <option value="9">D9 · නවාංශ</option>
                </select>
              </div>
              {result ? (
                <>
                  <div className="studio-chart-stage">
                    {settings.layout === "wheel" ? (
                      <StudioWheel
                        bodies={bodies}
                        transits={
                          settings.division === 1
                            ? overlay?.bodies.filter((b) =>
                                settings.bodies.includes(
                                  b.name as (typeof BODIES)[number],
                                ),
                              )
                            : undefined
                        }
                        asc={asc}
                        settings={settings}
                        selected={selected}
                        onSelect={setSelected}
                      />
                    ) : (
                      <SouthIndianChart
                        cells={cells}
                        centerTitle={`${RASHIS[positionInfo(asc).sign]} · D${settings.division}`}
                      />
                    )}
                  </div>
                  <div
                    className="studio-change"
                    key={revision}
                    aria-hidden="true"
                  />
                  <div className="studio-selection" aria-live="polite">
                    {active
                      ? bodyDescription(active)
                      : "ග්‍රහයෙකු තෝරන්න / Select a planet"}
                  </div>
                  <p className="pro-small">
                    {settings.division === 9
                      ? "D9 යනු භාග සටහනකි — අහසේ සැබෑ ග්‍රහ පිහිටීම් නොවේ. නැකත්/පාද මෙහි D9 ඛණ්ඩාංක සඳහාය. "
                      : "0° මේෂ ඉහළින් · දක්ෂිණාවර්තව · රේඛා අගින් නිවැරදි අංශකය පෙන්වයි. "}
                    බල තත්ත්ව D1 සඳහාය. භාව: {settings.houses}. දෘෂ්ටි: තෝරාගත්
                    ග්‍රහයාගෙන් පිටතට.
                  </p>
                </>
              ) : (
                <div className="pro-empty">ග්‍රහ පිහිටීම් පූරණය වෙමින්…</div>
              )}
            </section>
            <aside className="pro-card studio-controls">
              <p className="pro-eyebrow">METHOD & DISPLAY</p>
              <h2>ඔබගේ ගණන ක්‍රමය</h2>
              <div className="pro-field-grid">
                <label>
                  අයනාංශය
                  <select
                    aria-label="අයනාංශය"
                    value={settings.calculation.ayanamsa}
                    onChange={(e) =>
                      calculation(
                        "ayanamsa",
                        e.target.value as CalculationConfig["ayanamsa"],
                      )
                    }
                  >
                    <option value="lahiri">Lahiri / චිත්‍රපක්ෂ</option>
                    <option value="raman">Raman</option>
                    <option value="kp_new">KP New</option>
                  </select>
                </label>
                <label>
                  රාහු / කේතු
                  <select
                    aria-label="රාහු / කේතු"
                    value={settings.calculation.nodes}
                    onChange={(e) =>
                      calculation("nodes", e.target.value as "mean" | "true")
                    }
                  >
                    <option value="mean">Mean node</option>
                    <option value="true">True node</option>
                  </select>
                </label>
                <label>
                  භාව ක්‍රමය
                  <select
                    aria-label="භාව ක්‍රමය"
                    value={settings.houses}
                    onChange={(e) =>
                      change(
                        "houses",
                        e.target.value as StudioSettings["houses"],
                      )
                    }
                  >
                    <option value="whole-sign">රාශි / Whole sign</option>
                    <option value="equal">Equal · Lagna starts H1</option>
                  </select>
                </label>
                <label>
                  දෘෂ්ටි නීති
                  <select
                    value={settings.aspects}
                    onChange={(e) =>
                      change(
                        "aspects",
                        e.target.value as StudioSettings["aspects"],
                      )
                    }
                  >
                    <option value="parashari">පරාශර · Sign drishti</option>
                    <option value="degree">Degree · 0/60/90/120/180°</option>
                    <option value="none">අක්‍රීය / Off</option>
                  </select>
                </label>
                <label>
                  Orb · {settings.orb}°
                  <input
                    type="range"
                    min="0"
                    max="15"
                    step=".5"
                    disabled={settings.aspects !== "degree"}
                    value={settings.orb}
                    onChange={(e) => change("orb", +e.target.value)}
                  />
                </label>
                <label>
                  දශා වසර · Vimshottari
                  <select
                    value={settings.calculation.dasaYearDays}
                    onChange={(e) =>
                      calculation(
                        "dasaYearDays",
                        +e.target.value as 360 | 365.25,
                      )
                    }
                  >
                    <option value="365.25">365.25 දින</option>
                    <option value="360">360 දින</option>
                  </select>
                </label>
                <label>
                  දශා ශේෂය
                  <select
                    value={settings.calculation.balanceDisplay}
                    onChange={(e) =>
                      calculation(
                        "balanceDisplay",
                        e.target.value as CalculationConfig["balanceDisplay"],
                      )
                    }
                  >
                    <option value="years-months-days">වසර / මාස / දින</option>
                    <option value="decimal-years">දශම වසර</option>
                  </select>
                </label>
              </div>
              <p className="pro-small">
                Equal භාව මෙම දෘශ්‍ය වැඩබිමට පමණි; share-link ගණනය Whole sign
                ලෙස පවතී. පරාශර දෘෂ්ටියට orb නොයෙදේ; රාහු/කේතු දෘෂ්ටි ඇතුළත්
                නැත.
              </p>
              <label className="studio-check">
                <input
                  type="checkbox"
                  checked={settings.nakshatras}
                  onChange={(e) => change("nakshatras", e.target.checked)}
                />
                නැකත් 27 / පාද 108
              </label>
              <fieldset className="studio-bodies">
                <legend>පෙන්වන ග්‍රහයන් / Points</legend>
                {BODIES.map((b) => (
                  <label className="studio-check" key={b}>
                    <input
                      type="checkbox"
                      checked={settings.bodies.includes(b)}
                      onChange={(e) =>
                        change(
                          "bodies",
                          e.target.checked
                            ? [...settings.bodies, b]
                            : settings.bodies.filter((p) => p !== b),
                        )
                      }
                    />
                    {b}
                  </label>
                ))}
              </fieldset>
              <label>
                අර්ථකථන නීති හා සටහන්
                <textarea
                  rows={4}
                  maxLength={6000}
                  value={settings.notes}
                  placeholder="ඔබගේ සම්ප්‍රදාය, මූලාශ්‍ර, පරීක්ෂණ…"
                  onChange={(e) => change("notes", e.target.value)}
                />
              </label>
              <p className="pro-small">
                පුද්ගලික සටහන් පමණි — ගණනයට ක්‍රියාත්මක නොවේ. සුරැකීමේදී පැතිකඩට
                එක් වේ.
              </p>
              <details>
                <summary>සුරැකි ක්‍රම / Presets ({presets.length})</summary>
                <label>
                  නව අනුවාදයේ නම
                  <input
                    minLength={2}
                    maxLength={100}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </label>
                <button
                  className="pro-button"
                  disabled={saving || name.trim().length < 2}
                  onClick={() => save(true)}
                >
                  නව ක්‍රම අනුවාදය සුරකින්න
                </button>
                <label>
                  පිටපතක් පූරණය කරන්න
                  <select
                    defaultValue=""
                    onChange={(e) => {
                      const p = presets.find((p) => p.id === e.target.value);
                      if (p) {
                        setSettings(
                          studioSettingsSchema.parse({
                            ...p.studio,
                            calculation: p.config,
                          }),
                        );
                        setName(p.name);
                        setRevision((v) => v + 1);
                        setNotice("පිටපත පූරණය විය. පැරණි අනුවාදය නොවෙනස්ය.");
                      }
                      e.target.value = "";
                    }}
                  >
                    <option value="">ක්‍රමය තෝරන්න…</option>
                    {presets.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} · v{p.version}
                      </option>
                    ))}
                  </select>
                </label>
              </details>
            </aside>
          </div>
          {result && (
            <section className="pro-card studio-worksheet studio-planet-worksheet">
              <div className="studio-chart-heading">
                <div>
                  <p className="pro-eyebrow">
                    MANUAL WORKSHEET · D{settings.division}
                  </p>
                  <h2>ග්‍රහ ස්ඵුට හා යොමු සටහන</h2>
                </div>
                <button
                  className="pro-secondary studio-no-print"
                  onClick={() => window.print()}
                >
                  මුද්‍රණය / PDF
                </button>
              </div>
              <p className="pro-small">
                {result.native.date} {result.native.timeLocal} ·{" "}
                {result.native.timezone} · {result.native.latitude},{" "}
                {result.native.longitude} · {result.tradition.ayanamsa}{" "}
                {result.tradition.ayanamsaDegrees}° ·{" "}
                {(overlay?.calculation ?? resultConfig).nodes} nodes ·{" "}
                {settings.houses} houses · Vimshottari{" "}
                {result.vimshottari.convention.yearDays}d
              </p>
              <p className="pro-small">
                දශා ශේෂය · {result.vimshottari.balanceAtBirth.lordSinhala}:{" "}
                {settings.calculation.balanceDisplay === "decimal-years"
                  ? `${result.vimshottari.balanceAtBirth.years.toFixed(4)} years`
                  : (() => {
                      const d = splitDashaYears(
                        result.vimshottari.balanceAtBirth.years,
                        result.vimshottari.convention.yearDays,
                      );
                      return `${d.y} වසර / ${d.m} මාස / ${d.d} දින`;
                    })()}
              </p>
              <div className="pro-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>ග්‍රහයා</th>
                      <th>රාශිය / ස්ඵුට</th>
                      <th>නැකත / පාදය</th>
                      <th>භාවය</th>
                      <th>තත්ත්වය (D1)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bodies.map((b) => {
                      const p = positionInfo(b.longitude);
                      return (
                        <tr
                          key={b.name}
                          className={
                            selected === b.name ? "studio-row-selected" : ""
                          }
                        >
                          <td>
                            <button
                              className="pro-text-button"
                              onClick={() => setSelected(b.name)}
                            >
                              {b.label} · {b.name}
                            </button>
                          </td>
                          <td>
                            {RASHIS[p.sign]} {p.degree.toFixed(4)}°
                          </td>
                          <td>
                            {NAKSHATRAS[p.nakshatra]} / {p.pada}
                          </td>
                          <td>
                            {studioHouse(b.longitude, asc, settings.houses)}
                          </td>
                          <td>
                            {b.retrograde ? "℞ · " : ""}
                            {b.dignity}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {settings.notes && (
                <p className="studio-notes">{settings.notes}</p>
              )}
              <p className="pro-small">
                සම්ප්‍රදායික අධ්‍යයන මෙවලමක් පමණි. අනාවැකි සඳහා විද්‍යාත්මක
                සහතිකයක් නැත.
              </p>
            </section>
          )}
        </>
      )}
      {result && <YogaDesk result={result} />}
      {result && (
        <SaveChart
          result={result}
          config={overlay?.calculation ?? resultConfig}
          ready={!pending && !error}
        />
      )}
      {loaded && (
        <TransitDesk
          key={calculationKey}
          result={workingResult}
          ready={!pending && !error}
          config={settings.calculation}
          onOverlay={setOverlay}
          initialState={initialState?.transit}
          onState={setTransitState}
        />
      )}
      {result && (
        <DashaBrowser
          key={`${result.native.utcTime}-${result.tradition.ayanamsa}-${result.vimshottari.convention.yearDays}`}
          result={result}
          initialState={initialState?.dasha}
          onState={setDashaState}
        />
      )}
      {referenceOpen && (
        <StudioReference
          inputRef={searchRef}
          result={result}
          presets={presets}
          onJump={jump}
          onSelect={setSelected}
          onClose={() => setReferenceOpen(false)}
        />
      )}
    </Frame>
  );
}
