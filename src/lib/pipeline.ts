import type { Analysis, EmbeddedItem, FeedbackItem } from "./types";
import { mockEmbed, sentiment, liveEmbeddingsAvailable, liveEmbed } from "./embeddings";
import { clusterItems } from "./cluster";

// Parse raw input into feedback items. Accepts CSV (with a `text`/`feedback` column and
// optional `source`/`date`) or plain text (one item per non-empty line).
export function parseFeedback(raw: string): FeedbackItem[] {
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];

  const header = lines[0].toLowerCase();
  const looksCsv = header.includes(",") && /(text|feedback|comment|review)/.test(header);

  if (looksCsv) {
    const cols = splitCsvLine(lines[0]).map((c) => c.toLowerCase());
    const ti = cols.findIndex((c) => /(text|feedback|comment|review)/.test(c));
    const si = cols.findIndex((c) => c.includes("source") || c.includes("channel"));
    const di = cols.findIndex((c) => c.includes("date"));
    const items: FeedbackItem[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cells = splitCsvLine(lines[i]);
      const text = (cells[ti] ?? "").trim();
      if (!text) continue;
      items.push({
        id: `f${i}`,
        text,
        source: si >= 0 ? cells[si]?.trim() : undefined,
        date: di >= 0 ? cells[di]?.trim() : undefined,
      });
    }
    return items;
  }

  return lines.map((text, i) => ({ id: `f${i + 1}`, text }));
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQ && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else inQ = !inQ;
    } else if (ch === "," && !inQ) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

export async function embedAll(items: FeedbackItem[], mode: "mock" | "live"): Promise<EmbeddedItem[]> {
  if (mode === "live" && liveEmbeddingsAvailable()) {
    const vectors = await liveEmbed(items.map((i) => i.text));
    return items.map((it, i) => ({ ...it, vector: vectors[i], sentiment: sentiment(it.text) }));
  }
  return items.map((it) => ({ ...it, vector: mockEmbed(it.text), sentiment: sentiment(it.text) }));
}

export async function analyze(
  items: FeedbackItem[],
  mode: "mock" | "live"
): Promise<{ analysis: Analysis; pool: EmbeddedItem[] }> {
  const usingLive = mode === "live" && liveEmbeddingsAvailable();
  const pool = await embedAll(items, mode);
  const clusters = clusterItems(pool);
  const grouped = clusters.reduce((a, c) => a + c.size, 0);
  const ungrouped = Math.max(0, items.length - grouped);
  const analysis: Analysis = {
    mode: usingLive ? "live" : "mock",
    itemCount: items.length,
    clusters,
    unsupportedRate: items.length ? Math.round((ungrouped / items.length) * 100) / 100 : 0,
  };
  return { analysis, pool };
}
