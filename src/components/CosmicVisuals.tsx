"use client";

import { useEffect } from "react";

/** Pure vector ornament inspired by the layered petals of a Sinhala lotus. */
export function CosmicMark() {
  return (
    <svg
      className="cosmic-mark"
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
    >
      <path d="M24 3C32 14 32 21 24 29C16 21 16 14 24 3Z" />
      <path d="M4 19C17 16 25 21 24 34C11 34 6 29 4 19ZM44 19C31 16 23 21 24 34C37 34 42 29 44 19Z" />
      <path d="M8 35Q24 47 40 35M24 29V44M2 10H10M6 6V14M38 8H46M42 4V12" />
      <circle cx="24" cy="24" r="2" fill="currentColor" stroke="none" />
    </svg>
  );
}

const zodiac = [
  "♈",
  "♉",
  "♊",
  "♋",
  "♌",
  "♍",
  "♎",
  "♏",
  "♐",
  "♑",
  "♒",
  "♓",
];

/** Decorative atlas, not a representation of the user's calculated chart. */
export function AstralWheel() {
  return (
    <svg
      className="astral-wheel"
      viewBox="0 0 600 600"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="moon-light" cx="35%" cy="30%" r="75%">
          <stop stopColor="#fff4cd" />
          <stop offset=".5" stopColor="#dfb975" />
          <stop offset="1" stopColor="#80603d" />
        </radialGradient>
        <radialGradient id="atlas-halo">
          <stop stopColor="#9e74ff" stopOpacity=".23" />
          <stop offset="1" stopColor="#9e74ff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="300" cy="300" r="280" fill="url(#atlas-halo)" stroke="none" />
      <g className="atlas-ticks">
        <circle cx="300" cy="300" r="264" />
        <circle cx="300" cy="300" r="252" />
        {Array.from({ length: 72 }, (_, i) => (
          <path
            key={i}
            transform={`rotate(${i * 5} 300 300)`}
            d={i % 6 === 0 ? "M300 36V53" : "M300 36V42"}
          />
        ))}
      </g>
      <g className="zodiac-ring">
        <circle cx="300" cy="300" r="228" />
        <circle cx="300" cy="300" r="186" />
        {zodiac.map((sign, i) => (
          <g key={sign} transform={`rotate(${i * 30} 300 300)`}>
            <path d="M300 72V114" />
            <text
              x="300"
              y="100"
              transform="rotate(15 300 300)"
              textAnchor="middle"
            >{`${sign}\uFE0E`}</text>
          </g>
        ))}
      </g>
      <g className="constellation-draw">
        <path d="M187 202L360 153L433 304L353 437L183 374L187 202L353 437L360 153L183 374L433 304L187 202" />
        {[
          [187, 202],
          [360, 153],
          [433, 304],
          [353, 437],
          [183, 374],
        ].map(([x, y]) => (
          <circle key={x} cx={x} cy={y} r="3" fill="currentColor" />
        ))}
      </g>
      <g className="planet-orbits">
        {[94, 132, 165].map((r) => (
          <circle key={r} cx="300" cy="300" r={r} />
        ))}
        {Array.from({ length: 9 }, (_, i) => (
          <g key={i} className={`planet planet-${i}`}>
            <circle
              cx="300"
              cy={300 - [94, 132, 165][i % 3]}
              r={i % 3 === 0 ? 5 : 3}
              fill={i % 2 === 0 ? "#e9c888" : "#83e8ec"}
              stroke="none"
            />
          </g>
        ))}
      </g>
      <g className="atlas-moon">
        <circle cx="300" cy="300" r="61" stroke="#ebc989" strokeOpacity=".2" />
        <circle
          cx="300"
          cy="300"
          r="52"
          fill="url(#moon-light)"
          stroke="#f7dc9f"
        />
        <g fill="#70583f" fillOpacity=".13" stroke="none">
          <circle cx="284" cy="279" r="12" />
          <circle cx="317" cy="309" r="17" />
          <circle cx="278" cy="318" r="7" />
          <circle cx="316" cy="275" r="5" />
        </g>
        <path
          d="M300 225V232M300 368V375M225 300H232M368 300H375"
          stroke="#f0cd89"
        />
      </g>
      <path
        className="atlas-crosshair"
        d="M32 300H60M540 300H568M300 16V28M300 572V584"
      />
    </svg>
  );
}

/** Progressive enhancement: content remains visible without JS or an observer. */
export function RevealObserver() {
  useEffect(() => {
    if (
      !window.IntersectionObserver ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.remove("reveal-pending");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.06 },
    );
    document.querySelectorAll(".reveal").forEach((node) => {
      // Never hide content already in the viewport, including after hydration.
      if (node.getBoundingClientRect().top > window.innerHeight) {
        node.classList.add("reveal-pending");
        observer.observe(node);
      }
    });
    return () => {
      observer.disconnect();
      document
        .querySelectorAll(".reveal-pending")
        .forEach((node) => node.classList.remove("reveal-pending"));
    };
  }, []);
  return null;
}
