# ARIS System Master Document

## Executive Summary

ARIS (Agentic Relationship Intelligence System) is a multi-agent, psychology-first AI CRM that transforms customer communication, sales, and relationship management. ARIS uniquely combines:
- 7 specialized autonomous AI agents working collaboratively
- 21+ field psychological profiling with real-time evolution tracking
- Continuous learning from human edits and sent emails
- Enterprise-grade orchestration, memory, and analytics

ARIS doesn’t just automate emails; it understands people, predicts behavior, and acts proactively to grow revenue while reducing operational overhead.

---

## Why ARIS Is Unmatched

- Multi-agent collaboration: Agents share insights, request expertise, and reach consensus on actions (response priority, sales opportunity, nurturing strategy).
- Deep psychology engine: 21+ structured traits (Personality_Type, Emotional_Trigger, Cognitive_Bias, Tone_Preference, Stress_Response, Conversion_Likelihood, Lead_Score, Cultural_Tone, Reading_Style, etc.).
- Real-time psychology evolution tracking: Detects personality shifts, buying intent changes, relationship upgrades, behavioral changes.
- Continuous learning: Learns from every edit, refinement, and sent email to adapt voice, tone, and strategy.
- Outcome-oriented orchestration: Every email triggers a coordinated workflow across agents with measurable business impact.
- Enterprise foundation: Multi-tenant isolation, audit trails, vector memories, RLS, and robust telemetry.

---

## Core Value to Users and Organizations

- Save 20–40 hours per user per month: AI drafts, refinement-by-command, automatic classification, context gathering, and follow-ups.
- Improve close rates 25–40%: Psychology-aligned messaging and agent consensus optimize timing, framing, and calls-to-action.
- Reduce churn 20–35%: Relationship health prediction and proactive interventions.
- Shorten sales cycles 15–30%: Right message, right time, right channel informed by behavior signals and evolution tracking.
- Scale consistency and quality: Team-wide best practices embedded into AI learning and decision engines.

Illustrative ROI (5-person team):
- Time saved: ~85 hours/week (~$10,000/mo at $50/hr loaded cost)
- Incremental revenue: +$20k–$100k/mo (deal size and cycle dependent)
- ARIS cost: <$1k/mo → ROI commonly 10–50x

---

## System Architecture (High-Level)

- Frontend: Next.js 15, React, Tailwind
- Backend: Next.js routes + service layer
- Database: PostgreSQL (Supabase) with RLS, audit, and migrations
- AI: OpenAI (completions + structured), vector embeddings for memories
- Agents: Specialized classes with orchestration and shared context
- Memory & Learning: 
  - `ai_learning_data`, `ai_learning_changes`, `ai_learning_insights`
  - `ai_memories` (semantic), `user_ai_email_preferences` (instruction layer)
  - `contact_analysis_history`, `contact_psychology_evolution`

---

## The 7 Specialized Agents

- EMAIL_PROCESSOR: Categorization, urgency/sentiment/intent detection, response priority.
- SALES_SPECIALIST: Lead qualification (BANT), opportunity scoring, pricing strategy.
- CUSTOMER_SUCCESS: Health scoring, churn risk detection, renewal/expansion strategy.
- PRODUCT_MATCHER: Product fit, recommendations, inventory context.
- RELATIONSHIP_ANALYZER: Relationship stage, warmth, evolution signals, next best engagement.
- BEHAVIOR_TRACKER: Pattern shifts (response time, tone, complexity), trigger detection.
- OPPORTUNITY_HUNTER: Upsell/cross-sell/referral, expansion timing, value levers.

Each agent:
- Maintains internal memory of context and prior decisions
- Emits analysis, recommendations, and confidence
- Contributes to a collaborative decision when needed

---

## Orchestration & Collaboration

Every inbound email triggers the orchestrator:
1) Build email + contact context (history, psychology, preferences, products, orders)
2) Determine which agents to activate (sales, cs, product, relationship, behavior)
3) Run agents in parallel; share insights across agents where relevant
4) Collaborative decision (consensus on priority, opportunity, or next best actions)
5) Execute actions (generate draft, schedule follow-up, open opportunity, log insights)
6) Calculate business impact; log telemetry and learning signals

Agent collaboration advantages:
- Multi-perspective analysis reduces errors
- Conflicts resolved via consensus + confidence thresholds
- Decisions produce actionable steps and escalation when appropriate

---

## Psychology Engine (21+ Traits)

Profiles include (representative subset):
- Personality_Type, Traits, Tone_Preference, Reading_Style
- Cognitive_Bias, Bias_Use_Tip, Emotional_Trigger, Emotional_Intent
- Stress_Response, Top_Trigger_Words, Avoid_Words
- Sales_Strategy, Messaging_Do / Messaging_Dont
- Best_CTA_Type, Recommended_Channel
- Lead_Score, Conversion_Likelihood, Estimated_Deal_Tier
- Cultural_Tone, Follow_Up_Timing, Trigger_Signal_Keywords

Applications:
- AI drafting style and argument structure
- Timing (Follow_Up_Timing) and CTA selection (Best_CTA_Type)
- Bias-aligned persuasion (Cialdini, heuristics)
- Channel routing (Recommended_Channel)

---

## Real-Time Psychology Evolution Tracking

Detections:
- Personality Shift (e.g., analytical → decisive)
- Buying Intent Change (likelihood, lead score movement)
- Relationship Upgrade (warming, trust signals)
- Behavioral Change (tone, length, latency patterns)

Outputs:
- Evolution events with confidence, insights, recommended actions
- Business impact assessment (opportunity score, risk level, revenue impact, urgency)
- Downstream triggers (escalation, nurturing, opportunity creation)

---

## Continuous Learning & Personalization

Learning sources:
- Draft edits (changes captured and scored)
- Refinement commands (natural-language transformations)
- Sent emails (style, tone, structure analysis)
- Outcome feedback (reply rates, conversions when available)

Learning effects:
- Personal voice modeling per user/team
- Prompt and strategy adaptation (tone, length, framing)
- Improved suggestion relevance and confidence calibration

Privacy:
- Opt-in learning (`user_ai_email_settings.learning_enabled`)
- Data retention controls; redaction paths supported

---

## Business Outcomes & Proof Metrics

- Time: AI handles analysis/draft → users review and send (minutes saved per email)
- Quality: Psychology-aligned messaging increases response and conversion rates
- Revenue: Proactive upsell/cross-sell/referral identification
- Retention: Churn risk flags → timely intervention

Key KPIs:
- Draft acceptance rate, edit delta score, time-to-send
- Response rate lift, conversion rate lift, cycle time reduction
- Churn risk alerts acknowledged/resolved, upsell conversion

---

## Dashboard Impact & Admin Metrics (Delivered)

### User Dashboard – AI Impact & Quality
- AI Impact Card (Overview)
  - Time saved this month: computed from monthly AI usage breakdown with per-feature minute assumptions
  - Cost saved this month: time saved × organization hourly rate
  - Top contributing feature (e.g., `email_response`, `drafting`, `ai_future`)
- Quality Signals (last 30 days)
  - Draft acceptance rate (0 changes in learning submissions)
  - Average changes per draft; average length delta %
  - Auto vs semi-auto split (approved vs requires_review vs completed)

Data sources
- `GET /api/usage/dashboard-v2`
  - savings: { time: minutes/hours/workDays, cost: hourlyRateUsd/savedUsd, breakdown: minutesByType }
  - quality: { acceptanceRate, sampleSize, avgChanges, avgLengthChangePct, autoVsSemi }
- Tables: `ai_usage_monthly_summary`, `ai_usage_tracking`, `ai_learning_data`, `email_queue`, `organization_settings`

Configuration
- Organization settings (optional overrides):
  - `ai_savings_hourly_rate_usd` (default: 30)
  - `ai_savings_config` (per-feature minutes defaults: email_response=7, drafting=8, ai_future=5, profiling=2, general=3)

UX notes
- Non-blocking empty states for new orgs (graceful zeros)
- Future: add tooltips to explain calculations and a link to configure hourly rate

### Admin – Organization-Level Metrics
- Organizations List `/admin/organizations`
  - Columns: Users, AI Messages (30d), AI Cost (30d)
  - API: `GET /api/admin/organizations` enriched with 30d usage aggregates
- Organization Detail `/api/admin/organizations/[id]`
  - returns `metrics`: { monthly_ai_messages, monthly_ai_cost_usd, monthly_auto_approved }

Indexes (recommended)
- `ai_usage_tracking (organization_id, created_at)`
- `email_queue (organization_id, created_at, status)`
- `ai_learning_data (user_id, created_at)`

Caching (optional)
- Cache `GET /api/usage/dashboard-v2` for 60–120s to reduce DB load under frequent refreshes

---

## Security & Compliance

- Supabase RLS for multi-tenant isolation
- Row-level logging and least-privilege access
- Content sanitization (where relevant), PII sheltering controls
- SOC 2/GDPR alignment in process; audit-friendly event logging

---

## Competitive Differentiation

- CRMs: Store data → ARIS understands people and acts autonomously
- AI Email tools: Write emails → ARIS predicts behavior, times outreach, and learns from outcomes
- Sales Enablement: Content libraries → ARIS personalizes at psychology level, per contact

Result: Fewer manual steps, faster cycles, more revenue—with explainable, collaborative AI.

---

## User Experience Highlights

- Inbox Intelligence: Instant classification, context summary, and suggested actions
- AI Draft Window: One-click drafts; refine with commands ("shorter, warmer, add CTA")
- Analysis Transparency: Key factors + confidence with history
- Relationship Health: Psychology evolution timeline and interventions

Note: Bias tip is optionally applicable via “Apply Tip to Draft” in the AI Draft window; Reset restores original content.

---

## Extensibility & Integrations

- ERP (e.g., Metakocka), email providers, vector memory, Stripe billing
- Modular agent additions and custom workflows
- Feature flags per subscription tier

---

# Phase 1 (Delivered)

Delivered capabilities:
- Multi-agent orchestration with inter-agent communication and consensus
- 21+ field psychology profiling integrated across drafting and decisions
- Real-time psychology evolution tracking and business impact
- Learning from edits, sent emails, and refinements with personalization
- Enterprise-grade schema, RLS, logging, and memory services

Expected outcomes:
- 20–40 hours saved per user per month
- 25–40% uplift in conversion metrics
- 15–30% shorter cycles, 20–35% churn reduction

---

# Phase 2: Advanced Behavioral Intelligence (In Progress → Lean Delivered)

Goal: Move from reactive analysis to predictive, cross-contact intelligence with industry-aware persuasion and measurable revenue lift.

## Code Modules (Scaffolded)
- Behavioral Prediction Engine: `src/lib/psychology/behavioral-prediction-engine.ts`
- Cognitive Bias Engine: `src/lib/psychology/cognitive-bias-engine.ts`
- Industry Psychology Models: `src/lib/psychology/industry-psychology-models.ts`
- Cross-Customer Learning: `src/lib/intelligence/cross-customer-learning.ts`

## Minimal Viable Outputs (Live)
- Communication evolution (trend + factors)
- Next-best action with recommended timing
- Bias tip (summary) for message framing

Persisted as a lean snapshot under: `emails.metadata.phase2`

UI exposure (Email Detail & Draft):
- Compact “AI Insights” strip (next-best action + timing, bias tip)
- “Apply Tip to Draft” button (optional; reversible via Reset)
- API: `GET /api/emails/phase2/:id`

## 2.1–2.4 (Scope Held Minimal for Now)
- We implemented only the essentials and avoided new tables to keep Phase 2 lean and pragmatic.

## Phase 2 Next (Optional Enhancements)
- Dashboard widgets: evolution trends, next-best action queue
- Use bias tip in draft generation behind a toggle (A/B ready)
- Lightweight evaluation: track whether the recommended action was taken

KPIs to watch:
- Draft acceptance and send speed on “action recommended” emails
- Meetings booked / replies for “schedule_call” recommendations
- Win rate lift on opportunities that followed bias tips

---

# Appendix: Key Tables & Services (Representative)

- Psychology & Analysis: `ai_profiler`, `contact_analysis_history`, `contact_psychology_evolution`
- Learning: `ai_learning_data`, `ai_learning_changes`, `ai_learning_insights`, `user_ai_scores`
- Preferences: `user_ai_email_preferences`, `user_ai_email_settings`
- Memory: `ai_memories` (vector), relationships, access logs
- Orchestration: `email_queue`, interaction logs, collaborative decisions (if enabled)

---

This master document is the single source of truth for ARIS capabilities and roadmap. Future phases will be appended here with implementation diffs, KPIs, and outcomes.
