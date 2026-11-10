"use client";
import { useState } from "react";
import { withBasePath } from "@/lib/base-path";
import Shell from "./Shell";
import { errorMessage, proRequest } from "./client";
export default function Login({ register = false }: { register?: boolean }) {
  const [email, setEmail] = useState(""),
    [name, setName] = useState(""),
    [code, setCode] = useState("");
  const [pending, setPending] = useState(false),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      if (pending) {
        await proRequest("/auth", { action: "verify", code });
        window.location.assign(withBasePath("/pro"));
      } else {
        await proRequest("/auth", {
          action: "start",
          email,
          displayName: register ? name : "Pro astrologer",
          intent: register ? "register" : "login",
        });
        setPending(true);
        setMessage(
          "ඔබගේ ඊමේල් වෙත යැවූ කේතය ඇතුළත් කරන්න. එය මිනිත්තු 10කින් කල් ඉකුත් වේ.",
        );
      }
    } catch (e) {
      setMessage(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Shell>
      <div className="pro-auth-grid">
        <section className="pro-intro">
          <p className="pro-eyebrow">YOUR METHOD. YOUR WORKSPACE.</p>
          <h1>
            ඔබගේ දැනුමට
            <br />
            <em>වෙන් වූ වැඩබිමක්.</em>
          </h1>
          <p>
            ඔබේ ගණනය කිරීමේ ක්‍රම සුරකින්න. සේවාලාභීන්ට ඔබේම සබැඳියක් ලබා දෙන්න.
            සෑම කේන්ද්‍රයකම ක්‍රමය පැහැදිලිව තබන්න.
          </p>
          <div className="pro-orbit" aria-hidden="true">
            <span>✧</span>
            <i />
            <b>ජෝතිෂ Pro</b>
          </div>
          <div className="pro-feature-strip">
            <span>01 · වෙනම Pro ගිණුම</span>
            <span>02 · අනුවාද සහිත ක්‍රම</span>
            <span>03 · පුද්ගලික සේවාලාභීන්</span>
          </div>
        </section>
        <section className="pro-card pro-auth-card">
          <p className="pro-eyebrow">
            {register ? "CREATE YOUR PRACTICE" : "WELCOME BACK"}
          </p>
          <h2>{register ? "Pro ලියාපදිංචිය" : "Pro ගිණුමට පිවිසෙන්න"}</h2>
          <p className="pro-muted">
            Hadahana සාමාන්‍ය ගිණුමෙන් වෙන් වූ, ඊමේල් කේතයක් මඟින් ආරක්ෂිත
            පිවිසුමක්.
          </p>
          <form onSubmit={submit}>
            {!pending ? (
              <>
                {register && (
                  <label>
                    පෙන්වන නම
                    <input
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      minLength={2}
                      maxLength={100}
                      required
                      placeholder="ජෝතිෂ්‍යවේදියාගේ නම"
                    />
                  </label>
                )}
                <label>
                  ඊමේල් ලිපිනය
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    maxLength={254}
                    placeholder="you@example.com"
                  />
                </label>
              </>
            ) : (
              <label>
                අංක 6 සත්‍යාපන කේතය
                <input
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  autoFocus
                />
              </label>
            )}
            <button className="pro-button" disabled={busy}>
              {busy
                ? "රැඳී සිටින්න…"
                : pending
                  ? "සත්‍යාපනය කර පිවිසෙන්න →"
                  : "ඊමේල් කේතය ලබාගන්න →"}
            </button>
            {pending && (
              <button
                type="button"
                className="pro-text-button"
                onClick={() => {
                  setPending(false);
                  setCode("");
                }}
              >
                ඊමේල් වෙනස් කරන්න / නව කේතයක්
              </button>
            )}
          </form>
          {message && (
            <p role="status" className="pro-notice">
              {message}
            </p>
          )}
          <p className="pro-muted pro-auth-switch">
            {register ? "දැනටමත් ගිණුමක් තිබේද?" : "වෙනම Pro ගිණුමක් අවශ්‍යද?"}{" "}
            <a href={withBasePath(register ? "/pro/login" : "/pro/register")}>
              {register ? "පිවිසෙන්න" : "ලියාපදිංචි වන්න"}
            </a>
          </p>
          <div className="pro-divider" />
          <p className="pro-small">
            දින 20ක අත්හදා බැලීම සහ JYOTISHA_PRO බලපත්‍රය LUMS මඟින් කළමනාකරණය
            වේ. මෙම private pilot සඳහා upstream සම්බන්ධතාව අවශ්‍යයි.
          </p>
        </section>
      </div>
    </Shell>
  );
}
