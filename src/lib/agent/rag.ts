/**
 * Lightweight local RAG over Handahana research markdown.
 * Prefer OpenAI embeddings when OPENAI_API_KEY is set; else lexical scoring.
 */

import fs from "fs";
import path from "path";
import OpenAI from "openai";

export type KnowledgeChunk = {
  id: string;
  path: string;
  title: string;
  text: string;
  embedding?: number[];
};

const ROOT_CANDIDATES = [
  path.join(process.cwd(), "knowledge"),
  path.join(process.cwd(), "docs"),
  "/home/ubuntu/projects/kendraya-handahana-research/knowledge",
];

const INDEX_PATH = path.join(process.cwd(), "knowledge", ".index.json");

function chunkText(text: string, size = 900, overlap = 120): string[] {
  const clean = text.replace(/\r\n/g, "\n").trim();
  if (clean.length <= size) return [clean];
  const out: string[] = [];
  let i = 0;
  while (i < clean.length) {
    out.push(clean.slice(i, i + size));
    i += size - overlap;
  }
  return out;
}

function listMarkdownFiles(): string[] {
  const files: string[] = [];
  for (const root of ROOT_CANDIDATES) {
    if (!fs.existsSync(/* turbopackIgnore: true */ root)) continue;
    for (const name of fs.readdirSync(/* turbopackIgnore: true */ root)) {
      if (!name.endsWith(".md")) continue;
      files.push(path.join(/* turbopackIgnore: true */ root, name));
    }
  }
  return [...new Set(files)];
}

export function buildLexicalIndex(): KnowledgeChunk[] {
  const chunks: KnowledgeChunk[] = [];
  for (const file of listMarkdownFiles()) {
    const raw = fs.readFileSync(file, "utf8");
    const title = raw.split("\n").find((l) => l.startsWith("#"))?.replace(/^#+\s*/, "") ?? path.basename(file);
    const parts = chunkText(raw);
    parts.forEach((text, i) => {
      chunks.push({
        id: `${path.basename(file)}#${i}`,
        path: file,
        title,
        text,
      });
    });
  }
  return chunks;
}

function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (!na || !nb) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

function lexicalScore(query: string, text: string): number {
  const q = query.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  const t = text.toLowerCase();
  if (!q.length) return 0;
  let hit = 0;
  for (const w of q) if (t.includes(w)) hit += 1;
  // boost Sinhala / domain tokens present as substrings
  return hit / q.length;
}

async function embedTexts(texts: string[]): Promise<number[][]> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY missing");
  const client = new OpenAI({ apiKey: key });
  const res = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: texts,
  });
  return res.data
    .sort((a, b) => a.index - b.index)
    .map((d) => d.embedding as number[]);
}

export async function ensureEmbeddedIndex(): Promise<KnowledgeChunk[]> {
  if (fs.existsSync(INDEX_PATH)) {
    try {
      const cached = JSON.parse(fs.readFileSync(INDEX_PATH, "utf8")) as KnowledgeChunk[];
      if (cached.length && cached[0].embedding?.length) return cached;
    } catch {
      /* rebuild */
    }
  }
  const base = buildLexicalIndex();
  if (!process.env.OPENAI_API_KEY) return base;
  try {
    const batch = 32;
    for (let i = 0; i < base.length; i += batch) {
      const slice = base.slice(i, i + batch);
      const vectors = await embedTexts(slice.map((c) => c.text.slice(0, 6000)));
      vectors.forEach((v, j) => {
        base[i + j].embedding = v;
      });
    }
    fs.mkdirSync(path.dirname(INDEX_PATH), { recursive: true });
    fs.writeFileSync(INDEX_PATH, JSON.stringify(base));
  } catch {
    return base;
  }
  return base;
}

export async function searchKnowledge(query: string, k = 6) {
  const index = await ensureEmbeddedIndex();
  let scored: Array<KnowledgeChunk & { score: number }>;

  if (index.some((c) => c.embedding?.length) && process.env.OPENAI_API_KEY) {
    try {
      const [qVec] = await embedTexts([query]);
      scored = index.map((c) => ({
        ...c,
        score: c.embedding ? cosine(qVec, c.embedding) : lexicalScore(query, c.text),
      }));
    } catch {
      scored = index.map((c) => ({ ...c, score: lexicalScore(query, c.text) }));
    }
  } else {
    scored = index.map((c) => ({ ...c, score: lexicalScore(query, c.text) }));
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map(({ id, path: p, title, text, score }) => ({
      id,
      path: p,
      title,
      excerpt: text.slice(0, 700),
      score: Number(score.toFixed(4)),
    }));
}
