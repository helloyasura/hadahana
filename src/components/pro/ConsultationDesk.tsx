"use client";
import { useState } from "react";
import type { z } from "zod";
import type { studioBirthSchema } from "@/lib/pro/input";
import type { getPanchanga } from "@/lib/astrology/panchanga";
import type { matchPorondam } from "@/lib/astrology/porondam";
import type { scanEventDates } from "@/lib/astrology/event-nakath";
import { EVENT_CATEGORIES } from "@/lib/astrology/event-categories";
import { panchangaRows } from "@/lib/astrology/panchanga-view";
import Shell from "./Shell";
import { errorMessage, proRequest } from "./client";
type Birth = z.infer<typeof studioBirthSchema>;
const initial: Birth = {
  date: "2000-01-01",
  time: "12:00",
  latitude: 6.9271,
  longitude: 79.8612,
  timezone: "Asia/Colombo",
};
export function BirthFields({
  value,
  onChange,
  prefix,
}: {
  value: Birth;
  onChange: (value: Birth) => void;
  prefix: string;
}) {
  return (
    <div className="pro-field-grid">
      {(
        [
          ["date", "date", "දිනය"],
          ["time", "time", "වේලාව"],
          ["latitude", "number", "අක්ෂාංශ"],
          ["longitude", "number", "දේශාංශ"],
          ["timezone", "text", "IANA කලාපය"],
        ] as const
      ).map(([key, type, label]) => (
        <label key={key}>
          {label}
          <input
            aria-label={`${prefix} ${key}`}
            type={type}
            step={type === "number" ? "any" : undefined}
            value={value[key] ?? ""}
            onChange={(e) =>
              onChange({
                ...value,
                [key]:
                  type === "number"
                    ? e.target.value === ""
                      ? NaN
                      : +e.target.value
                    : e.target.value,
              })
            }
          />
        </label>
      ))}
    </div>
  );
}
export default function ConsultationDesk() {
  const [tab, setTab] = useState<"panchanga" | "match" | "nakath">("panchanga"),
    [a, setA] = useState<Birth>(initial),
    [b, setB] = useState<Birth>({ ...initial, date: "2001-02-02" }),
    [from, setFrom] = useState("2000-01-01"),
    [to, setTo] = useState("2000-01-07"),
    [event, setEvent] = useState("naming"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [pan, setPan] = useState<Awaited<ReturnType<typeof getPanchanga>>>(),
    [matching, setMatching] =
      useState<Awaited<ReturnType<typeof matchPorondam>>>(),
    [nakath, setNakath] =
      useState<Awaited<ReturnType<typeof scanEventDates>>>();
  async function run() {
    setBusy(true);
    setError("");
    setPan(undefined);
    setMatching(undefined);
    setNakath(undefined);
    try {
      const data = await proRequest<{
        panchanga?: typeof pan;
        matching?: typeof matching;
        nakath?: typeof nakath;
      }>(
        "/tools",
        tab === "panchanga"
          ? { action: tab, input: a }
          : tab === "match"
            ? { action: tab, a, b }
            : {
                action: tab,
                birth: a,
                fromDate: from,
                toDate: to,
                eventId: event,
              },
      );
      setPan(data.panchanga);
      setMatching(data.matching);
      setNakath(data.nakath);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  const rows = pan ? panchangaRows(pan, "si") : null;
  return (
    <Shell active="tools">
      <div className="pro-page-title">
        <div>
          <p className="pro-eyebrow">CONSULTATION TOOLKIT</p>
          <h1>පංචාංග · පොරොන්දම් · නැකත්</h1>
          <p className="pro-muted">
            පුද්ගලික Pro වැඩබිම · මෙහි ඇතුළත් දත්ත සුරැකෙන්නේ නැත.
          </p>
        </div>
      </div>
      <p className="pro-notice">
        මෙම යොමු මෙවලම් පවතින ශ්‍රී ලාංකික Lahiri / mean-node / whole-sign
        ක්‍රමය භාවිත කරයි — Studio preset එක වෙනුවට. පොරොන්දම් හා නැකත් දින
        ඇගයීම් සරල මූලික පරීක්ෂාවන් පමණි; විවාහ හෝ අවසාන මුහුර්ත තීරණයක් නොවේ.
      </p>
      <div className="studio-actions">
        {(
          [
            ["panchanga", "පංචාංගය"],
            ["match", "පොරොන්දම්"],
            ["nakath", "නැකත් දින සොයන්න"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            aria-pressed={tab === id}
            className={tab === id ? "pro-button" : "pro-secondary"}
            disabled={busy}
            onClick={() => {
              setTab(id);
              setPan(undefined);
              setMatching(undefined);
              setNakath(undefined);
              setError("");
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <section className="pro-card studio-worksheet">
        <h2>{tab === "panchanga" ? "දිනය හා ස්ථානය" : "A · ජන්ම සටහන"}</h2>
        <BirthFields prefix="Person A" value={a} onChange={setA} />
        {tab === "panchanga" && (
          <p className="pro-small">
            දින පංචාංගය සූර්යෝදය අනුවය; ඉහත වේලාව භාවිත නොවේ. කලාපය:{" "}
            {a.timezone}. ධ්‍රැව ප්‍රදේශවල solar windows නොලැබිය හැක.
          </p>
        )}
        {tab === "match" && (
          <>
            <h2>B · ජන්ම සටහන</h2>
            <BirthFields prefix="Person B" value={b} onChange={setB} />
          </>
        )}
        {tab === "nakath" && (
          <div className="pro-field-grid">
            <label>
              ආරම්භ දිනය
              <input
                aria-label="Nakath from"
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </label>
            <label>
              අවසන් දිනය
              <input
                aria-label="Nakath to"
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </label>
            <label>
              කාර්යය
              <select
                aria-label="Nakath event"
                value={event}
                onChange={(e) => setEvent(e.target.value)}
              >
                {EVENT_CATEGORIES.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.si} · {e.en}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
        <button className="pro-button" disabled={busy} onClick={run}>
          {busy ? "ගණනය වෙමින්…" : "ගණනය කරන්න / Calculate"}
        </button>
      </section>
      {error && (
        <p role="alert" className="pro-notice">
          {error}
        </p>
      )}
      {pan && rows && (
        <section className="pro-card studio-worksheet pro-tool-result">
          <p className="pro-eyebrow">DAILY PANCHANGA · LAHIRI</p>
          <h2>
            {pan.date} · {pan.timezone}
          </h2>
          <div className="pro-table-wrap">
            <table>
              <tbody>
                {[...rows.limbs, ...rows.sun, ...rows.periods].map((r) => (
                  <tr key={r.label}>
                    <th>{r.label}</th>
                    <td>
                      {r.value}
                      {r.detail && <small> · {r.detail}</small>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="pro-small">
            {pan.noteSi} · සියලු දින/වේලා: {pan.timezone}. Studio ayanamsa
            වෙනස්කම් මෙයට නොයෙදේ.
          </p>
        </section>
      )}
      {matching && (
        <section className="pro-card studio-worksheet pro-tool-result">
          <p className="pro-eyebrow">
            PORONDAM · PRELIMINARY SCREEN, NOT A VERDICT
          </p>
          <h2>
            {matching.personA.nekatha} / {matching.personA.pada} ×{" "}
            {matching.personB.nekatha} / {matching.personB.pada}
          </h2>
          <p className="pro-notice">
            Rajju / Vedha සම්පූර්ණ වගු මෙහි නැත. Mahendra / Stree-deergha /
            Vasya ඇතුළු සමහර නීති සරල කර ඇත. සම්පූර්ණ 10/20 පොරොන්දම් ලකුණක් හෝ
            ප්‍රතිශතයක් ලෙස නොසලකන්න.
          </p>
          <div className="pro-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>යොමුව</th>
                  <th>මූලික ඇගයීම</th>
                  <th>හේතුව</th>
                </tr>
              </thead>
              <tbody>
                {matching.points
                  .filter((p) => !["rajju", "vedha"].includes(p.id))
                  .map((p) => (
                    <tr key={p.id}>
                      <td>{p.nameSi}</td>
                      <td>
                        {p.ok
                          ? "ගැළපෙන යෝජනාව / Favourable screen"
                          : "තවදුරටත් පරීක්ෂා කරන්න"}
                      </td>
                      <td>{p.detail}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
      {nakath && (
        <section className="pro-card studio-worksheet pro-tool-result">
          <p className="pro-eyebrow">
            NAKATH DAY SHORTLIST · NOT A FINAL MUHURTA
          </p>
          <h2>
            {nakath.event.si} · {nakath.native.janmaNekathaSi}
          </h2>
          <p className="pro-small">
            {nakath.fromDate} — {nakath.toDate} · ඉල්ලූ දින {nakath.scannedDays}
            , ලැබුණු දින {nakath.dates.length}. අසාර්ථක දින මඟහැරිය හැක. කලාපය:{" "}
            {a.timezone}. රාහු කාලය නොලැබෙන ස්ථානවල පවතින engine එක 06:00–18:00
            දින අෂ්ටක අනුමානය භාවිත කළ හැක; අවසාන වේලාවක් තීරණය කිරීමට ස්වාධීනව
            පරීක්ෂා කරන්න.
          </p>
          <div className="pro-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>දිනය</th>
                  <th>නැකත</th>
                  <th>කාණ්ඩය</th>
                  <th>රාහු කාලය · {a.timezone}</th>
                </tr>
              </thead>
              <tbody>
                {nakath.dates.map((d) => (
                  <tr key={d.date}>
                    <td>{d.date}</td>
                    <td>{d.dayNakshatra.spoken}</td>
                    <td>
                      {d.grade} · {d.dayNakshatra.score}
                    </td>
                    <td>
                      {d.rahuKalaya?.start ?? "—"}–{d.rahuKalaya?.end ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </Shell>
  );
}
