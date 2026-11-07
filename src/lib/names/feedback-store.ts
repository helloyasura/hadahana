/**
 * Persistent name feedback DB (like / dislike learning).
 *
 * Stores up/down rates for first names, middle names, and full pairs.
 * Default backend: atomic JSON file under data/ (works locally & on the
 * cloud agent VM). If DATABASE_URL / NAME_FEEDBACK_DB_PATH points at a
 * writable JSON path it uses that instead.
 */

import { createHash, randomUUID } from "crypto";
import { mkdir, readFile, rename, writeFile } from "fs/promises";
import path from "path";

export type FeedbackPartKind = "first" | "middle" | "full";
export type FeedbackAction = "up" | "down";

export type PartRating = {
  kind: FeedbackPartKind;
  roman: string;
  sinhala: string;
  upCount: number;
  downCount: number;
  updatedAt: string;
};

export type FeedbackEvent = {
  id: string;
  at: string;
  action: FeedbackAction;
  target: FeedbackPartKind;
  fullRoman: string;
  fullSinhala: string;
  firstRoman: string;
  firstSinhala: string;
  middleRoman: string;
  middleSinhala: string;
  sessionId?: string;
};

export type FeedbackStoreData = {
  version: 1;
  parts: Record<string, PartRating>;
  events: FeedbackEvent[];
};

export type LearningSnapshot = {
  likedFirst: string[];
  dislikedFirst: string[];
  likedMiddle: string[];
  dislikedMiddle: string[];
  likedFull: string[];
  dislikedFull: string[];
  /** roman(lower) → net score (up - down) for first names */
  firstNet: Record<string, number>;
  middleNet: Record<string, number>;
};

const MAX_EVENTS = 2500;

function defaultDbPath(): string {
  if (process.env.NAME_FEEDBACK_DB_PATH) {
    return process.env.NAME_FEEDBACK_DB_PATH;
  }
  // Prefer project data/ — durable across restarts on this VM.
  return path.join(process.cwd(), "data", "name-feedback.json");
}

function partKey(kind: FeedbackPartKind, roman: string): string {
  return `${kind}:${roman.trim().toLowerCase()}`;
}

function emptyStore(): FeedbackStoreData {
  return { version: 1, parts: {}, events: [] };
}

let writeChain: Promise<unknown> = Promise.resolve();

async function readStore(dbPath: string): Promise<FeedbackStoreData> {
  try {
    const raw = await readFile(dbPath, "utf8");
    const parsed = JSON.parse(raw) as FeedbackStoreData;
    if (!parsed || parsed.version !== 1 || !parsed.parts) return emptyStore();
    return {
      version: 1,
      parts: parsed.parts ?? {},
      events: Array.isArray(parsed.events) ? parsed.events : [],
    };
  } catch {
    return emptyStore();
  }
}

async function writeStore(dbPath: string, data: FeedbackStoreData): Promise<void> {
  await mkdir(path.dirname(dbPath), { recursive: true });
  const tmp = `${dbPath}.${process.pid}.${randomUUID()}.tmp`;
  await writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
  await rename(tmp, dbPath);
}

/** Serialize mutations so concurrent feedback posts do not clobber. */
function withStoreLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = writeChain.then(fn, fn);
  writeChain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export function netScore(r: PartRating): number {
  return r.upCount - r.downCount;
}

export function rateLabel(r: PartRating): "hot" | "liked" | "neutral" | "cool" | "banned" {
  const net = netScore(r);
  if (r.downCount >= 3 && net <= -2) return "banned";
  if (net <= -1) return "cool";
  if (net >= 3 || (r.upCount >= 2 && net >= 1)) return "hot";
  if (net >= 1) return "liked";
  return "neutral";
}

export async function recordFeedback(input: {
  action: FeedbackAction;
  target: FeedbackPartKind;
  firstRoman: string;
  firstSinhala: string;
  middleRoman: string;
  middleSinhala: string;
  sessionId?: string;
}): Promise<{ store: FeedbackStoreData; touched: PartRating[] }> {
  const dbPath = defaultDbPath();
  return withStoreLock(async () => {
    const store = await readStore(dbPath);
    const at = new Date().toISOString();
    const fullRoman = `${input.firstRoman} ${input.middleRoman}`.trim();
    const fullSinhala = `${input.firstSinhala} ${input.middleSinhala}`.trim();

    const bump = (kind: FeedbackPartKind, roman: string, sinhala: string) => {
      const key = partKey(kind, roman);
      const prev = store.parts[key] ?? {
        kind,
        roman: roman.trim(),
        sinhala: sinhala.trim(),
        upCount: 0,
        downCount: 0,
        updatedAt: at,
      };
      const next: PartRating = {
        ...prev,
        sinhala: sinhala.trim() || prev.sinhala,
        upCount: prev.upCount + (input.action === "up" ? 1 : 0),
        downCount: prev.downCount + (input.action === "down" ? 1 : 0),
        updatedAt: at,
      };
      store.parts[key] = next;
      return next;
    };

    const touched: PartRating[] = [];
    if (input.target === "full") {
      touched.push(bump("full", fullRoman, fullSinhala));
      // Full like/dislike also nudges the first name rate (user's primary ask).
      touched.push(bump("first", input.firstRoman, input.firstSinhala));
    } else if (input.target === "first") {
      touched.push(bump("first", input.firstRoman, input.firstSinhala));
    } else {
      touched.push(bump("middle", input.middleRoman, input.middleSinhala));
    }

    store.events.push({
      id: randomUUID(),
      at,
      action: input.action,
      target: input.target,
      fullRoman,
      fullSinhala,
      firstRoman: input.firstRoman.trim(),
      firstSinhala: input.firstSinhala.trim(),
      middleRoman: input.middleRoman.trim(),
      middleSinhala: input.middleSinhala.trim(),
      sessionId: input.sessionId,
    });
    if (store.events.length > MAX_EVENTS) {
      store.events = store.events.slice(-MAX_EVENTS);
    }

    await writeStore(dbPath, store);
    return { store, touched };
  });
}

export async function loadFeedbackStore(): Promise<FeedbackStoreData> {
  return readStore(defaultDbPath());
}

export async function buildLearningSnapshot(
  store?: FeedbackStoreData,
): Promise<LearningSnapshot> {
  const data = store ?? (await loadFeedbackStore());
  const likedFirst: string[] = [];
  const dislikedFirst: string[] = [];
  const likedMiddle: string[] = [];
  const dislikedMiddle: string[] = [];
  const likedFull: string[] = [];
  const dislikedFull: string[] = [];
  const firstNet: Record<string, number> = {};
  const middleNet: Record<string, number> = {};

  for (const r of Object.values(data.parts)) {
    const net = netScore(r);
    const label = rateLabel(r);
    const roman = r.roman.trim();
    if (r.kind === "first") {
      firstNet[roman.toLowerCase()] = net;
      if (label === "banned" || label === "cool") dislikedFirst.push(roman);
      if (label === "hot" || label === "liked") likedFirst.push(roman);
    } else if (r.kind === "middle") {
      middleNet[roman.toLowerCase()] = net;
      if (label === "banned" || label === "cool") dislikedMiddle.push(roman);
      if (label === "hot" || label === "liked") likedMiddle.push(roman);
    } else if (r.kind === "full") {
      if (label === "banned" || label === "cool") dislikedFull.push(roman);
      if (label === "hot" || label === "liked") likedFull.push(roman);
    }
  }

  return {
    likedFirst,
    dislikedFirst,
    likedMiddle,
    dislikedMiddle,
    likedFull,
    dislikedFull,
    firstNet,
    middleNet,
  };
}

/** Deterministic shuffle seed from session + name for stable randomize. */
export function shuffleSeed(sessionId: string, salt: string): number {
  const h = createHash("sha256")
    .update(`${sessionId}:${salt}:${Date.now()}`)
    .digest();
  return h.readUInt32BE(0);
}

export function feedbackDbPathForDebug(): string {
  return defaultDbPath();
}
