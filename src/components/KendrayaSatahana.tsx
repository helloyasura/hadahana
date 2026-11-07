"use client";

import type { ReactNode } from "react";
import { SouthIndianChart } from "./SouthIndianChart";

type ChartBlock = {
  centerTitleSi: string;
  degree: string;
  cells: Array<{
    row: number;
    col: number;
    signIndex?: number;
    signSi: string;
    glyphs: string[];
    isLagna: boolean;
    rashiNum?: number;
  }>;
};

type Booklet = {
  shakaYear: number;
  ayanaSi: string;
  rituSi: string;
  sunRashiSi: string;
  sunBhaga: number;
  lunarMonthSi: string;
  pakshaShort: string;
  tithiSi: string;
  weekdayShortSi: string;
  weekdaySi: string;
  ishta: { hours: string; minutes: string; seconds: string };
  ceYear: number;
  ceMonthSi: string;
  ceDay: number;
  timeAmPmSi: string;
  lagnaLordSi: string;
  lagnaRashiSi: string;
  hora: { signSi: string; lordSi: string };
  drekkana: { signSi: string; lordSi: string };
  navamsa: { signSi: string; lordSi: string };
  dwadashamsa: { signSi: string; lordSi: string };
  trimshamsa: { signSi: string };
  yogaSi: string;
  karanaSi: string;
  padaWord: string;
  lon: string;
  lat: string;
  roleSi: string;
  genderSi: string;
  ganaSi: string;
  yoniSi: string;
  nadiSi: string;
  vrukshaSi: string;
  pakshiSi: string;
  bhutaSi: string;
  gothraSi: string;
  varnaSi: string;
  lingaSi: string;
  rajjuSi: string;
  dashaBalance: {
    lordSi: string;
    years: number;
    months: number;
    days: number;
  };
  lagnaSphuta: { bhaga: string; kala: string; vikala: string };
  sunriseColombo: string;
  sunrisePlace: string;
  sunrisePlaceLabel: string;
  thrivara: Array<{
    dateSi: string;
    nekathaSi: string;
    nekathaHours: string;
    nekathaMinutes: string;
    tithiSi: string;
    tithiHours: string;
    tithiMinutes: string;
  }>;
  grahaTaththwaya: Array<{
    nameSi: string;
    bhava: string;
    rashiSi: string;
    balayaSi: string;
    gathiSi: string;
  }>;
  birthNarrative: {
    year: number;
    monthSi: string;
    day: number;
    weekdaySi: string;
    hours: string;
    minutes: string;
    place: string;
  };
};

export type SatahanaData = {
  blessing: string;
  titleSi: string;
  subtitleSi?: string;
  native: {
    name: string | null;
    genderSi?: string;
    dateSi: string;
    timeLocal: string;
    tzOffset: string;
    placeLabel: string;
    address?: string | null;
    latitude: number;
    longitude: number;
    julianDay?: number;
  };
  meta: {
    weekdaySi: string;
    tithi: string;
    tithiEnds?: string;
    nekathaSi: string;
    nekathaFullSi?: string;
    pada: number;
    nekathaEnds?: string;
    karana: string;
    yoga: string;
    yogaEnds?: string;
    hora: string;
    sunrise: string;
    sunset: string;
    ayanamsa: string;
    drekkana22LordSi: string;
    navamsa64LordSi: string;
    paksha?: string;
    lagnaLordSi?: string;
    chandraLordSi?: string;
  };
  rashiChart: ChartBlock;
  navamsaChart: ChartBlock;
  chandraChart?: ChartBlock;
  grahaTable: Array<{
    nameSi: string;
    rashiSi: string;
    rashiLordSi?: string;
    raBa: string;
    flags?: string;
    navamsaSi: string;
    bhava: number;
    sphuta: string;
    nekathaSi: string;
    nekathaFullSi?: string;
    pada: number;
    nekathaLordSi: string;
    retrograde?: boolean;
  }>;
  namThebima?: {
    primarySi: string;
    primaryRoman: string;
    allLetters: string[];
    avoid: string[];
    guidanceSi: string;
  } | null;
  mahaDasha: Array<{
    index?: number;
    lordSi: string;
    startSi: string;
    endSi?: string;
    years?: number;
  }>;
  antarDasha: Array<{
    index?: number;
    lordSi: string;
    startSi: string;
    endSi?: string;
    years?: number;
  }>;
  antarMahaLordSi?: string;
  dashaBalanceSi: string;
  bhavaRows: Array<{
    bhava: number;
    start: string;
    mid: string;
    end: string;
    midNekatha: string;
    occupants: string;
    signSi?: string;
    themesSi?: string;
  }>;
  legendSi?: string;
  footerSi: string;
  booklet: Booklet;
};

function DotLine({ children }: { children: ReactNode }) {
  return <p className="booklet-line">{children}</p>;
}

function Fill({ children }: { children: ReactNode }) {
  return <span className="booklet-fill">{children}</span>;
}

export function KendrayaSatahana({ data }: { data: SatahanaData }) {
  const b = data.booklet;

  return (
    <article className="satahana booklet-satahana" id="kendraya-satahana">
      {/* —— පිටුව 1: ඉෂ්ට කාල / ශක යුග —— */}
      <div className="print-sheet print-sheet-cover booklet-page">
        <p className="satahana-blessing">{data.blessing}</p>
        <h1 className="satahana-title">{data.titleSi}</h1>
        <p className="satahana-subtitle">
          සම්ප්‍රදායික හඳහන පොත් ආකෘතිය · {data.native.name ?? "—"} ·{" "}
          {b.roleSi}
        </p>

        <DotLine>
          ශ්‍රී ශුද්ධ ශකරාජ වර්ෂ{" "}
          <Fill>{b.shakaYear}</Fill> වන්නෙහි {b.ayanaSi}{" "}
          <Fill>{b.rituSi}</Fill> සෘතුව තුළ{" "}
          <Fill>{b.sunRashiSi}</Fill> රවි{" "}
          <Fill>{b.sunBhaga}</Fill> භාගයක් වූ{" "}
          <Fill>{b.lunarMonthSi}</Fill> මස {b.pakshaShort}{" "}
          <Fill>{b.tithiSi}</Fill> තිථිය ලත්{" "}
          <Fill>{b.weekdayShortSi}</Fill> දින ශුද්ධ සූර්යෝදයාදි{" "}
          <Fill>{b.ishta.hours}</Fill> පැය විනාඩි{" "}
          <Fill>
            {b.ishta.minutes} තත් {b.ishta.seconds}
          </Fill>{" "}
          ට
        </DotLine>

        <DotLine>
          හෙවත් ව්‍යවහාර වර්ෂ <Fill>{b.ceYear}</Fill> ක් වූ{" "}
          <Fill>{b.ceMonthSi}</Fill> මස <Fill>{b.ceDay}</Fill> වැනි දින
          ශ්‍රී ලංකා සම්මත වේලාවෙන් <Fill>{b.timeAmPmSi}</Fill> ට
        </DotLine>

        <DotLine>
          <Fill>{b.lagnaLordSi}</Fill> හිමි{" "}
          <Fill>{b.lagnaRashiSi}</Fill> ලග්නය{" "}
          <Fill>{b.hora.lordSi}</Fill> හිමි රාශ්‍යාර්ධය ·{" "}
          <Fill>{b.drekkana.lordSi}</Fill> හිමි{" "}
          <Fill>{b.drekkana.signSi}</Fill> ද්‍රේක්කාණය ·{" "}
          <Fill>{b.navamsa.lordSi}</Fill> හිමි{" "}
          <Fill>{b.navamsa.signSi}</Fill> නවාංශකය
        </DotLine>

      </div>

      {/* —— පිටුව: රාශි + නවාංශ කේන්ද්‍ර (stacked, diagonal corners) —— */}
      <div className="print-sheet print-sheet-charts booklet-page booklet-charts-page">
        <section className="satahana-charts booklet-charts-stack">
          <SouthIndianChart
            cells={data.rashiChart.cells}
            centerTitle={data.rashiChart.centerTitleSi}
            traditional
          />
          <SouthIndianChart
            cells={data.navamsaChart.cells}
            centerTitle={data.navamsaChart.centerTitleSi}
            traditional
          />
        </section>
        <p className="booklet-note">
          * ස්ත්‍රී / පුරුෂ භේදය අනුව නවාංශකය වෙනස් කර නැත.
        </p>
      </div>

      {/* —— පිටුව 2: අංශ / ඛණ්ඩාංක / ගණ-යෝනි —— */}
      <div className="print-sheet print-sheet-graha booklet-page">
        <DotLine>
          <Fill>{b.navamsa.lordSi}</Fill> හිමි{" "}
          <Fill>{b.navamsa.signSi}</Fill> නවාංශකය ·{" "}
          <Fill>{b.dwadashamsa.lordSi}</Fill> හිමි{" "}
          <Fill>{b.dwadashamsa.signSi}</Fill> ද්වාදශාංශකය ·{" "}
          <Fill>{b.trimshamsa.signSi}</Fill> ත්‍රිංශාංශකය
        </DotLine>
        <DotLine>
          ලග්න කාල හෝරාව <Fill>{b.hora.lordSi}</Fill> · යෝගය{" "}
          <Fill>{b.yogaSi}</Fill> · කරණය <Fill>{b.karanaSi}</Fill> ·
          නැකතේ පාදය <Fill>{b.padaWord}</Fill>
        </DotLine>
        <DotLine>
          නැගෙනහිර දේශාන්තර <Fill>{b.lon}</Fill> · උත්තරාක්ෂ භාග{" "}
          <Fill>{b.lat}</Fill>
        </DotLine>
        <DotLine>
          ශ්‍රී පුණ්‍යවන්ත <Fill>{b.roleSi}</Fill>ගේ ගණයද{" "}
          <Fill>{b.ganaSi}</Fill> · යෝනිය <Fill>{b.yoniSi}</Fill>
        </DotLine>
        <DotLine>
          වෘක්ෂයද <Fill>{b.vrukshaSi}</Fill> · පක්ෂියාද{" "}
          <Fill>{b.pakshiSi}</Fill> · භූතයද <Fill>{b.bhutaSi}</Fill> ·
          ගෝත්‍රයද <Fill>{b.gothraSi}</Fill>
        </DotLine>
        <DotLine>
          වර්ණයද <Fill>{b.varnaSi}</Fill> · ලිංගයද{" "}
          <Fill>{b.lingaSi}</Fill> · නාඩියද <Fill>{b.nadiSi}</Fill> ·
          රජ්ජුවද <Fill>{b.rajjuSi}</Fill>
        </DotLine>
        <DotLine>
          සඳුගේ විංශෝත්තරී නක්ෂත්‍ර මහදශා ශේෂය ·{" "}
          <Fill>{b.dashaBalance.lordSi}</Fill> · වර්ෂ{" "}
          <Fill>{String(b.dashaBalance.years).padStart(2, "0")}</Fill> ·
          මාස{" "}
          <Fill>{String(b.dashaBalance.months).padStart(2, "0")}</Fill> ·
          දින{" "}
          <Fill>{String(b.dashaBalance.days).padStart(2, "0")}</Fill>
        </DotLine>
        <p className="booklet-note">
          අපහරණ හැර ඉදිරියට ඇති වන්නේය. · ලංකා පංචාංග ලිත ඇසුරෙනි.
        </p>

        {data.namThebima ? (
          <section className="satahana-box print-optional-nam">
            <h3>නම් තැබීම (නැකැත් අක්ෂර)</h3>
            <p>
              ප්‍රධාන අකුර:{" "}
              <strong>
                {data.namThebima.primarySi} / {data.namThebima.primaryRoman}
              </strong>
            </p>
            <p>සුභ අකුරු: {data.namThebima.allLetters.join(" · ")}</p>
            <p>වළකින්න: {data.namThebima.avoid.join(" · ")}</p>
          </section>
        ) : null}
      </div>

      {/* —— පිටුව 3: උපන් විස්තර + ත්‍රීවාර ලිඛිත —— */}
      <div className="print-sheet print-sheet-dasha booklet-page">
        <DotLine>
          ක්‍රි.ව. <Fill>{b.birthNarrative.year}</Fill> අවු{" "}
          <Fill>{b.birthNarrative.monthSi}</Fill> මස{" "}
          <Fill>{b.birthNarrative.day}</Fill> වන{" "}
          <Fill>{b.birthNarrative.weekdaySi}</Fill> දින ඔරලෝසු වේලාවෙන්{" "}
          <Fill>{b.birthNarrative.hours}</Fill> පසු වී විනාඩි{" "}
          <Fill>{b.birthNarrative.minutes}</Fill> ට{" "}
          <Fill>{b.birthNarrative.place}</Fill> දී උපන්නේය.
        </DotLine>

        <h3 className="booklet-h3">ත්‍රීවාර ලිඛිත</h3>
        <div className="satahana-table-wrap">
          <table className="satahana-table booklet-table">
            <thead>
              <tr>
                <th>දිනය</th>
                <th>නැකත</th>
                <th>පැය</th>
                <th>විනාඩි</th>
                <th>තිථිය</th>
                <th>පැය</th>
                <th>විනාඩි</th>
              </tr>
            </thead>
            <tbody>
              {b.thrivara.map((row) => (
                <tr key={row.dateSi}>
                  <td>{row.dateSi}</td>
                  <td>{row.nekathaSi}</td>
                  <td>{row.nekathaHours}</td>
                  <td>{row.nekathaMinutes}</td>
                  <td>{row.tithiSi}</td>
                  <td>{row.tithiHours}</td>
                  <td>{row.tithiMinutes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="booklet-sphuta-grid">
          <div>
            <h3 className="booklet-h3">❖ ලග්න ස්ඵුටය</h3>
            <p>
              භාග <Fill>{b.lagnaSphuta.bhaga}</Fill> · කලා{" "}
              <Fill>{b.lagnaSphuta.kala}</Fill> · විකලා{" "}
              <Fill>{b.lagnaSphuta.vikala}</Fill>
            </p>
          </div>
          <div>
            <h3 className="booklet-h3">❖ සූර්යෝදය (කොළඹ)</h3>
            <p>
              <Fill>{b.sunriseColombo}</Fill>
            </p>
          </div>
          <div>
            <h3 className="booklet-h3">
              ❖ සූර්යෝදය ({b.sunrisePlaceLabel})
            </h3>
            <p>
              <Fill>{b.sunrisePlace}</Fill>
            </p>
          </div>
          <div>
            <h3 className="booklet-h3">❖ ඉෂ්ට කාලය</h3>
            <p>
              පැය <Fill>{b.ishta.hours}</Fill> · විනාඩි{" "}
              <Fill>{b.ishta.minutes}</Fill> · තත්පර{" "}
              <Fill>{b.ishta.seconds}</Fill>
            </p>
          </div>
        </div>

        <section className="satahana-dasha">
          <div>
            <h3>මහා දශා (විංශෝත්තරී)</h3>
            <table className="satahana-table compact">
              <thead>
                <tr>
                  <th>#</th>
                  <th>ග්‍රහ</th>
                  <th>ආරම්භය</th>
                  <th>අවසානය</th>
                  <th>වර්ෂ</th>
                </tr>
              </thead>
              <tbody>
                {data.mahaDasha.map((d, i) => (
                  <tr key={`${d.lordSi}-${d.startSi}`}>
                    <td>{String(d.index ?? i + 1).padStart(2, "0")}</td>
                    <td>{d.lordSi}</td>
                    <td>{d.startSi}</td>
                    <td>{d.endSi ?? "—"}</td>
                    <td>{d.years ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div>
            <h3>
              අන්තර් දශා
              {data.antarMahaLordSi ? ` (${data.antarMahaLordSi})` : ""}
            </h3>
            <table className="satahana-table compact">
              <thead>
                <tr>
                  <th>#</th>
                  <th>ග්‍රහ</th>
                  <th>ආරම්භය</th>
                  <th>අවසානය</th>
                  <th>වර්ෂ</th>
                </tr>
              </thead>
              <tbody>
                {data.antarDasha.map((d, i) => (
                  <tr key={`${d.lordSi}-${d.startSi}`}>
                    <td>{String(d.index ?? i + 1).padStart(2, "0")}</td>
                    <td>{d.lordSi}</td>
                    <td>{d.startSi}</td>
                    <td>{d.endSi ?? "—"}</td>
                    <td>{d.years ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* —— පිටුව 4: ග්‍රහ තත්වය + භාව —— */}
      <div className="print-sheet print-sheet-bhava booklet-page">
        <h3 className="booklet-h3">ග්‍රහ තත්වය</h3>
        <div className="satahana-table-wrap">
          <table className="satahana-table booklet-table">
            <thead>
              <tr>
                <th>ග්‍රහයා</th>
                <th>භාවය</th>
                <th>රාශිය</th>
                <th>ග්‍රහ බලය</th>
                <th>ග්‍රහගති</th>
              </tr>
            </thead>
            <tbody>
              {b.grahaTaththwaya.map((g) => (
                <tr key={g.nameSi}>
                  <td>{g.nameSi}</td>
                  <td>{g.bhava}</td>
                  <td>{g.rashiSi}</td>
                  <td>{g.balayaSi}</td>
                  <td>{g.gathiSi}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <section className="satahana-table-wrap print-optional-extra">
          <h3>භාව (රාශි භාව — Whole sign)</h3>
          <table className="satahana-table">
            <thead>
              <tr>
                <th>භාව</th>
                <th>රාශි</th>
                <th>ආරම්භය</th>
                <th>මධ්‍යය</th>
                <th>අවසානය</th>
                <th>නැකත</th>
                <th>ග්‍රහයෝ</th>
              </tr>
            </thead>
            <tbody>
              {data.bhavaRows.map((row) => (
                <tr key={row.bhava}>
                  <td>{String(row.bhava).padStart(2, "0")}</td>
                  <td>{row.signSi ?? "—"}</td>
                  <td>{row.start}</td>
                  <td>{row.mid}</td>
                  <td>{row.end}</td>
                  <td>{row.midNekatha}</td>
                  <td>{row.occupants}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {data.chandraChart ? (
          <section className="satahana-charts print-optional-extra booklet-charts-stack">
            <SouthIndianChart
              cells={data.chandraChart.cells}
              centerTitle={data.chandraChart.centerTitleSi}
              traditional
            />
          </section>
        ) : null}

        <p className="satahana-balance">{data.dashaBalanceSi}</p>
        <footer className="satahana-footer">{data.footerSi}</footer>
      </div>
    </article>
  );
}
