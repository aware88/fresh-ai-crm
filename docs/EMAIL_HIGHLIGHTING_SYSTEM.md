# Email Highlighting System

This document explains the colored left borders you see on email tiles in the ARIS CRM system.

## Overview

The email list uses **colored left borders** to visually indicate different types of emails and their priority. The system combines:

1. **AI Agent Assignment** - Colors based on which department should handle the email
2. **Opportunity Indicators** - Colors for sales opportunities  
3. **Selection States** - Colors for user interaction

## Border Color Meanings

### 1. Agent Assignment Colors (Primary System)

The AI automatically analyzes each email and assigns it to the appropriate team:

| Color | Agent Type | Meaning | When Applied |
|-------|------------|---------|--------------|
| 🟢 **Green** (`#10B981`) | **Sales** | Sales inquiry detected | Product requests, pricing questions, purchase intent |
| 🔵 **Blue** (`#3B82F6`) | **Customer Service** | Support request | Technical questions, general inquiries, product support |
| 🔴 **Red** (`#EF4444`) | **Dispute** | Urgent issue | Complaints, disputes, refund requests |
| 🟣 **Purple** (`#8B5CF6`) | **Billing** | Payment/account issue | Invoice questions, payment problems, account changes |
| ⚫ **Gray** (`#6B7280`) | **Auto-Reply** | Simple/routine | Acknowledgments, simple questions |

### 2. Opportunity Indicators (When No Agent Assignment)

When the intelligent opportunity system detects sales potential:

| Color | Confidence | Meaning |
|-------|------------|---------|
| 🟢 **Green** (`#10B981`) | **High** | Strong opportunity (€5K+ detected) |
| 🟠 **Amber** (`#F59E0B`) | **Medium/Low** | Potential opportunity (€1K-5K detected) |

### 3. Selection & Status Colors

| Color | State | Meaning |
|-------|-------|---------|
| 🔵 **Blue** (`#3B82F6`) | **Selected** | Currently selected email |
| 🔵 **Blue** (`#3B82F6`) | **Unread** | New unread email (when no other assignment) |
| ⚪ **Transparent** | **Read** | Read email with no special assignment |

## How It Works

### Priority Order (Top to Bottom)
1. **Selected Email** → Blue border (overrides everything)
2. **Opportunity Detection** → Green/Amber border (when intelligent calculation succeeds)
3. **Agent Assignment** → Color based on AI classification
4. **Unread Status** → Blue border (fallback for unread emails)
5. **Default** → Transparent border (read emails with no assignment)

### AI Classification Process

The system uses AI to analyze email content and automatically determines:

```javascript
// Example from email-classifier.ts
switch (category) {
  case 'sales':
    agentType = 'sales';
    highlightColor = '#10B981'; // Green
    break;
    
  case 'support':
  case 'product_inquiry':
    agentType = 'customer';
    highlightColor = '#3B82F6'; // Blue
    break;
    
  case 'dispute':
    agentType = 'dispute';
    highlightColor = '#EF4444'; // Red
    break;
    
  case 'billing':
    agentType = 'billing';
    highlightColor = '#8B5CF6'; // Purple
    break;
}
```

## Examples

### Sales Email (Green Border)
**Email**: "Hi, can you quote 1mt of organic ashwagandha powder?"
- **AI Analysis**: Sales inquiry detected
- **Border**: Green (`#10B981`)
- **Badge**: "Sales" with dollar icon

### Support Email (Blue Border)
**Email**: "How do I install your software on Windows?"
- **AI Analysis**: Technical support request
- **Border**: Blue (`#3B82F6`)  
- **Badge**: "Customer" with user icon

### Dispute Email (Red Border)
**Email**: "I want a refund, your product doesn't work!"
- **AI Analysis**: Dispute/complaint detected
- **Border**: Red (`#EF4444`)
- **Badge**: "Dispute" with warning icon

### Billing Email (Purple Border)
**Email**: "I haven't received my invoice for last month"
- **AI Analysis**: Billing inquiry detected
- **Border**: Purple (`#8B5CF6`)
- **Badge**: "Billing" with credit card icon

## Code Implementation

The highlighting is implemented in:
- **`/src/lib/email/email-classifier.ts`** - AI classification logic
- **`/src/components/email/imap/ImapClient.tsx`** - IMAP email display
- **`/src/components/email/outlook/EmailList.tsx`** - Outlook email display

```javascript
// Border color logic from ImapClient.tsx
style={{
  borderLeft: selectedEmail?.id === email.id 
    ? '4px solid #3B82F6'  // Selected (blue)
    : email.upsellData?.hasUpsellOpportunity
    ? email.upsellData.highestConfidence === 'high'
      ? '4px solid #10B981' // Opportunity high (green)
      : '4px solid #F59E0B' // Opportunity medium (amber)
    : email.highlight_color 
    ? `4px solid ${email.highlight_color}` // Agent assignment
    : !email.read 
    ? '4px solid #3B82F6' // Unread (blue)
    : '4px solid transparent' // Default
}}
```

## Benefits

1. **Quick Visual Triage** - Instantly see which emails need immediate attention
2. **Team Routing** - Know which department should handle each email
3. **Priority Management** - Red disputes get immediate attention
4. **Sales Focus** - Green borders highlight revenue opportunities
5. **Efficiency** - Reduce time spent reading every email to understand its nature
