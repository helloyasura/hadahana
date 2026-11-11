import assert from "node:assert/strict";
import { pdfTimeBudgets } from "../src/lib/pdf/timeouts";
const production = { launchMs: 10000, renderMs: 25000 };
const ci = { launchMs: 30000, renderMs: 60000 };
assert.deepEqual(pdfTimeBudgets({}), production);
assert.deepEqual(pdfTimeBudgets({ NODE_ENV: "development" }), production);
assert.deepEqual(pdfTimeBudgets({ CI: "false" }), production);
assert.deepEqual(pdfTimeBudgets({ CI: "1" }), production);
assert.deepEqual(pdfTimeBudgets({ CI: "true" }), ci);
assert.deepEqual(pdfTimeBudgets({ CI: "true", NODE_ENV: "test" }), ci);
assert.deepEqual(pdfTimeBudgets({ CI: "true", NODE_ENV: "development" }), ci);
assert.deepEqual(pdfTimeBudgets({ CI: "true", NODE_ENV: "production" }), production,
  "CI must never relax a deployed production process's resource deadlines");
for (const values of [production, ci]) {
  assert.ok(values.launchMs > 0 && values.launchMs < values.renderMs);
  assert.ok(values.renderMs <= 60000, "No unbounded rendering");
}
console.log("PDF timeout policy passed: bounded CI cold-start allowance; production remains 10s launch / 25s total.");
