import { yogaCandidates } from "@/lib/pro/yogas";
import type { ProChartResult } from "./Chart";
export default function YogaDesk({ result }: { result: ProChartResult }) {
  const rows = yogaCandidates(result);
  return (
    <section className="pro-card studio-worksheet studio-yoga-desk">
      <p className="pro-eyebrow">D1 WHOLE-SIGN · EXPLAINABLE CANDIDATES</p>
      <h2>යෝග යොමු හා මූලික හැඩ</h2>
      <p className="pro-notice">
        මෙය මූලික භූමිතික candidates පමණි. සම්පූර්ණ ශක්තිය, භංග, ශුභ බලපෑම් හා
        චන්ද්‍ර තත්ත්වය පරීක්ෂා නොකර යෝගයක් සම්පූර්ණ බව හෝ අනාගත ප්‍රතිඵලයක්
        කියන්නේ නැත. D9 / Equal-house display වෙනස්කම් මෙයට නොයෙදේ.
      </p>
      <div className="pro-table-wrap">
        <table>
          <thead>
            <tr>
              <th>යෝගය</th>
              <th>මූලික හැඩය</th>
              <th>නීතිය / හේතුව</th>
              <th>තව පරීක්ෂා කළ යුතු දේ</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.name}
                className={r.matched ? "studio-row-selected" : ""}
              >
                <td>{r.name}</td>
                <td>{r.matched ? "Candidate / මූලික ගැළපීම" : "නොගැළපේ"}</td>
                <td>
                  {r.rule}
                  <br />
                  {r.detail}
                </td>
                <td>{r.cautions}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="pro-small">
        මූලාශ්‍ර: BPHS 75.1–2 (Pancha Mahapurusha); Gajakesari Moon-kendra මූලික
        convention. Source links හා වෙනස්කම් යොමු පුස්තකාලයේ. Shadbala /
        Ashtakavarga අගයන් තවම ස්වාධීන known-chart fixtures සමඟ තහවුරු කර නැති
        නිසා නොපෙන්වයි.
      </p>
    </section>
  );
}
