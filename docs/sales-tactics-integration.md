# Sales Tactics Integration Documentation

## Overview

This document outlines the integration of the `sales_tactics` dataset into the CRM Mind backend's AI email response system. The integration enhances AI-generated emails with psychologically informed sales tactics based on personality profiles and email content.

## Components

### 1. Sales Tactics Service

Location: `/src/lib/ai/sales-tactics.ts`

This module provides functions to:
- Fetch relevant sales tactics from Supabase based on personality profiles and email context
- Score and prioritize tactics by matching tone preferences, emotional triggers, and contextual keyword relevance
- Format sales tactics into a natural language string suitable for AI prompt injection

### 2. Email AI Context Builder

Location: `/src/lib/integrations/metakocka/email-context-builder.ts`

This module has been extended to:
- Include a `salesTactics` field in the `EmailMetakockaContext` interface
- Fetch the contact's personality profile from the `ai_profiler` table
- Query matching sales tactics using the sales tactics service
- Inject the sales tactics data into the AI context
- Format the AI context with personality profile summary and relevant sales tactics

### 3. OpenAI API Integration

Location: `/src/lib/openai/client.ts`

The OpenAI client has been updated to:
- Accept sales tactics context as an optional parameter in the `analyzeEmail` function
- Include sales tactics in the system prompt for the OpenAI API call
- Guide the AI to incorporate sales tactics naturally in the generated response

## Data Flow

1. User requests an AI-generated email response
2. System fetches the contact's personality profile from the `ai_profiler` table
3. System queries matching sales tactics based on the profile and email content
4. Sales tactics are formatted and included in the AI context
5. OpenAI API is called with the enhanced context
6. AI generates a response that naturally incorporates the sales tactics
7. Response is returned to the user

## Database Schema

### sales_tactics Table

```sql
CREATE TABLE public.sales_tactics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    expert TEXT NOT NULL,
    category TEXT NOT NULL,
    tactical_snippet TEXT NOT NULL,
    use_case TEXT,
    email_phrase TEXT,
    emotional_trigger TEXT,
    matching_tone TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create GIN index for efficient array searching
CREATE INDEX idx_sales_tactics_matching_tone ON public.sales_tactics USING GIN (matching_tone);
```

## API Reference

### Sales Tactics Service

```typescript
// Fetch sales tactics matching a personality profile and email context
async function getMatchingSalesTactics(
  profile: PersonalityProfile, 
  emailContext: EmailContext
): Promise<SalesTactic[]>

// Format sales tactics for AI context
function formatSalesTacticsForAIContext(tactics: SalesTactic[]): string
```

### Email AI Context Builder

```typescript
// Build email context with sales tactics
async function buildEmailMetakockaContext(
  emailId: string, 
  userId: string
): Promise<EmailMetakockaContext>

// Format context for AI consumption
function formatContextForAI(context: EmailMetakockaContext): string
```

### OpenAI Client

```typescript
// Analyze email with sales tactics context
async function analyzeEmail(
  emailContent: string, 
  salesTacticsContext?: string
): Promise<string>
```

## Testing

A comprehensive test suite is available at `/src/tests/sales-tactics-integration.test.ts` to verify the integration works correctly. The tests cover:

1. Fetching sales tactics based on personality profiles
2. Integrating sales tactics into AI context
3. Including sales tactics in OpenAI prompts
4. Verifying that AI-generated responses incorporate sales tactics naturally

To run the tests:

```bash
npm test -- src/tests/sales-tactics-integration.test.ts
```

## Best Practices

1. **Natural Integration**: Sales tactics should be subtly and naturally incorporated into AI responses, not explicitly mentioned.

2. **Expert References**: When appropriate, AI responses should reference sales tactics experts and rationale to add credibility.

3. **Tone Matching**: Sales tactics should be matched to the contact's tone preferences to ensure they resonate effectively.

4. **Emotional Triggers**: Consider the contact's emotional triggers when selecting sales tactics to use.

5. **Context Awareness**: Use email content to further refine sales tactics selection based on relevance.

## Future Enhancements

1. **UI Integration**: Add UI elements to show selected tactics and rationale in email drafts.

2. **Feedback Loop**: Implement a mechanism for users to provide feedback on the effectiveness of sales tactics.

3. **Custom Tactics**: Allow users to create and store their own custom sales tactics.

4. **A/B Testing**: Implement A/B testing to measure the effectiveness of different sales tactics.

5. **Analytics**: Add analytics to track which sales tactics are most effective for different personality profiles.
