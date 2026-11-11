"use client";
import { useEffect, useState } from "react";
import type { Client, Preset, ShareLink } from "@/lib/pro/store";
import {
  DEFAULT_CALCULATION_CONFIG,
  type CalculationConfig,
} from "@/lib/astrology/config";
import { withBasePath } from "@/lib/base-path";
import Shell from "./Shell";
import Chart from "./Chart";
import { errorMessage, localDate, proRequest } from "./client";
type Profile = {
  displayName: string;
  qualifications: string;
  contact: string;
  logo: string;
};
type Data = {
  profile: Profile;
  presets: Preset[];
  links: Omit<ShareLink, "tokenHash">[];
  clients: { id: string; createdAt: number; presetId: string; lagna: string }[];
};
export default function Workspace({
  section,
}: {
  section: "dashboard" | "presets" | "links";
}) {
  const [data, setData] = useState<Data>(),
    [profile, setProfile] = useState<Profile>(),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const [config, setConfig] = useState<CalculationConfig>({
      ...DEFAULT_CALCULATION_CONFIG,
    }),
    [presetName, setPresetName] = useState("මගේ ප්‍රධාන ක්‍රමය"),
    [presetId, setPresetId] = useState("");
  const [label, setLabel] = useState(""),
    [days, setDays] = useState(30),
    [maxUses, setMaxUses] = useState(10),
    [shareUrl, setShareUrl] = useState("");
  const [client, setClient] = useState<Client>();
  async function reload() {
    const d = await proRequest<Data>("/workspace");
    setData(d);
    setProfile(d.profile);
    setPresetId((p) => p || d.presets[0]?.id || "");
  }
  useEffect(() => {
    reload().catch((e) => setMessage(errorMessage(e)));
  }, []);
  async function mutate(body: unknown) {
    setBusy(true);
    setMessage("");
    try {
      const r = await proRequest<{ token?: string }>("/workspace", body);
      if (r.token)
        setShareUrl(window.location.origin + withBasePath(`/pro/s/${r.token}`));
      await reload();
      setMessage("සුරකින ලදි.");
    } catch (e) {
      setMessage(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  function option<K extends keyof CalculationConfig>(
    key: K,
    value: CalculationConfig[K],
  ) {
    setConfig((c) => ({ ...c, [key]: value }));
  }
  async function openClient(id: string) {
    try {
      const r = await proRequest<{ client: Client }>(`/workspace?client=${id}`);
      setClient(r.client);
    } catch (e) {
      setMessage(errorMessage(e));
    }
  }
  function downloadClient() {
    if (!client) return;
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(client, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `pro-client-${client.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
  const title =
    section === "dashboard"
      ? "ඔබගේ ජෝතිෂ වැඩබිම"
      : section === "presets"
        ? "ඔබගේ ගණනය කිරීමේ ක්‍රම"
        : "ඔබේ ක්‍රමයට, ඔබේ සබැඳියක්";
  return (
    <Shell active={section}>
      <div className="pro-page-title">
        <div>
          <p className="pro-eyebrow">
            {section === "dashboard"
              ? "PRACTICE OVERVIEW"
              : section === "presets"
                ? "VERSIONED METHODS"
                : "INVITE · CALCULATE · SAVE"}
          </p>
          <h1>{title}</h1>
          <p className="pro-muted">
            {data?.profile.displayName || "ජෝතිෂ Pro"} · වෙන් වූ වෘත්තීය ගිණුම
          </p>
        </div>
        <button
          className="pro-secondary"
          onClick={async () => {
            try {
              await proRequest("/auth", { action: "logout" });
              window.location.assign(withBasePath("/pro/login"));
            } catch (e) {
              setMessage(errorMessage(e));
            }
          }}
        >
          ඉවත් වන්න
        </button>
      </div>
      {message && (
        <p className="pro-notice" role="status">
          {message}
        </p>
      )}
      {!data ? (
        <p className="pro-muted">වැඩබිම පූරණය වෙමින්…</p>
      ) : (
        <>
          {section === "dashboard" && (
            <>
              <div className="pro-stats">
                {[
                  [data.clients.length, "සේවාලාභී සටහන්"],
                  [data.presets.length, "ක්‍රම අනුවාද"],
                  [
                    data.links.filter(
                      (l) =>
                        !l.revoked &&
                        l.expiresAt > Date.now() &&
                        l.uses < l.maxUses,
                    ).length,
                    "සක්‍රීය සබැඳි",
                  ],
                ].map(([n, t]) => (
                  <div className="pro-card" key={t}>
                    <strong>{n}</strong>
                    <span>{t}</span>
                  </div>
                ))}
              </div>
              <div className="pro-work-grid">
                <section className="pro-card">
                  <p className="pro-eyebrow">CLIENT RECORDS</p>
                  <h2>සේවාලාභීන්</h2>
                  <p className="pro-small">
                    කැමැත්ත ලබා දුන් සටහන් පමණි. දින 90කින් ස්වයංක්‍රීයව ඉවත්
                    වේ. සියලු දින Asia/Colombo.
                  </p>
                  {!data.clients.length ? (
                    <div className="pro-empty">
                      තවම සටහන් නැත.
                      <a href={withBasePath("/pro/links")}>
                        පළමු සබැඳිය සාදන්න →
                      </a>
                    </div>
                  ) : (
                    <ul className="pro-list">
                      {data.clients.map((c, i) => (
                        <li key={c.id}>
                          <div>
                            <b>සේවාලාභී {String(i + 1).padStart(2, "0")}</b>
                            <small>
                              {localDate(c.createdAt)} · {c.lagna}
                            </small>
                          </div>
                          <button
                            className="pro-secondary"
                            onClick={() => openClient(c.id)}
                          >
                            විවෘත කරන්න
                          </button>
                          <a href={withBasePath(`/pro/cases?id=${c.id}`)}>විමර්ශනය දිගටම →</a>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
                <section className="pro-card">
                  <p className="pro-eyebrow">PROFESSIONAL PROFILE</p>
                  <h2>ඔබගේ පැතිකඩ</h2>
                  {profile && (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        mutate({ action: "profile", ...profile });
                      }}
                    >
                      <label>
                        පෙන්වන නම
                        <input
                          value={profile.displayName}
                          onChange={(e) =>
                            setProfile({
                              ...profile,
                              displayName: e.target.value,
                            })
                          }
                          required
                          minLength={2}
                          maxLength={100}
                        />
                      </label>
                      <label>
                        සුදුසුකම් · ස්වයං ප්‍රකාශිත
                        <textarea
                          value={profile.qualifications}
                          onChange={(e) =>
                            setProfile({
                              ...profile,
                              qualifications: e.target.value,
                            })
                          }
                          maxLength={500}
                        />
                      </label>
                      <label>
                        සම්බන්ධතා · පුද්ගලික
                        <input
                          value={profile.contact}
                          onChange={(e) =>
                            setProfile({ ...profile, contact: e.target.value })
                          }
                          maxLength={200}
                        />
                      </label>
                      <label>
                        ලාංඡනය · PNG / JPEG / WebP, 20 KB දක්වා
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (!f) return;
                            if (f.size > 20000) {
                              setMessage("Logo limit: 20 KB");
                              return;
                            }
                            const r = new FileReader();
                            r.onload = () =>
                              setProfile({
                                ...profile,
                                logo: String(r.result),
                              });
                            r.readAsDataURL(f);
                          }}
                        />
                      </label>
                      {profile.logo && (
                        <button
                          type="button"
                          className="pro-text-button"
                          onClick={() => setProfile({ ...profile, logo: "" })}
                        >
                          ලාංඡනය ඉවත් කරන්න
                        </button>
                      )}
                      <button className="pro-button" disabled={busy}>
                        පැතිකඩ සුරකින්න
                      </button>
                    </form>
                  )}
                </section>
              </div>
              {client && (
                <>
                  <div className="pro-inline">
                    <h2>සේවාලාභී සටහන · {localDate(client.createdAt)}</h2>
                    <button className="pro-secondary" onClick={downloadClient}>
                      පුද්ගලික පිටපත ලබාගන්න
                    </button>
                    <button
                      className="pro-danger"
                      disabled={busy}
                      onClick={() => {
                        if (
                          window.confirm(
                            "මෙම පුද්ගලික සටහන ස්ථිරව ඉවත් කරන්නද?",
                          )
                        ) {
                          mutate({ action: "deleteClient", id: client.id });
                          setClient(undefined);
                        }
                      }}
                    >
                      සටහන ඉවත් කරන්න
                    </button>
                  </div>
                  <Chart
                    result={client.result}
                    balance={client.manifest.balanceDisplay}
                  />
                </>
              )}
            </>
          )}
          {section === "presets" && (
            <div className="pro-work-grid">
              <section className="pro-card">
                <p className="pro-eyebrow">METHOD BUILDER</p>
                <h2>නව අනුවාදයක් සාදන්න</h2>
                <p className="pro-small">
                  සුරැකි අනුවාද වෙනස් නොවේ. ඒවාට බැඳුණු සබැඳි සහ පරණ කේන්ද්‍ර
                  මුල් ක්‍රමයම තබාගනී.
                </p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    mutate({ action: "preset", name: presetName, config });
                  }}
                >
                  <label>
                    ක්‍රමයේ නම
                    <input
                      value={presetName}
                      onChange={(e) => setPresetName(e.target.value)}
                      minLength={2}
                      maxLength={100}
                      required
                    />
                  </label>
                  <div className="pro-field-grid">
                    <label>
                      අයනාංශය
                      <select
                        value={config.ayanamsa}
                        onChange={(e) =>
                          option(
                            "ayanamsa",
                            e.target.value as CalculationConfig["ayanamsa"],
                          )
                        }
                      >
                        <option value="lahiri">Lahiri / චිත්‍රපක්ෂ</option>
                        <option value="raman">Raman</option>
                        <option value="kp_new">KP New</option>
                        <option disabled>
                          True Chitra · තවම පරීක්ෂා කර නැත
                        </option>
                      </select>
                    </label>
                    <label>
                      රාහු / කේතු
                      <select
                        value={config.nodes}
                        onChange={(e) =>
                          option("nodes", e.target.value as "mean" | "true")
                        }
                      >
                        <option value="mean">Mean node</option>
                        <option value="true">True node</option>
                      </select>
                    </label>
                    <label>
                      ඉර උදාව · සූර්ය තැටිය
                      <select
                        value={config.sunriseDisc}
                        onChange={(e) =>
                          option(
                            "sunriseDisc",
                            e.target.value as "centre" | "upper-limb",
                          )
                        }
                      >
                        <option value="upper-limb">
                          ඉහළ දාරය / upper limb
                        </option>
                        <option value="centre">මධ්‍යය / disc centre</option>
                      </select>
                    </label>
                    <label>
                      වර්තනය / Refraction
                      <select
                        value={String(config.sunriseRefraction)}
                        onChange={(e) =>
                          option("sunriseRefraction", e.target.value === "true")
                        }
                      >
                        <option value="true">සක්‍රීය · standard 34′</option>
                        <option value="false">අක්‍රීය</option>
                      </select>
                    </label>
                    <label>
                      දශා වසරක දිග
                      <select
                        value={config.dasaYearDays}
                        onChange={(e) =>
                          option(
                            "dasaYearDays",
                            Number(e.target.value) as 360 | 365.25,
                          )
                        }
                      >
                        <option value={365.25}>365.25 දින</option>
                        <option value={360}>360 දින</option>
                      </select>
                    </label>
                    <label>
                      දශා ශේෂය පෙන්වීම
                      <select
                        value={config.balanceDisplay}
                        onChange={(e) =>
                          option(
                            "balanceDisplay",
                            e.target
                              .value as CalculationConfig["balanceDisplay"],
                          )
                        }
                      >
                        <option value="years-months-days">
                          වසර / මාස / දින
                        </option>
                        <option value="decimal-years">දශම වසර</option>
                      </select>
                    </label>
                    <label>
                      භාව ක්‍රමය
                      <select value={config.houseSystem} onChange={() => {}}>
                        <option value="whole-sign">
                          Whole sign / රාශි භාව
                        </option>
                      </select>
                    </label>
                    <label>
                      නම් අක්ෂර වගුව
                      <select
                        value={config.nameLetterTable}
                        onChange={() => {}}
                      >
                        <option value="sinhala-v1">
                          Sinhala v1 · Hadahana
                        </option>
                      </select>
                    </label>
                  </div>
                  <p className="pro-small">
                    Standard horizon: සූර්ය අර්ධ විෂ්කම්භය 16′, වර්තනය 34′. කඳු
                    / උන්නතාංශ / කාලගුණ සකස් කිරීම් නැත. True Chitra, වෙනත් භාව
                    හා අක්ෂර වගු පරීක්ෂණයෙන් පසුව පමණි.
                  </p>
                  <button className="pro-button" disabled={busy}>
                    නව අනුවාදය සුරකින්න →
                  </button>
                </form>
              </section>
              <aside className="pro-card">
                <p className="pro-eyebrow">YOUR METHOD LIBRARY</p>
                <h2>සුරැකි ක්‍රම</h2>
                <ul className="pro-list">
                  {data.presets.map((p) => (
                    <li key={p.id}>
                      <div>
                        <b>
                          {p.name}{" "}
                          <span className="pro-pill">v{p.version}</span>
                        </b>
                        <small>
                          {p.config.ayanamsa} · {p.config.nodes} ·{" "}
                          {p.config.dasaYearDays}d
                        </small>
                      </div>
                      <button
                        className="pro-secondary"
                        onClick={() => {
                          setConfig({ ...p.config });
                          setPresetName(p.name);
                          setMessage(
                            "පිටපත සංස්කරණය කර නව අනුවාදයක් ලෙස සුරකින්න.",
                          );
                        }}
                      >
                        පිටපතක්
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="pro-notice">
                  Hadahana default ක්‍රමය පවතින සාමාන්‍ය Hadahana ප්‍රතිඵලම ලබා
                  දෙයි. මෙහි වෙනස්කම් සාමාන්‍ය පරිශීලකයන්ට බලපාන්නේ නැත.
                </div>
              </aside>
            </div>
          )}
          {section === "links" && (
            <div className="pro-work-grid">
              <section className="pro-card">
                <p className="pro-eyebrow">SHARE YOUR METHOD</p>
                <h2>නව සබැඳියක් සාදන්න</h2>
                <p className="pro-small">
                  මෙම සබැඳිය ඇති අයෙකුට පමණක් ඔබගේ ක්‍රමයෙන් කේන්ද්‍රයක් ගණනය කළ
                  හැක. සටහන් ඔබේ සේවාලාභී ලැයිස්තුවට එක් වේ.
                </p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setShareUrl("");
                    mutate({ action: "link", presetId, label, days, maxUses });
                  }}
                >
                  <label>
                    බැඳෙන ක්‍රමය
                    <select
                      value={presetId}
                      onChange={(e) => setPresetId(e.target.value)}
                      required
                    >
                      {data.presets.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} · v{p.version}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    පුද්ගලික ලේබලය · අනිවාර්ය නැත
                    <input
                      value={label}
                      onChange={(e) => setLabel(e.target.value)}
                      maxLength={100}
                      placeholder="උදා: නොවැම්බර් උපදේශන"
                    />
                  </label>
                  <div className="pro-field-grid">
                    <label>
                      කල් ඉකුත් වීම · දින
                      <input
                        type="number"
                        min={1}
                        max={90}
                        value={days}
                        onChange={(e) => setDays(Number(e.target.value))}
                        required
                      />
                    </label>
                    <label>
                      උපරිම භාවිත
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={maxUses}
                        onChange={(e) => setMaxUses(Number(e.target.value))}
                        required
                      />
                    </label>
                  </div>
                  <button className="pro-button" disabled={busy}>
                    සබැඳිය ජනනය කරන්න ↗
                  </button>
                </form>
                {shareUrl && (
                  <div className="pro-notice">
                    <label>
                      මෙය එක් වරක් පමණක් පෙන්වයි. ආරක්ෂිතව පිටපත් කරන්න.
                      <input
                        readOnly
                        value={shareUrl}
                        aria-label="Generated private link"
                        onFocus={(e) => e.target.select()}
                      />
                    </label>
                    <button
                      className="pro-secondary"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(shareUrl);
                          setMessage("පිටපත් කරන ලදි.");
                        } catch {
                          setMessage("සබැඳිය තෝරා අතින් පිටපත් කරන්න.");
                        }
                      }}
                    >
                      පිටපත් කරන්න
                    </button>
                  </div>
                )}
              </section>
              <section className="pro-card">
                <p className="pro-eyebrow">LINK CONTROL</p>
                <h2>ඔබගේ සබැඳි</h2>
                <p className="pro-small">
                  අසාර්ථක ගණනය කිරීම් ද භාවිතයක් ලෙස ගණන් ගනී. කේන්ද්‍ර ප්‍රතිඵල
                  සබැඳිය හරහා නැවත ප්‍රසිද්ධ නොවේ.
                </p>
                {!data.links.length ? (
                  <div className="pro-empty">
                    පළමු සබැඳිය සෑදීමට වම්පස පෝරමය භාවිත කරන්න.
                  </div>
                ) : (
                  <ul className="pro-list">
                    {data.links.map((l) => (
                      <li key={l.id}>
                        <div>
                          <b>{l.label || "ලේබලයක් නැති සබැඳිය"}</b>
                          <small>
                            {l.uses}/{l.maxUses} භාවිත ·{" "}
                            {localDate(l.expiresAt)} (Asia/Colombo)
                          </small>
                          <small>
                            {l.revoked
                              ? "අවලංගුයි"
                              : l.expiresAt <= Date.now() || l.uses >= l.maxUses
                                ? "අවසන්"
                                : "සක්‍රීයයි"}
                          </small>
                        </div>
                        <button
                          className="pro-danger"
                          disabled={busy || l.revoked}
                          onClick={() => mutate({ action: "revoke", id: l.id })}
                        >
                          අවලංගු කරන්න
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          )}
        </>
      )}
    </Shell>
  );
}
