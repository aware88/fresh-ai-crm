/**
 * Email Context Builder
 * 
 * This module builds comprehensive context for AI email processing by integrating
 * Metakocka data with email content. It formats data from multiple sources into
 * structured context that can be used by AI models for generating responses.
 */

import { 
  getContactWithRelatedData
} from './data-aggregator';
import { 
  getMetakockaDataForAIContext,
  getOrderDetailsForAI
} from '@/lib/integrations/metakocka/metakocka-ai-integration';
// Import client dynamically to avoid circular dependencies
function createClient() {
  const { createClient } = require('@/lib/supabase/server');
  return createClient();
}
// Format currency helper function
function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

/**
 * Build context for email processing
 * This provides the AI with comprehensive information about the email,
 * the contact, related products, inventory, and any other relevant data
 */
export async function buildEmailProcessingContext(emailId: string) {
  const supabase = createClient();
  
  // Get email data
  const { data: email, error } = await supabase
    .from('emails')
    .select('*, contact_id')
    .eq('id', emailId)
    .single();
  
  if (error || !email) {
    console.error('Error fetching email data:', error);
    return {
      email: null,
      contactContext: null,
      metakockaContext: null,
      processingInstructions: getDefaultEmailProcessingInstructions()
    };
  }
  
  // Get contact data
  const contactContext = await getContactContext(email.contact_id);
  
  // Get Metakocka data if available
  let metakockaContext = null;
  let orderContext = null;
  
  if (email.created_by) {
    try {
      metakockaContext = await getMetakockaDataForAIContext(email.created_by);
      
      // If this email is related to an order, get detailed order data
      if (email.order_id) {
        orderContext = await getOrderDetailsForAI(email.order_id, email.created_by);
      }
    } catch (error) {
      console.error('Error fetching Metakocka data for email context:', error);
    }
  }
  
  // Get language detection results if available
  let languageContext = null;
  if (email.metadata && email.metadata.language_detection) {
    languageContext = {
      detectedLanguage: email.metadata.language_detection.language,
      confidence: email.metadata.language_detection.confidence,
      supportedLanguage: isLanguageSupported(email.metadata.language_detection.language)
    };
  }
  
  // Get intent classification if available
  let intentContext = null;
  if (email.metadata && email.metadata.intent_classification) {
    intentContext = {
      primaryIntent: email.metadata.intent_classification.primary_intent,
      confidence: email.metadata.intent_classification.confidence,
      secondaryIntents: email.metadata.intent_classification.secondary_intents || []
    };
  }
  
  return {
    email,
    contactContext,
    metakockaContext,
    orderContext,
    languageContext,
    intentContext,
    processingInstructions: getEmailProcessingInstructions(email, contactContext, metakockaContext)
  };
}

/**
 * Get contact context for email processing
 */
async function getContactContext(contactId: string) {
  if (!contactId) return null;
  
  const contactData = await getContactWithRelatedData(contactId);
  if (!contactData) return null;
  
  return {
    id: contactData.id,
    name: `${contactData.firstname || ''} ${contactData.lastname || ''}`.trim(),
    email: contactData.email,
    company: contactData.company,
    personalityType: contactData.personalitytype,
    personalityAnalysis: contactData.personalityanalysis,
    communicationPreferences: contactData.communication_preferences || {},
    lastInteraction: contactData.lastinteraction,
    relationshipStrength: calculateRelationshipStrength(contactData),
    previousEmails: formatPreviousEmails(contactData.emails || []),
    notes: contactData.notes
  };
}

/**
 * Format previous emails for context
 */
function formatPreviousEmails(emails: any[]) {
  // Sort emails by date (newest first) and take the 5 most recent
  return emails
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)
    .map(email => ({
      id: email.id,
      subject: email.subject,
      sentAt: email.created_at,
      snippet: summarizeText(email.raw_content, 100),
      sentiment: email.analysis?.sentiment || null,
      topics: email.analysis?.topics || []
    }));
}

/**
 * Calculate relationship strength based on contact data
 * Returns a score from 1-10
 */
function calculateRelationshipStrength(contactData: any): number {
  let score = 5; // Default middle score
  
  // Factors that increase relationship strength
  if (contactData.emails && contactData.emails.length > 0) {
    score += Math.min(contactData.emails.length / 2, 2); // Up to +2 for email history
  }
  
  if (contactData.lastinteraction) {
    // Recent interactions increase score
    const daysSinceLastInteraction = Math.floor(
      (Date.now() - new Date(contactData.lastinteraction).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysSinceLastInteraction < 7) {
      score += 1; // +1 for very recent interaction
    }
  }
  
  if (contactData.personalitytype) {
    score += 1; // +1 for having personality data
  }
  
  // Cap the score between 1-10
  return Math.max(1, Math.min(10, score));
}

/**
 * Define the type for email processing instructions
 */
type EmailProcessingInstructions = {
  generateResponse: boolean;
  suggestProducts: boolean;
  checkInventory: boolean;
  includeMetakockaData: boolean;
  confidenceThreshold: number;
  requireManualReview: boolean;
  responseLanguage?: string;
  responseTone?: 'formal' | 'friendly' | 'professional' | 'casual';
  includeProductDetails?: boolean;
  includePricing?: boolean;
  includeAvailability?: boolean;
  priorityLevel?: 'low' | 'medium' | 'high';
};

/**
 * Get default processing instructions for email processing
 */
function getDefaultEmailProcessingInstructions(): EmailProcessingInstructions {
  return {
    generateResponse: true,
    suggestProducts: true,
    checkInventory: true,
    includeMetakockaData: true,
    confidenceThreshold: 0.7,
    requireManualReview: true,
    responseLanguage: 'en',
    responseTone: 'professional',
    includeProductDetails: true,
    includePricing: true,
    includeAvailability: true,
    priorityLevel: 'medium'
  };
}

/**
 * Get customized processing instructions based on email and contact context
 */
function getEmailProcessingInstructions(
  email: any, 
  contactContext: any, 
  metakockaContext: any
): EmailProcessingInstructions {
  const instructions = getDefaultEmailProcessingInstructions();
  
  // Adjust based on detected language
  if (email.metadata?.language_detection?.language) {
    instructions.responseLanguage = email.metadata.language_detection.language;
  }
  
  // Adjust based on contact personality and preferences
  if (contactContext) {
    // Adjust tone based on personality type
    if (contactContext.personalityType === 'analytical') {
      instructions.responseTone = 'professional';
      instructions.includeProductDetails = true;
    } else if (contactContext.personalityType === 'expressive') {
      instructions.responseTone = 'friendly';
    } else if (contactContext.personalityType === 'driver') {
      instructions.responseTone = 'formal';
    } else if (contactContext.personalityType === 'amiable') {
      instructions.responseTone = 'casual';
    }
    
    // Adjust priority based on relationship strength
    if (contactContext.relationshipStrength > 8) {
      instructions.priorityLevel = 'high';
    } else if (contactContext.relationshipStrength < 4) {
      instructions.priorityLevel = 'low';
    }
    
    // Adjust review requirements based on relationship
    if (contactContext.relationshipStrength > 7) {
      instructions.requireManualReview = false;
    }
  }
  
  // Adjust based on Metakocka data availability
  if (!metakockaContext) {
    instructions.includeMetakockaData = false;
    instructions.suggestProducts = false;
    instructions.checkInventory = false;
  }
  
  // Adjust based on email intent if available
  if (email.metadata?.intent_classification) {
    const intent = email.metadata.intent_classification.primary_intent;
    
    if (intent === 'product_inquiry') {
      instructions.suggestProducts = true;
      instructions.includeProductDetails = true;
      instructions.includePricing = true;
      instructions.includeAvailability = true;
    } else if (intent === 'support_request') {
      instructions.suggestProducts = false;
      instructions.includeProductDetails = false;
      instructions.requireManualReview = true;
    } else if (intent === 'complaint') {
      instructions.requireManualReview = true;
      instructions.priorityLevel = 'high';
    }
  }
  
  return instructions;
}

/**
 * Check if a language is supported for AI response generation
 */
function isLanguageSupported(languageCode: string): boolean {
  // List of supported languages for AI response generation
  const supportedLanguages = [
    'en', // English
    'es', // Spanish
    'fr', // French
    'de', // German
    'it', // Italian
    'pt', // Portuguese
    'nl', // Dutch
    'sl', // Slovenian (for Metakocka)
    'hr', // Croatian
    'sr', // Serbian
    'bs', // Bosnian
    'mk', // Macedonian
    'sq', // Albanian
    'bg', // Bulgarian
    'ro', // Romanian
    'hu', // Hungarian
    'cs', // Czech
    'sk', // Slovak
    'pl', // Polish
    'ru', // Russian
    'uk', // Ukrainian
    'tr', // Turkish
    'ar', // Arabic
    'zh', // Chinese
    'ja', // Japanese
    'ko'  // Korean
  ];
  
  return supportedLanguages.includes(languageCode.toLowerCase());
}

/**
 * Summarize text to a specified length
 */
function summarizeText(text: string, maxLength: number): string {
  if (!text) return '';
  return text.length <= maxLength ? text : text.substring(0, maxLength) + '...';
}
