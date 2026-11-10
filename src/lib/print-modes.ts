import { track } from "./analytics";

/**
 * A4 print layouts for කේන්ද්‍ර සටහන.
 * Modes drive data-print-mode on <html> before window.print().
 */

export type PrintMode = "single" | "standard" | "book" | "charts";
export type PrintPaper = "A4" | "A4-landscape" | "Letter";

export const PRINT_MODES: Array<{
  id: PrintMode;
  si: string;
  en: string;
  hintSi: string;
  hintEn: string;
}> = [
  {
    id: "single",
    si: "එක් පිටුව (A4)",
    en: "Single page (A4)",
    hintSi:
      "සම්පූර්ණ සටහන එක A4 පිටුවකට ගැලපෙන ලෙස සංක්ෂිප්ත කරයි — ඉක්මන් බෙදාගැනීමට.",
    hintEn:
      "Fits the full chart onto one A4 sheet with compact typography — quick handout.",
  },
  {
    id: "standard",
    si: "සම්පූර්ණ බහු-පිටු",
    en: "Full multi-page",
    hintSi:
      "සාමාන්‍ය A4 පිටු කිහිපයකින් සම්පූර්ණ විස්තර — පැහැදිලි කොටස් බිඳීම් සමඟ.",
    hintEn:
      "Natural multi-page A4 with clean section breaks for the full satahana.",
  },
  {
    id: "book",
    si: "පොත් / පොකට් පොත්",
    en: "Print book / booklet",
    hintSi:
      "පිටු 1: මාතෘකා + චාර්ට් · පිටු 2: ග්‍රහ · පිටු 3: දසා · පිටු 4: භාව/අමතර — බැඳීමට පහසු.",
    hintEn:
      "Page 1: title + charts · 2: graha · 3: dasha · 4: bhava/extras — bindable booklet.",
  },
  {
    id: "charts",
    si: "චාර්ට් පමණි",
    en: "Charts only",
    hintSi: "උපන් විස්තර + රාශි/නවාංශ/චන්ද්‍ර චාර්ට් එක A4 පිටුවක.",
    hintEn: "Birth header + Rashi / Navamsa / Chandra charts on one A4 page.",
  },
];

export const PRINT_PAPERS: Array<{
  id: PrintPaper;
  si: string;
  en: string;
}> = [
  { id: "A4", si: "A4 සිරස්", en: "A4 portrait" },
  { id: "A4-landscape", si: "A4 තිරස්", en: "A4 landscape" },
  { id: "Letter", si: "Letter (US)", en: "US Letter" },
];

const PAGE_CSS: Record<PrintPaper, string> = {
  A4: "@page { size: A4 portrait; margin: 10mm; }",
  "A4-landscape": "@page { size: A4 landscape; margin: 8mm; }",
  Letter: "@page { size: letter portrait; margin: 0.4in; }",
};

const STYLE_ID = "handahana-print-page-style";

function ensurePageStyle(paper: PrintPaper) {
  let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement("style");
    el.id = STYLE_ID;
    document.head.appendChild(el);
  }
  el.textContent = PAGE_CSS[paper];
}

/** Usable print height in CSS px for the selected paper (≈96dpi). */
function usableHeightPx(paper: PrintPaper): number {
  if (paper === "A4-landscape") return Math.floor(((210 - 16) / 25.4) * 96);
  if (paper === "Letter") return Math.floor((11 - 0.8) * 96);
  return Math.floor(((297 - 20) / 25.4) * 96); // A4 portrait
}

function fitSinglePageScale(paper: PrintPaper) {
  const host = document.querySelector(".satahana-host") as HTMLElement | null;
  const art = document.querySelector("#kendraya-satahana") as HTMLElement | null;
  if (!host || !art) return;
  host.style.removeProperty("--print-scale");
  // Force layout after compact print CSS is active
  const h = art.getBoundingClientRect().height;
  const maxH = usableHeightPx(paper);
  const scale = h > maxH ? Math.max(0.55, Math.min(1, (maxH * 0.98) / h)) : 1;
  host.style.setProperty("--print-scale", String(Number(scale.toFixed(3))));
}

export function applyPrintAttributes(
  mode: PrintMode,
  paper: PrintPaper = "A4",
) {
  const root = document.documentElement;
  root.dataset.printMode = mode;
  root.dataset.printPaper = paper;
  root.classList.add("printing");
  ensurePageStyle(paper);
}

export function clearPrintAttributes() {
  const root = document.documentElement;
  delete root.dataset.printMode;
  delete root.dataset.printPaper;
  root.classList.remove("printing");
  document.getElementById(STYLE_ID)?.remove();
  const host = document.querySelector(".satahana-host") as HTMLElement | null;
  host?.style.removeProperty("--print-scale");
}

export function runPrint(mode: PrintMode, paper: PrintPaper = "A4") {
  track("tool_used", { tool: "export" });
  track("chart_printed", { mode, paper });
  applyPrintAttributes(mode, paper);
  const cleanup = () => {
    clearPrintAttributes();
    window.removeEventListener("afterprint", cleanup);
  };
  window.addEventListener("afterprint", cleanup);
  window.setTimeout(() => {
    if (mode === "single" || mode === "charts") {
      fitSinglePageScale(paper);
    }
    window.print();
    window.setTimeout(cleanup, 2000);
  }, 80);
}
