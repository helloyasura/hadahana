"use client";

import { useEffect, useMemo, useState } from "react";
import type { Lang } from "@/lib/i18n";
import { apiUrl } from "@/lib/base-path";

export type PlaceFormValue = {
  placeId: string;
  placeName: string;
  latitude: string;
  longitude: string;
  useCustomCoords: boolean;
};

export type PlaceOption = {
  id: string;
  label: string;
  labelSi?: string | null;
  kind: string;
  district?: string | null;
  latitude: number;
  longitude: number;
  address?: string | null;
};

type Props = {
  lang: Lang;
  value: PlaceFormValue;
  onChange: (next: PlaceFormValue) => void;
  labels: {
    place: string;
    search: string;
    address: string;
    customCoords: string;
    latitude: string;
    longitude: string;
    hospitals: string;
    cities: string;
    towns: string;
  };
};

export function PlaceFields({ lang, value, onChange, labels }: Props) {
  const [places, setPlaces] = useState<PlaceOption[]>([]);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch(apiUrl("/api/places"))
      .then((r) => r.json())
      .then((j) => {
        if (!cancelled && j.ok) setPlaces(j.places as PlaceOption[]);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const grouped = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const filtered = q
      ? places.filter((p) => {
          const hay = [
            p.id,
            p.label,
            p.labelSi ?? "",
            p.district ?? "",
            p.address ?? "",
          ]
            .join(" ")
            .toLowerCase();
          return hay.includes(q) || q.split(/\s+/).every((w) => hay.includes(w));
        })
      : places;
    return {
      hospitals: filtered.filter((p) => p.kind === "hospital"),
      cities: filtered.filter((p) => p.kind === "city"),
      towns: filtered.filter((p) => p.kind === "town"),
      total: filtered.length,
    };
  }, [places, filter]);

  const selected = places.find((p) => p.id === value.placeId);

  function selectPreset(id: string) {
    const p = places.find((x) => x.id === id);
    if (!p) {
      onChange({ ...value, placeId: id });
      return;
    }
    onChange({
      ...value,
      placeId: p.id,
      placeName: p.address || p.label,
      latitude: String(p.latitude),
      longitude: String(p.longitude),
      useCustomCoords: false,
    });
  }

  return (
    <div className="place-fields">
      <label className="place-search">
        <span>{labels.search}</span>
        <input
          type="search"
          value={filter}
          placeholder={
            lang === "si"
              ? "නගරය / රෝහල / ලිපිනය සොයන්න…"
              : "Search city / hospital / address…"
          }
          onChange={(e) => setFilter(e.target.value)}
        />
      </label>

      <label>
        <span>
          {labels.place}{" "}
          <em className="place-count">
            ({grouped.total}/{places.length})
          </em>
        </span>
        <select
          value={value.placeId === "custom" ? "custom" : value.placeId}
          onChange={(e) => {
            if (e.target.value === "custom") {
              onChange({
                ...value,
                placeId: "custom",
                useCustomCoords: true,
              });
              return;
            }
            selectPreset(e.target.value);
          }}
        >
          <option value="custom">
            {lang === "si"
              ? "— අතින් ඛණ්ඩාංක / ලිපිනය —"
              : "— Custom coordinates / address —"}
          </option>
          <optgroup label={labels.hospitals}>
            {grouped.hospitals.map((p) => (
              <option key={p.id} value={p.id}>
                {lang === "si" && p.labelSi ? p.labelSi : p.label}
                {p.district ? ` · ${p.district}` : ""}
              </option>
            ))}
          </optgroup>
          <optgroup label={labels.cities}>
            {grouped.cities.map((p) => (
              <option key={p.id} value={p.id}>
                {lang === "si" && p.labelSi ? p.labelSi : p.label}
                {p.district ? ` · ${p.district}` : ""}
              </option>
            ))}
          </optgroup>
          <optgroup label={labels.towns}>
            {grouped.towns.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
                {p.district ? ` · ${p.district}` : ""}
              </option>
            ))}
          </optgroup>
        </select>
      </label>

      <label>
        <span>{labels.address}</span>
        <input
          value={value.placeName}
          placeholder={
            lang === "si"
              ? "රෝහල් ලිපිනය හෝ උපන් ස්ථානය"
              : "Hospital address or birth place"
          }
          onChange={(e) =>
            onChange({
              ...value,
              placeName: e.target.value,
              placeId: value.useCustomCoords ? "custom" : value.placeId,
            })
          }
        />
      </label>

      <label className="place-custom-toggle">
        <input
          type="checkbox"
          checked={value.useCustomCoords}
          onChange={(e) =>
            onChange({
              ...value,
              useCustomCoords: e.target.checked,
              placeId: e.target.checked ? "custom" : value.placeId || "colombo",
            })
          }
        />
        <span>{labels.customCoords}</span>
      </label>

      <div className="place-coords">
        <label>
          <span>{labels.latitude}</span>
          <input
            type="number"
            step="any"
            inputMode="decimal"
            value={value.latitude}
            disabled={!value.useCustomCoords && Boolean(selected)}
            onChange={(e) =>
              onChange({
                ...value,
                latitude: e.target.value,
                useCustomCoords: true,
                placeId: "custom",
              })
            }
          />
        </label>
        <label>
          <span>{labels.longitude}</span>
          <input
            type="number"
            step="any"
            inputMode="decimal"
            value={value.longitude}
            disabled={!value.useCustomCoords && Boolean(selected)}
            onChange={(e) =>
              onChange({
                ...value,
                longitude: e.target.value,
                useCustomCoords: true,
                placeId: "custom",
              })
            }
          />
        </label>
      </div>

      {selected && !value.useCustomCoords ? (
        <p className="place-hint muted">
          {selected.address ? `${selected.address} · ` : ""}
          {selected.latitude.toFixed(5)}°N, {selected.longitude.toFixed(5)}°E
        </p>
      ) : null}
    </div>
  );
}

export function emptyPlaceForm(
  placeId = "asiri-kandy",
  lat = "7.2744",
  lon = "80.61115",
): PlaceFormValue {
  return {
    placeId,
    placeName: "",
    latitude: lat,
    longitude: lon,
    useCustomCoords: false,
  };
}

export function placePayload(place: PlaceFormValue) {
  const lat = Number(place.latitude);
  const lon = Number(place.longitude);
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lon);
  const custom =
    place.useCustomCoords || place.placeId === "custom" || !place.placeId;

  if (custom && hasCoords) {
    return {
      placeId: undefined as string | undefined,
      placeName: place.placeName || undefined,
      latitude: lat,
      longitude: lon,
    };
  }

  return {
    placeId: place.placeId || undefined,
    placeName: place.placeName || undefined,
    latitude: hasCoords ? lat : undefined,
    longitude: hasCoords ? lon : undefined,
  };
}
