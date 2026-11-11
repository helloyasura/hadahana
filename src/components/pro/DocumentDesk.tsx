"use client";
import { useState } from "react";
import type { Client } from "@/lib/pro/store";
import { RASHIS } from "@/lib/pro/studio";
import {
  compareDocument,
  emptyReading,
  planetNames,
  type DocumentReading,
} from "@/lib/pro/document-reading";
import type { ProChartResult } from "./Chart";
export type Upload = {
  mime: "image/jpeg" | "image/png" | "image/webp" | "application/pdf";
  data: string;
};
export async function readDocumentFile(file: File): Promise<Upload> {
  if (
    !["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(
      file.type,
    ) ||
    file.size > 2 * 1024 * 1024 ||
    !file.size
  )
    throw new Error("JPEG/PNG/WebP/PDF only, up to 2MB; PDF maximum 4 pages");
  const data = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onerror = () => reject(new Error("File could not be read"));
    r.onload = () => resolve(String(r.result).split(",")[1]);
    r.readAsDataURL(file);
  });
  return { mime: file.type as Upload["mime"], data };
}
export function DocumentUploadFields({
  onFile,
  consent,
  onConsent,
  hasFile,
}: {
  onFile: (file?: File) => void;
  consent: boolean;
  onConsent: (v: boolean) => void;
  hasFile: boolean;
}) {
  return (
    <fieldset className="case-upload">
      <legend>නැකත් / ජන්ම පත්‍රය (අත්‍යවශ්‍ය නොවේ)</legend>
      <label>
        ඡායාරූපය හෝ PDF
        <input
          aria-label="Birth document upload"
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          onChange={(e) => onFile(e.target.files?.[0])}
        />
      </label>
      <p className="pro-small">
        JPEG / PNG / WebP / PDF · 2MB · PDF පිටු 1–4 (password නැති). පින්තූර
        EXIF/GPS ඉවත් කරයි. PDF දෘශ්‍ය පිටු බවට පරිවර්තනය කරයි; මුල් PDF සහ එහි
        metadata තබන්නේ නැත. රහස් අමතර පිටු ඉවත් කර පැහැදිලි පිටපතක් යොදන්න.
      </p>
      {hasFile && (
        <label className="pro-checkbox">
          <input
            aria-label="Document consent"
            type="checkbox"
            checked={consent}
            onChange={(e) => onConsent(e.target.checked)}
          />
          මෙම ලේඛනය ජෝතිෂ්‍යවේදියාට ලබා දීමට හා නඩුව සමඟ encrypted ලෙස දින 90ක්
          දක්වා තබා ගැනීමට අවසර ඇත.
        </label>
      )}
    </fieldset>
  );
}
export default function DocumentDesk({
  client,
  computed,
  busy,
  onAction,
  onUpload,
  onLock,
}: {
  client: Client;
  computed?: ProChartResult;
  busy: boolean;
  onAction: (data: Record<string, unknown>) => Promise<boolean>;
  onUpload: (upload: Upload) => Promise<void>;
  onLock: (reason: string) => Promise<void>;
}) {
  const file = client.case!,
    document = file.document;
  const [page, setPage] = useState(0),
    [zoom, setZoom] = useState(1),
    [rotation, setRotation] = useState(0),
    [reading, setReading] = useState<DocumentReading>(
      file.documentReading ?? emptyReading,
    ),
    [reason, setReason] = useState(""),
    [confirmed, setConfirmed] = useState(false),
    [upload, setUpload] = useState<Upload>(),
    [consent, setConsent] = useState(false),
    [error, setError] = useState("");
  const rows = computed ? compareDocument(computed, reading) : [];
  const select = (
    label: string,
    value: number | null,
    onChange: (n: number | null) => void,
  ) => (
    <label>
      {label}
      <select
        aria-label={`Document ${label}`}
        value={value ?? ""}
        onChange={(e) =>
          onChange(e.target.value === "" ? null : +e.target.value)
        }
      >
        <option value="">නොදනී / Not entered</option>
        {RASHIS.map((r, i) => (
          <option key={i} value={i}>
            {r}
          </option>
        ))}
      </select>
    </label>
  );
  return (
    <aside className="pro-card case-document-desk">
      <p className="pro-eyebrow">
        DOCUMENT → MANUAL VERIFICATION → TIME HYPOTHESIS
      </p>
      <h2>ජන්ම පත්‍ර විමර්ශනය</h2>
      <p className="pro-small">
        {file.timeUnsure
          ? "⚠ Customer: birth time unsure. Placeholder time is provisional."
          : "Customer birth-time uncertainty not declared."}{" "}
        මුල් දත්ත: {client.input.date} {client.input.time} ·{" "}
        {file.placeLabel || client.input.timezone}. කේන්ද්‍රය සමඟ අතින් සසඳන්න;
        OCR / AI extraction නැත.
      </p>
      {document ? (
        <>
          <div className="studio-actions">
            <label>
              පිටුව
              <select
                aria-label="Document page"
                value={Math.min(page, document.pages.length - 1)}
                onChange={(e) => setPage(+e.target.value)}
              >
                {document.pages.map((_, i) => (
                  <option key={i} value={i}>
                    {i + 1}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Zoom
              <input
                aria-label="Document zoom"
                type="range"
                min=".5"
                max="3"
                step=".1"
                value={zoom}
                onChange={(e) => setZoom(+e.target.value)}
              />
            </label>
            <button
              className="pro-secondary"
              onClick={() => setRotation((v) => (v + 90) % 360)}
            >
              Rotate 90°
            </button>
          </div>
          <div className="case-document-viewport">
            <svg
              viewBox="0 0 1600 1600"
              role="img"
              aria-label="Customer birth document — sanitized page"
              style={{
                width: `${zoom * 100}%`,
                height: "auto",
                maxWidth: "none",
                display: "block",
              }}
            >
              <title>Sanitized birth document</title>
              <image
                href={`data:image/png;base64,${document.pages[Math.min(page, document.pages.length - 1)]}`}
                x="0"
                y="0"
                width="1600"
                height="1600"
                preserveAspectRatio="xMidYMid meet"
                transform={`rotate(${rotation} 800 800)`}
              />
            </svg>
          </div>
          <button
            className="pro-text-button"
            disabled={busy}
            onClick={() => onAction({ action: "removeDocument" })}
          >
            ලේඛනය හා අතින් සටහන් කළ අගයන් මකන්න
          </button>
        </>
      ) : (
        <p>තවම ලේඛනයක් නැත. අතින් දත්ත ඇතුළත් කිරීමටද හැක.</p>
      )}
      <details>
        <summary>අවසරය ඇති ලේඛනයක් එක් කරන්න / ප්‍රතිස්ථාපනය කරන්න</summary>
        <DocumentUploadFields
          hasFile={!!upload}
          consent={consent}
          onConsent={setConsent}
          onFile={async (f) => {
            try {
              setUpload(f ? await readDocumentFile(f) : undefined);
              setConsent(false);
              setError("");
            } catch (e) {
              setError(String(e));
            }
          }}
        />
        <button
          className="pro-secondary"
          disabled={busy || !consent || !upload}
          onClick={async () => {
            if (upload) {
              await onUpload(upload);
              setUpload(undefined);
              setConsent(false);
            }
          }}
        >
          ලේඛනය සුරකින්න
        </button>
        {error && <p role="alert">{error}</p>}
      </details>
      <details open>
        <summary>ලේඛනයේ සඳහන් අගයන් / Manual quick form</summary>
        <div className="pro-field-grid">
          {select("Lagna", reading.lagna, (n) =>
            setReading({ ...reading, lagna: n }),
          )}
          {planetNames.map((p) => (
            <div key={p}>
              {select(p, reading.planets[p], (n) =>
                setReading({
                  ...reading,
                  planets: { ...reading.planets, [p]: n },
                }),
              )}
            </div>
          ))}
        </div>
        <label>
          දශා අධිපති
          <select
            aria-label="Document dasha lord"
            value={reading.dashaLord}
            onChange={(e) =>
              setReading({
                ...reading,
                dashaLord: e.target.value as typeof reading.dashaLord,
              })
            }
          >
            <option value="">Not entered</option>
            {planetNames.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </label>
        <label className="pro-checkbox">
          <input
            aria-label="Compare document dasha balance"
            type="checkbox"
            checked={reading.checkBalance}
            onChange={(e) =>
              setReading({ ...reading, checkBalance: e.target.checked })
            }
          />
          දශා ශේෂයත් සසඳන්න
        </label>
        <div className="pro-field-grid">
          {(["years", "months", "days"] as const).map((key) => (
            <label key={key}>
              {key}
              <input
                aria-label={`Document balance ${key}`}
                type="number"
                min={0}
                max={key === "months" ? 11 : key === "days" ? 31 : 120}
                value={reading[key]}
                onChange={(e) =>
                  setReading({ ...reading, [key]: +e.target.value })
                }
              />
            </label>
          ))}
          <label>
            Document year convention
            <select
              aria-label="Document year days"
              value={reading.yearDays}
              onChange={(e) =>
                setReading({
                  ...reading,
                  yearDays: e.target.value as typeof reading.yearDays,
                })
              }
            >
              <option>365.25</option>
              <option>360</option>
            </select>
          </label>
        </div>
        <button
          className="pro-secondary"
          disabled={busy}
          onClick={() => onAction({ action: "documentReading", reading })}
        >
          අගයන් සුරකින්න
        </button>
      </details>
      <div aria-live="polite">
        <h3>වෙනස්කම් / Comparison</h3>
        {!computed && (
          <p>ගණනය වෙමින් හෝ අසම්පූර්ණයි; අවසන් සටහන මත තීරණ නොගන්න.</p>
        )}
        {computed && !rows.length && <p>පළමුව document අගයක් තෝරන්න.</p>}
        <ul>
          {rows.map((r) => (
            <li
              key={r.point}
              className={r.matches ? "case-match" : "case-mismatch"}
            >
              {r.matches ? "✓" : "⚠"} {r.point}: document{" "}
              {typeof r.stated === "number" ? RASHIS[r.stated] : r.stated} /
              computed{" "}
              {typeof r.computed === "number" ? RASHIS[r.computed] : r.computed}
            </li>
          ))}
        </ul>
      </div>
      <p className="pro-small">
        වෙනසක් උපන් වේලාව වැරදි බවට සාක්ෂියක් නොවේ. අයනාංශ, භාව ක්‍රමය, node
        වර්ගය, වසර සම්මුතිය හා ලේඛනයේ වටකිරීම් පරීක්ෂා කරන්න. දශා ශේෂය
        configured year days අනුව දින ±1.5 tolerance යොදා සසඳයි.
      </p>
      <details>
        <summary>වේලා නිවැරදි කිරීමේ සහාය / Rectification assist</summary>
        <p className="pro-small">
          Studio Birth mode සහ minute-precision scrubber හෝ time input භාවිත කර
          වෙනස්කම් සසඳන්න. එකම දිනය/ස්ථානය තබන්න. මෙය ඔබගේ hypothesis එකක් පමණි;
          උපන් වේලාවට ස්වයංක්‍රීය සහතිකයක් නොවේ.
        </p>
        <label>
          වෙනස් කිරීමේ හේතුව
          <textarea
            aria-label="Rectification reason"
            minLength={10}
            maxLength={1000}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </label>
        <label className="pro-checkbox">
          <input
            aria-label="Confirm corrected time"
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
          />
          මෙම සටහනේ වේලාව අතින් පරීක්ෂා කළ hypothesis ලෙස රඳවමි.
        </label>
        <button
          className="pro-button"
          disabled={
            busy || !computed || !confirmed || reason.trim().length < 10
          }
          onClick={() => onLock(reason)}
        >
          වත්මන් වේලාව රඳවන්න / Lock corrected time
        </button>
        {file.rectification && (
          <p className="pro-notice">
            Locked hypothesis: {file.rectification.original.time} →{" "}
            {file.rectification.corrected.time} · {file.rectification.reason}.
            මුල් customer දත්ත වෙනස් කර නැත.
          </p>
        )}
      </details>
    </aside>
  );
}
