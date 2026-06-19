import Anthropic from "@anthropic-ai/sdk";
import type { AskAnswer, Citation, Cluster, EmbeddedItem, PRD } from "./types";
import { clusterCitations, retrieve } from "./rag";
import { mockEmbed } from "./embeddings";

// Server-only generation (imports the Anthropic SDK). Pure derivations (roadmap,
// experiments) live in derive.ts so the client never bundles the SDK.

export function liveGenerationAvailable(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

let client: Anthropic | null = null;
const getClient = () => (client ??= new Anthropic());

// ---- PRD: mock-templated grounded in citations, or Claude in live mode ----

const CITATION_GUARD = 2; // a recommendation must cite ≥2 sources

export async function generatePRD(
  cluster: Cluster,
  pool: EmbeddedItem[],
  mode: "mock" | "live"
): Promise<PRD> {
  const evidence = clusterCitations(cluster.itemIds, pool, 3);
  if (evidence.length < CITATION_GUARD) {
    throw new Error("Insufficient evidence: a PRD needs at least 2 cited sources.");
  }

  if (mode === "live" && liveGenerationAvailable()) {
    return livePRD(cluster, evidence);
  }

  return {
    title: `Improve ${cluster.label}`,
    problem: `Users repeatedly raise issues around "${cluster.label}" (${cluster.size} mentions, avg sentiment ${cluster.avgSentiment.toFixed(2)}). This theme scores ${cluster.opportunityScore}/100 on opportunity.`,
    evidence,
    proposal: `Scope a focused improvement to the "${cluster.label}" experience. Start with the highest-frequency pain points in the evidence, ship behind a flag, and measure against the success metric below.`,
    successMetric: `Reduce negative "${cluster.label}" feedback by ≥20% and improve theme sentiment within one release.`,
    risks: [
      "Theme may bundle distinct sub-problems — validate with a quick follow-up survey.",
      "Small sample for some sub-themes; confirm before over-investing.",
    ],
  };
}

async function livePRD(cluster: Cluster, evidence: Citation[]): Promise<PRD> {
  const schema = {
    type: "object",
    properties: {
      title: { type: "string" },
      problem: { type: "string" },
      proposal: { type: "string" },
      successMetric: { type: "string" },
      risks: { type: "array", items: { type: "string" } },
    },
    required: ["title", "problem", "proposal", "successMetric", "risks"],
    additionalProperties: false,
  };
  const prompt = `You are an AI PM. Using ONLY the cited user feedback below, draft a focused PRD for the theme "${cluster.label}". Do not invent facts beyond the evidence.\n\nEVIDENCE:\n${evidence.map((e, i) => `[${i + 1}] ${e.text}`).join("\n")}\n\nReturn a PRD: title, problem (grounded in evidence), proposal, a measurable success metric, and 2–3 risks.`;
  const res = await getClient().messages.create({
    model: "claude-opus-4-8",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
    output_config: { format: { type: "json_schema", schema } },
  } as unknown as Anthropic.MessageCreateParamsNonStreaming);
  const text = res.content.find((b) => b.type === "text") as Anthropic.TextBlock;
  const parsed = JSON.parse(text.text) as Omit<PRD, "evidence">;
  return { ...parsed, evidence };
}

// ---- Ask over feedback (RAG Q&A) ----

export async function ask(
  question: string,
  pool: EmbeddedItem[],
  mode: "mock" | "live"
): Promise<AskAnswer> {
  const citations = retrieve(mockEmbed(question), pool, 4);
  if (mode === "live" && liveGenerationAvailable()) {
    const prompt = `Answer the question using ONLY the cited user feedback. If the feedback doesn't cover it, say so.\n\nQUESTION: ${question}\n\nFEEDBACK:\n${citations.map((c, i) => `[${i + 1}] ${c.text}`).join("\n")}`;
    const res = await getClient().messages.create({
      model: "claude-opus-4-8",
      max_tokens: 600,
      messages: [{ role: "user", content: prompt }],
    });
    const text = res.content.filter((b): b is Anthropic.TextBlock => b.type === "text").map((b) => b.text).join("\n");
    return { answer: text, citations };
  }
  // Mock: synthesize a grounded answer from the retrieved snippets.
  const answer = citations.length
    ? `Based on ${citations.length} relevant feedback items, users mention: ${citations.map((c) => `"${c.text.slice(0, 80)}${c.text.length > 80 ? "…" : ""}"`).join("; ")}. The strongest signal relates to ${citations[0].text.slice(0, 60)}…`
    : "No relevant feedback found for that question.";
  return { answer, citations };
}
