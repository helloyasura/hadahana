/** Production's shared-droplet limits stay unchanged. Fresh GitHub runners can
 * spend >10s starting an otherwise healthy Chrome before its first DevTools
 * connection; give only non-production CI a larger, still finite startup budget.
 */
export function pdfTimeBudgets(env: NodeJS.ProcessEnv = process.env) {
  const slowCi = env.CI === "true" && env.NODE_ENV !== "production";
  return {
    launchMs: slowCi ? 30000 : 10000,
    renderMs: slowCi ? 60000 : 25000,
  };
}
