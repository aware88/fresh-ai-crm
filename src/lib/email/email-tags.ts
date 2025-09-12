/**
 * Email Tag Generation from AI Analysis
 * 
 * Maps AI analysis results to visual tags for email interface
 */

export interface EmailTag {
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  color?: string;
  priority: number; // Lower number = higher priority for display
}

export interface EmailTagData {
  // From email_index table
  importance?: string; // 'low', 'normal', 'high', 'urgent'
  assigned_agent?: string; // 'customer', 'sales', 'dispute', 'billing', 'auto_reply'
  agent_priority?: string; // 'low', 'medium', 'high', 'urgent'
  upsell_data?: any;
  sentiment_score?: number; // -1.00 to 1.00
  language_code?: string;
  ai_analyzed?: boolean;
  has_attachments?: boolean;
  
  // From AI analysis (if available)
  classification?: {
    category?: string; // 'sales', 'support', 'dispute', 'billing', 'product_inquiry', 'general'
    intent?: string; // 'new_lead', 'existing_customer', 'complaint', 'question', 'request_info', 'other'
    sentiment?: string; // 'positive', 'neutral', 'negative', 'frustrated'
    urgency?: string;
  };
}

/**
 * Generate email tags from AI analysis data
 */
export function generateEmailTags(data: EmailTagData): EmailTag[] {
  const tags: EmailTag[] = [];

  // 1. Priority/Urgency Tags (Highest priority display)
  const urgency = data.agent_priority || data.importance || data.classification?.urgency;
  if (urgency) {
    switch (urgency.toLowerCase()) {
      case 'urgent':
        tags.push({ label: '🚨 URGENT', variant: 'destructive', priority: 1 });
        break;
      case 'high':
        tags.push({ label: '⚡ HIGH', variant: 'secondary', color: 'orange', priority: 2 });
        break;
      case 'low':
        tags.push({ label: '🔽 LOW', variant: 'outline', priority: 9 });
        break;
      // Don't show 'normal' or 'medium' to save space
    }
  }

  // 2. Category/Department Tags (Second priority)
  const category = data.classification?.category || data.assigned_agent;
  if (category) {
    switch (category.toLowerCase()) {
      case 'sales':
        tags.push({ label: '💰 SALES', variant: 'secondary', color: 'blue', priority: 3 });
        break;
      case 'support':
      case 'customer':
        tags.push({ label: '🛠️ SUPPORT', variant: 'secondary', color: 'green', priority: 3 });
        break;
      case 'billing':
        tags.push({ label: '💳 BILLING', variant: 'secondary', color: 'purple', priority: 3 });
        break;
      case 'dispute':
        tags.push({ label: '⚖️ DISPUTE', variant: 'destructive', priority: 3 });
        break;
      case 'product_inquiry':
        tags.push({ label: '📦 PRODUCT', variant: 'outline', priority: 4 });
        break;
    }
  }

  // 3. Intent Tags (Third priority)
  const intent = data.classification?.intent;
  if (intent) {
    switch (intent.toLowerCase()) {
      case 'new_lead':
        tags.push({ label: '🆕 LEAD', variant: 'secondary', color: 'emerald', priority: 4 });
        break;
      case 'complaint':
        tags.push({ label: '😤 COMPLAINT', variant: 'destructive', priority: 2 });
        break;
      case 'question':
        tags.push({ label: '❓ QUESTION', variant: 'outline', priority: 6 });
        break;
      case 'request_info':
        tags.push({ label: 'ℹ️ INFO', variant: 'outline', priority: 7 });
        break;
    }
  }

  // 4. Opportunity Tags (High business value)
  if (data.upsell_data?.hasUpsellOpportunity) {
    const value = data.upsell_data.totalPotentialValue;
    if (value && parseFloat(value) > 1000) {
      tags.push({ label: '💎 HIGH VALUE', variant: 'secondary', color: 'gold', priority: 2 });
    } else if (value) {
      tags.push({ label: '⬆️ UPSELL', variant: 'outline', priority: 5 });
    }
  }

  // 5. Sentiment Tags (Only if not neutral)
  const sentiment = data.classification?.sentiment;
  if (sentiment && sentiment !== 'neutral') {
    switch (sentiment.toLowerCase()) {
      case 'positive':
        tags.push({ label: '😊 POSITIVE', variant: 'secondary', color: 'green', priority: 8 });
        break;
      case 'negative':
        tags.push({ label: '😠 NEGATIVE', variant: 'destructive', priority: 4 });
        break;
      case 'frustrated':
        tags.push({ label: '🤬 FRUSTRATED', variant: 'destructive', priority: 3 });
        break;
    }
  }

  // 6. Language Tags (Only if not default)
  if (data.language_code && data.language_code !== 'en') {
    switch (data.language_code) {
      case 'sl':
        tags.push({ label: '🇸🇮 SL', variant: 'outline', priority: 10 });
        break;
    }
  }

  // 7. Attachment Tag
  if (data.has_attachments) {
    tags.push({ label: '📎 FILES', variant: 'outline', priority: 8 });
  }

  // Sort by priority and limit to 4 tags maximum
  return tags
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 4);
}

/**
 * Get tag style classes for rendering
 */
export function getTagClasses(tag: EmailTag): string {
  const baseClasses = 'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium';
  
  switch (tag.variant) {
    case 'destructive':
      return `${baseClasses} bg-red-100 text-red-800 border border-red-200`;
    case 'secondary':
      if (tag.color) {
        switch (tag.color) {
          case 'blue':
            return `${baseClasses} bg-blue-100 text-blue-800 border border-blue-200`;
          case 'green':
            return `${baseClasses} bg-green-100 text-green-800 border border-green-200`;
          case 'purple':
            return `${baseClasses} bg-purple-100 text-purple-800 border border-purple-200`;
          case 'orange':
            return `${baseClasses} bg-orange-100 text-orange-800 border border-orange-200`;
          case 'emerald':
            return `${baseClasses} bg-emerald-100 text-emerald-800 border border-emerald-200`;
          case 'gold':
            return `${baseClasses} bg-yellow-100 text-yellow-800 border border-yellow-200`;
        }
      }
      return `${baseClasses} bg-gray-100 text-gray-800 border border-gray-200`;
    case 'outline':
      return `${baseClasses} bg-white text-gray-600 border border-gray-300`;
    default:
      return `${baseClasses} bg-gray-50 text-gray-700 border border-gray-200`;
  }
}