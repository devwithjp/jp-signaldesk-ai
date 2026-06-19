"use client";

import { useState } from "react";
import type { Analysis, AskAnswer, Citation, Cluster, EmbeddedItem, PRD } from "@/lib/types";
import { buildRoadmap, buildExperiments } from "@/lib/derive";
import { sampleCsv } from "@/lib/sample-data";
import { track } from "@/lib/analytics";
import { apiPath } from "@/lib/base";

type Section = "themes" | "ask" | "prd" | "roadmap" | "metrics";

export function Workspace() {
  const [raw, setRaw] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [pool, setPool] = useState<EmbeddedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [section, setSection] = useState<Section>("themes");

  async function analyze(input: string) {
    setLoading(true);
    setError(null);
    track("demo_started", {});
    try {
      const res = await fetch(apiPath("/api/analyze"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ raw: input, mode: "mock" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Analysis failed");
      setAnalysis(data.analysis);
      setPool(data.pool);
      setSection("themes");
      track("core_action_completed", { items: data.analysis.itemCount, themes: data.analysis.clusters.length });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed");
      track("error_seen", { where: "analyze" });
    } finally {
      setLoading(false);
    }
  }

  if (!analysis) {
    return (
      <ImportPanel
        raw={raw}
        setRaw={setRaw}
        loading={loading}
        error={error}
        onSample={() => analyze(sampleCsv)}
        onAnalyze={() => analyze(raw)}
      />
    );
  }

  const idToText = new Map(pool.map((p) => [p.id, p.text]));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1 rounded-full border border-line bg-surface p-1">
          {(["themes", "ask", "prd", "roadmap", "metrics"] as Section[]).map((s) => (
            <button
              key={s}
              onClick={() => setSection(s)}
              className={`rounded-full px-4 py-2 text-sm font-medium capitalize transition-colors ${
                section === s ? "bg-accent text-accent-fg" : "text-muted hover:text-fg"
              }`}
            >
              {s === "prd" ? "PRD" : s}
            </button>
          ))}
        </div>
        <button
          onClick={() => {
            setAnalysis(null);
            setPool([]);
          }}
          className="text-sm text-muted hover:text-fg"
        >
          ← New import
        </button>
      </div>

      {section === "themes" ? <Themes analysis={analysis} idToText={idToText} /> : null}
      {section === "ask" ? <Ask pool={pool} /> : null}
      {section === "prd" ? <PRDPanel clusters={analysis.clusters} pool={pool} /> : null}
      {section === "roadmap" ? <Roadmap clusters={analysis.clusters} /> : null}
      {section === "metrics" ? <Metrics analysis={analysis} /> : null}
    </div>
  );
}

function ImportPanel({
  raw,
  setRaw,
  loading,
  error,
  onSample,
  onAnalyze,
}: {
  raw: string;
  setRaw: (v: string) => void;
  loading: boolean;
  error: string | null;
  onSample: () => void;
  onAnalyze: () => void;
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-6">
      <h2 className="text-lg font-semibold tracking-tight">Import feedback</h2>
      <p className="mt-1 text-sm text-muted">
        Paste feedback (one per line) or a CSV with a <span className="font-mono">text</span> column. Or
        load the sample dataset.
      </p>
      <textarea
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        rows={8}
        placeholder="The onboarding was confusing...&#10;The app is too slow...&#10;Pricing is expensive..."
        className="mt-4 w-full resize-y rounded-lg border border-line bg-bg p-3 font-mono text-sm outline-none focus:border-accent/50"
      />
      {error ? <p className="mt-3 text-sm text-muted">⚠ {error}</p> : null}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          onClick={onAnalyze}
          disabled={loading || raw.trim().length === 0}
          className="inline-flex h-11 items-center rounded-full bg-accent px-6 text-sm font-medium text-accent-fg disabled:opacity-50"
        >
          {loading ? "Analyzing…" : "Analyze feedback"}
        </button>
        <button
          onClick={onSample}
          disabled={loading}
          className="inline-flex h-11 items-center rounded-full border border-line px-5 text-sm hover:bg-elevated disabled:opacity-50"
        >
          Load sample dataset
        </button>
        <span className="font-mono text-xs text-muted">embed → cluster → score · mock mode, no key</span>
      </div>
    </div>
  );
}

function sentimentColor(s: number) {
  if (s <= -0.3) return "text-fg";
  if (s >= 0.3) return "text-muted";
  return "text-muted";
}

function Themes({ analysis, idToText }: { analysis: Analysis; idToText: Map<string, string> }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        {analysis.itemCount} feedback items grouped into {analysis.clusters.length} themes, ranked by
        opportunity score.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {analysis.clusters.map((c) => (
          <div key={c.id} className="rounded-xl border border-line bg-surface p-5">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-semibold tracking-tight">{c.label}</h3>
              <span className="flex-none rounded-full bg-accent px-2.5 py-1 font-mono text-xs text-accent-fg">
                {c.opportunityScore}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5 font-mono text-[11px] text-muted">
              <span className="rounded-full border border-line px-2 py-0.5">{c.size} items</span>
              <span className={`rounded-full border border-line px-2 py-0.5 ${sentimentColor(c.avgSentiment)}`}>
                sentiment {c.avgSentiment.toFixed(2)}
              </span>
              {c.keywords.map((k) => (
                <span key={k} className="rounded-full border border-line px-2 py-0.5">
                  {k}
                </span>
              ))}
            </div>
            <ul className="mt-3 space-y-1.5">
              {c.itemIds.slice(0, 2).map((id) => (
                <li key={id} className="flex gap-2 text-sm text-muted">
                  <span className="mt-2 h-1 w-1 flex-none rounded-full bg-accent" />
                  <span className="leading-relaxed">“{idToText.get(id)}”</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function CitationList({ citations }: { citations: Citation[] }) {
  return (
    <ul className="mt-3 space-y-1.5">
      {citations.map((c, i) => (
        <li key={i} className="flex gap-2 text-sm text-muted">
          <span className="mt-0.5 font-mono text-xs text-accent">[{i + 1}]</span>
          <span className="leading-relaxed">
            “{c.text}” {c.source ? <span className="text-muted/70">· {c.source}</span> : null}
          </span>
        </li>
      ))}
    </ul>
  );
}

function Ask({ pool }: { pool: EmbeddedItem[] }) {
  const [q, setQ] = useState("");
  const [ans, setAns] = useState<AskAnswer | null>(null);
  const [loading, setLoading] = useState(false);

  async function run() {
    if (!q.trim()) return;
    setLoading(true);
    setAns(null);
    const res = await fetch(apiPath("/api/ask"), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ question: q, pool, mode: "mock" }),
    });
    const data = await res.json();
    setAns(data);
    setLoading(false);
    track("ai_output_generated", { kind: "ask" });
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">Ask a question; answers are grounded in retrieved feedback (RAG) with citations.</p>
      <div className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && run()}
          placeholder="What do users complain about most?"
          className="h-11 flex-1 rounded-full border border-line bg-bg px-4 text-sm outline-none focus:border-accent/50"
        />
        <button
          onClick={run}
          disabled={loading || !q.trim()}
          className="inline-flex h-11 items-center rounded-full bg-accent px-5 text-sm font-medium text-accent-fg disabled:opacity-50"
        >
          {loading ? "…" : "Ask"}
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {["What do users complain about most?", "Is pricing an issue?", "What do users like?"].map((s) => (
          <button key={s} onClick={() => setQ(s)} className="rounded-full border border-line px-3 py-1 text-xs text-muted hover:text-fg">
            {s}
          </button>
        ))}
      </div>
      {ans ? (
        <div className="rounded-xl border border-line bg-surface p-5">
          <p className="leading-relaxed">{ans.answer}</p>
          {ans.citations.length ? (
            <>
              <div className="mt-4 font-mono text-xs uppercase tracking-wider text-accent">Evidence</div>
              <CitationList citations={ans.citations} />
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function PRDPanel({ clusters, pool }: { clusters: Cluster[]; pool: EmbeddedItem[] }) {
  const [selected, setSelected] = useState<string>(clusters[0]?.id ?? "");
  const [prd, setPrd] = useState<PRD | null>(null);
  const [loading, setLoading] = useState(false);
  const [rated, setRated] = useState(false);

  async function gen() {
    const cluster = clusters.find((c) => c.id === selected);
    if (!cluster) return;
    setLoading(true);
    setPrd(null);
    setRated(false);
    const res = await fetch(apiPath("/api/prd"), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ cluster, pool, mode: "mock" }),
    });
    const data = await res.json();
    setPrd(data.prd);
    setLoading(false);
    track("ai_output_generated", { kind: "prd" });
  }

  async function rate(n: number) {
    await fetch(apiPath("/api/feedback"), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ rating: n, on: "prd" }),
    });
    setRated(true);
    track("feedback_submitted", { rating: n });
  }

  function exportMd() {
    if (!prd) return;
    const md = `# ${prd.title}\n\n## Problem\n${prd.problem}\n\n## Evidence\n${prd.evidence
      .map((e, i) => `${i + 1}. "${e.text}"${e.source ? ` (${e.source})` : ""}`)
      .join("\n")}\n\n## Proposal\n${prd.proposal}\n\n## Success metric\n${prd.successMetric}\n\n## Risks\n${prd.risks
      .map((r) => `- ${r}`)
      .join("\n")}\n`;
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "prd.md";
    a.click();
    URL.revokeObjectURL(url);
    track("export_clicked", { kind: "prd" });
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Generate a PRD grounded in a theme&apos;s feedback. Guardrail: every PRD cites ≥2 sources.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="h-11 rounded-full border border-line bg-bg px-4 text-sm outline-none focus:border-accent/50"
        >
          {clusters.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label} ({c.size})
            </option>
          ))}
        </select>
        <button
          onClick={gen}
          disabled={loading}
          className="inline-flex h-11 items-center rounded-full bg-accent px-5 text-sm font-medium text-accent-fg disabled:opacity-50"
        >
          {loading ? "Generating…" : "Generate PRD"}
        </button>
        {prd ? (
          <button onClick={exportMd} className="inline-flex h-11 items-center rounded-full border border-line px-5 text-sm hover:bg-elevated">
            Export .md
          </button>
        ) : null}
      </div>

      {prd ? (
        <article className="rounded-xl border border-line bg-surface p-6">
          <h3 className="text-xl font-semibold tracking-tight">{prd.title}</h3>
          <Section h="Problem">{prd.problem}</Section>
          <div className="mt-4">
            <div className="font-mono text-xs uppercase tracking-wider text-accent">Evidence ({prd.evidence.length} cited)</div>
            <CitationList citations={prd.evidence} />
          </div>
          <Section h="Proposal">{prd.proposal}</Section>
          <Section h="Success metric">{prd.successMetric}</Section>
          <div className="mt-4">
            <div className="font-mono text-xs uppercase tracking-wider text-accent">Risks</div>
            <ul className="mt-2 space-y-1.5">
              {prd.risks.map((r, i) => (
                <li key={i} className="flex gap-2 text-sm text-muted">
                  <span className="mt-2 h-1 w-1 flex-none rounded-full bg-accent" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-6 flex items-center gap-3 border-t border-line pt-4">
            {rated ? (
              <span className="text-sm text-muted">Thanks — feedback recorded.</span>
            ) : (
              <>
                <span className="text-sm text-muted">Useful?</span>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} onClick={() => rate(n)} className="h-8 w-8 rounded-full border border-line text-sm text-muted hover:border-accent hover:text-fg">
                    {n}
                  </button>
                ))}
              </>
            )}
          </div>
        </article>
      ) : null}
    </div>
  );
}

function Section({ h, children }: { h: string; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <div className="font-mono text-xs uppercase tracking-wider text-accent">{h}</div>
      <p className="mt-1 leading-relaxed text-muted">{children}</p>
    </div>
  );
}

function Roadmap({ clusters }: { clusters: Cluster[] }) {
  const roadmap = buildRoadmap(clusters);
  const experiments = buildExperiments(clusters);
  const horizons = ["Now", "Next", "Later"] as const;
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-medium text-muted">Roadmap (by opportunity score)</h3>
        <div className="mt-3 grid gap-4 md:grid-cols-3">
          {horizons.map((h) => (
            <div key={h} className="rounded-xl border border-line bg-surface p-4">
              <div className="font-mono text-xs uppercase tracking-wider text-accent">{h}</div>
              <div className="mt-3 space-y-2">
                {roadmap.filter((r) => r.horizon === h).map((r) => (
                  <div key={r.clusterId} className="rounded-lg border border-line bg-bg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{r.title}</span>
                      <span className="font-mono text-xs text-muted">{r.opportunityScore}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted">{r.rationale}</p>
                  </div>
                ))}
                {roadmap.filter((r) => r.horizon === h).length === 0 ? (
                  <p className="text-xs text-muted/60">—</p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-sm font-medium text-muted">Experiment plans (top themes)</h3>
        <div className="mt-3 space-y-3">
          {experiments.map((e) => (
            <div key={e.clusterId} className="rounded-xl border border-line bg-surface p-4">
              <div className="text-sm"><span className="text-accent">Hypothesis:</span> {e.hypothesis}</div>
              <div className="mt-1 text-sm text-muted"><span className="text-fg">Variant:</span> {e.variant}</div>
              <div className="mt-1 text-sm text-muted"><span className="text-fg">Success:</span> {e.successCriteria}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Metrics({ analysis }: { analysis: Analysis }) {
  const top = analysis.clusters[0];
  const cards = [
    { k: "North star", v: "—", d: "Validated opportunities → PRDs (tracked over time)" },
    { k: "Feedback analyzed", v: String(analysis.itemCount), d: "items this session" },
    { k: "Themes found", v: String(analysis.clusters.length), d: "clusters ≥ 2 items" },
    { k: "Top opportunity", v: top ? `${top.opportunityScore}` : "—", d: top ? top.label : "" },
    { k: "Quality", v: "100%", d: "PRDs with ≥2 evidence links (guardrail enforced)" },
    { k: "Ungrouped", v: `${Math.round(analysis.unsupportedRate * 100)}%`, d: "feedback not in a supported theme" },
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((c) => (
        <div key={c.k} className="rounded-xl border border-line bg-surface p-5">
          <div className="font-mono text-xs uppercase tracking-wider text-accent">{c.k}</div>
          <div className="mt-2 text-2xl font-semibold tracking-tight">{c.v}</div>
          <div className="mt-1 text-sm text-muted">{c.d}</div>
        </div>
      ))}
    </div>
  );
}
