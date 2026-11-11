import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import sharp from "sharp";
import { castKendraya } from "../src/lib/astrology/kendraya";
import {
  DEFAULT_CALCULATION_CONFIG,
  calculationConfigSchema,
} from "../src/lib/astrology/config";
import {
  initialCase,
  shiftCivilClock,
  defaultServices,
  checklist,
  reportDraft,
  questionEvidence,
  canComplete,
  caseStudioSchema,
} from "../src/lib/pro/cases";
import {
  emptyStore,
  newId,
  transaction,
  type Client,
} from "../src/lib/pro/store";
import { applyCaseAction, ownedCase } from "../src/lib/pro/case-actions";
import { compareDocument, emptyReading } from "../src/lib/pro/document-reading";
import { sanitizeDocument } from "../src/lib/pro/document";
import { caseReportHtml } from "../src/lib/pdf/case-template";
const input = {
  date: "2000-01-01",
  time: "12:00",
  latitude: 6.9271,
  longitude: 79.8612,
  timezone: "Asia/Colombo",
};
const config = calculationConfigSchema.parse(DEFAULT_CALCULATION_CONFIG);
assert.deepEqual(shiftCivilClock(input, 7 / 60), {
  date: input.date,
  time: "12:07",
});
assert.deepEqual(
  shiftCivilClock({ date: "2000-01-01", time: "00:00" }, -1 / 60),
  { date: "1999-12-31", time: "23:59" },
);
assert.throws(() => shiftCivilClock(input, NaN));
const result = await castKendraya(input, config, { precise: true });
const owner = newId(),
  other = newId();
const client: Client = {
  id: newId(),
  ownerId: owner,
  linkId: "manual",
  presetId: "manual",
  input,
  result,
  createdAt: Date.now(),
  consentVersion: "pro-v1",
  manifest: {
    config,
    configHash: "synthetic",
    engine: "synthetic-test",
    sunriseUtc: undefined,
    balanceDisplay: "years",
  },
};
const db = emptyStore();
db.accounts.push({
  id: owner,
  subject: randomUUID(),
  email: "synthetic@example.test",
  displayName: "Synthetic astrologer",
  contact: "",
  qualifications: "",
  logo: "",
  createdAt: Date.now(),
});
client.case = initialCase(client);
db.clients.push(client);
assert.equal(client.case.status, "new");
assert.equal(client.case.assignedTo, null);
assert.deepEqual(client.case.state.settings.calculation, config);
const action = (body: Record<string, unknown>) =>
  applyCaseAction(db, owner, {
    id: client.id,
    revision: client.case!.revision,
    ...body,
  });
assert.throws(() => ownedCase(db, other, client.id), /not found/);
assert.throws(
  () =>
    applyCaseAction(db, other, {
      action: "state",
      id: client.id,
      revision: 0,
      state: client.case!.state,
    }),
  /Not found/,
);
const details = {
  action: "update",
  status: "in_progress",
  claim: true,
  serviceId: "reading",
  question: "Career question",
  notes: "SYNTHETIC INTERNAL NOTE",
  checked: ["verify"],
};
action(details);
assert.equal(client.case.assignedTo, owner);
assert.equal(client.case.revision, 1);
assert.throws(
  () => applyCaseAction(db, owner, { ...details, id: client.id, revision: 0 }),
  /another tab/,
);
assert.throws(
  () => action({ ...details, checked: ["invented"] }),
  /Unknown checklist/,
);
assert.throws(
  () => action({ ...details, status: "completed" }),
  /final report/,
);
assert.throws(
  () =>
    action({
      action: "state",
      state: { ...client.case!.state, comparisonId: newId() },
    }),
  /not found/,
);
const state = structuredClone(client.case.state);
state.input.time = "12:15";
state.settings.division = 9;
state.dasha = { maha: 1, bhukti: 2, date: "2001-01-01" };
action({ action: "state", state });
assert.deepEqual(caseStudioSchema.parse(client.case.state), state);
action({
  action: "pin",
  title: "<script>finding</script>",
  text: "Editable evidence & caveat",
  state,
});
action({
  action: "report",
  title: "Report <img src=x>",
  body: reportDraft("en", client.case.findings),
  language: "en",
  stage: "draft",
  reviewed: false,
});
assert.throws(
  () =>
    action({
      action: "report",
      title: "Final",
      body: "Review needed",
      language: "si",
      stage: "final",
      reviewed: false,
    }),
  /Review the report/,
);
action({
  action: "report",
  title: "අවසන් වාර්තාව",
  body: "සමාලෝචිත සාක්ෂි",
  language: "si",
  stage: "final",
  reviewed: true,
});
const report = client.case.reports[1],
  html = caseReportHtml(report);
assert.ok(!html.includes("<script>finding"));
assert.match(html, /&lt;script&gt;/);
assert.ok(!html.includes("SYNTHETIC INTERNAL NOTE"));
client.case.findings[0].text = "Later correction";
assert.equal(report.findings[0].text, "Editable evidence & caveat");
assert.equal(canComplete(client.case), false);
report.issuedAt = Date.now();
assert.equal(canComplete(client.case), true);
action({ ...details, status: "completed" });
assert.equal(client.case.status, "completed");
action({
  action: "rectify",
  state,
  confirmed: true,
  reason: "Synthetic manually reviewed hypothesis",
});
assert.equal(client.input.time, "12:00");
assert.equal(client.case.rectification?.original.time, "12:00");
assert.equal(client.case.rectification?.corrected.time, "12:15");
assert.match(client.case.timeline.at(-1)!.action, /12:00.*12:15/);
assert.throws(
  () =>
    action({
      action: "rectify",
      state: { ...state, input: { ...state.input, date: "2001-01-01" } },
      confirmed: true,
      reason: "Invalid date change",
    }),
  /time only/,
);
const reading = structuredClone(emptyReading);
reading.lagna = Math.floor(
  (result.lagna.longitudeExact ?? result.lagna.longitude) / 30,
);
assert.equal(compareDocument(result, reading)[0].matches, true);
reading.lagna = (reading.lagna + 1) % 12;
assert.equal(compareDocument(result, reading)[0].matches, false);
reading.dashaLord = result.vimshottari.balanceAtBirth
  .lord as typeof reading.dashaLord;
assert.equal(compareDocument(result, reading).at(-1)!.matches, true);
for (const service of defaultServices) {
  const steps = checklist(service.kind);
  assert.equal(new Set(steps.map((s) => s.id)).size, steps.length);
  assert.ok(
    steps.every((s) =>
      ["studio", "tools", "compare", "report", "evidence"].includes(s.tool),
    ),
  );
}
const evidence = questionEvidence(result, "career", "2001-01-01T12:00:00Z");
assert.deepEqual(
  evidence.rows.map((r) => r.house),
  [2, 6, 10, 11],
);
assert.equal(evidence.periods.length, 3);
assert.ok(evidence.rows.every((r) => !!r.lord));
action({
  action: "service",
  name: "Custom professional reading",
  kind: "reading",
});
assert.equal(db.accounts[0].services!.length, 6);
const raw = await sharp({
  create: { width: 80, height: 100, channels: 3, background: "white" },
})
  .withExif({ IFD0: { Artist: "Synthetic artist" } })
  .jpeg()
  .toBuffer();
assert.ok((await sharp(raw).metadata()).exif);
const doc = await sanitizeDocument({
  mime: "image/jpeg",
  data: raw.toString("base64"),
  consent: true,
});
const clean = await sharp(Buffer.from(doc.pages[0], "base64")).metadata();
assert.equal(clean.exif, undefined);
assert.equal(clean.icc, undefined);
assert.equal(clean.format, "png");
await assert.rejects(
  sanitizeDocument({
    mime: "application/pdf",
    data: raw.toString("base64"),
    consent: true,
  }),
);
await assert.rejects(
  sanitizeDocument({
    mime: "image/jpeg",
    data: raw.toString("base64"),
    consent: false,
  }),
);
await assert.rejects(
  sanitizeDocument({
    mime: "image/svg+xml",
    data: Buffer.from('<svg onload="alert(1)"/>').toString("base64"),
    consent: true,
  }),
);
const dir = await mkdtemp(path.join(tmpdir(), "case-enc-test-"));
const oldPath = process.env.PRO_DATA_PATH,
  oldKey = process.env.PRO_STORAGE_KEY;
try {
  process.env.PRO_DATA_PATH = path.join(dir, "cases.enc");
  process.env.PRO_STORAGE_KEY = randomBytes(32).toString("hex");
  await transaction((store) => {
    store.accounts.push(db.accounts[0]);
    store.clients.push({ ...client, case: undefined });
  });
  const migrated = await transaction((store) => store.clients[0]);
  assert.equal(migrated.case!.state.input.time, "12:00");
  assert.deepEqual(
    migrated.manifest,
    JSON.parse(JSON.stringify(client.manifest)),
  );
  await transaction((store) => {
    store.clients[0].case!.document = doc;
    store.clients[0].case!.notes = "SYNTHETIC PRIVATE CASE NOTE";
  });
  const encrypted = await readFile(process.env.PRO_DATA_PATH);
  assert.ok(!encrypted.includes(Buffer.from("SYNTHETIC PRIVATE CASE NOTE")));
  assert.ok(!encrypted.includes(Buffer.from(doc.pages[0])));
  assert.equal(
    await transaction((store) => store.clients[0].case!.document!.pages[0]),
    doc.pages[0],
  );
} finally {
  if (oldPath === undefined) delete process.env.PRO_DATA_PATH;
  else process.env.PRO_DATA_PATH = oldPath;
  if (oldKey === undefined) delete process.env.PRO_STORAGE_KEY;
  else process.env.PRO_STORAGE_KEY = oldKey;
  await rm(dir, { recursive: true, force: true });
}
console.log(
  "Cases passed: tenant isolation, optimistic revisions, status/issuance gates, immutable report pins, XSS escaping, privacy, exact tool snapshots, service checklists, evidence, manual document comparison, auditable rectification, EXIF stripping, upload rejection and encrypted legacy migration.",
);
