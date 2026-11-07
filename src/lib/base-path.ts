/**
 * Public URL prefix when mounted under ervanta.com/hadahana (or local `/`).
 * Set NEXT_PUBLIC_BASE_PATH at build time (Docker ARG).
 */
export const BASE_PATH = (process.env.NEXT_PUBLIC_BASE_PATH || "").replace(
  /\/$/,
  "",
);

/** Prefix an app-relative path for fetch / links under basePath. */
export function withBasePath(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  if (!BASE_PATH) return p;
  if (p === BASE_PATH || p.startsWith(`${BASE_PATH}/`)) return p;
  return `${BASE_PATH}${p}`;
}

/** API helper: `/api/...` → `/hadahana/api/...` when basePath is set. */
export function apiUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return withBasePath(p.startsWith("/api") ? p : `/api${p}`);
}
