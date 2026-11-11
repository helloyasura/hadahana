import { withBasePath } from "@/lib/base-path";
import {
  parseProLimitFields,
  type ProLimitDetails,
} from "@/lib/pro/limits";
export class ProClientError extends Error {
  status: number;
  reason?: string;
  retryAfterSeconds?: number;
  limit?: number;
  constructor(message: string, status: number, details?: ProLimitDetails) {
    super(message);
    this.status = status;
    this.reason = details?.reason;
    this.retryAfterSeconds = details?.retryAfterSeconds;
    this.limit = details?.limit;
  }
}
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
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const details = parseProLimitFields(data, res.headers.get("retry-after"));
    throw new ProClientError(
      (data && typeof data === "object" && "error" in data
        ? String((data as { error?: unknown }).error || "")
        : "") || "ඉල්ලීම අසාර්ථකයි.",
      res.status,
      details,
    );
  }
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
