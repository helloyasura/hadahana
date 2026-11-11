"use client";
import { useMemo, useState } from "react";
import { dashaTree, periodPath } from "@/lib/pro/dasha";
import { grahaLabel } from "@/lib/astrology/sinhala-names";
import type { ProChartResult } from "./Chart";
export default function DashaBrowser({ result }: { result: ProChartResult }) {
  const tree = useMemo(
    () =>
      dashaTree(
        result.chandra.longitudeExact ?? result.chandra.longitude,
        result.native.utcTime,
        result.vimshottari.convention.yearDays as 360 | 365.25,
      ),
    [result],
  );
  const [maha, setMaha] = useState(0),
    [bhukti, setBhukti] = useState(0),
    [date, setDate] = useState(""),
    [message, setMessage] = useState("");
  const m = tree[maha] ?? tree[0],
    b = m.children[bhukti] ?? m.children[0];
  const format = (ms: number) =>
    new Intl.DateTimeFormat("en-GB", {
      timeZone: result.native.timezone,
      dateStyle: "medium",
      timeStyle: "short",
    }).format(ms);
  // Date jump uses UTC noon as a clearly labelled instant; no ambiguous local-clock guessing.
  const path = date ? periodPath(tree, Date.parse(`${date}T12:00:00Z`)) : [];
  function jump(value: string) {
    setDate(value);
    const p = periodPath(tree, Date.parse(`${value}T12:00:00Z`));
    if (!p.length) {
      setMessage("මෙම සටහනේ කාල පරාසයෙන් පිටතයි / Outside calculated lifespan");
      return;
    }
    setMaha(tree.indexOf(p[0]));
    setBhukti(p[0].children.indexOf(p[1]));
    setMessage(p.map((p) => grahaLabel(p.lord).sinhala).join(" → "));
  }
  return (
    <section className="pro-card studio-worksheet studio-dasha-browser">
      <p className="pro-eyebrow">VIMSHOTTARI · MAHA / BHUKTI / ANTARA</p>
      <h2>දශා · භුක්ති · අන්තර</h2>
      <p className="pro-small">
        ජන්ම චන්ද්‍රයාගේ නැකත අනුව · වසර{" "}
        {result.vimshottari.convention.yearDays} දින · පූර්ණ මහාදශාවෙන් උපකාල
        ගණනය කර උපතට පෙර කාලය කපා ඇත. දර්ශන කලාපය: {result.native.timezone}.
      </p>
      <div className="pro-field-grid">
        <label>
          මහා දශාව
          <select
            aria-label="Mahadasha"
            value={tree.indexOf(m)}
            onChange={(e) => {
              setMaha(+e.target.value);
              setBhukti(0);
            }}
          >
            {tree.map((p, i) => (
              <option key={p.fullStart} value={i}>
                {grahaLabel(p.lord).sinhala} · {p.lord}
              </option>
            ))}
          </select>
        </label>
        <label>
          භුක්තිය / Antardasha
          <select
            aria-label="Bhukti"
            value={m.children.indexOf(b)}
            onChange={(e) => setBhukti(+e.target.value)}
          >
            {m.children.map((p, i) => (
              <option key={p.fullStart} value={i}>
                {grahaLabel(p.lord).sinhala} · {p.lord}
              </option>
            ))}
          </select>
        </label>
        <label>
          දින සෙවීම · UTC 12:00
          <input
            aria-label="Dasha date jump"
            type="date"
            value={date}
            onChange={(e) => jump(e.target.value)}
          />
        </label>
      </div>
      {message && (
        <p role="status" className="pro-notice">
          {message}
        </p>
      )}
      <p className="pro-small">
        {m.lord}: {format(m.start)} — {format(m.end)}
        <br />
        {b?.lord}: {b && format(b.start)} — {b && format(b.end)}
      </p>
      <div className="pro-table-wrap">
        <table>
          <thead>
            <tr>
              <th>අන්තර / Pratyantara</th>
              <th>ආරම්භය · {result.native.timezone}</th>
              <th>අවසානය</th>
            </tr>
          </thead>
          <tbody>
            {b?.children.map((p) => (
              <tr
                className={
                  path[2]?.fullStart === p.fullStart
                    ? "studio-row-selected"
                    : ""
                }
                key={p.fullStart}
              >
                <td>
                  {grahaLabel(p.lord).sinhala} · {p.lord}
                </td>
                <td>{format(p.start)}</td>
                <td>{format(p.end)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
