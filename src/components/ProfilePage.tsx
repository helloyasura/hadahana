"use client";
import { useEffect, useState } from "react";
import { AccountPanel } from "./AccountPanel";
import { CosmicMark } from "./CosmicVisuals";
import { apiUrl, withBasePath } from "@/lib/base-path";
import type { Profile } from "@/lib/account/types";
export function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => { fetch(apiUrl("/api/account"), { cache: "no-store" }).then(r => r.json()).then(j => { if (j.ok) setProfile(j.profile); else setError(j.error); }).catch(() => setError("Unable to load your profile. Please try again.")).finally(() => setLoading(false)); }, []);
  return <div className="workspace profile-page"><div className="starfield" aria-hidden="true" /><nav className="studio-nav"><a className="studio-wordmark" href={withBasePath("/")}><CosmicMark /><span>HADAHANA<small>YOUR ASTRAL SPACE</small></span></a><a className="studio-nav-link" href={withBasePath("/")}>← Back to studio</a></nav>{error && <p className="error" role="alert">{error}</p>}{loading ? <p role="status">Connecting to your astral profile…</p> : <AccountPanel profile={profile} onProfile={setProfile} />}</div>;
}
