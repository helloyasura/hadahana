"use client";
import { useEffect, useState } from "react";
import {
  filterClientRecords,
  type ClientSummary,
} from "@/lib/pro/chart-metadata";
import type { Client } from "@/lib/pro/store";
import Shell from "./Shell";
import Chart from "./Chart";
import { errorMessage, localDate, proRequest } from "./client";
import { withBasePath } from "@/lib/base-path";
export default function ClientArchive() {
  const [clients, setClients] = useState<ClientSummary[]>([]),
    [query, setQuery] = useState(""),
    [first, setFirst] = useState(""),
    [second, setSecond] = useState(""),
    [records, setRecords] = useState<Client[]>([]),
    [edit, setEdit] = useState({ label: "", tags: "", notes: "" }),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  async function reload() {
    const d = await proRequest<{ clients: ClientSummary[] }>("/workspace");
    setClients(d.clients);
  }
  useEffect(() => {
    reload().catch((e) => setMessage(errorMessage(e)));
  }, []);
  useEffect(() => {
    const c = clients.find((c) => c.id === first);
    if (c) setEdit({ label: c.label, tags: c.tags.join(", "), notes: c.notes });
  }, [first, clients]);
  useEffect(() => {
    let cancelled = false;
    setRecords([]);
    if (!first) return;
    setBusy(true);
    Promise.all(
      [first, ...(second && second !== first ? [second] : [])].map((id) =>
        proRequest<{ client: Client }>(
          `/workspace?client=${encodeURIComponent(id)}`,
        ),
      ),
    )
      .then((r) => {
        if (!cancelled) setRecords(r.map((r) => r.client));
      })
      .catch((e) => {
        if (!cancelled) setMessage(errorMessage(e));
      })
      .finally(() => {
        if (!cancelled) setBusy(false);
      });
    return () => {
      cancelled = true;
    };
  }, [first, second]);
  async function save() {
    setBusy(true);
    try {
      await proRequest("/workspace", {
        action: "chartMeta",
        id: first,
        label: edit.label,
        tags: edit.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        notes: edit.notes,
      });
      await reload();
      setRecords((current) =>
        current.map((c) =>
          c.id === first
            ? {
                ...c,
                label: edit.label,
                tags: edit.tags
                  .split(",")
                  .map((t) => t.trim())
                  .filter(Boolean),
                notes: edit.notes,
              }
            : c,
        ),
      );
      setMessage("සේවාලාභී සටහන් සුරැකුණි.");
    } catch (e) {
      setMessage(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  const list = filterClientRecords(clients, query);
  return (
    <Shell active="clients">
      <div className="pro-page-title">
        <div>
          <p className="pro-eyebrow">PRIVATE CHART ARCHIVE</p>
          <h1>සේවාලාභී සටහන් හා සැසඳීම</h1>
          <p className="pro-muted">
            පෞද්ගලික encrypted සටහන් · දින 90 retention · උපරිම 100.
          </p>
        </div>
        <a href={withBasePath("/pro/studio")}>Studio එකෙන් සටහනක් සුරකින්න →</a>
      </div>
      {message && (
        <p role="status" className="pro-notice">
          {message}
        </p>
      )}
      <section className="pro-card">
        <label>
          ලේබලය, tag, සටහන් හෝ ලග්නය සොයන්න
          <input
            aria-label="Search client charts"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <p role="status" className="pro-small">
          {list.length} / {clients.length} සටහන්
        </p>
        <ul className="pro-list">
          {list.map((c) => (
            <li key={c.id}>
              <div>
                <b>{c.label}</b>
                <small>
                  {c.tags.join(" · ")} · {c.lagna} · {localDate(c.createdAt)}
                </small>
              </div>
              <a href={withBasePath(`/pro/cases?id=${c.id}`)}>විමර්ශනය දිගටම →</a>
              <button className="pro-secondary" onClick={() => setFirst(c.id)}>
                විවෘත කරන්න
              </button>
            </li>
          ))}
        </ul>
        <div className="pro-field-grid">
          <label>
            A · ප්‍රධාන සටහන
            <select
              aria-label="Comparison chart A"
              value={first}
              onChange={(e) => setFirst(e.target.value)}
            >
              <option value="">තෝරන්න…</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            B · සැසඳීමේ සටහන
            <select
              aria-label="Comparison chart B"
              value={second}
              onChange={(e) => setSecond(e.target.value)}
            >
              <option value="">සැසඳීම ඉවත් කරන්න</option>
              {clients
                .filter((c) => c.id !== first)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
            </select>
          </label>
        </div>
      </section>
      {first && (
        <section className="pro-card studio-worksheet">
          <h2>A · පුද්ගලික ලේබලය හා සටහන්</h2>
          <div className="pro-field-grid">
            <label>
              ලේබලය
              <input
                aria-label="Edit client label"
                maxLength={100}
                value={edit.label}
                onChange={(e) => setEdit({ ...edit, label: e.target.value })}
              />
            </label>
            <label>
              Tags
              <input
                aria-label="Edit client tags"
                value={edit.tags}
                onChange={(e) => setEdit({ ...edit, tags: e.target.value })}
              />
            </label>
          </div>
          <label>
            සටහන්
            <textarea
              aria-label="Edit client notes"
              maxLength={6000}
              value={edit.notes}
              onChange={(e) => setEdit({ ...edit, notes: e.target.value })}
            />
          </label>
          <button
            className="pro-button"
            disabled={busy || !edit.label.trim()}
            onClick={save}
          >
            සේවාලාභී සටහන් යාවත්කාලීන කරන්න
          </button>
        </section>
      )}
      {busy && <p role="status">පූරණය වෙමින්…</p>}
      <div className="pro-client-comparison">
        {records.map((c, i) => (
          <article key={c.id}>
            <h2>
              {i === 0 ? "A" : "B"} · {c.label || "ජන්ම සටහන"}
            </h2>
            <p className="pro-small">
              {c.result.native.date} {c.result.native.timeLocal} ·{" "}
              {c.result.native.timezone} · {c.manifest.config.ayanamsa} /{" "}
              {c.manifest.config.nodes} / {c.manifest.config.houseSystem} /{" "}
              {c.manifest.config.dasaYearDays}d. වෙනස් ක්‍රමවලින් ගණනය කළ සටහන්
              විය හැක.
            </p>
            <Chart result={c.result} />
            <p className="studio-notes">{c.notes}</p>
          </article>
        ))}
      </div>
    </Shell>
  );
}
