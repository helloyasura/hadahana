/** Shared Pro email-code limit copy and LUMS 429 parsing. */
export const GENERIC_CODE_WAIT =
  "නව කේතයක් ඉල්ලීමට පෙර රැඳී සිටින්න.";
export const WRONG_CODE = "කේතය හෝ පිවිසුම් තොරතුරු වැරදියි.";
export const DEFAULT_EMAIL_HOURLY_LIMIT = 5;

export type ProLimitDetails = {
  reason?: string;
  retryAfterSeconds?: number;
  limit?: number;
};

export function parseRetryAfterHeader(header: string | null, now = Date.now()) {
  if (!header) return undefined;
  const asNumber = Number(header);
  if (Number.isFinite(asNumber)) return Math.max(0, Math.ceil(asNumber));
  const when = Date.parse(header);
  if (Number.isFinite(when))
    return Math.max(0, Math.ceil((when - now) / 1000));
  return undefined;
}

export function parseProLimitFields(
  body: unknown,
  retryAfterHeader?: string | null,
  now = Date.now(),
): ProLimitDetails {
  const data =
    body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const reason = typeof data.reason === "string" ? data.reason : undefined;
  const fromBody =
    typeof data.retryAfterSeconds === "number" &&
    Number.isFinite(data.retryAfterSeconds)
      ? Math.max(0, Math.ceil(data.retryAfterSeconds))
      : undefined;
  const limit =
    typeof data.limit === "number" && Number.isFinite(data.limit) && data.limit > 0
      ? data.limit
      : undefined;
  return {
    reason,
    retryAfterSeconds:
      fromBody ?? parseRetryAfterHeader(retryAfterHeader ?? null, now),
    limit,
  };
}

export function isTimedProLimit(reason?: string) {
  return (
    reason === "email_hourly_limit" ||
    reason === "ip_hourly_limit" ||
    reason === "verify_limit" ||
    reason === "resend_cooldown"
  );
}

export function proLimitMessage({
  reason,
  retryAfterSeconds,
  limit,
}: ProLimitDetails): string {
  const seconds = Math.max(0, Math.ceil(retryAfterSeconds ?? 0));
  const minutes = Math.max(1, Math.ceil(seconds / 60) || 1);
  const cap = limit && limit > 0 ? limit : DEFAULT_EMAIL_HOURLY_LIMIT;
  if (reason === "email_hourly_limit")
    return `ඔබ මෙම පැයේ කේත ${cap}ක් ඉල්ලා ඇත. කරුණාකර මිනිත්තු ${minutes} කින් නැවත උත්සාහ කරන්න. / You've requested ${cap} codes this hour; try again in ${minutes} minutes.`;
  if (reason === "resend_cooldown")
    return `නව කේතයක් සඳහා තත්පර ${Math.max(1, seconds)} ක් රැඳී සිටින්න. / Wait ${Math.max(1, seconds)} seconds before requesting a new code.`;
  if (reason === "too_many_attempts")
    return "බොහෝ වරක් වැරදි කේතයක් ඇතුළත් කර ඇත. කරුණාකර නව කේතයක් ඉල්ලන්න. / Too many incorrect attempts. Request a new code.";
  if (reason === "ip_hourly_limit" || reason === "verify_limit")
    return seconds >= 60
      ? `කරුණාකර මිනිත්තු ${minutes} කින් නැවත උත්සාහ කරන්න. / Please try again in ${minutes} minutes.`
      : `නව කේතයක් සඳහා තත්පර ${Math.max(1, seconds)} ක් රැඳී සිටින්න. / Wait ${Math.max(1, seconds)} seconds before trying again.`;
  if (seconds > 0)
    return seconds >= 60
      ? `නව කේතයක් ඉල්ලීමට පෙර මිනිත්තු ${minutes} ක් රැඳී සිටින්න. / Please wait ${minutes} minutes before requesting a new code.`
      : `නව කේතයක් සඳහා තත්පර ${Math.max(1, seconds)} ක් රැඳී සිටින්න. / Wait ${Math.max(1, seconds)} seconds before requesting a new code.`;
  return GENERIC_CODE_WAIT;
}
