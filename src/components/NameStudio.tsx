"use client";
import { useEffect, useRef, useState } from "react";
import type { Lang } from "@/lib/i18n";
import type { SuggestedName, LetterSource } from "@/lib/names/types";
import {
  RELIGION_OPTIONS,
  type ReligionContext,
} from "@/lib/names/personalities";
import {
  NAME_COUNT_DEFAULT,
  NAME_COUNT_MAX,
  clampNameCount,
} from "@/lib/names/name-count";
import { apiUrl } from "@/lib/base-path";
import { track } from "@/lib/analytics";
type BirthPayload = {
  date: string;
  time: string;
  placeId?: string;
  placeName?: string;
  latitude?: number;
  longitude?: number;
  gender?: string;
  nativeName?: string;
};
const split = (s: string) =>
  s
    .split(/[,،|/·•\s]+/)
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 16);
const contextLabel = (id: ReligionContext, lang: Lang) => {
  const r = RELIGION_OPTIONS.find((r) => r.id === id);
  return r ? (lang === "si" ? r.si : r.en) : id;
};
export function NameStudio({
  lang,
  birth,
  hasChart,
}: {
  lang: Lang;
  birth: BirthPayload;
  hasChart: boolean;
}) {
  const si = lang === "si";
  const [letterSource, setLetterSource] = useState<LetterSource>("chart"),
    [firstRaw, setFirstRaw] = useState(""),
    [middleRaw, setMiddleRaw] = useState("");
  const [religion, setReligion] = useState<ReligionContext>("buddhist"),
    [traditional, setTraditional] = useState(false),
    [review, setReview] = useState(false),
    [count, setCount] = useState(NAME_COUNT_DEFAULT);
  const [names, setNames] = useState<SuggestedName[]>([]),
    [letters, setLetters] = useState<{
      primary: string;
      first: string[];
      middle: string[];
    } | null>(null);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [picked, setPicked] = useState<SuggestedName | null>(null);
  const history = useRef<string[]>([]),
    partHistory = useRef<string[]>([]),
    session = useRef("");
  // Freeze the constraints used for results; changing form controls must not reshuffle
  // old names with a new religion or starting-letter set.
  const resultOptions = useRef({ religion, traditional, review, letterSource });
  useEffect(() => {
    session.current = `names_${Math.random().toString(36).slice(2)}`;
  }, []);
  function resetResults() {
    setNames([]);
    setLetters(null);
    setPicked(null);
    history.current = [];
    partHistory.current = [];
    setNotice("");
    setError("");
  }
  async function post(path: string, data: unknown) {
    const res = await fetch(apiUrl(path), {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Hadahana-Action": "1" },
      body: JSON.stringify(data),
    });
    const j = await res.json();
    if (!j.ok) throw Error(j.error || "Please try again.");
    return j;
  }
  async function generate() {
    if (letterSource === "chart" && !hasChart) {
      setError(si ? "පළමුව කේන්ද්‍රය සාදන්න." : "Cast the chart first.");
      return;
    }
    if (letterSource === "manual" && !split(firstRaw).length) {
      setError(si ? "ආරම්භක අකුරු ඇතුළත් කරන්න." : "Enter first-name letters.");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    setPicked(null);
    track("name_suggestions_requested");
    try {
      const j = await post("/api/names/suggest", {
        birth,
        letterSource,
        manualFirstLetters: split(firstRaw),
        manualMiddleLetters: split(middleRaw),
        religionContext: religion,
        includeTraditional: traditional,
        includeReview: review,
        count,
        excludePairs: history.current.slice(-2048),
        verifyCurrentUsage: false,
      });
      setNames(j.names);
      setLetters(j.letters);
      resultOptions.current = { religion, traditional, review, letterSource };
      history.current = [
        ...new Set([
          ...history.current,
          ...j.names.map((n: SuggestedName) => n.roman),
        ]),
      ].slice(-2048);
      if (j.exhausted || !j.names.length)
        setNotice(
          si
            ? "මෙම අකුරු සහ මනාප සඳහා සමාලෝචිත නව විකල්ප අඩුයි. අකුරු හෝ මනාප වෙනස් කළ හැක; හිඟය පිරවීමට නම්/අර්ථ නිර්මාණය නොකරමු."
            : "Fewer reviewed, unused matches remain for these letters/preferences. We will not invent names or meanings to fill the count.",
        );
      if (j.unmatchedLetters?.length)
        setNotice(
          (j.exhausted
            ? si
              ? "සමාලෝචිත විකල්ප අඩුයි. "
              : "Fewer reviewed matches remain. "
            : "") +
            (si
              ? `මෙම අකුරු සඳහා සමාලෝචිත නම් නැත: ${j.unmatchedLetters.join(", ")}. දී ඇති වෙනත් අකුරු පමණක් යොදා ඇත.`
              : `No reviewed matches for: ${j.unmatchedLetters.join(", ")}. Only your other allowed letters are used.`),
        );
      track("name_suggestions_generated", { method: "curated" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  async function swap(n: SuggestedName, part: "first" | "middle") {
    if (!letters) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const opts = resultOptions.current;
      const j = await post("/api/names/reshuffle", {
        current: n,
        part,
        firstLetters: letters.first,
        middleLetters: letters.middle,
        primary: letters.primary,
        gender:
          birth.gender === "male" || birth.gender === "female"
            ? birth.gender
            : "unspecified",
        religionContext: opts.religion,
        includeTraditional: opts.traditional,
        includeReview: opts.review,
        letterSource: opts.letterSource,
        excludePairs: history.current.slice(-2048),
        excludeParts: partHistory.current.slice(-2048),
        sessionId: session.current,
        recordDownvote: true,
      });
      if (j.warning) setNotice(j.warning);
      history.current = [...new Set([...history.current, j.name.roman])].slice(
        -2048,
      );
      partHistory.current = [
        ...new Set([...partHistory.current, n[part].roman]),
      ].slice(-2048);
      setNames((list) => list.map((x) => (x.roman === n.roman ? j.name : x)));
      setPicked((cur) => (cur?.roman === n.roman ? j.name : cur));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  async function feedback(n: SuggestedName, action: "up" | "down") {
    setBusy(true);
    setError("");
    try {
      await post("/api/names/feedback", {
        action,
        target: "full",
        firstRoman: n.first.roman,
        firstSinhala: n.first.sinhala,
        middleRoman: n.middle.roman,
        middleSinhala: n.middle.sinhala,
        sessionId: session.current,
      });
      setNotice(si ? "ඔබේ ප්‍රතිචාරය සටහන් කළා." : "Feedback recorded.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="name-studio">
      <header className="name-studio-head">
        <h3>{si ? "නවීන නාම චිත්‍රාගාරය" : "Modern Name Studio"}</h3>
        <p>
          {si
            ? "කෙටි, කියවීමට පහසු, සංස්කෘතියට ගැළපෙන මුල් + මධ්‍ය නම්."
            : "Short, readable first + middle names, with cultural preferences."}
        </p>
      </header>
      <p className="muted">
        {si
          ? "ජනීෂ් / විදියන් වැනි නවීන ශබ්ද රටාවන්ට ප්‍රමුඛතාව දෙමු; නමේ ශබ්දයෙන් අර්ථයක් හෝ ආගමක් අනුමාන නොකරමු."
          : "Modern sound styles like Janeesh / Vidiyan guide ranking, but sound alone never establishes a meaning or religion."}
      </p>
      <div
        className="name-source-tabs"
        role="tablist"
        aria-label="Starting-letter source"
      >
        {(["chart", "manual"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            role="tab"
            aria-selected={letterSource === mode}
            disabled={busy}
            className={letterSource === mode ? "active" : ""}
            onClick={() => {
              setLetterSource(mode);
              resetResults();
            }}
          >
            {mode === "chart"
              ? si
                ? "කේන්ද්‍ර අකුරු"
                : "Chart letters"
              : si
                ? "අතින් අකුරු"
                : "Manual letters"}
          </button>
        ))}
      </div>
      {letterSource === "manual" && (
        <div className="name-studio-grid">
          <label>
            {si ? "මුල් නමේ අකුරු" : "First-name letters"}
            <input
              value={firstRaw}
              disabled={busy}
              onChange={(e) => {
                setFirstRaw(e.target.value);
                resetResults();
              }}
              placeholder="ට, ටි, ම, මි, මු, ප, පි"
            />
          </label>
          <label>
            {si ? "මධ්‍ය නමේ අකුරු (විකල්ප)" : "Middle-name letters (optional)"}
            <input
              value={middleRaw}
              disabled={busy}
              onChange={(e) => {
                setMiddleRaw(e.target.value);
                resetResults();
              }}
              placeholder={
                si
                  ? "හිස් නම් මුල් අකුරුම යොදයි"
                  : "Blank = reuse first letters"
              }
            />
          </label>
        </div>
      )}
      <div className="name-studio-grid">
        <label>
          {si ? "ආගමික / සංස්කෘතික මනාපය" : "Religion / culture preference"}
          <select
            aria-label={
              si ? "ආගමික / සංස්කෘතික මනාපය" : "Religion / culture preference"
            }
            value={religion}
            disabled={busy}
            onChange={(e) => {
              setReligion(e.target.value as ReligionContext);
              resetResults();
            }}
          >
            {RELIGION_OPTIONS.filter(
              (r) => !["unspecified", "interfaith"].includes(r.id),
            ).map((r) => (
              <option key={r.id} value={r.id}>
                {si ? r.si : r.en}
              </option>
            ))}
          </select>
        </label>
        <label>
          {si ? "නම් ගණන" : "Number of names"}
          <input
            type="number"
            min={1}
            max={NAME_COUNT_MAX}
            value={count}
            disabled={busy}
            onChange={(e) => setCount(clampNameCount(e.target.value))}
          />
        </label>
      </div>
      <label className="place-custom-toggle">
        <input
          type="checkbox"
          checked={traditional}
          disabled={busy}
          onChange={(e) => {
            setTraditional(e.target.checked);
            resetResults();
          }}
        />
        {si
          ? "සාම්ප්‍රදායික නම් ද ඇතුළත් කරන්න"
          : "Include traditional names (lower modernity score)"}
      </label>
      <label className="place-custom-toggle">
        <input
          type="checkbox"
          checked={review}
          disabled={busy}
          onChange={(e) => {
            setReview(e.target.checked);
            resetResults();
          }}
        />
        {si
          ? "අර්ථය තහවුරු නොකළ නවීන නම් ද බලන්න (සමාලෝචනය සඳහා පමණි)"
          : "Show modern names with unverified meanings (review only)"}
      </label>
      <p className="muted">
        {si
          ? "නවීනත්වය සංස්කාරක ඇගයීමකි; 2026 උපත් ජනප්‍රියතා දත්ත නොවේ. අකුරු නැති නම් වෙනත් අකුරු රහසේ යොදා නොගනිමු."
          : "Modernity is editorial, not verified 2026 newborn popularity. Scarce letters are never silently substituted. Culture tags describe compatibility, not someone’s identity."}
      </p>
      <button
        type="button"
        className="primary"
        disabled={busy}
        onClick={generate}
      >
        {busy
          ? si
            ? "නම් සොයමින්…"
            : "Finding names…"
          : si
            ? `මුල්+මධ්‍ය නම් ${count}ක් ජනනය කරන්න`
            : `Generate ${count} first + middle names`}
      </button>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="name-notice" role="status">
          {notice}
        </p>
      )}
      {letters && (
        <p className="muted">
          {si ? "මුල්" : "First"}: {letters.first.join(" · ")} /{" "}
          {si ? "මධ්‍ය" : "Middle"}: {letters.middle.join(" · ")}
          <br />
          {si
            ? "පිලි සහිත අකුරකට මූල ව්‍යංජනයද ඉඩ ඇත; ට සහ ත වෙනස් අකුරුය."
            : "Vowel-marked letters can use their base consonant; ට and ත remain distinct."}
        </p>
      )}
      {picked && (
        <aside className="name-picked">
          <h4>{si ? "තෝරාගත් නම" : "Selected name"}</h4>
          <p>
            {picked.sinhala} / {picked.roman}
          </p>
          <p>{si ? picked.meaningSi : picked.meaningEn}</p>
        </aside>
      )}
      <div className="name-cards">
        {names.map((n) => (
          <article className="name-card" key={n.roman}>
            <header>
              <strong>
                {n.sinhala}
                <br />
                <span className="name-roman">{n.roman}</span>
              </strong>
              <span className="name-badge">
                {n.first.startsWith} + {n.middle.startsWith}
              </span>
            </header>
            <p className="name-meaning">{si ? n.meaningSi : n.meaningEn}</p>
            <p className="name-quality-tags">
              {si ? "ගැළපෙන සන්දර්භ: " : "Compatible contexts: "}
              {(n.religionTags ?? [])
                .map((r) => contextLabel(r, lang))
                .join(" · ")}
              <br />
              {si ? "ශෛලිය" : "Style"}: {n.era} ·{" "}
              {si ? "සංස්කාරක ලකුණු" : "Editorial score"}: {n.score}
            </p>
            {n.meaningStatus === "review" ? (
              <p className="name-review-warning">
                {si
                  ? "අර්ථය සත්‍යාපනය කර නැත. අවසාන තේරීමට පෙර භාෂා විශේෂඥයෙකුගෙන් විමසන්න."
                  : "Meaning unverified. Ask a language specialist before your final choice."}
              </p>
            ) : (
              <details>
                <summary>{si ? "අර්ථ මූලාශ්‍ර" : "Meaning sources"}</summary>
                {(n.meaningSources ?? []).map((url, i) => (
                  <p key={i}>
                    <a href={url} target="_blank" rel="noreferrer">
                      {i === 0 ? n.first.roman : n.middle.roman} —{" "}
                      {si ? "මූලාශ්‍රය" : "source"}
                    </a>
                  </p>
                ))}
              </details>
            )}
            <div className="name-feedback-bar">
              <button
                type="button"
                disabled={busy}
                onClick={() => feedback(n, "up")}
                aria-label={`Like ${n.roman}`}
              >
                ♥
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => feedback(n, "down")}
                aria-label={`Dislike ${n.roman}`}
              >
                ✕
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => swap(n, "first")}
              >
                {si ? "මුල් මාරු" : "Swap first"}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => swap(n, "middle")}
              >
                {si ? "මධ්‍ය මාරු" : "Swap middle"}
              </button>
            </div>
            <footer>
              <span>{si ? "සමාලෝචිත නාම එකතුව" : "Curated catalogue"}</span>
              <button type="button" onClick={() => setPicked(n)}>
                {si ? "මෙය තෝරන්න" : "Pick this"}
              </button>
            </footer>
          </article>
        ))}
      </div>
    </section>
  );
}
