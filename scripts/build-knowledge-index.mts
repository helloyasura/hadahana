import { ensureEmbeddedIndex } from "../src/lib/agent/rag";

const index = await ensureEmbeddedIndex();
console.log(`Indexed ${index.length} chunks (embeddings: ${Boolean(index[0]?.embedding)})`);
