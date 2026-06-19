import type { Cluster, Experiment, RoadmapItem } from "./types";

// Pure, client-safe derivations from clusters (no model call, no SDK import) — roadmap
// and experiments are structured outputs of the opportunity scoring, identical in mock
// and live mode.

export function buildRoadmap(clusters: Cluster[]): RoadmapItem[] {
  const third = Math.ceil(clusters.length / 3);
  return clusters.map((c, i) => ({
    clusterId: c.id,
    title: `Address "${c.label}"`,
    horizon: i < third ? "Now" : i < 2 * third ? "Next" : "Later",
    opportunityScore: c.opportunityScore,
    rationale: `${c.size} pieces of feedback, avg sentiment ${c.avgSentiment.toFixed(2)} · opportunity ${c.opportunityScore}/100.`,
  }));
}

export function buildExperiments(clusters: Cluster[]): Experiment[] {
  return clusters.slice(0, 3).map((c) => ({
    clusterId: c.id,
    hypothesis: `Improving "${c.label}" will reduce negative feedback in this theme and lift retention for affected users.`,
    variant: `Ship a targeted change for ${c.label.toLowerCase()} to a 50% holdout.`,
    successCriteria: `Theme complaint rate drops ≥20% with no guardrail-metric regression over 2 weeks.`,
  }));
}
