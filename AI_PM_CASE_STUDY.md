# AI PM Case Study — SignalDesk AI

**Product problem.** PMs need to move from a pile of feedback to a defensible roadmap. SignalDesk makes the evidence trail first-class: every opportunity, PRD line, and experiment links back to real user quotes.

**ICP & personas.** Early-stage SaaS teams / founders with 50–500 feedback items from CSVs, app reviews, or notes. Jobs: find the highest-impact themes; justify a roadmap with evidence.

**MVP scope.**
- In: import (CSV/paste/sample), clustering + opportunity scoring, ask-over-feedback (RAG), one-click PRD with citations, roadmap + experiments, metrics, export.
- Out (V2): live ticketing integrations, multi-user review workflows, persistence/history.

**Metrics.**
- **North star:** validated opportunities converted into PRDs.
- **Activation:** first feedback import + cluster view.
- **Retention:** repeat imports / PRD updates.
- **Quality:** % of recommendations with evidence links.
- **Guardrail:** unsupported recommendation rate (target ~0 via the ≥2-citation rule).

**Experiment plan.** Hypothesis: requiring visible citations on every recommendation increases PM trust and the rate at which generated PRDs are actually used. Variant A: PRD without inline citations. Variant B: PRD with inline citations. Success: higher "PRD accepted/edited-and-kept" rate.

**Roadmap.** MVP (this) → V1: pgvector persistence + theme history + custom rubrics → V2: integrations, collaborative review, automated opportunity alerts.

**GTM.** Wedge: "paste your feedback, get a cited PRD in 60 seconds, no signup." Reach founders/PMs via communities and the portfolio.

**Trade-offs.** Over-generic insights (mitigated by minimum cluster size + confidence) vs. coverage; chose evidence-first guardrails because trust is the entire value proposition.
