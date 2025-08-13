Title: Pricing Page Update — Implement 3-Tier Structure in USD (No API Calls)

Objective
- Update the public pricing/landing page to match the backend subscription system and psychological design. Do not fetch data from APIs; hardcode the values below in USD.

Core Requirements
- Currency: USD only. No EUR anywhere.
- Plans: 1) Starter, 2) Pro, 3) Premium with three sub-tiers (Basic, Advanced, Enterprise).
- Unlimited contacts across all tiers.
- AI messages are the main limit and value lever.
- Show monthly price (pay monthly) and the effective per-month price when billed annually.
- Use strong visual psychology: highlight “Most Popular” on Pro, “Best Value” on Premium Advanced, and “Always Free” on Starter.
- Include top-up info as static text (no checkout), just to set expectations.
- Do not mention internal implementation details or APIs.

Plan Cards (Top Section)
1) Starter
- Badge: ALWAYS FREE
- Price: $0/month
- Annual Price: $0/month
- Subheading: “Great to get started”
- Primary CTA: “Get Started Free”
- Secondary CTA (subtle link): “Compare plans”
- Key Value Bullets:
  - 1 user
  - Unlimited contacts
  - 50 AI messages/month
  - Email sync included
  - Basic AI only (no persuasion engine)
  - Top-ups available

2) Pro (highlighted as Most Popular)
- Badge: MOST POPULAR
- Price: $29/month
- Annual (per‑month): $24/month (billed annually)
- Subheading: “Built for growing teams”
- Primary CTA: “Start Pro”
- Secondary CTA: “Compare plans”
- Key Value Bullets:
  - Up to 5 users
  - Unlimited contacts
  - 500 AI messages/month (shared across team)
  - CRM Assistant included
  - Full psychological profiling and sales tactics
  - Priority support
  - Top-ups available at a lower rate

3) Premium (three sub‑tiers presented in a horizontal toggle or stacked cards)
- Group Label: “Premium for Organizations”
- Sub‑tier badges: “Team Scale”, “Best Value”, “Everything Unlimited”

  a) Premium Basic — “Team Scale”
  - Price: $197/month
  - Annual (per‑month): $157/month (billed annually)
  - 20 users included (add‑ons allowed; show as footnote copy)
  - 5,000 AI messages/month
  - ERP integration ready (note: for organizations)
  - Advanced analytics

  b) Premium Advanced — “Best Value”
  - Price: $297/month
  - Annual (per‑month): $237/month (billed annually)
  - 50 users included
  - 15,000 AI messages/month
  - Custom integrations, white‑label, AI customization
  - Dedicated success agent

  c) Premium Enterprise — “Everything Unlimited”
  - Price: $497/month
  - Annual (per‑month): $397/month (billed annually)
  - 100 users included (expandable)
  - Unlimited AI messages
  - Tailored onboarding and SLA

Comparison Table (Mid Section)
- Columns: Starter | Pro | Premium Basic | Premium Advanced | Premium Enterprise
- Rows (checkmarks/text):
  - Users: 1 | 5 | 20 | 50 | 100+
  - Contacts: Unlimited (all columns)
  - AI messages/month: 50 | 500 | 5,000 | 15,000 | Unlimited
  - CRM Assistant: — | ✓ | ✓ | ✓ | ✓
  - Psychological profiling & sales tactics: — | ✓ | ✓ | ✓ | ✓
  - Email sync: ✓ | ✓ | ✓ | ✓ | ✓
  - Advanced analytics: — | — | ✓ | ✓ | ✓
  - ERP integration: — | — | ✓ | ✓ | ✓
  - Custom integrations: — | — | — | ✓ | ✓
  - White‑label: — | — | — | ✓ | ✓
  - AI customization: — | — | — | ✓ | ✓
  - Priority support: — | ✓ | ✓ | ✓ | ✓
  - Dedicated success agent: — | — | — | ✓ | ✓

Top‑Ups (Static Info Block)
- Title: “Need more AI messages?”
- Copy: “Buy top‑ups anytime. They roll over within your billing cycle and are used only after you hit your plan limit.”
- Pack examples (USD):
  - 100 messages — $5 ($0.05/message)
  - 500 messages — $20 ($0.04/message) — Popular
  - 1,000 messages — $35 ($0.035/message)
- Footnote: “Starter top‑ups are limited per month to encourage upgrading when usage grows.”

Psychology & Messaging Guidelines
- Anchor with Premium Enterprise and highlight Pro as the easy, value‑smart choice.
- “Value first” copy in alerts/notes (no scare tactics). Emphasize outcomes: “Close more deals with persuasive AI suggestions”.
- Starter transparency: label AI as “Generic AI (no persuasion engine)”. Hide advanced AI controls in visuals.
- Add subtle trust elements near CTAs: lightweight testimonials, privacy note, and “No credit card to start on Starter”.

Sections & Order
1) Hero with pricing toggle (Monthly vs Annually). Default to Monthly. Show annual savings on badges.
2) Plan cards (Starter, Pro highlighted, Premium group with three sub‑tiers). Clear CTAs for each.
3) Comparison table as specified.
4) Top‑Ups info block.
5) FAQ (see below) and closing CTA.

FAQ (Static)
- “How are AI messages counted?” — Each AI assist (email draft, profiling, etc.) counts as one message. We optimize tokens under the hood.
- “Can I switch plans anytime?” — Yes, upgrades are instant; downgrades take effect next billing cycle.
- “Do unused AI messages roll over?” — Plan quotas reset monthly. Top‑ups apply within the billing period.
- “What happens if I hit my limit?” — You’ll get a small grace buffer and clear prompts to buy a top‑up or upgrade.
- “Is there a trial for Pro?” — Starter users may receive a short Pro Boost trial from time to time.

CTAs
- Starter: “Get Started Free”
- Pro: “Start Pro”
- Premium Basic: “Talk to Sales”
- Premium Advanced: “Talk to Sales”
- Premium Enterprise: “Contact Us”

Design Notes
- Use contrast to highlight Pro.
- Display annual savings as a subtle percent badge on Pro and Premium sub‑tiers.
- Place trust badges/logos and a brief privacy statement near CTAs.
- Keep plan card heights consistent; truncate long lists with a “See all features” inline link to jump to the comparison table.

Copy Blocks (Ready‑to‑Use)
- Pro Hero Blurb: “Everything you need to sell smarter: persuasive AI, CRM Assistant, and team‑ready limits.”
- Starter Blurb: “Experience the core CRM with Email Sync and 50 AI messages/month. No credit card required.”
- Premium Blurb: “For organizations that need scale, compliance, and custom integrations.”

Hard Rules
- USD only.
- No dynamic fetches; all values are static as listed here.
- Do not add features we don’t list. Do not mention mobile app if not shown in the table.

Quality Checklist Before Handoff
- Pricing amounts match exactly:
  - Starter: $0
  - Pro: $29 ($24/mo when billed annually)
  - Premium Basic: $197 ($157/mo annually)
  - Premium Advanced: $297 ($237/mo annually)
  - Premium Enterprise: $497 ($397/mo annually)
- AI message limits match exactly: 50 / 500 / 5,000 / 15,000 / Unlimited.
- Unlimited contacts across all plans.
- Pro shows “Most Popular”. Premium Advanced shows “Best Value”. Starter shows “Always Free”.
- Top‑ups shown with USD and popular marker on 500 pack.

