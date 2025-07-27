/**
 * Email Context Analyzer - Phase 2 Enhancement
 * Provides deeper understanding of email content and relationships
 */

export interface EmailContext {
  // Basic extracted information
  dates: string[];
  statuses: string[];
  quantities: string[];
  locations: string[];
  keyFacts: string[];
  
  // Enhanced context (Phase 2)
  emailType: 'update' | 'inquiry' | 'confirmation' | 'request' | 'complaint' | 'general';
  urgency: 'low' | 'medium' | 'high' | 'urgent';
  senderTone: 'formal' | 'casual' | 'friendly' | 'urgent' | 'neutral';
  actionRequired: boolean;
  informationProvided: string[];
  informationMissing: string[];
  nextSteps: string[];
  relationshipContext: string;
}

export interface ContextSummary {
  summary: string;
  keyPoints: string[];
  avoidAsking: string[];
  shouldAsk: string[];
  responseGuidance: string;
}

/**
 * Enhanced email context analyzer
 */
export class EmailContextAnalyzer {
  
  /**
   * Analyze email content and extract comprehensive context
   */
  static analyzeEmail(emailContent: string): EmailContext {
    const content = emailContent.toLowerCase();
    
    // Basic extraction (from Phase 1)
    const basicContext = this.extractBasicContext(emailContent);
    
    // Enhanced analysis (Phase 2)
    const emailType = this.determineEmailType(content);
    const urgency = this.assessUrgency(content);
    const senderTone = this.analyzeSenderTone(content);
    const actionRequired = this.hasActionRequired(content);
    const informationProvided = this.extractProvidedInfo(content);
    const informationMissing = this.identifyMissingInfo(content, informationProvided);
    const nextSteps = this.suggestNextSteps(content, emailType);
    const relationshipContext = this.analyzeRelationship(content);
    
    return {
      ...basicContext,
      emailType,
      urgency,
      senderTone,
      actionRequired,
      informationProvided,
      informationMissing,
      nextSteps,
      relationshipContext
    };
  }
  
  /**
   * Extract basic context (Phase 1 logic)
   */
  private static extractBasicContext(emailContent: string) {
    const context = {
      dates: [] as string[],
      statuses: [] as string[],
      quantities: [] as string[],
      locations: [] as string[],
      keyFacts: [] as string[]
    };

    // Date patterns
    const datePatterns = [
      /\b(?:end of|by|before|after|on|in)\s+(?:january|february|march|april|may|june|july|august|september|october|november|december|\d{1,2}\/\d{1,2}|\d{1,2}-\d{1,2})\b/gi,
      /\b(?:this|next|last)\s+(?:week|month|year|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi,
      /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g,
      /\b\d{1,2}-\d{1,2}-\d{2,4}\b/g
    ];

    // Status patterns
    const statusPatterns = [
      /\b(?:approved|confirmed|completed|finished|ready|delivered|shipped|received|processed|accepted|rejected|cancelled|pending)\b/gi,
      /\b(?:will be|has been|is being|was)\s+\w+(?:ed|ing)\b/gi
    ];

    // Quantity patterns
    const quantityPatterns = [
      /\b\d+\s*(?:tons?|kg|pounds?|lbs|pieces?|units?|lots?|batches?|containers?)\b/gi,
      /\b(?:lot|batch|shipment|order|quantity)\s+(?:of\s+)?\w+/gi
    ];

    // Location patterns
    const locationPatterns = [
      /\b(?:warehouse|facility|port|dock|location|address|at our|from our)\b/gi
    ];

    // Extract information
    datePatterns.forEach(pattern => {
      const matches = emailContent.match(pattern);
      if (matches) context.dates.push(...matches);
    });

    statusPatterns.forEach(pattern => {
      const matches = emailContent.match(pattern);
      if (matches) context.statuses.push(...matches);
    });

    quantityPatterns.forEach(pattern => {
      const matches = emailContent.match(pattern);
      if (matches) context.quantities.push(...matches);
    });

    locationPatterns.forEach(pattern => {
      const matches = emailContent.match(pattern);
      if (matches) context.locations.push(...matches);
    });

    // Extract key sentences
    const sentences = emailContent.split(/[.!?]+/);
    sentences.forEach(sentence => {
      const trimmed = sentence.trim();
      if (trimmed.length > 10 && (
        /\b(?:approved|confirmed|ready|delivered|will be|has been|by|end of)\b/i.test(trimmed) ||
        /\b\d+\s*(?:tons?|kg|pieces?|lots?)\b/i.test(trimmed)
      )) {
        context.keyFacts.push(trimmed);
      }
    });

    return context;
  }
  
  /**
   * Determine the type of email
   */
  private static determineEmailType(content: string): EmailContext['emailType'] {
    if (/\b(?:approved|confirmed|completed|finished|ready|delivered|shipped)\b/.test(content)) {
      return 'update';
    }
    if (/\b(?:please|could you|would you|can you|need|require|request)\b/.test(content)) {
      return 'request';
    }
    if (/\b(?:question|inquiry|ask|wondering|curious)\b/.test(content)) {
      return 'inquiry';
    }
    if (/\b(?:confirm|confirmation|confirming|confirmed)\b/.test(content)) {
      return 'confirmation';
    }
    if (/\b(?:problem|issue|complaint|wrong|error|failed|not working)\b/.test(content)) {
      return 'complaint';
    }
    return 'general';
  }
  
  /**
   * Assess urgency level
   */
  private static assessUrgency(content: string): EmailContext['urgency'] {
    if (/\b(?:urgent|asap|immediately|right away|emergency|critical)\b/.test(content)) {
      return 'urgent';
    }
    if (/\b(?:soon|quickly|fast|prompt|timely)\b/.test(content)) {
      return 'high';
    }
    if (/\b(?:when convenient|no rush|take your time|whenever)\b/.test(content)) {
      return 'low';
    }
    return 'medium';
  }
  
  /**
   * Analyze sender's tone
   */
  private static analyzeSenderTone(content: string): EmailContext['senderTone'] {
    if (/\b(?:urgent|asap|immediately|critical)\b/.test(content)) {
      return 'urgent';
    }
    if (/\b(?:thanks|thank you|appreciate|grateful|pleasure)\b/.test(content)) {
      return 'friendly';
    }
    if (/\b(?:hi|hello|hey|good morning|good afternoon)\b/.test(content)) {
      return 'casual';
    }
    if (/\b(?:sincerely|regards|best regards|yours truly)\b/.test(content)) {
      return 'formal';
    }
    return 'neutral';
  }
  
  /**
   * Check if action is required
   */
  private static hasActionRequired(content: string): boolean {
    return /\b(?:please|could you|would you|can you|need|require|request|action|respond|reply)\b/.test(content);
  }
  
  /**
   * Extract information that was provided
   */
  private static extractProvidedInfo(content: string): string[] {
    const provided: string[] = [];
    
    // Check for specific information types
    if (/\b(?:approved|confirmed|completed)\b/.test(content)) {
      provided.push('status update');
    }
    if (/\b(?:end of|by|before|after|on|in)\s+(?:january|february|march|april|may|june|july|august|september|october|november|december)/.test(content)) {
      provided.push('timeline/dates');
    }
    if (/\b\d+\s*(?:tons?|kg|pounds?|lbs|pieces?|units?|lots?|batches?)\b/.test(content)) {
      provided.push('quantities/amounts');
    }
    if (/\b(?:warehouse|facility|port|dock|location)\b/.test(content)) {
      provided.push('location information');
    }
    if (/\b(?:lot|batch|shipment|order)\s+(?:number|id|#)\b/.test(content)) {
      provided.push('reference numbers');
    }
    if (/\b(?:certificate|certification|quality|standard)\b/.test(content)) {
      provided.push('certification/quality info');
    }
    
    return provided;
  }
  
  /**
   * Identify information that might be missing
   */
  private static identifyMissingInfo(content: string, provided: string[]): string[] {
    const missing: string[] = [];
    
    // If they mentioned approval but not documents
    if (provided.includes('status update') && !/\b(?:document|certificate|paperwork|form)\b/.test(content)) {
      missing.push('supporting documents');
    }
    
    // If they mentioned delivery but not shipping details
    if (/\b(?:delivery|shipment|shipping)\b/.test(content) && !/\b(?:tracking|carrier|shipping\s+company|logistics)\b/.test(content)) {
      missing.push('shipping/tracking information');
    }
    
    // If they mentioned quantities but not pricing
    if (provided.includes('quantities/amounts') && !/\b(?:price|cost|rate|fee|amount|total)\b/.test(content)) {
      missing.push('pricing information');
    }
    
    // If they mentioned approval but not next steps
    if (provided.includes('status update') && !/\b(?:next|following|subsequent|then|after)\b/.test(content)) {
      missing.push('next steps/timeline');
    }
    
    return missing;
  }
  
  /**
   * Suggest appropriate next steps
   */
  private static suggestNextSteps(content: string, emailType: EmailContext['emailType']): string[] {
    const steps: string[] = [];
    
    switch (emailType) {
      case 'update':
        steps.push('acknowledge the update');
        steps.push('request any missing documentation');
        steps.push('confirm next steps in the process');
        break;
      case 'request':
        steps.push('acknowledge the request');
        steps.push('provide timeline for response');
        steps.push('ask for any additional details needed');
        break;
      case 'inquiry':
        steps.push('provide clear answer to the question');
        steps.push('offer additional relevant information');
        steps.push('invite follow-up questions');
        break;
      case 'confirmation':
        steps.push('confirm receipt of information');
        steps.push('outline next steps');
        break;
      case 'complaint':
        steps.push('acknowledge the issue');
        steps.push('apologize if appropriate');
        steps.push('provide solution or escalation path');
        break;
      default:
        steps.push('acknowledge the communication');
        steps.push('provide relevant response');
    }
    
    return steps;
  }
  
  /**
   * Analyze relationship context
   */
  private static analyzeRelationship(content: string): string {
    if (/\b(?:supplier|vendor|partner)\b/.test(content)) {
      return 'supplier relationship';
    }
    if (/\b(?:customer|client|buyer)\b/.test(content)) {
      return 'customer relationship';
    }
    if (/\b(?:colleague|team|department)\b/.test(content)) {
      return 'internal relationship';
    }
    return 'business relationship';
  }
  
  /**
   * Generate comprehensive context summary for AI prompting
   */
  static generateContextSummary(context: EmailContext): ContextSummary {
    const summary = this.buildSummary(context);
    const keyPoints = this.extractKeyPoints(context);
    const avoidAsking = this.identifyAvoidAsking(context);
    const shouldAsk = this.identifyShouldAsk(context);
    const responseGuidance = this.generateResponseGuidance(context);
    
    return {
      summary,
      keyPoints,
      avoidAsking,
      shouldAsk,
      responseGuidance
    };
  }
  
  private static buildSummary(context: EmailContext): string {
    const parts = [];
    
    // Natural language summary
    if (context.emailType === 'update') {
      parts.push('They provided an update');
    } else if (context.emailType === 'request') {
      parts.push('They made a request');
    } else if (context.emailType === 'inquiry') {
      parts.push('They asked a question');
    }
    
    if (context.urgency === 'urgent') {
      parts.push('with high urgency');
    } else if (context.urgency === 'high') {
      parts.push('needs attention soon');
    }
    
    if (context.informationProvided.length > 0) {
      parts.push(`They shared: ${context.informationProvided.join(', ')}`);
    }
    
    return parts.join('. ');
  }
  
  private static extractKeyPoints(context: EmailContext): string[] {
    const points = [];
    
    // Add key facts
    points.push(...context.keyFacts.slice(0, 3));
    
    // Add status updates
    if (context.statuses.length > 0) {
      points.push(`Status: ${context.statuses.join(', ')}`);
    }
    
    // Add dates
    if (context.dates.length > 0) {
      points.push(`Timeline: ${context.dates.join(', ')}`);
    }
    
    // Add quantities
    if (context.quantities.length > 0) {
      points.push(`Quantities: ${context.quantities.join(', ')}`);
    }
    
    return points;
  }
  
  private static identifyAvoidAsking(context: EmailContext): string[] {
    const avoid: string[] = [];
    
    // Don't ask for information already provided
    if (context.informationProvided.includes('status update')) {
      avoid.push('status updates');
    }
    if (context.informationProvided.includes('timeline/dates')) {
      avoid.push('delivery dates');
      avoid.push('timeline information');
    }
    if (context.informationProvided.includes('quantities/amounts')) {
      avoid.push('quantity information');
    }
    if (context.informationProvided.includes('reference numbers')) {
      avoid.push('reference numbers');
    }
    
    return avoid;
  }
  
  private static identifyShouldAsk(context: EmailContext): string[] {
    const should: string[] = [];
    
    // Suggest asking for missing information
    context.informationMissing.forEach(missing => {
      should.push(missing);
    });
    
    // Add relationship-specific suggestions
    if (context.relationshipContext === 'supplier relationship') {
      should.push('quality certificates');
      should.push('shipping documents');
    }
    
    return should;
  }
  
  private static generateResponseGuidance(context: EmailContext): string {
    const guidance = [];
    
    // Natural guidance
    if (context.urgency === 'urgent') {
      guidance.push('This needs quick attention');
    }
    
    if (context.actionRequired) {
      guidance.push('They want you to do something');
    }
    
    if (context.senderTone === 'formal') {
      guidance.push('Keep it professional');
    } else if (context.senderTone === 'casual') {
      guidance.push('You can be more relaxed');
    }
    
    return guidance.join('. ');
  }
} 