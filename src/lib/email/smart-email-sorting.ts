/**
 * Smart Email Sorting System
 * 
 * Sorts emails with the following priority:
 * 1. Highlighted emails first (by priority level)
 * 2. Regular emails by date (newest first)
 * 3. Replied emails are automatically unhighlighted and sorted by date
 */

interface EmailForSorting {
  id: string;
  date: string;
  read: boolean;
  assigned_agent?: 'customer' | 'sales' | 'dispute' | 'billing' | 'auto_reply';
  highlight_color?: string;
  agent_priority?: 'low' | 'medium' | 'high' | 'urgent';
  upsellData?: {
    hasUpsellOpportunity: boolean;
    highestConfidence?: 'high' | 'medium' | 'low';
    totalPotentialValue?: number;
  };
  replied?: boolean;
  last_reply_at?: string;
}

/**
 * Priority levels for different highlight types
 */
const HIGHLIGHT_PRIORITIES = {
  // Agent-based priorities
  dispute: 1,        // Red - Most urgent
  sales: 2,          // Green - High priority
  billing: 3,        // Purple - Medium-high priority
  customer: 4,       // Blue - Medium priority
  auto_reply: 6,     // Gray - Low priority
  
  // Opportunity-based priorities (when no agent assignment)
  opportunity_high: 2,   // Green - Same as sales
  opportunity_medium: 5, // Amber - Medium-low priority
  opportunity_low: 5,    // Amber - Medium-low priority
} as const;

/**
 * Determine if an email should be highlighted
 */
function isEmailHighlighted(email: EmailForSorting): boolean {
  // Don't highlight if email has been replied to
  if (email.replied || email.last_reply_at) {
    return false;
  }
  
  // Highlight if has agent assignment (except auto_reply with low priority)
  if (email.assigned_agent && email.assigned_agent !== 'auto_reply') {
    return true;
  }
  
  // Highlight if has high-value opportunity
  if (email.upsellData?.hasUpsellOpportunity) {
    const value = email.upsellData.totalPotentialValue || 0;
    const confidence = email.upsellData.highestConfidence;
    
    // Only highlight significant opportunities
    return value >= 1000 || confidence === 'high';
  }
  
  // Highlight if has urgent priority regardless of agent
  if (email.agent_priority === 'urgent') {
    return true;
  }
  
  return false;
}

/**
 * Get priority score for highlighted email (lower = higher priority)
 */
function getHighlightPriority(email: EmailForSorting): number {
  // Urgent always comes first
  if (email.agent_priority === 'urgent') {
    return 0;
  }
  
  // Agent-based priority
  if (email.assigned_agent && email.assigned_agent in HIGHLIGHT_PRIORITIES) {
    return HIGHLIGHT_PRIORITIES[email.assigned_agent as keyof typeof HIGHLIGHT_PRIORITIES];
  }
  
  // Opportunity-based priority
  if (email.upsellData?.hasUpsellOpportunity) {
    const confidence = email.upsellData.highestConfidence;
    if (confidence === 'high') {
      return HIGHLIGHT_PRIORITIES.opportunity_high;
    } else {
      return HIGHLIGHT_PRIORITIES.opportunity_medium;
    }
  }
  
  return 10; // Default low priority
}

/**
 * Smart sort emails with highlighted emails first, then by date
 */
export function sortEmailsSmart<T extends EmailForSorting>(emails: T[]): T[] {
  return [...emails].sort((a, b) => {
    const aHighlighted = isEmailHighlighted(a);
    const bHighlighted = isEmailHighlighted(b);
    
    // If both highlighted or both not highlighted, sort by their category
    if (aHighlighted && bHighlighted) {
      // Both highlighted - sort by priority, then by date
      const aPriority = getHighlightPriority(a);
      const bPriority = getHighlightPriority(b);
      
      if (aPriority !== bPriority) {
        return aPriority - bPriority; // Lower number = higher priority
      }
      
      // Same priority - sort by date (newest first)
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
    
    if (aHighlighted && !bHighlighted) {
      return -1; // a comes first
    }
    
    if (!aHighlighted && bHighlighted) {
      return 1; // b comes first
    }
    
    // Both not highlighted - sort by date only (newest first)
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
}

/**
 * Mark email as replied and remove highlighting
 */
export function markEmailAsReplied<T extends EmailForSorting>(
  email: T, 
  replyTimestamp?: string
): T {
  return {
    ...email,
    replied: true,
    last_reply_at: replyTimestamp || new Date().toISOString(),
    // Clear highlighting-related fields
    assigned_agent: undefined,
    highlight_color: undefined,
    agent_priority: undefined,
  };
}

/**
 * Get display color for email border
 */
export function getEmailBorderColor(email: EmailForSorting, isSelected: boolean): string {
  // Selected email always gets blue border
  if (isSelected) {
    return '#3B82F6'; // Blue
  }
  
  // Don't highlight replied emails
  if (email.replied || email.last_reply_at) {
    return email.read ? 'transparent' : '#3B82F6'; // Unread blue, read transparent
  }
  
  // Opportunity colors (highest priority)
  if (email.upsellData?.hasUpsellOpportunity) {
    return email.upsellData.highestConfidence === 'high' 
      ? '#10B981' // Green for high confidence
      : '#F59E0B'; // Amber for medium/low confidence
  }
  
  // Agent assignment colors
  if (email.highlight_color) {
    return email.highlight_color;
  }
  
  // Default unread/read colors
  return email.read ? 'transparent' : '#3B82F6';
}

/**
 * Get email priority level for display
 */
export function getEmailPriorityLevel(email: EmailForSorting): 'urgent' | 'high' | 'medium' | 'low' | 'none' {
  if (email.replied || email.last_reply_at) {
    return 'none';
  }
  
  if (email.agent_priority === 'urgent' || email.assigned_agent === 'dispute') {
    return 'urgent';
  }
  
  if (email.assigned_agent === 'sales' || 
      (email.upsellData?.hasUpsellOpportunity && email.upsellData.highestConfidence === 'high')) {
    return 'high';
  }
  
  if (email.assigned_agent === 'billing' || email.assigned_agent === 'customer') {
    return 'medium';
  }
  
  if (email.upsellData?.hasUpsellOpportunity || email.assigned_agent === 'auto_reply') {
    return 'low';
  }
  
  return 'none';
}
