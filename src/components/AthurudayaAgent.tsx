"use client";

import { useState, useTransition } from "react";
import type { Lang } from "@/lib/i18n";
import { apiUrl } from "@/lib/base-path";

type Msg = { role: "user" | "assistant"; content: string };

type Birth = {
  date: string;
  time: string;
  placeId?: string;
  placeName?: string;
  latitude?: number;
  longitude?: number;
  gender: string;
  nativeName?: string;
};

const TOPICS: Array<{ id: string; si: string; en: string }> = [
  { id: "naming", si: "නම් තැබීම", en: "Naming" },
  { id: "studies", si: "අධ්‍යාපනය / ඉගෙනුම", en: "Studies" },
  { id: "career", si: "රැකියා / ජීවිකාව", en: "Career" },
  { id: "muhurta", si: "මුහුර්ත", en: "Muhurta" },
  { id: "general_palapala", si: "පලාපල", en: "Palapala" },
  { id: "marriage", si: "පොරොන්දම්", en: "Porondam" },
];

export function AthurudayaAgent({
  lang,
  birth,
}: {
  lang: Lang;
  birth: Birth;
}) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [topic, setTopic] = useState<string | null>("studies");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [toolsUsed, setToolsUsed] = useState<string[]>([]);

  function send(text: string) {
    const content = text.trim();
    if (!content || pending) return;
    setError(null);
    const next: Msg[] = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    startTransition(async () => {
      try {
        const res = await fetch(apiUrl("/api/agent/chat"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: next,
            birth: {
              date: birth.date,
              time: birth.time,
              placeId: birth.placeId,
              placeName: birth.placeName,
              latitude: birth.latitude,
              longitude: birth.longitude,
              gender: birth.gender,
              nativeName: birth.nativeName || undefined,
            },
            topic,
          }),
        });
        const json = await res.json();
        if (!json.ok && json.error) throw new Error(json.error);
        setMessages([
          ...next,
          { role: "assistant", content: json.reply || "(empty)" },
        ]);
        setToolsUsed(
          (json.toolCalls as Array<{ name: string }> | undefined)?.map(
            (t) => t.name,
          ) ?? [],
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  }

  return (
    <section className="agent-panel">
      <header className="agent-head">
        <h2>
          {lang === "si"
            ? "ආතුරුදය නියෝජිතයා (AI)"
            : "Athurudaya Agent (AI)"}
        </h2>
        <p>
          {lang === "si"
            ? "ගණනය මුලින් · RAG පර්යේෂණ · තීරණ / ඉගෙනුම් / රැකියා නිරීක්ෂණ. නියත විපාක නොවේ."
            : "Calc-first · research RAG · decision / studies / career findings. Not fixed fate."}
        </p>
      </header>

      <div className="agent-topics">
        {TOPICS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={topic === t.id ? "active" : ""}
            onClick={() => setTopic(t.id)}
          >
            {lang === "si" ? t.si : t.en}
          </button>
        ))}
      </div>

      <div className="agent-thread">
        {messages.length === 0 ? (
          <p className="muted">
            {lang === "si"
              ? "උදා: “මේ දරුවාට ඉගෙනුම් පැත්තෙන් මොනවද කියන්නේ? නමට අකුරුත් කියන්න.”"
              : "E.g. “What does this chart suggest for studies? Also naming letters.”"}
          </p>
        ) : null}
        {messages.map((m, i) => (
          <div key={`${m.role}-${i}`} className={`agent-msg ${m.role}`}>
            <span className="agent-role">
              {m.role === "user"
                ? lang === "si"
                  ? "ඔබ"
                  : "You"
                : lang === "si"
                  ? "ආතුරුදය"
                  : "Athurudaya"}
            </span>
            <div className="agent-body">{m.content}</div>
          </div>
        ))}
        {pending ? (
          <p className="muted">
            {lang === "si" ? "ගණනය කරමින්…" : "Computing & reasoning…"}
          </p>
        ) : null}
      </div>

      {toolsUsed.length ? (
        <p className="agent-tools">
          tools: {toolsUsed.join(" · ")}
        </p>
      ) : null}
      {error ? <p className="error">{error}</p> : null}

      <form
        className="agent-compose"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <textarea
          rows={3}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            lang === "si"
              ? "ප්‍රශ්නය ලියන්න…"
              : "Ask for findings, studies, naming…"
          }
        />
        <button type="submit" className="primary" disabled={pending}>
          {lang === "si" ? "විමසන්න" : "Ask"}
        </button>
      </form>
    </section>
  );
}
