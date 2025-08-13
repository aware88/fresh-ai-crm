# ARIS – Future Enhancements Backlog (Optional)

This backlog lists pragmatic, optional enhancements we can pick up later. It stays lean, favors measurable impact, and avoids unnecessary complexity. Nothing here is required for current value delivery.

## Guiding Principles
- Ship small, reversible increments
- Prefer UI hints over heavy flows
- Measure before and after; keep what works

## Near-Term (1–2 weeks, low risk)
- Bias toggle in generation: Optional toggle to pre-apply bias tip during draft generation (A/B ready).
- Insights mini-widget: Dashboard card showing weekly trend of increasing vs decreasing engagement counts.
- One-click follow-up timing: Quick-select chips (e.g., “3h”, “Tomorrow morning”) informed by `recommendedTimingHours` when available.
- CTA presets by personality: Suggested CTAs (button/link text) aligned to `Best_CTA_Type` and `Tone_Preference`.
- Lightweight success logging: Track if user acted on “next-best action” and basic outcome (reply/meeting booked if present).

## Mid-Term (2–4 weeks, moderate scope)
- Consensus explanations: Short, human-readable rationale from inter-agent decisions (top 2 factors + confidence).
- Industry hinting: Tiny badge indicating inferred industry profile used (from `IndustryPsychologyModels`).
- Cross-customer nudge library: Curate top-performing short nudges (anonymized) for reuse, surfaced contextually.
- Evolution timeline ribbon: Compact UI timeline of `contact_psychology_evolution` with hover tooltips.
- Smart follow-up queue: Inbox view grouping items by predicted responsiveness window.

## Instrumentation & Evaluation
- Draft acceptance delta: Score magnitude of user edits by category (tone, length, structure) vs baseline.
- Action adherence: % of emails where recommended “next-best action” was taken.
- Outcome correlation: Simple lift metrics (reply/meeting/booked) for emails that used bias tip vs not (per-user opt-in).
- Agent impact telemetry: Per-agent contribution signal (e.g., which agent most correlated with accepted drafts this week).

## Platform & Ops
- Feature flags: Gate new hints/toggles per tier (Starter/Pro/Enterprise) and per org.
- Safe defaults: Hard caps on calls and per-message token budgets; graceful fallbacks.
- Privacy controls: Per-user switch for using outcomes in learning/evaluation.
- Docs: Append diffs and KPIs to `docs/ARIS_SYSTEM_MASTER_DOC.md` upon each enhancement roll-out.

---

Selection notes: Prioritize “Bias toggle in generation” and “Insights mini-widget” if/when we want quick, measurable wins without expanding schema.
