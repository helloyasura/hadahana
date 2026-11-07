/**
 * Minimal MCP-shaped stdio tool server for Handahana engines.
 * Protocol: newline-delimited JSON { id, method, params }
 * Methods: tools/list | tools/call
 *
 * Later can be swapped for official @modelcontextprotocol/sdk without changing handlers.
 */

import { AGENT_TOOL_DEFS, runAgentTool } from "../src/lib/agent/tools";

type Req = {
  id?: string | number;
  method: string;
  params?: { name?: string; arguments?: Record<string, unknown> };
};

async function handle(line: string) {
  let req: Req;
  try {
    req = JSON.parse(line) as Req;
  } catch {
    return;
  }
  if (req.method === "tools/list") {
    process.stdout.write(
      JSON.stringify({
        id: req.id,
        result: { tools: AGENT_TOOL_DEFS },
      }) + "\n",
    );
    return;
  }
  if (req.method === "tools/call") {
    const name = req.params?.name ?? "";
    const args = JSON.stringify(req.params?.arguments ?? {});
    try {
      const result = await runAgentTool(name, args);
      process.stdout.write(
        JSON.stringify({ id: req.id, result: { content: result } }) + "\n",
      );
    } catch (err) {
      process.stdout.write(
        JSON.stringify({
          id: req.id,
          error: err instanceof Error ? err.message : String(err),
        }) + "\n",
      );
    }
  }
}

process.stdin.setEncoding("utf8");
let buf = "";
process.stdin.on("data", (chunk) => {
  buf += chunk;
  const parts = buf.split("\n");
  buf = parts.pop() ?? "";
  for (const line of parts) {
    if (line.trim()) void handle(line.trim());
  }
});

process.stderr.write(
  "[handahana-mcp] ready — methods: tools/list, tools/call\n",
);
