import type { SatahanaData } from "../../components/KendrayaSatahana";
import type { PdfOrientation, PdfSize } from "./options";
export function escapeHtml(value: unknown): string {
  return String(value ?? "—").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
const e = escapeHtml;
function table(headers: string[], rows: unknown[][]) {
  return `<table><thead><tr>${headers.map(h => `<th>${e(h)}</th>`).join("")}</tr></thead><tbody>${rows.map(row => `<tr>${row.map(v => `<td>${e(v)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
}
export function chartSvg(chart: SatahanaData["rashiChart"]) {
  // Lagna-fixed Sri Lankan geometry; vector lines and shaped Sinhala text share coordinates.
  const positions = [[150,48],[67,25],[25,68],[48,150],[25,232],[68,275],[150,252],[232,275],[275,232],[252,150],[275,68],[232,25]];
  const cells = chart.cells as (typeof chart.cells[number] & {houseNum?: number})[];
  const lagna = cells.find(c => c.isLagna)?.signIndex;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" role="img" aria-label="${e(chart.centerTitleSi)}"><g fill="none" stroke="#607887" stroke-width="1"><rect x="1" y="1" width="298" height="298" rx="3"/><path d="M100 0V300M200 0V300M0 100H300M0 200H300M0 0L100 100M200 100L300 0M0 300L100 200M200 200L300 300"/></g>${positions.map(([x,y],i) => {
    const cell = cells.find(c => c.houseNum === i+1) ?? (lagna == null ? undefined : cells.find(c => c.signIndex === (lagna+i)%12));
    const glyphs = cell?.glyphs || [];
    const lines = glyphs.length ? Array.from({length: Math.ceil(glyphs.length/2)}, (_,n) => glyphs.slice(n*2,n*2+2).join(" ")) : [String(i+1)];
    return `<text x="${x}" y="${y}" text-anchor="middle" font-size="13" fill="#17324c">${lines.map((g,j) => `<tspan x="${x}" dy="${j ? 17 : 0}">${e(g)}</tspan>`).join("")}</text>`;
  }).join("")}<text x="150" y="145" text-anchor="middle" font-size="10" fill="#17324c">${chart.centerTitleSi.split(" ").map((word,i)=>`<tspan x="150" dy="${i ? 15 : -15}">${e(word)}</tspan>`).join("")}</text><text x="150" y="185" text-anchor="middle" font-size="9">${e(chart.degree)}</text></svg>`;
}
export function pdfTemplate(d: SatahanaData, size: PdfSize, orientation: PdfOrientation) {
  const b = d.booklet;
  const section = (title: string, body: string) => `<section><h2>${e(title)}</h2>${body}</section>`;
  const pairs = (rows: unknown[][]) => table(["විස්තර / Detail", "අගය / Value"], rows);
  return `<!doctype html><html lang="si"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; font-src data:; img-src data:"><title>Hadahana horoscope</title><style>
  @page { size: ${size} ${orientation}; margin: 14mm 11mm 16mm; }
  * { box-sizing:border-box; } body { margin:0; color:#203349; background:white; font:10pt/1.65 'Noto Sans Sinhala','Abhaya Libre',sans-serif; overflow-wrap:anywhere; }
  header { border-bottom:2px solid #b89a50; padding-bottom:10px; margin-bottom:14px; } .brand { font:700 12pt sans-serif; letter-spacing:3px; color:#886a2b; } h1 { font-size:20pt; line-height:1.5; margin:8px 0; } h2 { font-size:12pt; color:#204a60; margin:14px 0 8px; break-after:avoid; } p {margin:6px 0;} .muted {color:#506879;font-size:9pt;} section { margin-bottom:15px; } .charts {display:flex;gap:8mm;flex-wrap:wrap;justify-content:center;} figure {margin:0; width:calc(50% - 4mm); max-width:82mm; break-inside:avoid; } svg {display:block;width:100%;height:auto;} figcaption {text-align:center;font-size:9pt;margin-top:5px;} table {border-collapse:collapse;width:100%;table-layout:fixed;font-size:9pt;} th,td {border:1px solid #cdd7dd;padding:5px;vertical-align:top;} th {background:#edf3f5;text-align:left;} thead {display:table-header-group;} tr {break-inside:avoid;} .page {break-before:page;} .keep {break-inside:avoid;}
  </style></head><body><header><div class="brand">✦ HADAHANA / ASTRAL STUDIO</div><p class="muted">${e(d.blessing)}</p><h1>${e(d.titleSi)}</h1><p>${e(d.native.name || "ජන්ම කේන්ද්‍රය")} · ${e(d.native.dateSi)} · ${e(d.native.timeLocal)}</p><p class="muted">${e(d.native.placeLabel)} · ${e(d.native.tzOffset)}</p></header>
  ${section("උපන් විස්තර / Birth details", pairs([["නම / Name",d.native.name],["දිනය / Date",d.native.dateSi],["වේලාව / Time",d.native.timeLocal],["ස්ථානය / Place",d.native.placeLabel],["අක්ෂාංශ / Latitude",d.native.latitude],["දේශාංශ / Longitude",d.native.longitude],["ලිපිනය / Address", d.native.address],["නැකත / Nakshatra",d.meta.nekathaFullSi || d.meta.nekathaSi],["පාදය / Pada",d.meta.pada],["තිථිය / Tithi",d.meta.tithi],["යෝගය / Yoga",d.meta.yoga],["කරණය / Karana",d.meta.karana]]))}
  <section class="page"><h2>කේන්ද්‍ර සටහන් / Horoscope charts</h2><div class="charts">${[d.rashiChart,d.navamsaChart,d.chandraChart].filter(Boolean).map(c => `<figure>${chartSvg(c!)}<figcaption>${e(c!.centerTitleSi)}</figcaption></figure>`).join("")}</div></section>
  ${section("ග්‍රහ පිහිටීම් / Planetary positions",table(["ග්‍රහයා","රාශිය","අංශක","නැකත / පාදය","නවාංශය","භාවය"],d.grahaTable.map(r=>[r.nameSi+(r.retrograde?" (R)":""),r.rashiSi,r.sphuta,`${r.nekathaSi} / ${r.pada}`,r.navamsaSi,r.bhava])))}
  ${section("උපන් සටහන / Birth almanac",pairs([["ශක වර්ෂය",b.shakaYear],["රවි රාශිය / භාග",`${b.sunRashiSi} / ${b.sunBhaga}`],["පක්ෂය / තිථිය",`${b.pakshaShort} / ${b.tithiSi}`],["උපන් වේලාව",b.timeAmPmSi],["ඉෂ්ට කාලය (පැය / විනාඩි / තත්පර)",`${b.ishta.hours} / ${b.ishta.minutes} / ${b.ishta.seconds}`],["ලග්න ස්ඵුටය (භාග / කලා / විකලා)",`${b.lagnaSphuta.bhaga} / ${b.lagnaSphuta.kala} / ${b.lagnaSphuta.vikala}`],["සූර්යෝදය (කොළඹ)",b.sunriseColombo],[`සූර්යෝදය (${b.sunrisePlaceLabel})`,b.sunrisePlace],["ලිංග / ජන්ම භූමිකාව",`${b.genderSi} / ${b.lingaSi} / ${b.roleSi}`],["අයනය / සෘතුව",`${b.ayanaSi} / ${b.rituSi}`],["චන්ද්‍ර මාසය",b.lunarMonthSi],["ලග්නය / අධිපති",`${b.lagnaRashiSi} / ${b.lagnaLordSi}`],["හෝරා",`${b.hora.signSi} / ${b.hora.lordSi}`],["දෙර්කාණ",`${b.drekkana.signSi} / ${b.drekkana.lordSi}`],["නවාංශ",`${b.navamsa.signSi} / ${b.navamsa.lordSi}`],["ද්වාදශාංශ",`${b.dwadashamsa.signSi} / ${b.dwadashamsa.lordSi}`],["ත්‍රිංශාංශ",b.trimshamsa.signSi],["ගණ / යෝනි / නාඩි",`${b.ganaSi} / ${b.yoniSi} / ${b.nadiSi}`],["වෘක්ෂ / පක්ෂි / භූත",`${b.vrukshaSi} / ${b.pakshiSi} / ${b.bhutaSi}`],["ගෝත්‍ර / වර්ණ / රජ්ජු",`${b.gothraSi} / ${b.varnaSi} / ${b.rajjuSi}`],["සූර්යෝදය / Sunrise",d.meta.sunrise],["සූර්යාස්තය / Sunset",d.meta.sunset],["අයනාංශය",d.meta.ayanamsa]]))}
  ${section("ත්‍රිවාර / Daily almanac",`<p>${e(`${b.birthNarrative.year} ${b.birthNarrative.monthSi} ${b.birthNarrative.day} ${b.birthNarrative.weekdaySi} · ${b.birthNarrative.hours}:${b.birthNarrative.minutes} · ${b.birthNarrative.place}`)}</p>`+table(["දිනය","නැකත","පැය / විනාඩි","තිථිය","පැය / විනාඩි"],b.thrivara.map(r=>[r.dateSi,r.nekathaSi,`${r.nekathaHours} / ${r.nekathaMinutes}`,r.tithiSi,`${r.tithiHours} / ${r.tithiMinutes}`])))}
  ${section("ග්‍රහ තත්ත්වය / Planetary state",table(["ග්‍රහයා","භාවය","රාශිය","බලය","ගති"],b.grahaTaththwaya.map(r=>[r.nameSi,r.bhava,r.rashiSi,r.balayaSi,r.gathiSi])))}
  ${section("මහ දසා / Major periods",`<p>${e(d.dashaBalanceSi)}</p>`+table(["අධිපති","ආරම්භය","අවසානය","වර්ෂ"],d.mahaDasha.map(r=>[r.lordSi,r.startSi,r.endSi,r.years])))}
  ${section("අන්තර් දසා / Sub-periods",`<p>${e(d.antarMahaLordSi)}</p>`+table(["අධිපති","ආරම්භය","අවසානය","වර්ෂ"],d.antarDasha.map(r=>[r.lordSi,r.startSi,r.endSi,r.years])))}
  ${section("භාව සටහන / Houses",table(["භාවය / රාශිය","ආරම්භය","මධ්‍යය","අවසානය"],d.bhavaRows.map(r=>[`${r.bhava} / ${r.signSi}`,r.start,r.mid,r.end]))+table(["භාවය","නැකත","ග්‍රහයන්"],d.bhavaRows.map(r=>[r.bhava,r.midNekatha,r.occupants])))}
  ${d.namThebima ? section("නම් තැබීම / Naming letters",pairs([["ප්‍රධාන අකුර / Primary",`${d.namThebima.primarySi} / ${d.namThebima.primaryRoman}`],["සුභ අකුරු / Letters",d.namThebima.allLetters.join(" · ")],["වළකින්න / Avoid",d.namThebima.avoid.join(" · ")]])+`<p>${e(d.namThebima.guidanceSi)}</p>`) : ""}
  <p class="muted">${e(d.legendSi)}</p><p class="muted">${e(d.footerSi)}</p><p class="muted">Cultural guidance only — not medical, legal or financial advice.</p></body></html>`;
}
