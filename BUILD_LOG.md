# BUILD_LOG — jp-signaldesk-ai

## 2026-06-14

### Completed
- Scaffolded Next.js 16 + TS + Tailwind v4; synced golden core (design system, `ui`, `theme-toggle`, `analytics`, `next.config`) from the portfolio `_golden/`.
- RAG pipeline (`src/lib`): `embeddings` (deterministic TF-hashing mock + OpenAI live + cosine + sentiment), `cluster` (greedy cosine agglomeration + opportunity scoring), `rag` (top-k retrieval), `generate` (server-only: PRD + ask, mock-templated or claude-opus-4-8), `derive` (client-safe roadmap/experiments), `pipeline` (CSV/text parse → embed → cluster), `sample-data` (32 themed items).
- API: `POST /api/analyze`, `/api/ask`, `/api/prd`, `/api/feedback`.
- UI: interactive `workspace.tsx` (import → themes / ask / PRD / roadmap / metrics), dashboard hero, how-it-works.
- Docs: README, `.env.example`, CI, SECURITY, AI eng + AI PM case studies.

### Decisions
- **Mock embeddings = deterministic TF-hashing vectors** — meaningful cosine similarity with zero keys, so clustering + retrieval genuinely work in the demo. Verified end-to-end: 9 test items → 3 correct themes (onboarding / slow-loading / pricing); RAG ask returned 2 citations; PRD generated with the ≥2-citation guardrail satisfied.
- **Two providers in live mode** (OpenAI embeddings + Claude generation) because Anthropic has no embeddings API; mock mode removes both.
- **Embedded pool round-trips through the client** between `/api/analyze` and `/api/ask` + `/api/prd` — serverless-safe statelessness, no server session needed.
- **Roadmap/experiments are pure derivations in `derive.ts`** (no SDK import) so the client bundle never includes the Anthropic SDK.

### Status
- `npm run lint` clean (first pass); `npx tsc` clean; `npm run build` passes (4 API routes + pages). Pipeline verified via live API test.

### Notes / gotchas
- A zombie AgentEval dev server held port 3000 during testing; killed all `next-server` processes and confirmed SignalDesk owns 3000 before re-testing. (When testing multiple apps, kill prior dev servers first.)
- No stemming in the mock embedder — items with disjoint surface words land in the long tail ("ungrouped" in metrics). Realistic; the full 32-item sample clusters cleanly.

### Next actions
- Clone scaffold for ScreenSense QA (multimodal, polished mock).
- After deploy: capture screenshots, fill live URL + GitHub link.

### Human-only / blocked
- `gh` not authenticated → GitHub push pending JP login.
- Vercel deploy pending JP approval.
