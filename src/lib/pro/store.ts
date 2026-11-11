import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  randomUUID,
} from "node:crypto";
import { mkdir, readFile, writeFile, rename, rm, stat } from "node:fs/promises";
import path from "node:path";
import { studioSettingsSchema, type StudioSettings } from "./studio";
import type { CalculationConfig } from "../astrology/config";
import type { BirthInput, castKendraya } from "../astrology/kendraya";

export type ProAccount = {
  id: string;
  subject: string;
  email: string;
  displayName: string;
  qualifications: string;
  contact: string;
  logo: string;
  studio?: StudioSettings;
  createdAt: number;
};
export type Preset = {
  id: string;
  ownerId: string;
  name: string;
  version: number;
  config: CalculationConfig;
  studio?: StudioSettings;
  createdAt: number;
};
export type ShareLink = {
  id: string;
  ownerId: string;
  presetId: string;
  tokenHash: string;
  label: string;
  expiresAt: number;
  maxUses: number;
  uses: number;
  revoked: boolean;
  createdAt: number;
};
export type Client = {
  id: string;
  ownerId: string;
  linkId: string;
  presetId: string;
  input: BirthInput;
  createdAt: number;
  consentVersion: "pro-v1";
  result: Awaited<ReturnType<typeof castKendraya>>;
  manifest: {
    config: CalculationConfig;
    configHash: string;
    engine: string;
    sunriseUtc: string | undefined;
    balanceDisplay: string;
  };
};
export type ProStore = {
  version: 1;
  accounts: ProAccount[];
  presets: Preset[];
  links: ShareLink[];
  clients: Client[];
  sessions: { hash: string; ownerId: string; expiresAt: number }[];
  challenges: {
    hash: string;
    email: string;
    displayName: string;
    intent: "login" | "register";
    remoteId: string;
    attempts: number;
    expiresAt: number;
  }[];
  rates: { key: string; count: number; expiresAt: number }[];
};
export type ProErrorDetails = {
  reason?: string;
  retryAfterSeconds?: number;
  limit?: number;
};
export class ProError extends Error {
  reason?: string;
  retryAfterSeconds?: number;
  limit?: number;
  constructor(
    message: string,
    public status = 400,
    details?: ProErrorDetails,
  ) {
    super(message);
    this.reason = details?.reason;
    this.retryAfterSeconds = details?.retryAfterSeconds;
    this.limit = details?.limit;
  }
}
export const digest = (s: string) =>
  createHash("sha256").update(s).digest("hex");
export const opaqueToken = () => randomBytes(32).toString("base64url");
export const newId = () => randomUUID();
function key() {
  const value = process.env.PRO_STORAGE_KEY;
  if (!value || value.length < 32)
    throw new ProError(
      "Pro සේවාව තවම සකසා නැත. / Pro storage is not configured.",
      503,
    );
  return createHash("sha256").update(value).digest();
}
export const emptyStore = (): ProStore => ({
  version: 1,
  accounts: [],
  presets: [],
  links: [],
  clients: [],
  sessions: [],
  challenges: [],
  rates: [],
});
/** Atomic encrypted JSON, following existing repo storage. One isolated file, no consumer tables. */
export async function transaction<T>(
  fn: (db: ProStore) => T | Promise<T>,
): Promise<T> {
  const encryptionKey = key();
  const file =
    process.env.PRO_DATA_PATH ||
    path.join(process.cwd(), "data", "jyotisha-pro.enc");
  await mkdir(path.dirname(file), { recursive: true, mode: 0o700 });
  const lock = `${file}.lock`;
  let acquired = false;
  for (let i = 0; i < 60; i++) {
    try {
      await mkdir(lock, { mode: 0o700 });
      acquired = true;
      break;
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== "EEXIST") throw e;
      await new Promise((r) => setTimeout(r, 50));
    }
  }
  if (!acquired)
    throw new ProError("Pro ගබඩාව කාර්යබහුලයි. නැවත උත්සාහ කරන්න.", 503);
  let tmp: string | undefined;
  try {
    let db = emptyStore();
    try {
      if ((await stat(file)).size > 16 * 1024 * 1024)
        throw new Error("capacity");
      const b = await readFile(file);
      const d = createDecipheriv(
        "aes-256-gcm",
        encryptionKey,
        b.subarray(0, 12),
      );
      d.setAAD(Buffer.from("jyotisha-pro:v1"));
      d.setAuthTag(b.subarray(12, 28));
      db = JSON.parse(
        Buffer.concat([d.update(b.subarray(28)), d.final()]).toString(),
      );
      if (db.version !== 1) throw new Error("schema");
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== "ENOENT")
        throw new ProError(
          "Pro ගබඩාව කියවිය නොහැක. පරිපාලක සහාය අවශ්‍යයි.",
          503,
        );
    }
    // Additive migration: legacy accounts/presets retain their original calculation configs.
    for (const account of db.accounts)
      account.studio = studioSettingsSchema.parse(account.studio ?? {});
    const now = Date.now();
    db.sessions = db.sessions.filter((s) => s.expiresAt > now);
    db.challenges = db.challenges.filter((s) => s.expiresAt > now);
    db.rates = db.rates.filter((s) => s.expiresAt > now);
    db.clients = db.clients.filter((c) => c.createdAt > now - 90 * 86400000);
    const result = await fn(db);
    const data = Buffer.from(JSON.stringify(db));
    if (data.length > 15 * 1024 * 1024)
      throw new ProError(
        "Pilot storage limit reached. Export/delete old records.",
        409,
      );
    const iv = randomBytes(12),
      c = createCipheriv("aes-256-gcm", encryptionKey, iv);
    c.setAAD(Buffer.from("jyotisha-pro:v1"));
    const encrypted = Buffer.concat([c.update(data), c.final()]);
    tmp = `${file}.${randomUUID()}.tmp`;
    await writeFile(tmp, Buffer.concat([iv, c.getAuthTag(), encrypted]), {
      mode: 0o600,
    });
    await rename(tmp, file);
    return result;
  } finally {
    if (tmp) await rm(tmp, { force: true });
    await rm(lock, { recursive: true, force: true });
  }
}
/** Store only salted identifiers, not IP/email/birth data, in bounded rate buckets. */
export function consumeRate(
  db: ProStore,
  scope: string,
  identifier: string,
  max: number,
  seconds: number,
) {
  const id = digest(`${process.env.PRO_STORAGE_KEY}:${scope}:${identifier}`);
  let row = db.rates.find((r) => r.key === id);
  if (!row) {
    if (db.rates.length >= 5000) return false;
    row = { key: id, count: 0, expiresAt: Date.now() + seconds * 1000 };
    db.rates.push(row);
  }
  row.count++;
  return row.count <= max;
}
export function usableLink(db: ProStore, token: string) {
  const link = db.links.find((l) => l.tokenHash === digest(token));
  if (
    !link ||
    link.revoked ||
    link.expiresAt <= Date.now() ||
    link.uses >= link.maxUses
  )
    throw new ProError("මෙම සබැඳිය අවසන් වී හෝ අවලංගු වී ඇත.", 410);
  return link;
}
