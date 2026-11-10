import type { castKendraya } from "@/lib/astrology/kendraya";
import { SouthIndianChart } from "@/components/SouthIndianChart";
export type ProChartResult = Awaited<ReturnType<typeof castKendraya>>;
export default function Chart({
  result,
  balance,
}: {
  result: ProChartResult;
  balance?: string;
}) {
  const cells = Array.from({ length: 12 }, (_, i) => ({
    houseNum: i + 1,
    isLagna: i === 0,
    glyphs: result.navagraha
      .filter((g) => g.bhava === i + 1)
      .map((g) => g.grahaSinhala),
  }));
  return (
    <section className="pro-card">
      <p className="pro-eyebrow">CALCULATION SNAPSHOT</p>
      <h2>කේන්ද්‍ර සටහන · {result.lagna.rashiSinhala}</h2>
      <div className="pro-chart-grid">
        <SouthIndianChart
          cells={cells}
          centerTitle={result.lagna.rashiSinhala}
          degree={result.lagna.degreeInRashi}
        />
        <div>
          <dl className="pro-facts">
            <dt>චන්ද්‍ර රාශිය</dt>
            <dd>{result.chandra.rashiSinhala}</dd>
            <dt>නැකත / පාදය</dt>
            <dd>
              {result.chandra.nekathaSinhala} / {result.chandra.pada}
            </dd>
            <dt>අයනාංශය</dt>
            <dd>{result.tradition.ayanamsa}</dd>
            <dt>දශා ශේෂය</dt>
            <dd>
              {balance || `${result.vimshottari.balanceAtBirth.years} years`}
            </dd>
            <dt>දශා අධිපති</dt>
            <dd>{result.vimshottari.balanceAtBirth.lordSinhala}</dd>
          </dl>
          <p className="pro-small">
            මෙය සම්ප්‍රදායික ගණනයක් පමණි. ජීවිත සිදුවීම් පිළිබඳ විද්‍යාත්මක
            සහතිකයක් නොවේ.
          </p>
        </div>
      </div>
      <div className="pro-table-wrap">
        <table>
          <thead>
            <tr>
              <th>ග්‍රහයා</th>
              <th>රාශිය</th>
              <th>අංශක</th>
              <th>භාවය</th>
            </tr>
          </thead>
          <tbody>
            {result.navagraha.map((p) => (
              <tr key={p.graha}>
                <td>{p.grahaSinhala}</td>
                <td>{p.rashiSinhala}</td>
                <td>{p.degreeInRashi}</td>
                <td>{p.bhava}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
