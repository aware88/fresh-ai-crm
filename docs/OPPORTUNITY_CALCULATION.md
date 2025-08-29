# Email Opportunity Calculation

This document explains how sales opportunities are calculated and displayed on email tiles in the ARIS CRM system.

## Overview

The opportunity system uses **intelligent AI-based calculation** to analyze incoming emails for potential sales opportunities and displays them as badges on email tiles. The system combines:

1. **AI Product Extraction** - Uses GPT-4 to identify specific products, quantities, and specifications from email content
2. **Real Pricing Lookup** - Fetches actual prices from your database or Metakocka integration  
3. **Dynamic Value Calculation** - Calculates real monetary opportunity based on actual requests and pricing
4. **No Fallback** - Shows nothing if AI analysis fails (no fake opportunity values)

The main calculation is performed by the `calculateIntelligentOpportunity` function in `/src/lib/email/intelligent-opportunity-calculator.ts`.

## How Opportunity Value is Calculated

### Intelligent Calculation (Primary Method)

The new intelligent system works in these steps:

#### 1. AI Product Extraction
Uses GPT-4 to analyze email content and extract:
- **Product names** (e.g., "organic ashwagandha powder")
- **Quantities** (e.g., 1 metric ton, 500kg)
- **Specifications** (e.g., "organic", "premium grade")
- **Context** (quote request, pricing inquiry, availability check)
- **Confidence score** (0.0 to 1.0)

#### 2. Real Pricing Lookup
For each extracted product, the system:
1. **Database Search**: Looks up products in your CRM database
2. **Metakocka Integration**: Queries Metakocka API for current pricing
3. **AI Estimation**: Uses AI to estimate market prices as fallback

#### 3. Dynamic Value Calculation
```
Opportunity Value = Quantity × Unit Price × Confidence Factor
```

**Example**: 
- Email: "Can you quote 1mt of organic ashwagandha powder"
- AI extracts: 1 metric ton of ashwagandha powder
- Database lookup: €8/kg for ashwagandha
- Calculation: 1,000kg × €8/kg = €8,000 opportunity

### No Fallback System

**Important**: If the intelligent calculation fails (e.g., AI is unavailable, no clear products detected), **no opportunity will be shown**. 

We removed the old pattern-based fallback system because:
- Static values like €2,000-€5,000 were misleading
- They didn't reflect actual customer requests or real pricing
- Better to show nothing than show fake opportunity values

### 2. Keyword Detection

Each pattern contains specific keywords that are matched against the email content (subject + body):

**Product Inquiry Keywords:**
- "interested in", "tell me more", "product demo", "pricing information", etc.

**Price Question Keywords:**
- "how much", "cost", "price", "quote", "estimate", etc.

**Competitor Mention Keywords:**
- Competitor names and comparison terms

**Expansion Signal Keywords:**
- "upgrade", "additional", "more features", "enterprise", etc.

**Renewal Opportunity Keywords:**
- "renew", "contract", "subscription", "expire", etc.

### 3. Confidence Scoring

Each opportunity is assigned a confidence level:

- **High**: Strong indicators present, multiple keyword matches
- **Medium**: Moderate indicators
- **Low**: Weak indicators, few keyword matches

### 4. Value Boosting

The base opportunity value can be increased by:

#### High-Value Signals (50% increase per signal):
- "enterprise", "bulk", "volume", "corporate"
- "million", "thousand", "large scale"
- "urgent", "asap", "immediately"

#### Confidence Boosters:
- "when can we", "how quickly", "timeline"
- These can upgrade Medium confidence to High

#### Multiple Keywords:
- 3+ matching keywords can upgrade Low confidence to Medium

### 5. Final Calculation

```javascript
// Base calculation
let potentialValue = pattern.baseValue;

// Apply high-value signal multipliers
const highValueSignals = countHighValueSignals(emailText);
potentialValue = Math.round(potentialValue * (1 + highValueSignals * 0.5));

// Confidence adjustments based on keyword count and boosters
confidence = adjustConfidenceBasedOnSignals(confidence, keywordCount, confidenceBoosters);
```

## Display Logic

### Email Tile Display

Opportunities are shown on email tiles as:
- **Green border**: High confidence opportunities
- **Amber border**: Medium/Low confidence opportunities
- **Badge**: Shows total potential value (e.g., "$2.5K opportunity")

### User Control

Users can toggle opportunity display on/off via:
**Settings → Display → Show Opportunity Badges**

When disabled, opportunity badges are hidden but the analysis still runs in the background.

## Example Calculations

### Intelligent Calculation Example

**Email Content:**
"Hi, can you give me pricing/quote for 1mt of organic ashwagandha powder? We need it for our supplement production line."

**AI Analysis:**
1. **Product Extraction**: "organic ashwagandha powder"
2. **Quantity Extraction**: 1 metric ton (1,000kg)
3. **Specifications**: ["organic"]
4. **Context**: "pricing/quote" request
5. **Confidence**: 0.95 (high confidence)

**Pricing Lookup:**
1. **Database Search**: Found ashwagandha powder at €8.00/kg
2. **Calculation**: 1,000kg × €8.00/kg = €8,000
3. **Display**: Green border, "€8.0K opportunity" badge

### Pattern-Based Fallback Example

**Email Content:**
"Hi, I'm interested in your enterprise solution for our company. We need pricing information for about 500 users. This is urgent - when can we schedule a demo?"

**Pattern Analysis:**
1. **Pattern Match**: Product Inquiry (base €2,000)
2. **Keywords Found**: "interested", "pricing information", "demo" (3 matches)
3. **High-Value Signals**: "enterprise" (+50%)
4. **Confidence Boosters**: "when can we" (upgrades to High confidence)
5. **Final Value**: €2,000 × 1.5 = €3,000
6. **Display**: Green border, "€3.0K opportunity" badge

## Technical Implementation

The intelligent opportunity calculation system consists of:

### Core Components

- **Intelligent Calculator**: `/src/lib/email/intelligent-opportunity-calculator.ts`
  - AI-powered product extraction using GPT-4
  - Database and Metakocka pricing lookup
  - Dynamic value calculation based on real data

- **Enhanced Detection**: `/src/lib/email/enhanced-upsell-detection.ts`
  - Combines intelligent calculation with pattern-based fallback
  - Maintains backward compatibility with existing components

- **Legacy System**: `/src/lib/email/upsellDetection.ts`
  - Original pattern-based detection (fallback only)

### Display Components

- **Email Tiles**: 
  - `/src/components/email/imap/ImapClient.tsx`
  - `/src/components/email/outlook/EmailList.tsx`
- **Opportunity Indicators**: `/src/components/email/UpsellIndicator.tsx`

### Settings & Configuration

- **Display Settings**: `/src/app/settings/display/page.tsx`
- **Settings Utility**: `/src/lib/settings/display-settings.ts`
- **User Toggle**: "Show Opportunity Badges" setting

## Notes

- Opportunity calculation runs automatically on email ingestion
- Values are estimates based on pattern recognition
- The system learns and improves over time
- Multiple opportunities can be detected in a single email
- Total potential value is the sum of all detected opportunities
