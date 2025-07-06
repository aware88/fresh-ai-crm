/**
 * AI Context Builder
 * 
 * This module builds comprehensive context for AI processing by leveraging
 * the data aggregator service. It formats data from multiple sources into
 * structured context that can be used by AI models.
 */

import { 
  getSupplierWithRelatedData, 
  getContactWithRelatedData,
  getDocumentProcessingContext,
  getAIQueryContext
} from './data-aggregator';
import { 
  getMetakockaDataForAIContext,
  getOrderDetailsForAI
} from '@/lib/integrations/metakocka/metakocka-ai-integration';

/**
 * Build context for document processing
 * This provides the AI with comprehensive information about the document,
 * the supplier, related emails, and any other relevant data
 */
export async function buildDocumentProcessingContext(documentId: string) {
  const context = await getDocumentProcessingContext(documentId);
  
  if (!context) {
    return {
      document: null,
      supplierContext: null,
      emailContext: null,
      processingInstructions: getDefaultProcessingInstructions()
    };
  }
  
  // Format supplier information for AI context
  const supplierContext = formatSupplierContext(context.supplier);
  
  // Format email information for AI context
  const emailContext = formatEmailContext(context.relatedEmails);
  
  // Format contact information with personality profiles
  const contactContext = formatContactContext(context.relatedContacts);
  
  // Format interaction information
  const interactionContext = formatInteractionContext(context.relatedInteractions);
  
  // Get Metakocka data if available
  let metakockaContext = null;
  let orderContext = null;
  if (context.document?.created_by) {
    try {
      metakockaContext = await getMetakockaDataForAIContext(context.document.created_by);
      
      // If this is an order document, get detailed order data
      if (context.document.document_type === 'order') {
        orderContext = await getOrderDetailsForAI(context.document.id, context.document.created_by);
      }
    } catch (error) {
      console.error('Error fetching Metakocka data for AI context:', error);
    }
  }
  
  return {
    document: context.document,
    supplierContext,
    emailContext,
    contactContext,
    interactionContext,
    metakockaContext,
    orderContext,
    processingInstructions: getProcessingInstructions(context)
  };
}

/**
 * Build context for AI query processing
 */
export async function buildQueryProcessingContext(queryId: string) {
  const context = await getAIQueryContext(queryId);
  
  if (!context) {
    return {
      query: null,
      supplierContext: [],
      previousQueries: [],
      metakockaContext: null
    };
  }
  
  // Format supplier information for each result
  const supplierContext = context.results.map(result => ({
    supplierId: result.supplier_id,
    supplierInfo: formatSupplierContext(result.supplierData),
    relevanceScore: result.relevance_score,
    productMatches: result.product_matches
  }));
  
  // Get previous queries for context
  const previousQueries = await getPreviousQueries(context.query.created_by);
  
  // Get Metakocka data if available
  let metakockaContext = null;
  let orderContext = null;
  if (context.query?.created_by) {
    try {
      metakockaContext = await getMetakockaDataForAIContext(context.query.created_by);
      
      // If this query is related to an order, get detailed order data
      if (context.query.order_id) {
        orderContext = await getOrderDetailsForAI(context.query.order_id, context.query.created_by);
      }
    } catch (error) {
      console.error('Error fetching Metakocka data for AI query context:', error);
    }
  }
  
  return {
    query: context.query,
    supplierContext,
    previousQueries,
    metakockaContext,
    orderContext
  };
}

/**
 * Format supplier data for AI context
 */
function formatSupplierContext(supplier: any) {
  if (!supplier) return null;
  
  return {
    id: supplier.id,
    name: supplier.name,
    email: supplier.email,
    phone: supplier.phone,
    website: supplier.website,
    reliabilityScore: supplier.reliability_score,
    notes: supplier.notes,
    documentCount: supplier.documents?.length || 0,
    emailCount: supplier.emails?.length || 0,
    pricingCount: supplier.pricing?.length || 0,
    contacts: (supplier.contacts || []).map((contact: any) => ({
      id: contact.id,
      name: `${contact.firstname} ${contact.lastname}`,
      email: contact.email,
      position: contact.position,
      personalityType: contact.personalitytype
    })),
    recentDocuments: (supplier.documents || [])
      .sort((a: any, b: any) => new Date(b.upload_date).getTime() - new Date(a.upload_date).getTime())
      .slice(0, 3)
      .map((doc: any) => ({
        id: doc.id,
        fileName: doc.file_name,
        documentType: doc.document_type,
        uploadDate: doc.upload_date,
        processingStatus: doc.processing_status
      })),
    recentEmails: (supplier.emails || [])
      .sort((a: any, b: any) => new Date(b.received_date).getTime() - new Date(a.received_date).getTime())
      .slice(0, 3)
      .map((email: any) => ({
        id: email.id,
        subject: email.subject,
        senderName: email.sender_name,
        senderEmail: email.sender_email,
        receivedDate: email.received_date
      }))
  };
}

/**
 * Format email data for AI context
 */
function formatEmailContext(emails: any[]) {
  if (!emails || emails.length === 0) return null;
  
  return emails.map(email => ({
    id: email.id,
    subject: email.subject,
    senderName: email.sender_name,
    senderEmail: email.sender_email,
    receivedDate: email.received_date,
    body: email.body ? summarizeText(email.body, 200) : null,
    productTags: email.product_tags
  }));
}

/**
 * Format contact data for AI context, including personality profiles
 */
function formatContactContext(contacts: any[]) {
  if (!contacts || contacts.length === 0) return null;
  
  return contacts.map(contact => {
    // Extract AI profiler data if available
    const personalityProfile = contact.ai_profiler ? {
      communicationStyle: contact.ai_profiler.communication_style,
      decisionMakingStyle: contact.ai_profiler.decision_making_style,
      preferredDataFormat: contact.ai_profiler.preferred_data_format,
      keyMotivators: contact.ai_profiler.key_motivators,
      painPoints: contact.ai_profiler.pain_points
    } : null;
    
    return {
      id: contact.id,
      name: `${contact.firstname} ${contact.lastname}`,
      email: contact.email,
      position: contact.position,
      personalityType: contact.personalitytype,
      personalityProfile,
      lastInteractionDate: contact.last_interaction_date,
      relationshipStrength: contact.relationship_strength
    };
  });
}

/**
 * Format interaction data for AI context
 */
function formatInteractionContext(interactions: any[]) {
  if (!interactions || interactions.length === 0) return null;
  
  return interactions.map(interaction => ({
    id: interaction.id,
    contactId: interaction.contact_id,
    interactionType: interaction.interaction_type,
    interactionDate: interaction.interaction_date,
    content: interaction.content ? summarizeText(interaction.content, 150) : null,
    sentiment: interaction.sentiment,
    topics: interaction.topics
  }));
}

/**
 * Define the type for processing instructions
 */
type ProcessingInstructions = {
  extractProducts: boolean;
  extractPricing: boolean;
  extractMetadata: boolean;
  confidenceThreshold: number;
  requireManualReview: boolean;
  detailLevel?: 'summary' | 'standard' | 'comprehensive';
  includeAnalytics?: boolean;
  includeRecommendations?: boolean;
  outputFormat?: string;
  priorityLevel?: 'low' | 'medium' | 'high';
};

/**
 * Get default processing instructions for document processing
 */
function getDefaultProcessingInstructions(): ProcessingInstructions {
  return {
    extractProducts: true,
    extractPricing: true,
    extractMetadata: true,
    confidenceThreshold: 0.7,
    requireManualReview: true,
    detailLevel: 'standard',
    includeAnalytics: false,
    includeRecommendations: false,
    priorityLevel: 'medium'
  };
}

/**
 * Get customized processing instructions based on context
 */
function getProcessingInstructions(context: any): ProcessingInstructions {
  const instructions = getDefaultProcessingInstructions();
  
  // If the supplier has a high reliability score, we might lower the confidence threshold
  if (context.supplier?.reliability_score > 8) {
    instructions.confidenceThreshold = 0.6;
  }
  
  // If we have processed many documents from this supplier successfully, we might not require manual review
  const processedDocs = (context.supplier?.documents || []).filter((doc: any) => 
    doc.processing_status === 'approved'
  ).length;
  
  if (processedDocs > 5) {
    instructions.requireManualReview = false;
  }
  
  // Personality-aware processing adjustments
  if (context.relatedContacts && context.relatedContacts.length > 0) {
    // Get the most relevant contact (first one)
    const primaryContact = context.relatedContacts[0];
    
    // If we have AI profiler data for this contact
    if (primaryContact.ai_profiler) {
      // Adjust processing based on communication style
      if (primaryContact.ai_profiler.communication_style === 'detailed') {
        instructions.extractMetadata = true;
        instructions.detailLevel = 'comprehensive';
      } else if (primaryContact.ai_profiler.communication_style === 'concise') {
        instructions.detailLevel = 'summary';
      }
      
      // Adjust processing based on decision making style
      if (primaryContact.ai_profiler.decision_making_style === 'analytical') {
        instructions.includeAnalytics = true;
        instructions.confidenceThreshold = 0.8; // Higher threshold for analytical people
      } else if (primaryContact.ai_profiler.decision_making_style === 'intuitive') {
        instructions.includeRecommendations = true;
      }
      
      // Adjust processing based on preferred data format
      if (primaryContact.ai_profiler.preferred_data_format) {
        instructions.outputFormat = primaryContact.ai_profiler.preferred_data_format;
      }
    }
    
    // If the contact has a high relationship strength, we might be more lenient
    if (primaryContact.relationship_strength > 8) {
      instructions.priorityLevel = 'high';
    }
  }
  
  return instructions;
}

/**
 * Get previous queries for context
 */
async function getPreviousQueries(userId: string) {
  const supabase = createClient();
  
  const { data: queries } = await supabase
    .from('supplier_queries')
    .select('*')
    .eq('created_by', userId)
    .order('timestamp', { ascending: false })
    .limit(5);
  
  return queries || [];
}

/**
 * Summarize text to a specified length
 */
function summarizeText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Create Supabase client
 */
function createClient() {
  // Import here to avoid circular dependencies
  const { createClient } = require('@/lib/supabase/client');
  return createClient();
}
