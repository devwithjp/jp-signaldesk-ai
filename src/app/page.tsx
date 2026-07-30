import { app } from "@/lib/site";
import { Container, Section, Eyebrow } from "@/components/ui";
import { Workspace } from "@/components/workspace";

export default function Home() {
  return (
    <>
      <div className="relative overflow-hidden border-b border-line">
        <div className="bg-grid absolute inset-0 -z-10" aria-hidden />
        <div className="accent-glow absolute inset-0 -z-10" aria-hidden />
        <Container className="py-16 sm:py-20">
          <div className="max-w-3xl">
            <Eyebrow>RAG · Product strategy</Eyebrow>
            <h1 className="mt-4 font-display text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
              {app.tagline}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">{app.description}</p>
            <p className="mt-4 font-mono text-xs text-muted">
              Mock mode — deterministic embeddings, no key. Set OPENAI_API_KEY + ANTHROPIC_API_KEY for real RAG.
            </p>
          </div>
        </Container>
      </div>

      <Section>
        <Workspace />
      </Section>
    </>
  );
}
