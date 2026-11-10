"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import type { CalculationConfig } from "@/lib/astrology/config";
import Shell from "./Shell";
import Chart, { type ProChartResult } from "./Chart";
import { errorMessage, proRequest } from "./client";
type Info = {
  displayName: string;
  logo: string;
  preset: { name: string; version: number; config: CalculationConfig };
};
type Output = {
  result: ProChartResult;
  manifest: { balanceDisplay: string; sunriseUtc: string };
  calculatedPer: string;
  presetName: string;
  presetVersion: number;
};
export default function PublicLink({ token }: { token: string }) {
  const [info, setInfo] = useState<Info>(),
    [output, setOutput] = useState<Output>(),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const [date, setDate] = useState(""),
    [time, setTime] = useState(""),
    [latitude, setLatitude] = useState(6.9271),
    [longitude, setLongitude] = useState(79.8612),
    [timezone, setTimezone] = useState("Asia/Colombo"),
    [consent, setConsent] = useState(false);
  useEffect(() => {
    proRequest<Info>(`/public/${encodeURIComponent(token)}`)
      .then(setInfo)
      .catch((e) => setMessage(errorMessage(e)));
  }, [token]);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    setOutput(undefined);
    try {
      setOutput(
        await proRequest<Output>(`/public/${encodeURIComponent(token)}`, {
          date,
          time,
          latitude,
          longitude,
          timezone,
          consent,
        }),
      );
    } catch (e) {
      setMessage(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Shell publicView>
      <div className="pro-public-heading">
        <p className="pro-eyebrow">A PERSONAL INVITATION TO CALCULATE</p>
        <h1>{info ? info.displayName : "පුද්ගලික කේන්ද්‍ර සබැඳිය"}</h1>
        <p>ජෝතිෂ්‍යවේදියාගේ ක්‍රමයට අනුව ඔබගේ කේන්ද්‍රය</p>
        {info && (
          <span className="pro-pill">
            {info.preset.name} · v{info.preset.version}
          </span>
        )}
      </div>
      {message && (
        <p className="pro-notice" role="status">
          {message}
        </p>
      )}
      {info && (
        <>
          {/* Logos are bounded, embedded raster data only: no remote tracking. */}
          {info.logo && (
            <div className="pro-logo">
              <Image
                unoptimized
                src={info.logo}
                alt={`${info.displayName} ලාංඡනය`}
                width={72}
                height={72}
              />
            </div>
          )}
          <div className="pro-work-grid">
            <section className="pro-card">
              <p className="pro-eyebrow">BIRTH DETAILS</p>
              <h2>උපන් තොරතුරු ඇතුළත් කරන්න</h2>
              <p className="pro-small">
                උප්පැන්නයේ සඳහන් සැබෑ ඔරලෝසු වේලාව භාවිත කරන්න. නම, දුරකථනය හෝ
                ඊමේල් අවශ්‍ය නැත.
              </p>
              <form onSubmit={submit}>
                <div className="pro-field-grid">
                  <label>
                    උපන් දිනය
                    <input
                      aria-label="උපන් දිනය"
                      type="date"
                      min="1900-01-01"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                    />
                  </label>
                  <label>
                    උපන් වේලාව · පැය 24
                    <input
                      aria-label="උපන් වේලාව"
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      required
                    />
                  </label>
                </div>
                <label>
                  උපන් ස්ථානය · ඉක්මන් තේරීම
                  <select
                    defaultValue="colombo"
                    onChange={(e) => {
                      const v: Record<string, [number, number]> = {
                        colombo: [6.9271, 79.8612],
                        kandy: [7.2906, 80.6337],
                        galle: [6.0535, 80.221],
                        jaffna: [9.6615, 80.0255],
                      };
                      if (v[e.target.value]) {
                        setLatitude(v[e.target.value][0]);
                        setLongitude(v[e.target.value][1]);
                        setTimezone("Asia/Colombo");
                      }
                    }}
                  >
                    <option value="colombo">කොළඹ</option>
                    <option value="kandy">මහනුවර</option>
                    <option value="galle">ගාල්ල</option>
                    <option value="jaffna">යාපනය</option>
                    <option value="custom">වෙනත් · පහළ ඛණ්ඩාංක සකසන්න</option>
                  </select>
                </label>
                <div className="pro-field-grid">
                  <label>
                    අක්ෂාංශය / Latitude
                    <input
                      type="number"
                      step="any"
                      min={-65}
                      max={65}
                      value={latitude}
                      onChange={(e) => setLatitude(Number(e.target.value))}
                      required
                    />
                  </label>
                  <label>
                    දේශාංශය / Longitude
                    <input
                      type="number"
                      step="any"
                      min={-180}
                      max={180}
                      value={longitude}
                      onChange={(e) => setLongitude(Number(e.target.value))}
                      required
                    />
                  </label>
                </div>
                <label>
                  කාල කලාපය / IANA timezone
                  <input
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    maxLength={80}
                    required
                  />
                </label>
                <div className="pro-notice">
                  <label className="pro-checkbox">
                    <input
                      type="checkbox"
                      checked={consent}
                      onChange={(e) => setConsent(e.target.checked)}
                      required
                    />
                    <span>
                      මගේ / මාගේ භාරයේ දරුවාගේ උපන් තොරතුරු{" "}
                      <b>{info.displayName}</b> වෙත යවා ගණනය සහ සේවාලාභී සටහනක්
                      ලෙස දින 90ක් දක්වා සුරැකීමට එකඟ වෙමි.
                    </span>
                  </label>
                  <p className="pro-small">
                    මෙම ක්‍රියාව පමණක් තොරතුරු සුරකියි. නිවැරදි කිරීමක් හෝ ඉවත්
                    කිරීමක් සඳහා ජෝතිෂ්‍යවේදියා අමතන්න. දත්ත ප්‍රසිද්ධ
                    ලැයිස්තුවකට හෝ analytics වෙත යවන්නේ නැත. සබැඳියට පැරණි
                    ප්‍රතිඵල බලන්න බැහැ.
                  </p>
                </div>
                <button className="pro-button" disabled={busy || !consent}>
                  {busy ? "ගණනය කරමින්…" : "කේන්ද්‍රය ගණනය කරන්න →"}
                </button>
              </form>
            </section>
            <aside className="pro-card pro-method-summary">
              <p className="pro-eyebrow">METHOD TRANSPARENCY</p>
              <h2>මෙම ගණනයේ ක්‍රමය</h2>
              <dl className="pro-facts">
                <dt>ක්‍රම අනුවාදය</dt>
                <dd>
                  {info.preset.name} · v{info.preset.version}
                </dd>
                <dt>අයනාංශය</dt>
                <dd>{info.preset.config.ayanamsa}</dd>
                <dt>රාහු / කේතු</dt>
                <dd>{info.preset.config.nodes}</dd>
                <dt>ඉර උදාව</dt>
                <dd>
                  {info.preset.config.sunriseDisc} · refraction{" "}
                  {info.preset.config.sunriseRefraction ? "on" : "off"}
                </dd>
                <dt>දශා වසර</dt>
                <dd>{info.preset.config.dasaYearDays} දින</dd>
                <dt>භාව ක්‍රමය</dt>
                <dd>Whole sign</dd>
              </dl>
              <div className="pro-divider" />
              <p className="pro-small">
                වෙනත් ගණනය ක්‍රමයකින් ප්‍රතිඵල වෙනස් විය හැක. මෙය “වඩා නිවැරදි
                අනාවැකි” පිළිබඳ සහතිකයක් නොවේ. සෞඛ්‍ය, මුදල් හෝ ජීවිත තීරණ සඳහා
                වෘත්තීය උපදෙස් වෙනුවට භාවිත නොකරන්න.
              </p>
              <p className="pro-small">
                ශ්‍රී ලංකාවේ ඓතිහාසික කාල වෙනස්කම් සඳහා Asia/Colombo භාවිත වේ.
                පැරණි ඔරලෝසු මාරුවීම් ආසන්න වේලාවන් ජෝතිෂ්‍යවේදියා සමඟ තහවුරු
                කරන්න.
              </p>
            </aside>
          </div>
        </>
      )}
      {output && (
        <div className="pro-result">
          <p className="pro-notice">
            {output.calculatedPer} ගේ ක්‍රමය අනුව ගණනය කරන ලදි ·{" "}
            {output.presetName} v{output.presetVersion}. ඔබගේ කැමැත්ත සහිත සටහන
            සුරැකිණි.
          </p>
          <Chart
            result={output.result}
            balance={output.manifest.balanceDisplay}
          />
        </div>
      )}
    </Shell>
  );
}
