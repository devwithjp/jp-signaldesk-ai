// Embeddings: deterministic mock vectors (TF hashing) so clustering and retrieval work
// with zero keys, plus a real OpenAI adapter (text-embedding-3-small) for live mode.
// Anthropic has no first-party embeddings API, so RAG uses OpenAI for vectors only.

const DIM = 96;

const STOP = new Set(
  "the a an and or but to of in on for with is are was it this that i we you they my our your their not no so very just really".split(" ")
);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w));
}

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Deterministic TF-hashing embedding: meaningful cosine similarity (shared words →
// closer vectors) without any model call.
export function mockEmbed(text: string): number[] {
  const v = new Array(DIM).fill(0);
  for (const w of tokenize(text)) {
    v[hashStr(w) % DIM] += 1;
  }
  return normalize(v);
}

function normalize(v: number[]): number[] {
  const mag = Math.sqrt(v.reduce((a, x) => a + x * x, 0)) || 1;
  return v.map((x) => x / mag);
}

export function cosine(a: number[], b: number[]): number {
  let dot = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) dot += a[i] * b[i];
  return dot; // inputs are normalized
}

const POS = new Set("love great good excellent amazing easy fast helpful nice perfect smooth happy".split(" "));
const NEG = new Set("hate bad terrible awful slow broken confusing crash bug error fail expensive frustrating annoying difficult hard wrong missing".split(" "));

export function sentiment(text: string): number {
  let s = 0;
  for (const w of tokenize(text)) {
    if (POS.has(w)) s += 1;
    if (NEG.has(w)) s -= 1;
  }
  return Math.max(-1, Math.min(1, s / 3));
}

export function liveEmbeddingsAvailable(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

// Real embeddings via OpenAI. Dynamically imported so mock mode never needs the dep at
// runtime. Returns mock vectors as a fallback if the call fails.
export async function liveEmbed(texts: string[]): Promise<number[][]> {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({ model: "text-embedding-3-small", input: texts }),
  });
  if (!res.ok) throw new Error(`OpenAI embeddings failed: ${res.status}`);
  const data = (await res.json()) as { data: { embedding: number[] }[] };
  return data.data.map((d) => d.embedding);
}
