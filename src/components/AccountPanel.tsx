"use client";
import { useState, type FormEvent } from "react";
import type { Profile } from "@/lib/account/types";
import { apiUrl } from "@/lib/base-path";
import type { Lang } from "@/lib/i18n";

export function AccountPanel({ profile, onProfile, lang = "en", hasPreview = false, onOpen }: {
  profile: Profile | null; onProfile: (profile: Profile | null) => void; lang?: Lang; hasPreview?: boolean; onOpen?: (id: string) => void;
}) {
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const si = lang === "si";
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const fields = new FormData(event.currentTarget);
    try {
      const res = await fetch(apiUrl("/api/account"), { method: "POST", headers: { "Content-Type": "application/json", "X-Hadahana-Action": "1" }, body: JSON.stringify({ action: mode, name: fields.get("name") || undefined, email: fields.get("email"), password: fields.get("password") }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Unable to sign in");
      onProfile(json.profile);
      if (hasPreview && json.profile?.license.active && json.pendingSaved && json.horoscopeId) onOpen?.(json.horoscopeId);
    } catch(e) { setError(e instanceof Error ? e.message : "Unable to sign in"); } finally { setBusy(false); }
  }
  async function logout() {
    const res = await fetch(apiUrl("/api/account"), { method: "POST", headers: { "Content-Type": "application/json", "X-Hadahana-Action": "1" }, body: JSON.stringify({ action: "logout" }) });
    if (res.ok) onProfile(null); else setError("Unable to sign out. Try again.");
  }
  return <section className="panel account-panel no-print" id="account-panel" aria-labelledby="profile-title" data-ph-no-capture>
    <div className="section-heading"><div><span className="section-index">03 / YOUR CELESTIAL IDENTITY</span><h2 id="profile-title">{profile ? (si ? "ඔබේ පැතිකඩ" : "Your astral profile") : (si ? "ඔබේ හඳහන සමඟ රැඳෙන්න" : "Your stars. Your space.")}</h2></div><span className="profile-sigil" aria-hidden="true">✧</span></div>
    {profile ? <>
      <div className="profile-overview"><div><h3>{profile.name}</h3><p className="muted">{profile.email}</p><p>{si ? "ඔබේ LUMS ගිණුමට සම්බන්ධයි" : "Connected to your LUMS portal account"}</p></div>
        <div className={`license-card ${profile.license.active ? "is-active" : "is-expired"}`}><span className="status-dot" /><strong>{profile.license.active ? profile.license.status === "trial" ? (si ? "නොමිලේ අත්හදා බැලීම" : "Free trial active") : "License active" : (si ? "බලපත්‍රය අවසන්" : "License required")}</strong><span className="trial-count">{profile.license.daysLeft ?? "∞"}<small>{si ? "දින ඉතිරි" : "days remaining"}</small></span>
          <p>{profile.license.expiresAt ? `${si ? "අවසන් දිනය" : "Access until"}: ${new Date(profile.license.expiresAt).toLocaleDateString("en-GB", { timeZone: "Asia/Colombo" })} (Asia/Colombo)` : "No expiry"}</p></div></div>
      {!profile.license.active && <p className="license-warning">{si ? "හඳහන් විශේෂාංග නැවත ලබා ගැනීමට LUMS තුළ බලපත්‍රයක් මිලදී ගන්න. ඔබේ පැතිකඩ හා උපන් විස්තර මෙහි රැඳේ." : "Your profile and birth details stay here. Buy or renew a license in LUMS to unlock horoscope tools again."}</p>}
      <div className="account-actions"><a className="primary" href="https://lums.ervanta.com/portal" target="_blank" rel="noopener noreferrer">{si ? "බලපත්‍රය මිලදී ගන්න / අලුත් කරන්න ↗" : "Buy / renew in LUMS ↗"}</a><button type="button" className="ghost" onClick={() => window.location.reload()}>{si ? "බලපත්‍රය නැවත බලන්න" : "Refresh license"}</button><button type="button" className="ghost" onClick={logout}>{si ? "ඉවත් වන්න" : "Sign out"}</button></div>
      <h3>{si ? "සුරැකි හඳහන්" : "Saved horoscopes"} <span className="muted">/ {profile.horoscopes.length}</span></h3>
      <div className="saved-grid">{profile.horoscopes.map(h => <article className="saved-horoscope" key={h.id}><span aria-hidden="true">✦</span><h4>{String(h.birth.nativeName || (si ? "මගේ හඳහන" : "My horoscope"))}</h4><p>{String(h.birth.date)} · {String(h.birth.time)}</p><p className="muted">{String(h.birth.placeName || h.birth.placeId || "Birth location saved")}</p><button className="ghost" type="button" disabled={!profile.license.active} onClick={() => onOpen ? onOpen(h.id) : window.location.assign(apiUrl(`/?horoscope=${encodeURIComponent(h.id)}`))}>{si ? "හඳහන විවෘත කරන්න ↗" : "Open horoscope ↗"}</button></article>)}</div>
      {!profile.horoscopes.length && <p className="muted">{si ? "පළමුව හඳහනක් සාදන්න." : "Generate your first horoscope to unlock the studio and save your birth details here."}</p>}
    </> : <div className="account-split"><div className="account-story"><span className="trial-badge">20 {si ? "දින නොමිලේ" : "DAYS FREE"}</span><p>{si ? "හඳහන සාදා අවසන්. බාගත කිරීමට සහ සියලු මෙවලම් සඳහා නොමිලේ ලියාපදිංචි වන්න." : hasPreview ? "Your preview is ready. Create a free profile to keep it, download your full horoscope and explore every studio tool." : "Create a profile, generate your horoscope and keep your birth details in one private space."}</p><ul><li>{si ? "සුරැකි හඳහන් සහ උපන් විස්තර" : "Saved horoscopes & birth details"}</li><li>{si ? "PDF / මුද්‍රණය, නම්, පොරොන්දම් සහ තවත්" : "PDF / print, names, compatibility & more"}</li><li>{si ? "දින 20 පසු LUMS හරහා බලපත්‍රය අලුත් කරන්න" : "After 20 days, buy or renew through LUMS"}</li></ul><small>{si ? "කාඩ්පතක් අවශ්‍ය නැත. ස්වයංක්‍රීය අය කිරීමක් නැත." : "No card required. No automatic billing. Same sign-in works in LUMS."}</small></div>
      <form onSubmit={submit} className="account-form"><div className="account-mode" role="group" aria-label="Account action"><button type="button" className={mode === "signup" ? "active" : "ghost"} onClick={() => setMode("signup")}>{si ? "ලියාපදිංචි වන්න" : "Create profile"}</button><button type="button" className={mode === "login" ? "active" : "ghost"} onClick={() => setMode("login")}>{si ? "ඇතුළු වන්න" : "Sign in"}</button></div>
      {mode === "signup" && <label><span>{si ? "නම" : "Profile name"}</span><input name="name" autoComplete="name" required maxLength={120} /></label>}
      <label><span>{si ? "ඊමේල් ලිපිනය" : "Email address"}</span><input name="email" type="email" autoComplete="email" required maxLength={254} /></label>
      <label><span>{si ? "මුරපදය" : "Password"}</span><input name="password" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} required minLength={8} maxLength={72} /></label>
      {mode === "signup" && <small>{si ? "අවම අක්ෂර 8, ඉංග්‍රීසි ලොකු/කුඩා අකුරු හා අංකයක්." : "At least 8 characters, with uppercase, lowercase and a number."}</small>}
      <button className="primary" type="submit" disabled={busy}>{busy ? (si ? "සම්බන්ධ වෙමින්…" : "Connecting…") : mode === "signup" ? (si ? "දින 20 නොමිලේ අරඹන්න ↗" : "Start my 20 free days ↗") : (si ? "ඇතුළු වන්න ↗" : "Sign in ↗")}</button></form></div>}
    {error && <p className="error" role="alert">{error}</p>}
  </section>;
}
