import { withBasePath } from "@/lib/base-path";
export async function proRequest<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(withBasePath(`/pro/api${path}`), {
    method: body === undefined ? "GET" : "POST",
    credentials: "same-origin",
    cache: "no-store",
    headers:
      body === undefined
        ? {}
        : { "Content-Type": "application/json", "x-jyotisha-pro": "1" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "ඉල්ලීම අසාර්ථකයි.");
  return data as T;
}
export const errorMessage = (e: unknown) =>
  e instanceof Error ? e.message : "නැවත උත්සාහ කරන්න.";
export function localDate(ms: number) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Colombo",
    dateStyle: "medium",
  }).format(ms);
}
