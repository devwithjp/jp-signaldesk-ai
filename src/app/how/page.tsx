import type { Metadata } from "next";
import { Section, SectionHeader, Eyebrow } from "@/components/ui";

export const metadata: Metadata = {
  title: "How it works",
  description: "The SignalDesk RAG pipeline: ingest → embed → cluster → retrieve → generate, every claim cited.",
};

const steps = [
  { n: "1", t: "Ingest", d: "Paste feedback or upload a CSV. The parser handles a text column plus optional source/date." },
  { n: "2", t: "Embed", d: "Each item becomes a vector. Mock mode uses deterministic TF-hashing embeddings; live mode uses OpenAI text-embedding-3-small." },
  { n: "3", t: "Cluster", d: "Greedy cosine-similarity clustering groups feedback into themes — deterministic, so the same upload yields the same themes." },
  { n: "4", t: "Score", d: "Each theme gets an opportunity score from size + negative-sentiment intensity." },
  { n: "5", t: "Retrieve", d: "For a question or a PRD, cosine search fetches the most relevant feedback as cited evidence (the R in RAG)." },
  { n: "6", t: "Generate", d: "PRDs and answers are generated grounded in the retrieved evidence (claude-opus-4-8 in live mode), with a ≥2-citation guardrail." },
];

export default function HowPage() {
  return (
    <Section>
      <SectionHeader
        eyebrow="How it works"
        title="From raw feedback to a cited PRD"
        intro="A retrieval-augmented pipeline where every generated recommendation is grounded in real user quotes — the citation trail is the product."
      />
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {steps.map((s) => (
          <div key={s.n} className="flex gap-4 rounded-xl border border-line bg-surface p-5">
            <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full border border-line bg-elevated font-mono text-sm text-accent">
              {s.n}
            </span>
            <div>
              <div className="font-medium">{s.t}</div>
              <p className="mt-1 text-sm leading-relaxed text-muted">{s.d}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 max-w-2xl">
        <Eyebrow>Why two providers</Eyebrow>
        <p className="mt-3 leading-relaxed text-muted">
          Anthropic has no first-party embeddings API, so live mode uses OpenAI for vectors and
          Claude (<span className="font-mono text-fg">claude-opus-4-8</span>) for generation. Mock mode
          removes both — deterministic hashing vectors mean the demo runs with zero keys.
        </p>
        <Eyebrow>Why citations are a guardrail</Eyebrow>
        <p className="mt-3 leading-relaxed text-muted">
          An evidence-first tool lives or dies on trust. Every PRD must cite at least two sources; the
          generator refuses otherwise. The metrics view tracks the share of feedback that couldn&apos;t be
          grounded into a supported theme.
        </p>
      </div>
    </Section>
  );
}
