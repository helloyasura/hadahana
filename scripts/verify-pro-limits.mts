/** Unit tests for Pro email-code limit copy and 429 parsing. */
import assert from "node:assert/strict";
import {
  GENERIC_CODE_WAIT,
  parseProLimitFields,
  parseRetryAfterHeader,
  proLimitMessage,
} from "../src/lib/pro/limits";

assert.equal(proLimitMessage({}), GENERIC_CODE_WAIT);
assert.equal(
  proLimitMessage({ reason: "email_hourly_limit", retryAfterSeconds: 900, limit: 5 }),
  "ඔබ මෙම පැයේ කේත 5ක් ඉල්ලා ඇත. කරුණාකර මිනිත්තු 15 කින් නැවත උත්සාහ කරන්න. / You've requested 5 codes this hour; try again in 15 minutes.",
);
assert.match(
  proLimitMessage({ reason: "email_hourly_limit", retryAfterSeconds: 59 }),
  /කේත 5ක්/,
);
assert.equal(
  proLimitMessage({ reason: "resend_cooldown", retryAfterSeconds: 42 }),
  "නව කේතයක් සඳහා තත්පර 42 ක් රැඳී සිටින්න. / Wait 42 seconds before requesting a new code.",
);
assert.match(proLimitMessage({ reason: "too_many_attempts" }), /නව කේතයක් ඉල්ලන්න/);
assert.equal(parseRetryAfterHeader("33"), 33);
assert.equal(
  parseRetryAfterHeader(new Date(Date.now() + 5000).toUTCString())! >= 4 &&
    parseRetryAfterHeader(new Date(Date.now() + 5000).toUTCString())! <= 6,
  true,
);
assert.deepEqual(
  parseProLimitFields(
    { reason: "email_hourly_limit", retryAfterSeconds: 12.2, limit: 5 },
    "99",
  ),
  { reason: "email_hourly_limit", retryAfterSeconds: 13, limit: 5 },
);
assert.deepEqual(parseProLimitFields({}, "70"), {
  reason: undefined,
  retryAfterSeconds: 70,
  limit: undefined,
});
console.log("Pro limit messages, retry-after parsing and fallback copy passed.");
