import type { Cluster, EmbeddedItem } from "./types";
import { cosine, rawTokenize, stem } from "./embeddings";

const THRESHOLD = 0.34; // cosine similarity to join a cluster (tuned for hashing vectors)
const MIN_SIZE = 2;
const PRAISE_MIN = 0.15; // above this an item is praise, not a pain point

// Curated, human labels for common product-feedback themes. The mock pipeline is
// deterministic, so a term-frequency lookup maps clusters to stable, readable names;
// clusters that match nothing fall back to a keyword-derived label.
const CURATED_LABELS: { label: string; terms: string[] }[] = [
  { label: "Onboarding confusion", terms: ["onboarding", "setup", "signup", "started", "steps", "tutorial"] },
  { label: "Slow performance", terms: ["slow", "slowly", "performance", "loading", "loads", "lag", "spinner"] },
  { label: "Pricing & value", terms: ["pricing", "expensive", "cost", "price", "plan", "plans", "cheapest", "subscription"] },
  { label: "Crashes & reliability", terms: ["crash", "crashes", "crashing", "bug", "bugs", "error", "errors", "unreliable", "broken"] },
  { label: "Mobile feature gaps", terms: ["mobile", "phone", "android", "ios", "desktop"] },
  { label: "Search quality", terms: ["search", "results", "find", "finds", "filter"] },
  { label: "Support response time", terms: ["support", "respond", "response", "waited", "waiting", "days", "reply"] },
  { label: "Documentation gaps", terms: ["documentation", "docs", "guides", "examples", "basics"] },
  { label: "Feature requests", terms: ["please", "add", "wish", "request", "integration", "integrations"] },
];

const PRAISE_LABEL = "What users love";

// Words that are fine for similarity but too generic to headline a theme.
const LABEL_STOP = new Set(
  "need needs needed will would can half app work time times never feel feels many gave before".split(" ").map(stem)
);

type Bucket = { centroid: number[]; itemIds: string[]; sum: number[] };

function add(b: Bucket, item: EmbeddedItem) {
  b.itemIds.push(item.id);
  for (let i = 0; i < item.vector.length; i++) b.sum[i] += item.vector[i];
  const mag = Math.sqrt(b.sum.reduce((a, x) => a + x * x, 0)) || 1;
  b.centroid = b.sum.map((x) => x / mag);
}

// Greedy single-pass agglomerative clustering by cosine similarity. Deterministic given
// deterministic embeddings + item order — the same upload always yields the same themes.
// Positive items are split out first: praise must never appear as evidence inside a
// negative pain-point theme, so it gets its own "What users love" bucket.
export function clusterItems(items: EmbeddedItem[]): Cluster[] {
  const praise = items.filter((it) => it.sentiment > PRAISE_MIN);
  const rest = items.filter((it) => it.sentiment <= PRAISE_MIN);

  const buckets: Bucket[] = [];
  for (const item of rest) {
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
  const maxSize = Math.max(...buckets.map((b) => b.itemIds.length), praise.length, 1);

  const clusters: Cluster[] = buckets
    .filter((b) => b.itemIds.length >= MIN_SIZE)
    .map((b, idx) => makeCluster(`cl_${idx + 1}`, b.itemIds.map((id) => byId.get(id)!), maxSize, false));

  if (praise.length >= MIN_SIZE) {
    clusters.push(makeCluster("cl_praise", praise, maxSize, true));
  }

  return clusters.sort((a, b) => b.opportunityScore - a.opportunityScore);
}

function makeCluster(id: string, members: EmbeddedItem[], maxSize: number, isPraise: boolean): Cluster {
  const { counts, forms } = termStats(members.map((m) => m.text));
  const keywords = topKeywords(counts, forms, 3);
  const avgSentiment = members.reduce((a, m) => a + m.sentiment, 0) / members.length;
  const sizeNorm = members.length / maxSize;
  // Praise is not a pain-point opportunity — rank it by volume only.
  const negIntensity = isPraise ? 0 : (1 - avgSentiment) / 2; // -1→1 (most negative), 1→0
  const opportunityScore = Math.round(100 * (0.6 * sizeNorm + 0.4 * negIntensity));
  return {
    id,
    label: isPraise ? PRAISE_LABEL : curatedLabel(counts) ?? labelFrom(keywords),
    keywords,
    itemIds: members.map((m) => m.id),
    size: members.length,
    avgSentiment: Math.round(avgSentiment * 100) / 100,
    sentimentLabel: sentimentText(avgSentiment, members),
    opportunityScore,
  };
}

// Term counts by stem, plus each stem's most frequent surface form for display.
function termStats(texts: string[]) {
  const counts = new Map<string, number>();
  const forms = new Map<string, Map<string, number>>();
  for (const t of texts) {
    for (const w of rawTokenize(t)) {
      const s = stem(w);
      counts.set(s, (counts.get(s) ?? 0) + 1);
      const f = forms.get(s) ?? new Map<string, number>();
      f.set(w, (f.get(w) ?? 0) + 1);
      forms.set(s, f);
    }
  }
  return { counts, forms };
}

function topKeywords(counts: Map<string, number>, forms: Map<string, Map<string, number>>, k: number): string[] {
  return [...counts.entries()]
    .filter(([w]) => !LABEL_STOP.has(w))
    .sort((a, b) => b[1] - a[1])
    .slice(0, k)
    .map(([s]) => {
      const f = forms.get(s);
      return f ? [...f.entries()].sort((a, b) => b[1] - a[1])[0][0] : s;
    });
}

function curatedLabel(counts: Map<string, number>): string | null {
  let best: string | null = null;
  let bestScore = 1; // require at least 2 matching term occurrences
  for (const { label, terms } of CURATED_LABELS) {
    const score = terms.reduce((a, t) => a + (counts.get(stem(t)) ?? 0), 0);
    if (score > bestScore) {
      bestScore = score;
      best = label;
    }
  }
  return best;
}

function labelFrom(keywords: string[]): string {
  if (keywords.length === 0) return "Uncategorized";
  const cap = (w: string) => w.charAt(0).toUpperCase() + w.slice(1);
  return keywords.slice(0, 2).map(cap).join(" & ");
}

// Honest sentiment display: a near-zero mean reads as "mixed" (opposing signals) or
// "neutral" (no signal), never a bare 0.00 that looks like a bug.
function sentimentText(avg: number, members: EmbeddedItem[]): string {
  const r = Math.round(avg * 100) / 100;
  if (Math.abs(r) < 0.1) {
    const hasPos = members.some((m) => m.sentiment > 0);
    const hasNeg = members.some((m) => m.sentiment < 0);
    return hasPos && hasNeg ? "mixed" : "neutral";
  }
  return r > 0 ? `+${r.toFixed(2)}` : r.toFixed(2);
}
