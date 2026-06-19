# SignalDesk AI

**Turn scattered feedback into evidence-backed product decisions.** Ingest user feedback, cluster pain points, find evidence, and generate PRDs, roadmaps, and experiment plans — **every claim cited**.

Part of [JP's AI portfolio](../jp-ai-portfolio). Built mock-first: the demo runs with **zero API keys** (deterministic embeddings, no DB).

> One-line pitch: *AI PM research-to-roadmap workspace.*

## Live demo

- _(deploying to Vercel — URL added at launch)_

## What it does

- **Import** feedback (paste, or CSV with a `text` column) — or load the sample dataset.
- **Cluster** it into themes with an opportunity score (size + negative-sentiment intensity).
- **Ask** questions over the feedback (RAG) with cited evidence.
- **Generate a PRD** grounded in a theme's feedback — guardrail: **≥2 citations** required.
- **Roadmap** (Now / Next / Later by opportunity) and **experiment plans**.
- **Metrics** view + Markdown export.

## How it works (RAG)

```
ingest → embed → cluster → score → retrieve → generate (cited)
```

- **Embed:** mock = deterministic TF-hashing vectors (no key); live = OpenAI `text-embedding-3-small`.
- **Cluster:** greedy cosine-similarity agglomeration — deterministic, so the same upload yields the same themes.
- **Generate:** PRDs/answers grounded in retrieved evidence; `claude-opus-4-8` in live mode.
- **Why two providers:** Anthropic has no embeddings API, so vectors come from OpenAI and generation from Claude. Mock mode removes both.

## Tech stack

Next.js 16 (App Router) · TypeScript · Tailwind v4 · OpenAI embeddings (live) · Anthropic SDK (live) · Supabase pgvector-ready · Vercel.

## Architecture

- `src/lib` — `embeddings` (mock + OpenAI), `cluster`, `rag` (retrieval), `generate` (server-only: PRD + ask), `derive` (client-safe roadmap/experiments), `pipeline` (parse → embed → cluster), `sample-data`, `analytics`.
- `src/app/api` — `POST /api/analyze`, `POST /api/ask`, `POST /api/prd`, `POST /api/feedback`.
- `src/components/workspace.tsx` — the interactive workspace (import → themes / ask / PRD / roadmap / metrics).

## Run locally

```bash
npm install
npm run dev      # http://localhost:3000 — mock mode, no keys
npm run lint && npx tsc --noEmit && npm run build
```

## Environment variables

See `.env.example` — all optional. `ANTHROPIC_API_KEY` + `OPENAI_API_KEY` enable live RAG. No secrets committed; `.env.local` is git-ignored.

## Deployment

Import into Vercel (Next.js preset). Optionally add the two keys for live mode. Mock mode needs no config.

## AI engineering skills demonstrated

RAG pipeline (ingest → embed → cluster → retrieve → generate), embeddings + cosine vector search, deterministic mock embeddings, citation-grounded generation with a ≥2-source guardrail, multi-provider integration.

## AI PM skills demonstrated

Research-to-roadmap workflow, opportunity scoring, evidence-first PRD generation, north-star + guardrail metric framework, experiment plans. See `AI_PM_CASE_STUDY.md`.
