// SignalDesk AI — domain types for the feedback → insight → PRD pipeline.

export type FeedbackItem = {
  id: string;
  text: string;
  source?: string; // e.g. "app review", "support", "survey"
  date?: string;
};

export type EmbeddedItem = FeedbackItem & {
  vector: number[];
  sentiment: number; // -1 (very negative) .. 1 (very positive)
};

export type Cluster = {
  id: string;
  label: string;
  keywords: string[];
  itemIds: string[];
  size: number;
  avgSentiment: number;
  sentimentLabel: string; // honest display form: "-0.47", "+0.44", "mixed", "neutral"
  opportunityScore: number; // 0–100
};

export type Citation = {
  itemId: string;
  text: string;
  source?: string;
};

export type PRD = {
  title: string;
  problem: string;
  evidence: Citation[];
  proposal: string;
  successMetric: string;
  risks: string[];
};

export type RoadmapItem = {
  clusterId: string;
  title: string;
  horizon: "Now" | "Next" | "Later";
  rationale: string;
  opportunityScore: number;
};

export type Experiment = {
  clusterId: string;
  hypothesis: string;
  variant: string;
  successCriteria: string;
};

export type AskAnswer = {
  answer: string;
  citations: Citation[];
};

export type Analysis = {
  mode: "mock" | "live";
  itemCount: number;
  clusters: Cluster[];
  unsupportedRate: number; // share of would-be recommendations lacking ≥2 citations
};
