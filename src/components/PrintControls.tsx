"use client";

import type { Lang } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import {
  PRINT_MODES,
  PRINT_PAPERS,
  runPrint,
  type PrintMode,
  type PrintPaper,
} from "@/lib/print-modes";

export function PrintControls({
  lang,
  mode,
  paper,
  onModeChange,
  onPaperChange,
  disabled,
}: {
  lang: Lang;
  mode: PrintMode;
  paper: PrintPaper;
  onModeChange: (m: PrintMode) => void;
  onPaperChange: (p: PrintPaper) => void;
  disabled?: boolean;
}) {
  const meta = PRINT_MODES.find((m) => m.id === mode)!;

  return (
    <div className="print-controls no-print">
      <div className="print-controls-row">
        <label>
          <span>{lang === "si" ? "මුද්‍රණ ආකාරය" : "Print layout"}</span>
          <select
            value={mode}
            disabled={disabled}
            onChange={(e) => onModeChange(e.target.value as PrintMode)}
          >
            {PRINT_MODES.map((m) => (
              <option key={m.id} value={m.id}>
                {lang === "si" ? m.si : m.en}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>{lang === "si" ? "කඩදාසි ප්‍රමාණය" : "Paper size"}</span>
          <select
            value={paper}
            disabled={disabled}
            onChange={(e) => onPaperChange(e.target.value as PrintPaper)}
          >
            {PRINT_PAPERS.map((p) => (
              <option key={p.id} value={p.id}>
                {lang === "si" ? p.si : p.en}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="primary"
          disabled={disabled}
          onClick={() => runPrint(mode, paper)}
        >
          {t(lang, "print")}
        </button>
      </div>
      <p className="print-hint muted">
        {lang === "si" ? meta.hintSi : meta.hintEn}
      </p>
      <p className="print-hint muted print-hint-note">
        {lang === "si"
          ? "මුද්‍රණ සංවාදයේදී Paper = A4 සහ Margins = Default තෝරන්න. Single page සඳහා “Fit to page” අක්‍රිය කරන්න."
          : "In the print dialog choose Paper = A4 and Margins = Default. For Single page, turn off browser “Fit to page / Scale” (use 100%)."}
      </p>
    </div>
  );
}
