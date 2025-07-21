export interface EmailClassification {
  category: 'sales' | 'support' | 'dispute' | 'billing' | 'product_inquiry' | 'general';
  intent: 'new_lead' | 'existing_customer' | 'complaint' | 'question' | 'order_issue' | 'request_info' | 'other';
  urgency: 'low' | 'medium' | 'high' | 'urgent';
  sentiment: 'positive' | 'neutral' | 'negative' | 'frustrated';
  confidence: number;
  keywords: string[];
  reasoning: string;
}

export interface EmailContext {
  from: string;
  subject: string;
  body: string;
  customerHistory?: {
    isExistingCustomer: boolean;
    previousOrders: number;
    lastInteraction: string;
  };
}

/**
 * Classify email content to determine category, intent, urgency, and sentiment
 */
export async function classifyEmail(emailContent: EmailContext): Promise<EmailClassification> {
  // Keywords for different categories
  const keywordPatterns = {
    sales: [
      'interested in', 'quote', 'price', 'buy', 'purchase', 'order', 
      'product information', 'catalog', 'availability', 'cost', 'demo'
    ],
    support: [
      'help', 'problem', 'issue', 'not working', 'broken', 'error',
      'how to', 'installation', 'setup', 'guide', 'tutorial'
    ],
    dispute: [
      'wrong', 'incorrect', 'mistake', 'received wrong', 'not what I ordered',
      'different than expected', 'not as described', 'return', 'refund',
      'compensation', 'resolve this', 'unacceptable'
    ],
    billing: [
      'invoice', 'payment', 'charge', 'bill', 'receipt', 'transaction',
      'credit card', 'refund', 'overcharged', 'billing error'
    ]
  };

  const urgencyKeywords = {
    urgent: ['urgent', 'emergency', 'asap', 'immediately', 'critical', 'stopped working'],
    high: ['soon', 'quickly', 'important', 'deadline', 'time sensitive'],
    medium: ['when possible', 'convenient', 'sometime', 'planning'],
    low: ['eventually', 'no rush', 'whenever', 'future reference']
  };

  const sentimentKeywords = {
    positive: ['thank you', 'great', 'excellent', 'satisfied', 'happy', 'love', 'perfect'],
    negative: ['disappointed', 'frustrated', 'angry', 'terrible', 'awful', 'worst'],
    frustrated: ['why', 'still waiting', 'already contacted', 'multiple times', 'no response']
  };

  // Normalize content for analysis
  const content = `${emailContent.subject} ${emailContent.body}`.toLowerCase();
  
  // Classify category
  let category: EmailClassification['category'] = 'general';
  let maxMatches = 0;
  
  for (const [cat, keywords] of Object.entries(keywordPatterns)) {
    const matches = keywords.filter(keyword => content.includes(keyword)).length;
    if (matches > maxMatches) {
      maxMatches = matches;
      category = cat as EmailClassification['category'];
    }
  }

  // Determine intent based on category and content
  let intent: EmailClassification['intent'] = 'other';
  
  if (category === 'sales') {
    if (content.includes('quote') || content.includes('price') || content.includes('cost')) {
      intent = 'request_info';
    } else if (content.includes('buy') || content.includes('purchase') || content.includes('order')) {
      intent = 'new_lead';
    } else {
      intent = 'request_info';
    }
  } else if (category === 'support') {
    if (content.includes('not working') || content.includes('broken') || content.includes('error')) {
      intent = 'complaint';
    } else {
      intent = 'question';
    }
  } else if (category === 'dispute') {
    intent = 'complaint';
  } else {
    // Check if customer history suggests existing customer
    if (emailContent.customerHistory?.isExistingCustomer) {
      intent = 'existing_customer';
    } else {
      intent = 'new_lead';
    }
  }

  // Determine urgency
  let urgency: EmailClassification['urgency'] = 'medium';
  for (const [level, keywords] of Object.entries(urgencyKeywords)) {
    if (keywords.some(keyword => content.includes(keyword))) {
      urgency = level as EmailClassification['urgency'];
      break;
    }
  }

  // Disputes and problems are inherently higher urgency
  if (category === 'dispute' && urgency === 'low') {
    urgency = 'medium';
  }

  // Determine sentiment
  let sentiment: EmailClassification['sentiment'] = 'neutral';
  for (const [sent, keywords] of Object.entries(sentimentKeywords)) {
    if (keywords.some(keyword => content.includes(keyword))) {
      sentiment = sent as EmailClassification['sentiment'];
      break;
    }
  }

  // Extract relevant keywords found
  const foundKeywords: string[] = [];
  for (const keywords of Object.values(keywordPatterns)) {
    foundKeywords.push(...keywords.filter(keyword => content.includes(keyword)));
  }

  // Calculate confidence based on keyword matches and clarity of intent
  const confidence = Math.min(0.95, Math.max(0.3, (maxMatches / 10) + (foundKeywords.length / 20) + 0.2));

  // Generate reasoning
  const reasoning = generateClassificationReasoning(category, intent, urgency, sentiment, foundKeywords);

  return {
    category,
    intent,
    urgency,
    sentiment,
    confidence,
    keywords: foundKeywords.slice(0, 5), // Top 5 keywords
    reasoning
  };
}

function generateClassificationReasoning(
  category: string,
  intent: string,
  urgency: string,
  sentiment: string,
  keywords: string[]
): string {
  const reasons = [];

  if (keywords.length > 0) {
    reasons.push(`Keywords suggest ${category} context: ${keywords.slice(0, 3).join(', ')}`);
  }

  if (urgency === 'high' || urgency === 'urgent') {
    reasons.push(`High urgency indicated by language patterns`);
  }

  if (sentiment !== 'neutral') {
    reasons.push(`${sentiment} sentiment detected in tone`);
  }

  if (intent === 'complaint') {
    reasons.push(`Problem or issue mentioned requiring resolution`);
  }

  return reasons.join('. ') || `Classified as ${category} based on content analysis.`;
}

/**
 * Get response strategy based on email classification
 */
export function getResponseStrategy(classification: EmailClassification) {
  const strategies = {
    sales: {
      tone: 'professional and enthusiastic',
      approach: 'Focus on value proposition and next steps',
      priority: classification.urgency === 'high' ? 'immediate' : 'same_day'
    },
    support: {
      tone: 'helpful and empathetic',
      approach: 'Provide clear solutions and resources',
      priority: classification.urgency === 'urgent' ? 'immediate' : 'within_4_hours'
    },
    dispute: {
      tone: 'apologetic and solution-focused',
      approach: 'Acknowledge issue, gather details, offer resolution',
      priority: 'immediate'
    },
    billing: {
      tone: 'professional and reassuring',
      approach: 'Review account details and clarify charges',
      priority: classification.urgency === 'high' ? 'same_day' : 'within_24_hours'
    },
    product_inquiry: {
      tone: 'informative and helpful',
      approach: 'Provide detailed product information',
      priority: 'same_day'
    },
    general: {
      tone: 'professional and courteous',
      approach: 'Address specific needs mentioned',
      priority: 'within_24_hours'
    }
  };

  return strategies[classification.category] || strategies.general;
} 