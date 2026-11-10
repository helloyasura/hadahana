// Privacy-preserving sanitizer for posthog-js `before_send`.
// posthog-js places the public project API key on event.properties.token.
// Dropping it makes https://us.i.posthog.com/e/ return 401
// "event submitted without an api_key".

export type PosthogCaptureEvent = {
  uuid?: string;
  event?: string;
  properties?: Record<string, unknown>;
  $set?: Record<string, unknown>;
  $set_once?: Record<string, unknown>;
  timestamp?: Date | string | number;
  $sent_at?: Date | string | number;
};

export type SanitizeContext = {
  origin: string;
  path: string;
  app: string;
};

/** Product properties we intentionally collect after consent. */
export const propertyKeys = new Set([
  'app',
  'tool',
  'product_slug',
  'category',
  'result_count',
  'query_length',
  'step',
  'method',
  'language',
  'mode',
  'paper',
  'action',
  'source',
  'page_path',
]);

/**
 * Internal posthog-js envelope fields required for ingestion and session
 * correlation. `token` is the public project API key, not a user or auth token.
 */
export const sdkPropertyKeys = new Set([
  'token',
  'distinct_id',
  '$device_id',
  '$user_id',
  '$session_id',
  '$window_id',
  '$lib',
  '$lib_version',
  '$insert_id',
  '$time',
  '$sent_at',
  '$is_identified',
  '$anon_distinct_id',
  '$process_person_profile',
  '$event_type',
  '$config_defaults',
  '$groups',
]);

const SAFE_STRING = /^[a-zA-Z0-9_./#:-]{1,120}$/;
const SAFE_KEY = /^[a-zA-Z0-9_$]{1,80}$/;

export const cleanProps = (props: Record<string, unknown>): Record<string, string | number | boolean> => {
  const out: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(props)) {
    if (!propertyKeys.has(key)) continue;
    if (typeof value === 'number' || typeof value === 'boolean' || (typeof value === 'string' && SAFE_STRING.test(value))) {
      out[key] = value;
    }
  }
  return out;
};

function stripUrlQuery(value: string): string | undefined {
  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return undefined;
    // Drop search params, and query strings that live in the hash (e.g. /#/page?q=1).
    let hash = url.hash;
    if (hash) {
      const queryAt = hash.indexOf('?');
      if (queryAt !== -1) hash = hash.slice(0, queryAt);
    }
    return url.origin + url.pathname + hash;
  } catch {
    return undefined;
  }
}

export function sanitizePersonProps(
  input: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  if (!input || typeof input !== 'object') return undefined;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (!SAFE_KEY.test(key)) continue;
    if (/referrer/i.test(key)) {
      out[key] = '';
      continue;
    }
    if (typeof value === 'boolean') {
      out[key] = value;
      continue;
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      out[key] = value;
      continue;
    }
    if (typeof value !== 'string') continue;
    if (value.length > 200) continue;
    if (/^https?:\/\//i.test(value)) {
      const cleaned = stripUrlQuery(value);
      if (cleaned) out[key] = cleaned;
      continue;
    }
    if (/@/.test(value)) continue;
    if (/^[a-zA-Z0-9_./#:-]{1,200}$/.test(value)) out[key] = value;
  }
  return Object.keys(out).length ? out : undefined;
}

function sanitizeGroups(value: unknown): Record<string, string | number | boolean> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const out: Record<string, string | number | boolean> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    if (!SAFE_KEY.test(key)) continue;
    if (typeof item === 'boolean' || (typeof item === 'number' && Number.isFinite(item))) {
      out[key] = item;
      continue;
    }
    if (typeof item === 'string' && SAFE_STRING.test(item)) out[key] = item;
  }
  return Object.keys(out).length ? out : undefined;
}

function copySanitizedSet(source: unknown): Record<string, unknown> | undefined {
  if (!source || typeof source !== 'object' || Array.isArray(source)) return undefined;
  return sanitizePersonProps(source as Record<string, unknown>);
}

export function sanitizePosthogEvent<T extends PosthogCaptureEvent>(
  event: T | null | undefined,
  ctx: SanitizeContext,
): T | null {
  if (!event) return null;
  const incoming = event.properties && typeof event.properties === 'object' ? event.properties : {};
  const safe: Record<string, unknown> = { ...cleanProps(incoming) };
  for (const key of sdkPropertyKeys) {
    if (incoming[key] === undefined) continue;
    if (key === '$groups') {
      const groups = sanitizeGroups(incoming[key]);
      if (groups) safe[key] = groups;
      continue;
    }
    safe[key] = incoming[key];
  }
  const nestedSet = copySanitizedSet(incoming.$set);
  if (nestedSet) safe.$set = nestedSet;
  const nestedSetOnce = copySanitizedSet(incoming.$set_once);
  if (nestedSetOnce) safe.$set_once = nestedSetOnce;

  const path = typeof safe.page_path === 'string' ? safe.page_path : ctx.path;
  event.properties = {
    ...safe,
    app: ctx.app,
    $current_url: ctx.origin + path,
    $pathname: path,
    $referrer: '',
    $ip: '0.0.0.0',
    $geoip_disable: true,
  };

  const set = copySanitizedSet(event.$set);
  const setOnce = copySanitizedSet(event.$set_once);
  if (set) event.$set = set;
  else delete event.$set;
  if (setOnce) event.$set_once = setOnce;
  else delete event.$set_once;
  return event;
}
