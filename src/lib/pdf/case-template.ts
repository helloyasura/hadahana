import type { CaseReport } from "../pro/cases";
import { escapeHtml as e } from "./template";
export function caseReportHtml(report: CaseReport) {
  const zone = (n: number) =>
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Colombo",
      dateStyle: "medium",
      timeStyle: "short",
    }).format(n);
  return `<!doctype html><html lang="${report.language}"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; font-src data:; img-src data:"><title>${e(report.title)}</title><style>
  @page{size:A4 portrait;margin:16mm 13mm 18mm}*{box-sizing:border-box}body{font:10pt/1.7 'Noto Sans Sinhala','Abhaya Libre',sans-serif;color:#203349;overflow-wrap:anywhere;margin:0}header{border-bottom:2px solid #b89a50;padding-bottom:12px}.brand{letter-spacing:2px;color:#886a2b}h1{font-size:20pt}h2{font-size:12pt;break-after:avoid}pre{font:inherit;white-space:pre-wrap;overflow-wrap:anywhere}.muted,footer{font-size:9pt;color:#506879}article{border-top:1px solid #ccd7dd;padding:10px 0}.draft{font-size:18pt;color:#946227}
  </style></head><body><header><b class="brand">ERVANTA · HADAHANA PRO</b><p>${e(report.branding.displayName)}<br>${e(report.branding.qualifications)}<br>${e(report.branding.contact)}</p></header>
  ${report.stage === "draft" ? '<p class="draft">කෙටුම්පත / DRAFT — not issued</p>' : '<p class="muted">සමාලෝචිත වාර්තාව / Reviewed final report</p>'}
  <h1>${e(report.title)}</h1><p class="muted">v${report.version} · ${zone(report.at)} Asia/Colombo</p><pre>${e(report.body)}</pre>
  <h2>සාක්ෂි සටහන් / Pinned findings</h2>${report.findings.map((f) => `<article><h2>${e(f.title)}</h2><pre>${e(f.text)}</pre><p class="muted">${e(f.state.input.date)} ${e(f.state.input.time)} ${e(f.state.input.timezone)} · ${e(f.state.input.latitude)}, ${e(f.state.input.longitude)} · D${f.state.settings.division} · ${e(f.state.settings.calculation.ayanamsa)} · ${e(f.state.settings.houses)} · ${e(f.state.settings.calculation.nodes)} nodes · Vimshottari ${f.state.settings.calculation.dasaYearDays}d<br>Recorded ${zone(f.at)} Asia/Colombo</p></article>`).join("")}
  <footer>පෞද්ගලිකයි / Confidential. Traditional interpretation only; not a certain prediction or a substitute for medical, legal or financial advice. Internal case notes, customer contact details and investigation timeline are not included. Delivery is controlled by your astrologer.</footer></body></html>`;
}
