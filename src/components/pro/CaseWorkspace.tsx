"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  caseStatuses,
  statusLabels,
  defaultServices,
  checklist,
  reportDraft,
  questionEvidence,
  type CaseFile,
  type CaseService,
  type CaseStudioState,
  type ConsultationState,
  type CaseReport,
} from "@/lib/pro/cases";
import {
  studioHouse,
  RASHIS,
  positionInfo,
  type StudioBody,
} from "@/lib/pro/studio";
import type { Client } from "@/lib/pro/store";
import { withBasePath } from "@/lib/base-path";
import { caseReportHtml } from "@/lib/pdf/case-template";
import Shell from "./Shell";
import Studio from "./Studio";
import DocumentDesk, { type Upload } from "./DocumentDesk";
import Chart, { type ProChartResult } from "./Chart";
import ConsultationDesk from "./ConsultationDesk";
import { errorMessage, localDate, proRequest } from "./client";
type Summary = {
  id: string;
  label: string;
  tags: string[];
  createdAt: number;
  source: string;
  status: CaseFile["status"];
  assignedTo: string | null;
  question: string;
  serviceId: string;
};
type Data = { ownerId: string; services: CaseService[]; clients: Summary[] };
export default function CaseWorkspace({
  initialId = "",
}: {
  initialId?: string;
}) {
  const [data, setData] = useState<Data>(),
    [message, setMessage] = useState(""),
    [query, setQuery] = useState(""),
    [status, setStatus] = useState(""),
    [mine, setMine] = useState(false),
    [source, setSource] = useState("");
  const [serviceName, setServiceName] = useState(""),
    [kind, setKind] = useState<CaseService["kind"]>("reading"),
    [client, setClient] = useState<Client>();
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      proRequest<Data>("/cases"),
      ...(initialId
        ? [
            proRequest<{ client: Client }>(
              `/cases?id=${encodeURIComponent(initialId)}`,
            ),
          ]
        : []),
    ])
      .then(([d, c]) => {
        if (cancelled) return;
        setData(d as Data);
        if (c) setClient((c as { client: Client }).client);
      })
      .catch((e) => {
        if (!cancelled) setMessage(errorMessage(e));
      });
    return () => {
      cancelled = true;
    };
  }, [initialId]);
  async function addService() {
    try {
      const r = await proRequest<{ services: CaseService[] }>("/cases", {
        action: "service",
        name: serviceName,
        kind,
      });
      setData((d) => (d ? { ...d, services: r.services } : d));
      setServiceName("");
    } catch (e) {
      setMessage(errorMessage(e));
    }
  }
  if (initialId && client && data)
    return (
      <CaseDetail
        key={client.id}
        initial={client}
        services={data.services}
        ownerId={data.ownerId}
        clients={data.clients}
      />
    );
  const terms = query.toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const list = (data?.clients ?? [])
    .filter(
      (c) =>
        (!status || c.status === status) &&
        (!mine || c.assignedTo === data?.ownerId) &&
        (!source || c.source === source) &&
        terms.every((t) =>
          `${c.label} ${c.tags.join(" ")} ${c.question} ${data?.services.find((s) => s.id === c.serviceId)?.name}`
            .toLocaleLowerCase()
            .includes(t),
        ),
    )
    .sort((a, b) => b.createdAt - a.createdAt);
  return (
    <Shell active="cases">
      <div className="pro-page-title">
        <div>
          <p className="pro-eyebrow">
            REQUEST → INVESTIGATION → REVIEWED REPORT
          </p>
          <h1>සේවා ඉල්ලීම් / Case inbox</h1>
          <p className="pro-muted">
            ඔබගේ සබැඳිවලින් ලැබුණු ඉල්ලීම් සහ සුරැකි සේවාලාභී කේන්ද්‍ර.
          </p>
        </div>
        <a href={withBasePath("/pro/links")}>ඉල්ලීම් සබැඳියක් සාදන්න →</a>
      </div>
      {message && (
        <p role="alert" className="pro-notice">
          {message}
        </p>
      )}
      <p className="pro-notice">
        පෞද්ගලික encrypted දත්ත · උපරිම දින 90 / සටහන් 100. පිටපත් හා වාර්තා ඔබ
        පාලනය කරයි. ස්වයංක්‍රීය customer email / delivery නැත. අවසරය හා උපන්
        දත්ත සේවාවට පෙර නැවත තහවුරු කරන්න.
      </p>
      <section className="pro-card">
        <div className="pro-field-grid">
          <label>
            සොයන්න
            <input
              aria-label="Search cases"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <label>
            තත්ත්වය
            <select
              aria-label="Case status filter"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">සියල්ල / All</option>
              {caseStatuses.map((s) => (
                <option key={s} value={s}>
                  {statusLabels[s]}
                </option>
              ))}
            </select>
          </label>
          <label>
            මූලාශ්‍රය
            <select
              aria-label="Case source filter"
              value={source}
              onChange={(e) => setSource(e.target.value)}
            >
              <option value="">All sources</option>
              <option value="incoming">Customer requests</option>
              <option value="archive">Saved charts</option>
            </select>
          </label>
        </div>
        <label className="pro-checkbox">
          <input
            type="checkbox"
            checked={mine}
            onChange={(e) => setMine(e.target.checked)}
          />
          මට පවරා ඇති / Assigned to me
        </label>
        <p className="pro-small">{list.length} ඉල්ලීම්</p>
        <ul className="pro-list case-inbox-list">
          {list.map((c) => (
            <li key={c.id}>
              <div>
                <b>{c.label}</b>
                <small>
                  {statusLabels[c.status]} ·{" "}
                  {c.source === "incoming"
                    ? "ලැබුණු ඉල්ලීම"
                    : "සුරැකි කේන්ද්‍රය"}{" "}
                  · {localDate(c.createdAt)}
                </small>
                <p>
                  {c.question ||
                    data?.services.find((s) => s.id === c.serviceId)?.name}
                </p>
              </div>
              <a
                className="pro-button"
                href={withBasePath(`/pro/cases?id=${c.id}`)}
              >
                විමර්ශනය / Investigate →
              </a>
            </li>
          ))}
        </ul>
        {!data && <p role="status">පූරණය වෙමින්…</p>}
        {data && !list.length && (
          <p>
            ඉල්ලීම් නැත. සබැඳියක් යවන්න හෝ Studio එකෙන් කේන්ද්‍රයක් සුරකින්න.
          </p>
        )}
      </section>
      <details className="pro-card">
        <summary>මගේ සේවා / Define services</summary>
        <p className="pro-small">
          සේවාවකට අදාළ මූලික checklist එක තෝරන්න. දැනට තනි-ජෝතිෂ්‍යවේදී පැවරීම
          පමණි.
        </p>
        <div className="pro-field-grid">
          <label>
            සේවා නම
            <input
              aria-label="Service name"
              maxLength={100}
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
            />
          </label>
          <label>
            මූලික සේවාව
            <select
              aria-label="Service kind"
              value={kind}
              onChange={(e) => setKind(e.target.value as typeof kind)}
            >
              {defaultServices.map((s) => (
                <option key={s.id} value={s.kind}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button
          className="pro-button"
          disabled={serviceName.trim().length < 2}
          onClick={addService}
        >
          සේවාව එක් කරන්න
        </button>
        <ul>
          {data?.services.map((s) => (
            <li key={s.id}>
              {s.name} · {s.kind}
            </li>
          ))}
        </ul>
      </details>
    </Shell>
  );
}
const caseTime = (ms: number) =>
  `${new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Colombo", dateStyle: "medium", timeStyle: "short" }).format(ms)} (Asia/Colombo)`;
function CaseDetail({
  initial,
  services,
  ownerId,
  clients,
}: {
  initial: Client;
  services: CaseService[];
  ownerId: string;
  clients: Summary[];
}) {
  const [client, setClient] = useState(initial),
    file = client.case!;
  const [details, setDetails] = useState({
    status: file.status,
    claim: file.assignedTo === ownerId,
    serviceId: file.serviceId,
    question: file.question,
    notes: file.notes,
    checked: file.checked,
  });
  const [tab, setTab] = useState("studio"),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [restore, setRestore] = useState({ key: 0, state: file.state });
  const current = useRef<CaseStudioState>(file.state),
    ready = useRef(false);
  const [computed, setComputed] = useState<ProChartResult>(),
    [transits, setTransits] = useState<StudioBody[]>([]),
    [topic, setTopic] = useState<"career" | "marriage" | "periods">(
      file.state.evidence?.topic ?? "career",
    ),
    [analysisDate, setAnalysisDate] = useState(
      file.state.evidence?.date ?? new Date().toISOString().slice(0, 10),
    );
  const [pinTitle, setPinTitle] = useState(""),
    [pinText, setPinText] = useState(""),
    [comparison, setComparison] = useState<Client>();
  const [comparisonId, setComparisonId] = useState(
    file.state.comparisonId ?? "",
  );
  const [language, setLanguage] = useState<"si" | "en">("si"),
    [reportTitle, setReportTitle] = useState("ජෝතිෂ්‍ය විමර්ශන වාර්තාව"),
    [body, setBody] = useState(reportDraft("si", file.findings)),
    [reviewed, setReviewed] = useState(false),
    [preview, setPreview] = useState<CaseReport>();
  const service =
    services.find((s) => s.id === details.serviceId) ?? defaultServices[0];
  const onStudio = useCallback(
    (
      state: CaseStudioState,
      result: ProChartResult | undefined,
      sky: StudioBody[],
    ) => {
      current.current = {
        ...state,
        consultation: current.current.consultation,
        comparisonId: current.current.comparisonId,
        evidence: current.current.evidence,
      };
      ready.current = !!result;
      setComputed(result);
      setTransits(sky);
    },
    [],
  );
  const onConsultation = useCallback((state: ConsultationState) => {
    current.current = { ...current.current, consultation: state };
  }, []);
  async function act(payload: Record<string, unknown>) {
    setBusy(true);
    setMessage("");
    try {
      const d = await proRequest<{ client: Client }>("/cases", {
        id: client.id,
        revision: file.revision,
        ...payload,
      });
      setClient(d.client);
      setMessage("නඩු සටහන සුරැකුණි / Case saved");
      return true;
    } catch (e) {
      setMessage(errorMessage(e));
      return false;
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    current.current.evidence = { topic, date: analysisDate };
  }, [topic, analysisDate]);
  function restoreState(state: CaseStudioState) {
    current.current = state;
    ready.current = false;
    setRestore((r) => ({ key: r.key + 1, state }));
    setComparisonId(state.comparisonId ?? "");
    setTopic(state.evidence?.topic ?? "career");
    setAnalysisDate(
      state.evidence?.date ?? new Date().toISOString().slice(0, 10),
    );
    setMessage(
      "සුරැකි මොහොත යළි පූරණය විය. Live / playback නවතා ඇත. / State restored, playback paused.",
    );
  }
  async function uploadDocument(upload: Upload) {
    setBusy(true);
    setMessage("");
    try {
      const d = await proRequest<{ client: Client }>("/cases/document", {
        id: client.id,
        revision: file.revision,
        upload: { ...upload, consent: true },
      });
      setClient(d.client);
      setMessage(
        "ලේඛනය encrypted ලෙස සුරැකුණි. EXIF/metadata ඉවත් කළ දෘශ්‍ය පිටු පමණි.",
      );
    } catch (e) {
      setMessage(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function lockTime(reason: string) {
    if (!ready.current) {
      setMessage("Wait for a valid chart before locking its time");
      return;
    }
    if (
      await act({
        action: "rectify",
        state: current.current,
        reason,
        confirmed: true,
      })
    )
      restoreState(current.current);
  }
  async function saveState() {
    if (!ready.current) {
      setMessage(
        "නිවැරදි ගණනය අවසන් වනතුරු රැඳී සිටින්න / Wait for a valid calculation",
      );
      return;
    }
    await act({ action: "state", state: current.current });
  }
  async function pin() {
    if (!ready.current) {
      setMessage("Wait for the chart calculation before pinning");
      return;
    }
    if (
      await act({
        action: "pin",
        title: pinTitle,
        text: pinText,
        state: current.current,
      })
    ) {
      setPinTitle("");
      setPinText("");
    }
  }
  async function download(report: CaseReport) {
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch(withBasePath("/pro/api/cases/pdf"), {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-jyotisha-pro": "1" },
        body: JSON.stringify({
          id: client.id,
          reportId: report.id,
          issue: report.stage === "final",
        }),
        cache: "no-store",
      });
      if (!res.ok)
        throw new Error((await res.json()).error ?? "PDF export failed");
      const url = URL.createObjectURL(await res.blob()),
        a = document.createElement("a");
      a.href = url;
      a.download = `hadahana-case-v${report.version}-${report.stage}.pdf`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
      const d = await proRequest<{ client: Client }>(`/cases?id=${client.id}`);
      setClient(d.client);
      setMessage(
        "PDF බාගත විය. Customer වෙත ස්වයංක්‍රීයව යවා නැත / Downloaded; not sent to customer.",
      );
    } catch (e) {
      setMessage(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    current.current.comparisonId = comparisonId;
    let cancelled = false;
    setComparison(undefined);
    if (comparisonId)
      proRequest<{ client: Client }>(`/cases?id=${comparisonId}`)
        .then((d) => {
          if (!cancelled) setComparison(d.client);
        })
        .catch((e) => {
          if (!cancelled) setMessage(errorMessage(e));
        });
    return () => {
      cancelled = true;
    };
  }, [comparisonId]);
  const evidence = computed
    ? questionEvidence(computed, topic, `${analysisDate}T12:00:00Z`)
    : undefined;
  const openStep = (tool: string, id: string) => {
    setTab(tool);
    if (tool === "studio")
      setTimeout(() => {
        const selector =
          id === "dasha" || id === "period"
            ? ".studio-dasha-browser"
            : id === "transit"
              ? ".studio-transit-desk"
              : ".pro-case-studio";
        document
          .querySelector(selector)
          ?.scrollIntoView({ behavior: "smooth" });
      }, 50);
  };
  const consultation = restore.state.consultation ?? {
    tab:
      service.kind === "marriage"
        ? ("match" as const)
        : service.kind === "nakath"
          ? ("nakath" as const)
          : ("panchanga" as const),
    a: restore.state.input,
    b: restore.state.input,
    from: restore.state.input.date,
    to: restore.state.input.date,
    event: "naming",
  };
  return (
    <Shell active="cases">
      <div className="pro-page-title">
        <div>
          <p className="pro-eyebrow">
            PRIVATE CASE · {statusLabels[file.status]}
          </p>
          <h1>{client.label || "සේවා ඉල්ලීම / Customer case"}</h1>
          <p className="pro-muted">
            {localDate(client.createdAt)} · consent {client.consentVersion} ·{" "}
            {client.linkId === "manual"
              ? "Saved chart"
              : "Customer share-link request"}
          </p>
        </div>
        <a href={withBasePath("/pro/cases")}>← ඉල්ලීම් සියල්ල</a>
      </div>
      <p className="pro-notice">
        දින 90කට පසු නඩුව, ලේඛන හා වාර්තා ඉවත් වේ. මුල් උපන් තොරතුරු නොවෙනස්ය.
        සුරැකූ මොහොත අත්හිටවූ Studio snapshot එකකි; මෙවලම් ප්‍රතිඵල නැවත ගණනය
        කරන්න. වෙනත් අයෙකුගේ දත්ත භාවිතයට ඔවුන්ගේ අවසරය තහවුරු කරන්න.
      </p>
      {message && (
        <p className="pro-notice" role="status">
          {message}
        </p>
      )}
      <section className="pro-card case-management">
        <div className="pro-field-grid">
          <label>
            සේවාව
            <select
              aria-label="Case service"
              value={details.serviceId}
              onChange={(e) =>
                setDetails({
                  ...details,
                  serviceId: e.target.value,
                  checked: [],
                })
              }
            >
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            තත්ත්වය
            <select
              aria-label="Case status"
              value={details.status}
              onChange={(e) =>
                setDetails({
                  ...details,
                  status: e.target.value as typeof details.status,
                })
              }
            >
              {caseStatuses.map((s) => (
                <option key={s} value={s}>
                  {statusLabels[s]}
                </option>
              ))}
            </select>
          </label>
          <label className="pro-checkbox">
            <input
              aria-label="Assign case to me"
              type="checkbox"
              checked={details.claim}
              onChange={(e) =>
                setDetails({ ...details, claim: e.target.checked })
              }
            />
            මට පවරන්න / Assign to me
          </label>
        </div>
        <label>
          ප්‍රශ්නය
          <input
            aria-label="Case question"
            maxLength={2000}
            value={details.question}
            onChange={(e) =>
              setDetails({ ...details, question: e.target.value })
            }
          />
        </label>
        <label>
          පෞද්ගලික විමර්ශන සටහන් (වාර්තාවට ඇතුළත් නොවේ)
          <textarea
            aria-label="Investigation notes"
            maxLength={6000}
            rows={3}
            value={details.notes}
            onChange={(e) => setDetails({ ...details, notes: e.target.value })}
          />
        </label>
        <button
          className="pro-button"
          disabled={busy}
          onClick={() => act({ action: "update", ...details })}
        >
          නඩු සටහන් සුරකින්න / Save case
        </button>
      </section>
      <section className="pro-card case-checklist">
        <h2>සේවා පියවර / Guided investigation</h2>
        <ol>
          {checklist(service.kind).map((step) => (
            <li key={step.id}>
              <label className="pro-checkbox">
                <input
                  type="checkbox"
                  aria-label={`Checklist ${step.id}`}
                  checked={details.checked.includes(step.id)}
                  onChange={(e) =>
                    setDetails({
                      ...details,
                      checked: e.target.checked
                        ? [...details.checked, step.id]
                        : details.checked.filter((s) => s !== step.id),
                    })
                  }
                />
                {step.label}
              </label>
              <button
                className="pro-text-button"
                onClick={() => openStep(step.tool, step.id)}
              >
                මෙවලම →
              </button>
            </li>
          ))}
        </ol>
      </section>
      <div className="case-sticky">
        <nav className="studio-actions" aria-label="Case tools">
          {[
            ["studio", "කේන්ද්‍ර වැඩබිම"],
            ["tools", "පංචාංග / පොරොන්දම් / නැකත්"],
            ["evidence", "ප්‍රශ්න සාක්ෂි"],
            ["compare", "සැසඳීම"],
            ["findings", "සොයාගැනීම්"],
            ["report", "වාර්තාව"],
            ["timeline", "ඉතිහාසය"],
          ].map(([id, label]) => (
            <button
              className={tab === id ? "pro-button" : "pro-secondary"}
              aria-pressed={tab === id}
              key={id}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </nav>
        <div className="studio-actions">
          <button className="pro-secondary" disabled={busy} onClick={saveState}>
            වැඩබිම සුරකින්න / Save case state
          </button>
          <button
            className="pro-text-button"
            disabled={busy}
            onClick={() => restoreState(file.state)}
          >
            සුරැකි වැඩබිම යළි ගන්න / Restore
          </button>
        </div>
      </div>
      <div hidden={tab !== "studio"} className="case-investigation-columns">
        <div>
          <Studio
            key={restore.key}
            embedded
            initialState={restore.state}
            onState={onStudio}
          />
        </div>
        <DocumentDesk
          key={file.document?.uploadedAt ?? "no-document"}
          client={client}
          computed={computed}
          busy={busy}
          onAction={act}
          onUpload={uploadDocument}
          onLock={lockTime}
        />
      </div>
      <div hidden={tab !== "tools"}>
        <ConsultationDesk
          key={restore.key}
          embedded
          initialState={consultation}
          onState={onConsultation}
        />
      </div>
      <section hidden={tab !== "evidence"} className="pro-card">
        <p className="pro-eyebrow">
          QUESTION-FOCUSED EVIDENCE · NO AUTOMATIC PREDICTIONS
        </p>
        <h2>අදාළ භාව, අධිපති, දශා හා ගෝචර</h2>
        <div className="pro-field-grid">
          <label>
            විෂය
            <select
              aria-label="Evidence topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value as typeof topic)}
            >
              <option value="career">රැකියාව / Career</option>
              <option value="marriage">විවාහ කාලය / Marriage timing</option>
              <option value="periods">අපල කාල / Difficult periods</option>
            </select>
          </label>
          <label>
            දිනය (UTC 12:00)
            <input
              aria-label="Evidence date"
              type="date"
              value={analysisDate}
              onChange={(e) => setAnalysisDate(e.target.value)}
            />
          </label>
        </div>
        <p className="pro-small">
          වත්මන් Studio frame: {computed?.native.date}{" "}
          {computed?.native.timeLocal} {computed?.native.timezone}. D1
          whole-sign භාව / සම්ප්‍රදායික අධිපතිත්වය පමණි — Studio equal-bhava
          තේරීමෙන් වෙනස් විය හැක. දිනයේ දශා වෙනමය; පහත ගෝචරය අවසන් වරට Studio හි
          ගණනය කළ UTC මොහොතට අදාළය.
        </p>
        {evidence ? (
          <>
            <div className="pro-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>භාවය</th>
                    <th>රාශිය</th>
                    <th>අධිපති</th>
                    <th>අධිපතිගේ භාවය</th>
                    <th>ග්‍රහයන්</th>
                  </tr>
                </thead>
                <tbody>
                  {evidence.rows.map((r) => (
                    <tr key={r.house}>
                      <td>{r.house}</td>
                      <td>{r.sign}</td>
                      <td>{r.lord}</td>
                      <td>{r.lordHouse}</td>
                      <td>{r.occupants.join(", ") || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p>
              දශා:{" "}
              {evidence.periods.map((p) => p.lord).join(" → ") ||
                "Outside calculated range"}
            </p>
            <ul>
              {evidence.periods.map((p, i) => (
                <li key={i}>
                  {p.lord}: {localDate(Date.parse(p.start))} —{" "}
                  {localDate(Date.parse(p.end))}
                </li>
              ))}
            </ul>
            {transits.length ? (
              <p>
                ගෝචර ({current.current.transit?.instant} UTC):{" "}
                {transits
                  .map(
                    (p) =>
                      `${p.name} ${RASHIS[positionInfo(p.longitude).sign]} H${studioHouse(p.longitude, computed!.lagna.longitudeExact ?? computed!.lagna.longitude, "whole-sign")}`,
                  )
                  .join(" · ")}
              </p>
            ) : (
              <p>ගෝචර සාක්ෂි සඳහා Studio හි ජන්මය Pin කර ගෝචරය ගණනය කරන්න.</p>
            )}
            <button
              className="pro-secondary"
              onClick={() => {
                setPinTitle(`${topic} · ${analysisDate}`);
                setPinText(JSON.stringify(evidence, null, 2).slice(0, 1800));
                setTab("findings");
              }}
            >
              සාක්ෂි සොයාගැනීමකට ගන්න →
            </button>
          </>
        ) : (
          <p>වලංගු Studio ගණනයක් අවශ්‍යයි.</p>
        )}
      </section>
      <section hidden={tab !== "compare"} className="pro-card">
        <h2>නඩුවට අදාළ සැසඳීම</h2>
        <label>
          B · අනෙක් කේන්ද්‍රය
          <select
            aria-label="Case comparison"
            value={comparisonId}
            onChange={(e) => setComparisonId(e.target.value)}
          >
            <option value="">තෝරන්න…</option>
            {clients
              .filter((c) => c.id !== client.id)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
          </select>
        </label>
        <p className="pro-small">
          සුරැකි මුල් කේන්ද්‍ර දෙකකි. එක් එක් කේන්ද්‍රයේ ක්‍රමය වෙනස් විය හැක;
          Studio හි වෙනස් කළ සටහන නොවේ.
        </p>
        <div className="pro-client-comparison">
          {[client, ...(comparison ? [comparison] : [])].map((c) => (
            <div key={c.id}>
              <p>
                {c.result.native.date} {c.result.native.timeLocal} ·{" "}
                {c.manifest.config.ayanamsa} / {c.manifest.config.nodes}
              </p>
              <Chart result={c.result} />
            </div>
          ))}
        </div>
      </section>
      <section hidden={tab !== "findings"} className="pro-card">
        <h2>සාක්ෂි හා සොයාගැනීම් / Pinned findings</h2>
        <p className="pro-small">
          මෙහි සටහන් වාර්තාවට එක් වේ. අභ්‍යන්තර සටහන් හෝ රහස් තොරතුරු එක්
          නොකරන්න. එක් එක් සොයාගැනීම සමඟ නිශ්චිත chart/tool snapshot එක සුරැකේ.
        </p>
        <label>
          ශීර්ෂය
          <input
            aria-label="Finding title"
            value={pinTitle}
            maxLength={100}
            onChange={(e) => setPinTitle(e.target.value)}
          />
        </label>
        <label>
          සොයාගැනීම / සීමාවන්
          <textarea
            aria-label="Finding text"
            value={pinText}
            maxLength={2000}
            rows={4}
            onChange={(e) => setPinText(e.target.value)}
          />
        </label>
        <button
          className="pro-button"
          disabled={busy || pinTitle.trim().length < 2 || !pinText.trim()}
          onClick={pin}
        >
          සොයාගැනීම රඳවන්න / Pin finding
        </button>
        {file.findings.map((f) => (
          <article className="case-finding" key={f.id}>
            <h3>{f.title}</h3>
            <p className="studio-notes">{f.text}</p>
            <p className="pro-small">
              {f.state.input.date} {f.state.input.time} · D
              {f.state.settings.division} ·{" "}
              {f.state.settings.calculation.ayanamsa}
            </p>
            <button
              className="pro-secondary"
              onClick={() => {
                restoreState(f.state);
                setTab("studio");
              }}
            >
              මෙම chart state යළි ගන්න
            </button>
            <button
              className="pro-text-button"
              disabled={busy}
              onClick={() => act({ action: "removePin", findingId: f.id })}
            >
              රඳවා ගැනීම ඉවත් කරන්න
            </button>
          </article>
        ))}
      </section>
      <section hidden={tab !== "report"} className="pro-card">
        <p className="pro-eyebrow">REVIEW → VERSION → PRIVATE PDF DOWNLOAD</p>
        <h2>සේවාලාභී වාර්තාව</h2>
        <div className="pro-field-grid">
          <label>
            භාෂාව
            <select
              aria-label="Report language"
              value={language}
              onChange={(e) => setLanguage(e.target.value as typeof language)}
            >
              <option value="si">සිංහල</option>
              <option value="en">English</option>
            </select>
          </label>
          <label>
            වාර්තා ශීර්ෂය
            <input
              aria-label="Report title"
              maxLength={100}
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
            />
          </label>
        </div>
        <button
          className="pro-secondary"
          onClick={() => setBody(reportDraft(language, file.findings))}
        >
          භාෂා template යළි යොදන්න (සංස්කරණ ප්‍රතිස්ථාපනය වේ)
        </button>
        <label>
          සාරාංශය හා නිර්දේශ
          <textarea
            aria-label="Report body"
            rows={10}
            maxLength={8000}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </label>
        <p className="pro-small">
          Pinned findings {file.findings.length} ස්වයංක්‍රීයව අමුණයි. පෞද්ගලික
          notes, checklist, timeline හා customer contact තොරතුරු එක් නොවේ.
          අනුවාද නොවෙනස්ය; නව සංස්කරණයක් සඳහා නව අනුවාදයක් සාදන්න.
        </p>
        <label className="pro-checkbox">
          <input
            aria-label="Report reviewed"
            type="checkbox"
            checked={reviewed}
            onChange={(e) => setReviewed(e.target.checked)}
          />
          වාර්තාව, සීමාවන් හා බෙදාගැනීමේ අවසරය අතින් පරීක්ෂා කළෙමි.
        </label>
        <div className="studio-actions">
          <button
            className="pro-secondary"
            disabled={busy}
            onClick={() =>
              act({
                action: "report",
                title: reportTitle,
                body,
                language,
                stage: "draft",
                reviewed: false,
              })
            }
          >
            කෙටුම්පත සුරකින්න
          </button>
          <button
            className="pro-button"
            disabled={busy || !reviewed}
            onClick={async () => {
              if (
                await act({
                  action: "report",
                  title: reportTitle,
                  body,
                  language,
                  stage: "final",
                  reviewed,
                })
              )
                setReviewed(false);
            }}
          >
            අවසන් අනුවාදය සාදන්න
          </button>
        </div>
        <ul className="pro-list case-report-list">
          {file.reports.map((r) => (
            <li key={r.id}>
              <div>
                <b>
                  v{r.version} · {r.stage} · {r.title}
                </b>
                <small>
                  {r.issuedAt
                    ? "Exported to astrologer; delivery unconfirmed"
                    : "Not issued"}{" "}
                  · {localDate(r.at)}
                </small>
              </div>
              <button className="pro-secondary" onClick={() => setPreview(r)}>
                පෙරදසුන
              </button>
              <button
                className="pro-button"
                disabled={busy}
                onClick={() => download(r)}
              >
                {r.stage === "final" ? "නිකුත් කර PDF ගන්න" : "Draft PDF"}
              </button>
            </li>
          ))}
        </ul>
        {preview && (
          <>
            <button
              className="pro-text-button"
              onClick={() => setPreview(undefined)}
            >
              පෙරදසුන වසන්න
            </button>
            <iframe
              className="case-report-preview"
              title="Customer report preview"
              sandbox=""
              srcDoc={caseReportHtml(preview)}
            />
          </>
        )}
        <p className="pro-notice">
          PDF ඔබට පමණක් බාගත වේ. ඔබ කැමති ආරක්ෂිත මාර්ගයකින් customer වෙත ලබා
          දෙන්න. Final PDF නිකුත් කළ පසු පමණක් ඉහළ තත්ත්වය Completed ලෙස
          සුරකින්න. ස්වයංක්‍රීය email නැත.
        </p>
      </section>
      <section hidden={tab !== "timeline"} className="pro-card">
        <h2>විමර්ශන ඉතිහාසය / Timeline</h2>
        <p className="pro-small">
          සුරැකූ ක්‍රියා පමණි; සෑම click එකක්ම නොවේ. අවසන් ක්‍රියා 100 දක්වා.
        </p>
        <ol className="case-timeline">
          {[...file.timeline].reverse().map((e, i) => (
            <li key={i}>
              <time>{caseTime(e.at)}</time>
              <p>{e.action}</p>
            </li>
          ))}
        </ol>
      </section>
    </Shell>
  );
}
