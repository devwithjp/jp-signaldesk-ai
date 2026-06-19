import type { Cluster, EmbeddedItem } from "./types";
import { cosine, tokenize } from "./embeddings";

const THRESHOLD = 0.34; // cosine similarity to join a cluster (tuned for hashing vectors)
const MIN_SIZE = 2;

type Bucket = { centroid: number[]; itemIds: string[]; sum: number[] };

function add(b: Bucket, item: EmbeddedItem) {
  b.itemIds.push(item.id);
  for (let i = 0; i < item.vector.length; i++) b.sum[i] += item.vector[i];
  const mag = Math.sqrt(b.sum.reduce((a, x) => a + x * x, 0)) || 1;
  b.centroid = b.sum.map((x) => x / mag);
}

// Greedy single-pass agglomerative clustering by cosine similarity. Deterministic given
// deterministic embeddings + item order — the same upload always yields the same themes.
export function clusterItems(items: EmbeddedItem[]): Cluster[] {
  const buckets: Bucket[] = [];
  for (const item of items) {
    let best = -1;
    let bestSim = THRESHOLD;
    for (let i = 0; i < buckets.length; i++) {
      const sim = cosine(item.vector, buckets[i].centroid);
      if (sim >= bestSim) {
        bestSim = sim;
        best = i;
      }
    }
    if (best >= 0) {
      add(buckets[best], item);
    } else {
      const b: Bucket = { centroid: item.vector.slice(), itemIds: [], sum: new Array(item.vector.length).fill(0) };
      add(b, item);
      buckets.push(b);
    }
  }

  const byId = new Map(items.map((it) => [it.id, it]));
  const maxSize = Math.max(...buckets.map((b) => b.itemIds.length), 1);

  const clusters: Cluster[] = buckets
    .filter((b) => b.itemIds.length >= MIN_SIZE)
    .map((b, idx) => {
      const members = b.itemIds.map((id) => byId.get(id)!);
      const keywords = topKeywords(members.map((m) => m.text), 3);
      const avgSentiment = members.reduce((a, m) => a + m.sentiment, 0) / members.length;
      const sizeNorm = b.itemIds.length / maxSize;
      const negIntensity = (1 - avgSentiment) / 2; // -1→1 (most negative), 1→0
      const opportunityScore = Math.round(100 * (0.6 * sizeNorm + 0.4 * negIntensity));
      return {
        id: `cl_${idx + 1}`,
        label: labelFrom(keywords),
        keywords,
        itemIds: b.itemIds,
        size: b.itemIds.length,
        avgSentiment: Math.round(avgSentiment * 100) / 100,
        opportunityScore,
      };
    });

  return clusters.sort((a, b) => b.opportunityScore - a.opportunityScore);
}

function topKeywords(texts: string[], k: number): string[] {
  const counts = new Map<string, number>();
  for (const t of texts) for (const w of tokenize(t)) counts.set(w, (counts.get(w) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, k)
    .map(([w]) => w);
}

function labelFrom(keywords: string[]): string {
  if (keywords.length === 0) return "Uncategorized";
  const cap = (w: string) => w.charAt(0).toUpperCase() + w.slice(1);
  return keywords.slice(0, 2).map(cap).join(" & ");
}
