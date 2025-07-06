/**
 * Enhanced Email Context Builder with Product Recommendations
 * 
 * This module builds comprehensive context for AI email processing by integrating
 * Metakocka data with email content and product recommendations. It formats data 
 * from multiple sources into structured context that can be used by AI models for 
 * generating responses.
 */

import { 
  getContactWithRelatedData,
  getEmailProcessingContext
} from './data-aggregator';
import { 
  getMetakockaDataForAIContext,
  getOrderDetailsForAI
} from '@/lib/integrations/metakocka/metakocka-ai-integration';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency } from '@/utils/format';
import { ProductRecommendationService } from '@/services/product-recommendation';

/**
 * Build context for email processing with product recommendations
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

  // Get product recommendations based on email content
  let productRecommendations = null;
  if (email.body) {
    try {
      const recommendationService = new ProductRecommendationService();
      productRecommendations = await recommendationService.recommendProductsFromEmail(
        email.body,
        email.contact_id,
        3 // Limit to 3 recommendations
      );
      
      // If the email is about a specific product, also get frequently bought together products
      if (email.metadata?.product_mentions?.length > 0) {
        const productId = email.metadata.product_mentions[0].product_id;
        const frequentlyBoughtTogether = await recommendationService.getFrequentlyBoughtTogether(productId);
        productRecommendations.frequentlyBoughtTogether = frequentlyBoughtTogether.products;
      }
      
      // If we have contact data, get personalized recommendations
      if (email.contact_id) {
        const personalizedRecommendations = await recommendationService.getPersonalizedRecommendations(email.contact_id);
        productRecommendations.personalizedRecommendations = personalizedRecommendations.products;
      }
    } catch (error) {
      console.error('Error generating product recommendations:', error);
    }
  }
  
  // Get processing instructions based on all available context
  const processingInstructions = getEmailProcessingInstructions(
    email, 
    contactContext, 
    metakockaContext,
    productRecommendations
  );
  
  return {
    email,
    contactContext,
    metakockaContext,
    orderContext,
    languageContext,
    intentContext,
    productRecommendations,
    processingInstructions
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
    communicationPreferences: contactData.communication_preferences,
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
      sentDate: email.created_at,
      content: summarizeText(email.body, 150),
      sentiment: email.metadata?.sentiment_analysis?.sentiment || 'neutral',
      intent: email.metadata?.intent_classification?.primary_intent || 'unknown'
    }));
}

/**
 * Calculate relationship strength based on contact data
 * Returns a score from 1-10
 */
function calculateRelationshipStrength(contactData: any): number {
  if (!contactData) return 5; // Default to medium
  
  let score = 5; // Start at neutral
  
  // Factor 1: Number of interactions
  const interactionCount = (contactData.emails?.length || 0) + 
                          (contactData.interactions?.length || 0);
  if (interactionCount > 20) score += 2;
  else if (interactionCount > 10) score += 1;
  else if (interactionCount < 3) score -= 1;
  
  // Factor 2: Recency of interaction
  if (contactData.lastinteraction) {
    const daysSinceLastInteraction = Math.floor(
      (Date.now() - new Date(contactData.lastinteraction).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysSinceLastInteraction < 7) score += 1;
    else if (daysSinceLastInteraction > 90) score -= 1;
  }
  
  // Factor 3: Sentiment of interactions
  const positiveInteractions = (contactData.emails || []).filter(
    (email: any) => email.metadata?.sentiment_analysis?.sentiment === 'positive'
  ).length;
  
  const negativeInteractions = (contactData.emails || []).filter(
    (email: any) => email.metadata?.sentiment_analysis?.sentiment === 'negative'
  ).length;
  
  if (positiveInteractions > negativeInteractions + 3) score += 1;
  if (negativeInteractions > positiveInteractions) score -= 1;
  
  // Ensure score is between 1-10
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
  includeRecommendations?: boolean;
  includeFrequentlyBoughtTogether?: boolean;
  includePersonalizedRecommendations?: boolean;
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
    priorityLevel: 'medium',
    includeRecommendations: true,
    includeFrequentlyBoughtTogether: true,
    includePersonalizedRecommendations: true
  };
}

/**
 * Get customized processing instructions based on email and contact context
 */
function getEmailProcessingInstructions(
  email: any, 
  contactContext: any, 
  metakockaContext: any,
  productRecommendations: any
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
  
  // Adjust based on product recommendations availability
  if (!productRecommendations || productRecommendations.products.length === 0) {
    instructions.includeRecommendations = false;
  }
  
  if (!productRecommendations?.frequentlyBoughtTogether || 
      productRecommendations.frequentlyBoughtTogether.length === 0) {
    instructions.includeFrequentlyBoughtTogether = false;
  }
  
  if (!productRecommendations?.personalizedRecommendations || 
      productRecommendations.personalizedRecommendations.length === 0) {
    instructions.includePersonalizedRecommendations = false;
  }
  
  // Adjust based on email intent if available
  if (email.metadata?.intent_classification) {
    const intent = email.metadata.intent_classification.primary_intent;
    
    if (intent === 'product_inquiry') {
      instructions.suggestProducts = true;
      instructions.includeProductDetails = true;
      instructions.includePricing = true;
      instructions.includeAvailability = true;
      instructions.includeRecommendations = true;
      instructions.includeFrequentlyBoughtTogether = true;
    } else if (intent === 'support_request') {
      instructions.suggestProducts = false;
      instructions.includeProductDetails = false;
      instructions.includeRecommendations = false;
      instructions.requireManualReview = true;
    } else if (intent === 'complaint') {
      instructions.requireManualReview = true;
      instructions.priorityLevel = 'high';
      instructions.includeRecommendations = false;
    } else if (intent === 'order_status') {
      instructions.includeProductDetails = true;
      instructions.includeAvailability = true;
      instructions.includeRecommendations = false;
    } else if (intent === 'price_inquiry') {
      instructions.includePricing = true;
      instructions.includeRecommendations = true;
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
