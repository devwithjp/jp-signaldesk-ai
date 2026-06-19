# Security & privacy — SignalDesk AI

## Secrets
- No secrets in source. `ANTHROPIC_API_KEY` and `OPENAI_API_KEY` are read only server-side (API routes / server modules), only in live mode.
- `.env.example` ships blank; `.env.local` is git-ignored; production secrets live in Vercel env vars.
- Embeddings and generation run in Node API routes (`runtime = "nodejs"`); the client never sees a key.

## Input validation
- `POST /api/analyze` requires ≥2 items and caps at 2000; CSV parsing tolerates quoted fields.
- `POST /api/ask` requires a non-empty question (capped at 500 chars) and a non-empty pool.
- `POST /api/prd` enforces the ≥2-citation guardrail and errors if a theme lacks enough evidence.
- `POST /api/feedback` validates a 1–5 rating.

## Data & privacy
- Default demo uses bundled sample feedback. User-pasted/uploaded feedback is processed in-request and not persisted server-side (the embedded pool round-trips through the client).
- No raw uploads are stored. For a persistent deployment, add a delete/reset path and a retention policy before accepting private data.

## Rate limiting & cost
- Mock mode makes no external calls.
- Live mode batches embeddings (one OpenAI call per analyze) and caps generation `max_tokens`. Add a platform rate limit before exposing live mode publicly.

## Threat model (MVP)
- **Prompt injection** in feedback: the generator is instructed to use only cited evidence; outputs are never executed.
- **Unsupported claims:** the ≥2-citation guardrail blocks ungrounded PRDs; the metrics view surfaces ungrouped feedback.
- **CSV injection:** parsing treats cells as text only; no formula evaluation.
- **Leaked keys / token spend:** server-only key access, mock-first default, capped tokens.
