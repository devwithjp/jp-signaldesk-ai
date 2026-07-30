import type { Citation, EmbeddedItem } from "./types";
import { cosine } from "./embeddings";

// Retrieve the top-k most similar feedback items to a query vector — the retrieval half
// of RAG. Returns citations (source-grounded snippets). `sentimentBias` lets opinion
// questions ("what do users complain about / like?") favor negative or positive items
// even when the question shares no vocabulary with the feedback.
export function retrieve(queryVec: number[], pool: EmbeddedItem[], k = 4, sentimentBias = 0): Citation[] {
  return [...pool]
    .map((it) => ({ it, score: cosine(queryVec, it.vector) + sentimentBias * it.sentiment }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .filter((x) => x.score > 0.05)
    .map((x) => ({ itemId: x.it.id, text: x.it.text, source: x.it.source }));
}

export function clusterCitations(itemIds: string[], pool: EmbeddedItem[], k = 3): Citation[] {
  const set = new Set(itemIds);
  return pool
    .filter((it) => set.has(it.id))
    .slice(0, k)
    .map((it) => ({ itemId: it.id, text: it.text, source: it.source }));
}
