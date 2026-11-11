"use client";
import {
  aspectBetween,
  NAKSHATRAS,
  positionInfo,
  RASHIS,
  type StudioBody,
  type StudioSettings,
} from "@/lib/pro/studio";
export const point = (longitude: number, radius: number) => ({
  x: 320 + radius * Math.sin((longitude * Math.PI) / 180),
  y: 320 - radius * Math.cos((longitude * Math.PI) / 180),
});
export function bodyDescription(body: StudioBody) {
  const p = positionInfo(body.longitude);
  return `${body.label} · ${body.name} · ${p.longitude.toFixed(4)}° · ${RASHIS[p.sign]} ${p.degree.toFixed(2)}° · ${NAKSHATRAS[p.nakshatra]} / ${p.pada} · ${body.retrograde ? "වක්‍ර / Retrograde" : "Direct"} · ${body.dignity}`;
}
export default function StudioWheel({
  bodies,
  asc,
  settings,
  selected,
  onSelect,
}: {
  bodies: StudioBody[];
  asc: number;
  settings: StudioSettings;
  selected: string;
  onSelect: (name: string) => void;
}) {
  const active = bodies.find((b) => b.name === selected);
  return (
    <svg
      className="studio-wheel"
      viewBox="0 0 640 640"
      role="group"
      aria-label={`Sidereal zodiac wheel D${settings.division}; zero Aries at top, clockwise`}
    >
      <defs>
        <radialGradient id="studio-glow">
          <stop stopColor="#203c4d" />
          <stop offset="1" stopColor="#0d1729" />
        </radialGradient>
      </defs>
      <circle
        cx="320"
        cy="320"
        r="306"
        fill="url(#studio-glow)"
        stroke="#345568"
      />
      {[198, 236, 268, 304].map((r) => (
        <circle key={r} cx="320" cy="320" r={r} fill="none" stroke="#345568" />
      ))}
      {settings.nakshatras &&
        Array.from({ length: 108 }, (_, i) => {
          const a = point((i * 360) / 108, i % 4 ? 295 : 270),
            b = point((i * 360) / 108, 304);
          return (
            <line
              key={i}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={i % 4 ? "#45616c" : "#7de5db"}
              strokeWidth={i % 4 ? 0.6 : 1}
            >
              <title>
                {NAKSHATRAS[Math.floor(i / 4)]} · පාද {(i % 4) + 1}
              </title>
            </line>
          );
        })}
      {settings.nakshatras &&
        NAKSHATRAS.map((name, i) => {
          const angle = ((i + 0.5) * 360) / 27,
            p = point(angle, 284);
          return (
            <text
              key={name}
              x={p.x}
              y={p.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="studio-nak-label"
              transform={`rotate(${angle > 90 && angle < 270 ? angle + 180 : angle}, ${p.x}, ${p.y})`}
            >
              <title>
                {name} · {((i * 360) / 27).toFixed(2)}°–
                {(((i + 1) * 360) / 27).toFixed(2)}°
              </title>
              {name}
            </text>
          );
        })}
      {RASHIS.map((name, i) => {
        const a = point(i * 30, 198),
          b = point(i * 30, 268),
          p = point(i * 30 + 15, 251);
        return (
          <g key={name}>
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#577984" />
            <text
              x={p.x}
              y={p.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="studio-sign-label"
            >
              {name}
            </text>
          </g>
        );
      })}
      {Array.from({ length: 12 }, (_, i) => {
        const start =
          settings.houses === "equal" ? asc : Math.floor(asc / 30) * 30;
        const a = point(start + i * 30, 80),
          b = point(start + i * 30, 198),
          p = point(start + i * 30 + 15, 92);
        return (
          <g key={i}>
            <line
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="#375267"
              strokeDasharray="2 5"
            />
            <text
              x={p.x}
              y={p.y}
              textAnchor="middle"
              className="studio-house-label"
            >
              {i + 1}
            </text>
          </g>
        );
      })}
      {active &&
        bodies
          .filter(
            (b) =>
              b.name !== active.name &&
              aspectBetween(active, b, settings.aspects, settings.orb),
          )
          .map((b) => {
            const a = point(active.longitude, 170),
              p = point(b.longitude, 170);
            return (
              <line
                key={b.name}
                x1={a.x}
                y1={a.y}
                x2={p.x}
                y2={p.y}
                stroke="#bc9ce7"
                strokeWidth="1.5"
                strokeDasharray="5 5"
              >
                <title>
                  {active.name} → {b.name} · {settings.aspects}
                </title>
              </line>
            );
          })}
      <circle cx="320" cy="320" r="61" fill="#101e31" stroke="#345568" />
      <text x="320" y="312" textAnchor="middle" className="studio-center">
        D{settings.division}
      </text>
      <text x="320" y="335" textAnchor="middle" className="studio-house-label">
        {settings.division === 1 ? "SIDEREAL SKY" : "NAVAMSA MAP"}
      </text>
      {bodies.map((b, i) => {
        const p = point(b.longitude, 150 + (i % 3) * 24),
          tick = point(b.longitude, 235),
          end = point(b.longitude, 224);
        return (
          <g key={b.name}>
            <line
              x1={tick.x}
              y1={tick.y}
              x2={p.x}
              y2={p.y}
              stroke={selected === b.name ? "#f0c787" : "#466873"}
              strokeWidth=".8"
            />
            <line
              x1={tick.x}
              y1={tick.y}
              x2={end.x}
              y2={end.y}
              stroke="#f0c787"
              strokeWidth="2"
            />
            <g
              role="button"
              tabIndex={0}
              aria-label={bodyDescription(b)}
              aria-pressed={selected === b.name}
              onClick={() => onSelect(b.name)}
              onFocus={() => onSelect(b.name)}
              onMouseEnter={() => onSelect(b.name)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(b.name);
                }
              }}
              className={`studio-planet ${selected === b.name ? "is-selected" : ""}`}
              style={{ transform: `translate(${p.x}px, ${p.y}px)` }}
            >
              <title>{bodyDescription(b)}</title>
              <circle r="17" />
              <text textAnchor="middle" dominantBaseline="middle">
                {b.name.slice(0, 2)}
                {b.retrograde ? "℞" : ""}
              </text>
            </g>
          </g>
        );
      })}
    </svg>
  );
}
