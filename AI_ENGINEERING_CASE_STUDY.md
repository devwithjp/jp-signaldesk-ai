# AI Engineering Case Study — SignalDesk AI

**Problem.** Product teams drown in scattered qualitative feedback; generic LLM summaries hallucinate and cite nothing.

**RAG architecture.** ingest → chunk/embed → cluster → retrieve → generate, with every recommendation grounded in retrieved snippets.
- **Embeddings** (`embeddings.ts`): deterministic TF-hashing vectors in mock mode (meaningful cosine similarity, zero keys); OpenAI `text-embedding-3-small` in live mode.
- **Clustering** (`cluster.ts`): greedy single-pass cosine agglomeration — deterministic given the embeddings, so the same upload always yields the same themes. Opportunity score = size + negative-sentiment intensity.
- **Retrieval** (`rag.ts`): cosine top-k over the embedded pool → citations.
- **Generation** (`generate.ts`): `claude-opus-4-8` with retrieved evidence and a strict JSON PRD schema in live mode; templated-from-evidence in mock mode. Hard guardrail: a PRD needs ≥2 cited sources or it isn't produced.

**Trade-offs.**
- Anthropic has no embeddings API, so live mode adds OpenAI for vectors only; mock mode removes even that.
- The embedded pool round-trips through the client (serverless-safe statelessness) rather than relying on a server session.
- No stemming in the mock embedder — realistic; items with different surface words may fall into the long tail (surfaced as "ungrouped" in metrics).

**What I'd improve next.** Supabase pgvector persistence; HDBSCAN-style clustering; per-cluster sub-theme splitting; streaming generation; an eval loop scoring citation faithfulness.

**Interview talking points.** Enforcing grounding (≥2 citations); the two-provider split; turning qualitative feedback into a quantified opportunity score.
