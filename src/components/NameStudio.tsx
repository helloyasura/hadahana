"use client";

import { track } from "@/lib/analytics";

import { useEffect, useMemo, useState, useTransition } from "react";
import type { Lang } from "@/lib/i18n";
import {
  INTERESTS,
  LIVING_COUNTRIES,
  NAMING_PERSONALITIES,
  NAME_LANGUAGE_OPTIONS,
  RELIGION_OPTIONS,
  type InterestId,
  type LivingCountry,
  type NameLanguagePref,
  type NamingPersonalityId,
  type ReligionContext,
} from "@/lib/names/personalities";
import type { LetterSource, SuggestedName } from "@/lib/names/types";
import {
  NAME_COUNT_DEFAULT,
  NAME_COUNT_MAX,
  NAME_COUNT_MIN,
  clampNameCount,
} from "@/lib/names/name-count";
import { apiUrl } from "@/lib/base-path";

type LearningBrief = {
  likedFirst: string[];
  dislikedFirst: string[];
  likedMiddle: string[];
  dislikedMiddle: string[];
};

function ensureSessionId(): string {
  if (typeof window === "undefined") return "server";
  const key = "handahana-name-session";
  let id = window.localStorage.getItem(key);
  if (!id) {
    id = `s_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
    window.localStorage.setItem(key, id);
  }
  return id;
}

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

function splitLetters(raw: string): string[] {
  return raw
    .split(/[,،|/·•\s]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 16);
}

export function NameStudio({
  lang,
  birth,
  hasChart,
}: {
  lang: Lang;
  birth: BirthPayload;
  hasChart: boolean;
}) {
  const [letterSource, setLetterSource] = useState<LetterSource>("chart");
  const [manualFirstRaw, setManualFirstRaw] = useState("");
  const [manualMiddleRaw, setManualMiddleRaw] = useState("");
  const [motherName, setMotherName] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [siblingsRaw, setSiblingsRaw] = useState("");
  const [sharedHopes, setSharedHopes] = useState("");
  const [interestsMother, setInterestsMother] = useState<InterestId[]>([]);
  const [interestsFather, setInterestsFather] = useState<InterestId[]>([]);
  const [livingCountry, setLivingCountry] = useState<LivingCountry>("lk");
  const [personality, setPersonality] = useState<
    NamingPersonalityId | "ensemble"
  >("ensemble");
  const [religionContext, setReligionContext] =
    useState<ReligionContext>("unspecified");
  const [nameLanguage, setNameLanguage] =
    useState<NameLanguagePref>("bilingual");
  const [verifyCurrentUsage, setVerifyCurrentUsage] = useState(true);
  const [preferPrimary, setPreferPrimary] = useState(true);
  const [nameCount, setNameCount] = useState(NAME_COUNT_DEFAULT);
  const [names, setNames] = useState<SuggestedName[]>([]);
  const [letters, setLetters] = useState<{
    primary: string;
    primaryRoman: string;
    all: string[];
    first?: string[];
    middle?: string[];
  } | null>(null);
  const [usedAgents, setUsedAgents] = useState<string[]>([]);
  const [source, setSource] = useState<string>("");
  const [framework, setFramework] = useState<string>("");
  const [graphTrace, setGraphTrace] = useState<string[]>([]);
  const [resultLetterSource, setResultLetterSource] = useState<string>("");
  const [usageInfo, setUsageInfo] = useState<{
    enabled: boolean;
    live: boolean;
    sources: string[];
    verifiedCount: number;
  } | null>(null);
  const [personaSummary, setPersonaSummary] = useState<string>("");
  const [learning, setLearning] = useState<LearningBrief | null>(null);
  const [sessionId, setSessionId] = useState("");
  const [feedbackBusy, setFeedbackBusy] = useState<string | null>(null);
  const [picked, setPicked] = useState<SuggestedName | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setSessionId(ensureSessionId());
  }, []);

  const siblingNames = useMemo(
    () =>
      siblingsRaw
        .split(/[,،\n]/)
        .map((s) => s.trim())
        .filter(Boolean),
    [siblingsRaw],
  );

  const countryHint = LIVING_COUNTRIES.find((c) => c.id === livingCountry);
  const manualFirstLetters = useMemo(
    () => splitLetters(manualFirstRaw),
    [manualFirstRaw],
  );
  const manualMiddleLetters = useMemo(
    () => splitLetters(manualMiddleRaw),
    [manualMiddleRaw],
  );

  function toggleInterest(which: "mother" | "father", id: InterestId) {
    const cur = which === "mother" ? interestsMother : interestsFather;
    const next = cur.includes(id)
      ? cur.filter((x) => x !== id)
      : [...cur, id].slice(0, 6);
    if (which === "mother") setInterestsMother(next);
    else setInterestsFather(next);
  }

  function generate() {
    if (letterSource === "chart" && !hasChart) {
      setError(
        lang === "si"
          ? "කේන්ද්‍ර අකුරු සඳහා පළමුව කේන්ද්‍රය සාදන්න — නැතහොත් 'අතින් අකුරු' තෝරන්න."
          : "Cast the Kendraya first for chart letters — or switch to Manual letters.",
      );
      return;
    }
    if (letterSource === "manual" && !manualFirstLetters.length) {
      setError(
        lang === "si"
          ? "මුල් නම සඳහා අකුරු ඇතුළත් කරන්න (උදා: මො, ර)."
          : "Enter at least one first-name letter (e.g. මො, ර).",
      );
      return;
    }
    setError(null);
    setPicked(null);
    track("tool_used", { tool: "nam" });
    track("name_suggestions_requested");
    startTransition(async () => {
      try {
        const res = await fetch(apiUrl("/api/names/suggest"), {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Hadahana-Action": "1" },
          body: JSON.stringify({
            birth: letterSource === "chart" || birth.date ? birth : undefined,
            motherName: motherName || undefined,
            fatherName: fatherName || undefined,
            siblingNames,
            interestsMother,
            interestsFather,
            sharedHopes: sharedHopes || undefined,
            livingCountry,
            personality,
            religionContext,
            nameLanguage,
            verifyCurrentUsage,
            preferPrimaryLetter: preferPrimary,
            count: clampNameCount(nameCount),
            letterSource,
            manualFirstLetters:
              letterSource === "manual" ? manualFirstLetters : undefined,
            manualMiddleLetters:
              letterSource === "manual" && manualMiddleLetters.length
                ? manualMiddleLetters
                : undefined,
          }),
        });
        const json = await res.json();
        if (!json.ok) throw new Error(json.error || "failed");
        setNames(json.names as SuggestedName[]);
        track("name_suggestions_generated", { method: json.source === "seed" ? "fallback" : "ai" });
        setLetters(json.letters);
        setUsedAgents(json.personalitiesUsed ?? []);
        setSource(json.source ?? "");
        setFramework(json.framework ?? "");
        setGraphTrace(
          Array.isArray(json.graphTrace) ? json.graphTrace.slice(0, 12) : [],
        );
        setResultLetterSource(json.letterSource ?? letterSource);
        setUsageInfo(json.usageVerification ?? null);
        const persona = json.horoscopePersona;
        setPersonaSummary(
          persona
            ? lang === "si"
              ? (persona.summarySi as string)
              : (persona.summaryEn as string)
            : "",
        );
        setLearning(json.learning ?? null);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  }

  function replaceNameInList(prev: SuggestedName, next: SuggestedName) {
    setNames((list) =>
      list.map((n) => (n.roman === prev.roman && n.sinhala === prev.sinhala ? next : n)),
    );
    setPicked((cur) =>
      cur && cur.roman === prev.roman && cur.sinhala === prev.sinhala ? next : cur,
    );
  }

  async function sendFeedback(
    n: SuggestedName,
    action: "up" | "down",
    target: "full" | "first" | "middle",
  ) {
    const busyKey = `${n.roman}:${target}:${action}`;
    setFeedbackBusy(busyKey);
    setError(null);
    try {
      const res = await fetch(apiUrl("/api/names/feedback"), {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Hadahana-Action": "1" },
        body: JSON.stringify({
          action,
          target,
          firstRoman: n.first.roman,
          firstSinhala: n.first.sinhala,
          middleRoman: n.middle.roman,
          middleSinhala: n.middle.sinhala,
          sessionId: sessionId || ensureSessionId(),
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "feedback failed");
      if (json.learning) {
        setLearning({
          likedFirst: json.learning.likedFirst ?? [],
          dislikedFirst: json.learning.dislikedFirst ?? [],
          likedMiddle: json.learning.likedMiddle ?? [],
          dislikedMiddle: json.learning.dislikedMiddle ?? [],
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setFeedbackBusy(null);
    }
  }

  async function reshufflePart(n: SuggestedName, part: "first" | "middle") {
    if (!letters?.primary) {
      setError(
        lang === "si"
          ? "ප්‍රතිස්ථාපනයට පෙර නම් ජනනය කරන්න."
          : "Generate names before reshuffling.",
      );
      return;
    }
    const busyKey = `${n.roman}:reshuffle:${part}`;
    setFeedbackBusy(busyKey);
    setError(null);
    try {
      const res = await fetch(apiUrl("/api/names/reshuffle"), {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Hadahana-Action": "1" },
        body: JSON.stringify({
          part,
          current: n,
          pool: names,
          firstLetters: letters.first ?? letters.all,
          middleLetters: letters.middle ?? letters.all,
          primary: letters.primary,
          gender: birth.gender === "male" || birth.gender === "female"
            ? birth.gender
            : "unspecified",
          country: livingCountry,
          letterSource: resultLetterSource || letterSource,
          sessionId: sessionId || ensureSessionId(),
          recordDownvote: true,
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "reshuffle failed");
      replaceNameInList(n, json.name as SuggestedName);
      if (json.learning) {
        setLearning({
          likedFirst: json.learning.likedFirst ?? [],
          dislikedFirst: json.learning.dislikedFirst ?? [],
          likedMiddle: json.learning.likedMiddle ?? [],
          dislikedMiddle: json.learning.dislikedMiddle ?? [],
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setFeedbackBusy(null);
    }
  }

  return (
    <section className="name-studio">
      <header className="name-studio-head">
        <h3>
          {lang === "si"
            ? "නවීන නාම චිත්‍රාගාරය (Agentic)"
            : "Modern Name Studio (Agentic)"}
        </h3>
        <p>
          {lang === "si"
            ? "සෑම යෝජනාවකම මුල් නම + මධ්‍ය නම ඇත. කේන්ද්‍ර අකුරු හෝ අතින් ඇතුළත් අකුරු — වෙන වෙනම විකල්ප දෙකකි."
            : "Every suggestion includes a first + middle name. Chart letters and manual letter entry are separate options."}
        </p>
      </header>

      <div className="name-source-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          className={letterSource === "chart" ? "active" : ""}
          aria-selected={letterSource === "chart"}
          onClick={() => setLetterSource("chart")}
        >
          {lang === "si" ? "කේන්ද්‍ර අකුරු" : "Chart letters"}
        </button>
        <button
          type="button"
          role="tab"
          className={letterSource === "manual" ? "active" : ""}
          aria-selected={letterSource === "manual"}
          onClick={() => setLetterSource("manual")}
        >
          {lang === "si" ? "අතින් අකුරු ඇතුළත් කරන්න" : "Manual letters"}
        </button>
      </div>

      {letterSource === "chart" ? (
        <p className="muted name-source-note">
          {hasChart
            ? lang === "si"
              ? "නම් තැබීමේ අකුරු කේන්ද්‍රයෙන් ගනී. මුල් සහ මධ්‍ය නම් ඒ අකුරු යටතේ ජනනය වේ."
              : "Letters come from the cast Kendraya. First and middle names are generated under those letters."
            : lang === "si"
              ? "මෙම විකල්පයට කේන්ද්‍රය සාදන්න අවශ්‍යයි."
              : "This option needs a cast Kendraya first."}
        </p>
      ) : (
        <div className="name-manual-letters">
          <p className="muted name-source-note">
            {lang === "si"
              ? "වෙනම විකල්පයකි — ඔබට අවශ්‍ය ආරම්භක අකුරු අතින් දෙන්න (කේන්ද්‍රය අනිවාර්ය නොවේ)."
              : "Separate option — type starting letters yourself (chart not required)."}
          </p>
          <div className="name-studio-grid">
            <label>
              <span>
                {lang === "si"
                  ? "මුල් නමේ අකුරු (අනිවාර්ය)"
                  : "First-name letters (required)"}
              </span>
              <input
                value={manualFirstRaw}
                onChange={(e) => setManualFirstRaw(e.target.value)}
                placeholder={
                  lang === "si" ? "උදා: මො, ර, ය" : "e.g. මො, ර, ය or Mo, Ra"
                }
              />
            </label>
            <label>
              <span>
                {lang === "si"
                  ? "මධ්‍ය නමේ අකුරු (විකල්ප)"
                  : "Middle-name letters (optional)"}
              </span>
              <input
                value={manualMiddleRaw}
                onChange={(e) => setManualMiddleRaw(e.target.value)}
                placeholder={
                  lang === "si"
                    ? "හිස් නම් මුල් අකුරුම යොදයි · උදා: ස, ක"
                    : "Blank = reuse first letters · e.g. ස, ක"
                }
              />
            </label>
          </div>
          {manualFirstLetters.length ? (
            <p className="muted">
              {lang === "si" ? "මුල්" : "First"}:{" "}
              {manualFirstLetters.join(" · ")}
              {" · "}
              {lang === "si" ? "මධ්‍ය" : "Middle"}:{" "}
              {(manualMiddleLetters.length
                ? manualMiddleLetters
                : manualFirstLetters
              ).join(" · ")}
            </p>
          ) : null}
        </div>
      )}

      <div className="name-studio-grid">
        <label>
          <span>{lang === "si" ? "මවගේ නම" : "Mother's name"}</span>
          <input
            value={motherName}
            onChange={(e) => setMotherName(e.target.value)}
          />
        </label>
        <label>
          <span>{lang === "si" ? "පියාගේ නම" : "Father's name"}</span>
          <input
            value={fatherName}
            onChange={(e) => setFatherName(e.target.value)}
          />
        </label>
        <label className="span-2">
          <span>
            {lang === "si"
              ? "සහෝදර/සහෝදරියන් (කොමාවෙන්)"
              : "Siblings (comma-separated)"}
          </span>
          <input
            value={siblingsRaw}
            onChange={(e) => setSiblingsRaw(e.target.value)}
            placeholder={
              lang === "si" ? "උදා: සහන්, නෙත්මි" : "e.g. Sahan, Nethmi"
            }
          />
        </label>
        <label>
          <span>{lang === "si" ? "ජීවත් වන රට" : "Living country"}</span>
          <select
            value={livingCountry}
            onChange={(e) => setLivingCountry(e.target.value as LivingCountry)}
          >
            {LIVING_COUNTRIES.map((c) => (
              <option key={c.id} value={c.id}>
                {lang === "si" ? c.si : c.en}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>
            {lang === "si" ? "නාම නියෝජිත පෞරුෂය" : "Naming agent"}
          </span>
          <select
            value={personality}
            onChange={(e) =>
              setPersonality(
                e.target.value as NamingPersonalityId | "ensemble",
              )
            }
          >
            <option value="ensemble">
              {lang === "si"
                ? "Ensemble (නිර්දේශිත — භාෂා/සාහිත්‍ය/ආගමික ඇතුළු)"
                : "Ensemble (recommended — language/literature/religion)"}
            </option>
            {NAMING_PERSONALITIES.map((p) => (
              <option key={p.id} value={p.id}>
                {lang === "si" ? p.si : p.en}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>
            {lang === "si" ? "නම් ගණන" : "Number of names"}
          </span>
          <input
            type="number"
            min={NAME_COUNT_MIN}
            max={NAME_COUNT_MAX}
            step={1}
            value={nameCount}
            onChange={(e) =>
              setNameCount(clampNameCount(e.target.value || NAME_COUNT_DEFAULT))
            }
          />
          <span className="muted name-count-hint">
            {lang === "si"
              ? `${NAME_COUNT_MIN}–${NAME_COUNT_MAX} අතර ඕනෑම ගණනක්`
              : `Any number from ${NAME_COUNT_MIN} to ${NAME_COUNT_MAX}`}
          </span>
        </label>
        <label>
          <span>
            {lang === "si" ? "නාම භාෂා මනාපය" : "Name language preference"}
          </span>
          <select
            value={nameLanguage}
            onChange={(e) =>
              setNameLanguage(e.target.value as NameLanguagePref)
            }
          >
            {NAME_LANGUAGE_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>
                {lang === "si" ? o.si : o.en}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>
            {lang === "si" ? "ආගමික / විශ්වාස සන්දර්භය" : "Religion / faith context"}
          </span>
          <select
            value={religionContext}
            onChange={(e) =>
              setReligionContext(e.target.value as ReligionContext)
            }
          >
            {RELIGION_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>
                {lang === "si" ? o.si : o.en}
              </option>
            ))}
          </select>
        </label>
      </div>

      {countryHint ? (
        <p className="name-country-hint muted">{countryHint.namingHint}</p>
      ) : null}

      <label className="place-custom-toggle">
        <input
          type="checkbox"
          checked={verifyCurrentUsage}
          onChange={(e) => setVerifyCurrentUsage(e.target.checked)}
        />
        <span>
          {lang === "si"
            ? "වත්මන් පරම්පරා නාම භාවිතය web මගින් සත්‍යාපනය කරන්න (තෝරාගත් රට + භාෂාව)"
            : "Verify against current-generation names via web (living country + language)"}
        </span>
      </label>

      <div className="name-interests">
        <div>
          <h4>
            {lang === "si"
              ? "මවගේ බලාපොරොත්තු / උනන්දුව"
              : "Mother's hopes / interests"}
          </h4>
          <div className="chip-row">
            {INTERESTS.map((i) => (
              <button
                key={`m-${i.id}`}
                type="button"
                className={interestsMother.includes(i.id) ? "active" : ""}
                onClick={() => toggleInterest("mother", i.id)}
              >
                {lang === "si" ? i.si : i.en}
              </button>
            ))}
          </div>
        </div>
        <div>
          <h4>
            {lang === "si"
              ? "පියාගේ බලාපොරොත්තු / උනන්දුව"
              : "Father's hopes / interests"}
          </h4>
          <div className="chip-row">
            {INTERESTS.map((i) => (
              <button
                key={`f-${i.id}`}
                type="button"
                className={interestsFather.includes(i.id) ? "active" : ""}
                onClick={() => toggleInterest("father", i.id)}
              >
                {lang === "si" ? i.si : i.en}
              </button>
            ))}
          </div>
        </div>
      </div>

      <label>
        <span>{lang === "si" ? "පොදු බලාපොරොත්තු" : "Shared hopes"}</span>
        <input
          value={sharedHopes}
          onChange={(e) => setSharedHopes(e.target.value)}
          placeholder={
            lang === "si"
              ? "උදා: දයාවත් · ඉගෙනුම් දක්ෂ · විදේශයේත් පහසු නමක්"
              : "e.g. kind · studious · easy name abroad"
          }
        />
      </label>

      {letterSource === "chart" ? (
        <label className="place-custom-toggle">
          <input
            type="checkbox"
            checked={preferPrimary}
            onChange={(e) => setPreferPrimary(e.target.checked)}
          />
          <span>
            {lang === "si"
              ? "ප්‍රධාන කේන්ද්‍ර අකුරට වැඩි කැඩැම්පතුවක් (මුල් නම)"
              : "Prefer primary Kendraya letter (first name)"}
          </span>
        </label>
      ) : null}

      <button
        type="button"
        className="primary"
        disabled={pending}
        onClick={generate}
      >
        {pending
          ? lang === "si"
            ? "මුල් + මධ්‍ය නම් සාදමින්…"
            : "Crafting first + middle names…"
          : lang === "si"
            ? `මුල්+මධ්‍ය නම් ${clampNameCount(nameCount)}ක් ජනනය කරන්න`
            : `Generate ${clampNameCount(nameCount)} first + middle names`}
      </button>

      {error ? <p className="error">{error}</p> : null}

      {letters ? (
        <p className="muted">
          {resultLetterSource === "manual"
            ? lang === "si"
              ? "අතින් අකුරු"
              : "Manual letters"
            : lang === "si"
              ? "කේන්ද්‍ර අකුරු"
              : "Chart letters"}
          :{" "}
          <strong>
            {letters.primary}
            {letters.primaryRoman ? `/${letters.primaryRoman}` : ""}
          </strong>
          {" · "}
          {lang === "si" ? "මුල්" : "first"}:{" "}
          {(letters.first ?? letters.all).slice(0, 8).join(" · ")}
          {" · "}
          {lang === "si" ? "මධ්‍ය" : "middle"}:{" "}
          {(letters.middle ?? letters.all).slice(0, 10).join(" · ")}
          <br />
          {lang === "si"
            ? "පිලි සහිත අකුරකට මූල ව්‍යංජනයද ඉඩ ඇත (උදා: මො → ම)."
            : "Vowel-marked letters also allow the base consonant (e.g. මො → ම)."}
          <br />
          agents: {usedAgents.join(" · ")} · source: {source}
          {framework ? ` · harness: ${framework}` : ""}
          {graphTrace.length ? (
            <>
              <br />
              graph: {graphTrace.join(" → ")}
            </>
          ) : null}
          {personaSummary ? (
            <>
              <br />
              <span className="persona-brief">
                {lang === "si" ? "හෝරා පෞරුෂය" : "Horoscope persona"}:{" "}
                {personaSummary}
              </span>
            </>
          ) : null}
          {usageInfo?.enabled ? (
            <>
              <br />
              {lang === "si" ? "වත්මන් භාවිත සත්‍යාපනය" : "Current-usage verify"}
              : {usageInfo.verifiedCount}/{names.length}
              {usageInfo.live
                ? lang === "si"
                  ? " · live web"
                  : " · live web"
                : lang === "si"
                  ? " · local fallback"
                  : " · local fallback"}
              {usageInfo.sources?.length
                ? ` · ${usageInfo.sources.slice(0, 3).join(", ")}`
                : ""}
            </>
          ) : null}
        </p>
      ) : null}

      {learning &&
      (learning.likedFirst.length ||
        learning.dislikedFirst.length ||
        learning.likedMiddle.length ||
        learning.dislikedMiddle.length) ? (
        <p className="muted learning-brief">
          {lang === "si" ? "ඉගෙනුම් සාරාංශය" : "Learning so far"}:{" "}
          {learning.likedFirst.length
            ? `${lang === "si" ? "කැමති මුල්" : "liked first"} ${learning.likedFirst.slice(0, 6).join(", ")}`
            : ""}
          {learning.dislikedFirst.length
            ? ` · ${lang === "si" ? "අකමැති මුල්" : "disliked first"} ${learning.dislikedFirst.slice(0, 6).join(", ")}`
            : ""}
          {learning.likedMiddle.length
            ? ` · ${lang === "si" ? "කැමති මධ්‍ය" : "liked middle"} ${learning.likedMiddle.slice(0, 4).join(", ")}`
            : ""}
          {learning.dislikedMiddle.length
            ? ` · ${lang === "si" ? "අකමැති මධ්‍ය" : "disliked middle"} ${learning.dislikedMiddle.slice(0, 4).join(", ")}`
            : ""}
        </p>
      ) : null}

      {picked ? (
        <div className="name-picked">
          <h4>{lang === "si" ? "තෝරාගත් නම" : "Selected name"}</h4>
          <p className="picked-main">
            {picked.sinhala} / {picked.roman}
          </p>
          <p className="muted">
            {lang === "si" ? "මුල්" : "First"}: {picked.first.sinhala} (
            {picked.first.startsWith}) ·{" "}
            {lang === "si" ? "මධ්‍ය" : "Middle"}: {picked.middle.sinhala} (
            {picked.middle.startsWith})
          </p>
          <p>{lang === "si" ? picked.meaningSi : picked.meaningEn}</p>
          <div className="name-feedback-bar picked-feedback">
            <button
              type="button"
              className="fb-like"
              disabled={!!feedbackBusy}
              onClick={() => sendFeedback(picked, "up", "full")}
            >
              {lang === "si" ? "මුළු නමට කැමතියි" : "Like full name"}
            </button>
            <button
              type="button"
              className="fb-dislike"
              disabled={!!feedbackBusy}
              onClick={() => sendFeedback(picked, "down", "full")}
            >
              {lang === "si" ? "මුළු නමට අකමැතියි" : "Dislike full name"}
            </button>
            <button
              type="button"
              className="fb-reshuffle"
              disabled={!!feedbackBusy}
              onClick={() => reshufflePart(picked, "first")}
            >
              {lang === "si"
                ? "මුල් නම අකමැතියි → වෙනස් කරන්න"
                : "Dislike first → reshuffle"}
            </button>
            <button
              type="button"
              className="fb-reshuffle"
              disabled={!!feedbackBusy}
              onClick={() => reshufflePart(picked, "middle")}
            >
              {lang === "si"
                ? "මධ්‍ය නම අකමැතියි → වෙනස් කරන්න"
                : "Dislike middle → reshuffle"}
            </button>
          </div>
        </div>
      ) : null}

      <div className="name-cards">
        {names.map((n) => (
          <article
            key={`${n.roman}-${n.sinhala}-${n.agentId}`}
            className={`name-card${picked?.roman === n.roman ? " selected" : ""}${n.isPrimaryLetter ? " primary-letter" : ""}${n.usageVerified ? " usage-verified" : ""}`}
          >
            <header>
              <strong>
                {n.sinhala}
                <br />
                <span className="name-roman">{n.roman}</span>
              </strong>
              <span className="name-badge">
                {n.first.startsWith}+{n.middle.startsWith}
                {n.isPrimaryLetter ? " ★" : ""}
                {n.usageVerified ? " ✓" : ""}
              </span>
            </header>
            <p className="name-parts muted">
              {lang === "si" ? "මුල්" : "First"}: {n.first.sinhala} /{" "}
              {n.first.roman} · {lang === "si" ? "මධ්‍ය" : "Middle"}:{" "}
              {n.middle.sinhala} / {n.middle.roman}
            </p>
            <p className="name-meaning">
              {lang === "si" ? n.meaningSi : n.meaningEn}
            </p>
            <p className="muted">{lang === "si" ? n.whySi : n.whyEn}</p>
            {n.alignWhySi || n.alignWhyEn ? (
              <p className="muted align-why">
                {lang === "si" ? n.alignWhySi : n.alignWhyEn}
              </p>
            ) : null}
            <p className="muted">
              {lang === "si" ? n.familyFitSi : n.familyFitEn}
            </p>
            <p className="muted">
              {lang === "si" ? n.countryFitSi : n.countryFitEn}
            </p>
            {n.factors ? (
              <ul className="name-factors">
                {(
                  [
                    [
                      "horoscopePersonalityFit",
                      lang === "si" ? "හෝරා ගති" : "Horoscope",
                    ],
                    [
                      "readability",
                      lang === "si" ? "කියවීම" : "Readability",
                    ],
                    [
                      "memorability",
                      lang === "si" ? "මතකය" : "Memory",
                    ],
                    [
                      "modernGenerationFit",
                      lang === "si" ? "නවීන" : "Modern",
                    ],
                    [
                      "meaningLanguageFit",
                      lang === "si" ? "අර්ථ/භාෂා" : "Meaning",
                    ],
                    [
                      "religionFit",
                      lang === "si" ? "ආගම" : "Religion",
                    ],
                    [
                      "countryFit",
                      lang === "si" ? "රට" : "Country",
                    ],
                  ] as const
                ).map(([key, label]) => (
                  <li key={key}>
                    <span>{label}</span>
                    <strong>{n.factors![key]}</strong>
                  </li>
                ))}
              </ul>
            ) : null}
            {n.usageNoteSi || n.usageNoteEn ? (
              <p className={`muted${n.usageVerified ? " usage-hit" : ""}`}>
                {lang === "si" ? n.usageNoteSi : n.usageNoteEn}
              </p>
            ) : null}
            <div className="name-feedback-bar">
              <button
                type="button"
                className="fb-like"
                title={lang === "si" ? "කැමතියි" : "Like"}
                disabled={!!feedbackBusy}
                onClick={() => sendFeedback(n, "up", "full")}
              >
                ♥
              </button>
              <button
                type="button"
                className="fb-dislike"
                title={lang === "si" ? "අකමැතියි" : "Dislike"}
                disabled={!!feedbackBusy}
                onClick={() => sendFeedback(n, "down", "full")}
              >
                ✕
              </button>
              <button
                type="button"
                className="fb-part"
                disabled={!!feedbackBusy}
                onClick={() => reshufflePart(n, "first")}
              >
                {lang === "si" ? "මුල් මාරු" : "Swap first"}
              </button>
              <button
                type="button"
                className="fb-part"
                disabled={!!feedbackBusy}
                onClick={() => reshufflePart(n, "middle")}
              >
                {lang === "si" ? "මධ්‍ය මාරු" : "Swap middle"}
              </button>
            </div>
            <footer>
              <span>
                {lang === "si" ? n.agentLabelSi : n.agentLabelEn} · {n.score}
              </span>
              <button type="button" onClick={() => setPicked(n)}>
                {lang === "si" ? "මෙය තෝරන්න" : "Pick this"}
              </button>
            </footer>
          </article>
        ))}
      </div>
    </section>
  );
}
