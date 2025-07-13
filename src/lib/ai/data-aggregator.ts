/**
 * Data Aggregator Service
 * 
 * This service aggregates data from multiple sources to provide comprehensive
 * context for AI processing. It combines information from suppliers, contacts,
 * emails, documents, and interactions to create a unified data view.
 */

import { Database } from '@/types/supabase';

// Import client dynamically to avoid circular dependencies and handle build-time safely
async function createClient() {
  try {
    const { createClient } = await import('@/lib/supabase/client');
    return createClient();
  } catch (error) {
    console.error('Error initializing Supabase client:', error);
    // Return a comprehensive mock client that simulates all used method chains
    // Mock response factory to ensure consistent return shape
    const mockResponse = (data = null) => ({ data, error: null });
    
    // Create a chainable mock that handles any method call
    const createChainableMock = () => {
      const handler = {
        get: (target: any, prop: string) => {
          // Return empty arrays/objects for common properties
          if (prop === 'data') return [];
          if (prop === 'error') return null;
          
          // Return a function for any method call that returns another chainable mock
          return (...args: any[]) => {
            // For terminal operations that should return data
            if (['single', 'maybeSingle'].includes(prop)) {
              return mockResponse(null);
            }
            // Continue the chain for all other methods
            return new Proxy({}, handler);
          };
        }
      };
      return new Proxy({}, handler);
    };
    
    // Create the base mock client
    return {
      from: () => createChainableMock()
    };
  }
}

// Define custom types for data aggregation
type Supplier = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  website?: string | null;
  reliability_score?: number | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
};

type SupplierDocument = {
  id: string;
  supplier_id: string;
  file_name: string;
  file_type: string;
  document_type: string;
  file_path: string;
  upload_date?: string;
  metadata?: any;
  created_by?: string | null;
  processing_status?: string;
  extracted_data?: any;
  processing_metadata?: any;
  processing_error?: string | null;
  processed_at?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
};

type SupplierEmail = {
  id: string;
  supplier_id: string;
  sender_email: string;
  sender_name?: string | null;
  subject?: string | null;
  body?: string | null;
  received_date?: string;
  product_tags?: any;
  metadata?: any;
  created_at?: string;
  created_by?: string | null;
};

type SupplierPricing = {
  id: string;
  user_id: string;
  supplier_id: string;
  product_id: string;
  price: number;
  currency?: string;
  unit_price?: boolean;
  quantity?: number;
  unit?: string | null;
  valid_from?: string | null;
  valid_to?: string | null;
  source_document_id?: string | null;
  notes?: string | null;
  metadata?: any;
  created_at?: string;
  updated_at?: string;
};

type Contact = {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  position?: string | null;
  personalitytype?: string | null;
  notes?: string | null;
  lastcontact?: string | null;
  lastinteraction?: string | null;
  createdat?: string;
  updatedat?: string;
  ai_profiler_id?: number | null;
  personalitynotes?: string;
  status?: string;
  full_name?: string | null;
  personalityanalysis?: any;
  personalityhistory?: any;
  personalitylastupdated?: string | null;
};

type Interaction = {
  id: string;
  contact_id: string;
  type: string;
  subject?: string | null;
  content?: string | null;
  sentiment?: string | null;
  personalityinsights?: string | null;
  date?: string;
  createdat?: string;
  updatedat?: string;
  interaction_date?: string;
  metadata?: any;
  title: string;
  created_by?: string | null;
};

type Email = {
  id: string;
  subject?: string | null;
  sender: string;
  recipient: string;
  raw_content?: string | null;
  analysis?: string | null;
  contact_id?: string | null;
  message_id?: string | null;
  read?: boolean;
  created_at?: string;
  updated_at?: string;
};

type AIProfiler = {
  id: number;
  Personality_Type?: string | null;
  Traits?: string | null;
  Sales_Strategy?: string | null;
  Messaging_Do?: string | null;
  Messaging_Dont?: string | null;
  Common_Biases?: string | null;
  Emotional_Trigger?: string | null;
  Objection?: string | null;
  Reframe?: string | null;
  Copywriting_Style?: string | null;
  Tone_Preference?: string | null;
  Best_CTA_Type?: string | null;
  Preferred_Visual_Format?: string | null;
  Trigger_Signal_Keywords?: string | null;
  Follow_Up_Timing?: string | null;
  Suggested_Subject_Lines?: string | null;
  Cognitive_Bias?: string | null;
  Bias_Use_Tip?: string | null;
  Reading_Style?: string | null;
  Stress_Response?: string | null;
  Top_Trigger_Words?: string | null;
  Avoid_Words?: string | null;
  Emotional_Intent?: string | null;
  Cultural_Tone?: string | null;
  Lead_Score?: number | null;
  Conversion_Likelihood?: string | null;
  Scraped_Signal_Summary?: string | null;
  Recommended_Channel?: string | null;
  Estimated_Deal_Tier?: string | null;
};

type SupplierWithRelations = Supplier & {
  documents?: SupplierDocument[];
  emails?: SupplierEmail[];
  pricing?: SupplierPricing[];
  contacts?: Contact[];
};

type DocumentWithRelations = SupplierDocument & {
  supplier?: Supplier;
  relatedContacts?: Contact[];
  relatedInteractions?: Interaction[];
  relatedEmails?: SupplierEmail[];
};

type ContactWithRelations = Contact & {
  interactions?: Interaction[];
  emails?: Email[];
  ai_profiler?: AIProfiler | null;
};

/**
 * Fetch comprehensive supplier data including related documents, emails, and pricing
 */
export async function getSupplierWithRelatedData(supplierId: string): Promise<SupplierWithRelations | null> {
  const supabase = await createClient();
  
  // Fetch the supplier
  const { data: supplier, error } = await supabase
    .from('suppliers')
    .select('*')
    .eq('id', supplierId)
    .single();
  
  if (error || !supplier) {
    console.error('Error fetching supplier:', error);
    return null;
  }
  
  // Fetch related documents
  const { data: documents } = await supabase
    .from('supplier_documents')
    .select('*')
    .eq('supplier_id', supplierId);
  
  // Fetch related emails
  const { data: emails } = await supabase
    .from('supplier_emails')
    .select('*')
    .eq('supplier_id', supplierId);
  
  // Fetch related pricing
  const { data: pricing } = await supabase
    .from('supplier_pricing')
    .select('*')
    .eq('supplier_id', supplierId);
  
  // Fetch related contacts (if any, based on email domain matching)
  const { data: contacts } = await supabase
    .from('contacts')
    .select('*')
    .ilike('email', `%@${supplier.email.split('@')[1]}`);
  
  return {
    ...supplier,
    documents: documents || [],
    emails: emails || [],
    pricing: pricing || [],
    contacts: contacts || []
  };
}

/**
 * Fetch comprehensive contact data including interactions, emails, and AI profiler data
 */
export async function getContactWithRelatedData(contactId: string): Promise<ContactWithRelations | null> {
  const supabase = await createClient();
  
  // Fetch the contact
  const { data: contact, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', contactId)
    .single();
  
  if (error || !contact) {
    console.error('Error fetching contact:', error);
    return null;
  }
  
  // Fetch related interactions
  const { data: interactions } = await supabase
    .from('interactions')
    .select('*')
    .eq('contact_id', contactId);
  
  // Fetch related emails
  const { data: emails } = await supabase
    .from('emails')
    .select('*')
    .eq('contact_id', contactId);
  
  // Fetch AI profiler data if available
  const { data: aiProfiler } = await supabase
    .from('ai_profiler')
    .select('*')
    .eq('id', contact.ai_profiler_id || 0)
    .maybeSingle();
  
  return {
    ...contact,
    interactions: interactions || [],
    emails: emails || [],
    ai_profiler: aiProfiler || null
  };
}

/**
 * Get context for document processing based on supplier and document information
 */
export async function getDocumentProcessingContext(documentId: string) {
  const supabase = await createClient();
  
  // Fetch the document with supplier information
  const { data: document, error } = await supabase
    .from('supplier_documents')
    .select(`
      *,
      supplier:supplier_id (*)
    `)
    .eq('id', documentId)
    .single();
  
  if (error || !document) {
    console.error('Error fetching document:', error);
    return null;
  }
  
  // Get supplier with all related data
  const supplierData = await getSupplierWithRelatedData(document.supplier_id);
  
  // Get related emails that might provide context for this document
  const { data: relatedEmails } = await supabase
    .from('supplier_emails')
    .select('*')
    .eq('supplier_id', document.supplier_id)
    .order('received_date', { ascending: false })
    .limit(5);
  
  // Find related contacts based on document content and metadata
  const relatedContacts = await findRelatedContacts(document);
  
  // Find related interactions that might mention this document
  const relatedInteractions = await findRelatedInteractions(document, relatedContacts);
  
  return {
    document,
    supplier: supplierData,
    relatedEmails: relatedEmails || [],
    relatedContacts: relatedContacts || [],
    relatedInteractions: relatedInteractions || []
  };
}

/**
 * Find contacts related to a document based on content matching
 */
async function findRelatedContacts(document: SupplierDocument): Promise<Contact[]> {
  const supabase = await createClient();
  const relatedContacts: Contact[] = [];
  
  // If we have extracted data with contact information
  if (document.extracted_data && typeof document.extracted_data === 'object') {
    const extractedData = document.extracted_data as any;
    
    // Look for contact emails in the extracted data
    const possibleEmails: string[] = [];
    
    // Check common fields where emails might be found
    if (extractedData.contacts) {
      // If there's a dedicated contacts array
      if (Array.isArray(extractedData.contacts)) {
        extractedData.contacts.forEach((contact: any) => {
          if (contact.email) possibleEmails.push(contact.email);
        });
      } else if (extractedData.contacts.email) {
        possibleEmails.push(extractedData.contacts.email);
      }
    }
    
    // Check for cc, bcc, to fields (common in emails and some documents)
    ['to', 'cc', 'bcc', 'recipient', 'recipients'].forEach(field => {
      if (extractedData[field]) {
        if (Array.isArray(extractedData[field])) {
          extractedData[field].forEach((item: any) => {
            if (typeof item === 'string' && item.includes('@')) {
              possibleEmails.push(item);
            } else if (item.email) {
              possibleEmails.push(item.email);
            }
          });
        } else if (typeof extractedData[field] === 'string' && extractedData[field].includes('@')) {
          possibleEmails.push(extractedData[field]);
        }
      }
    });
    
    // If we found any emails, look for matching contacts
    if (possibleEmails.length > 0) {
      for (const email of possibleEmails) {
        const { data: contacts } = await supabase
          .from('contacts')
          .select('*')
          .eq('email', email);
        
        if (contacts && contacts.length > 0) {
          relatedContacts.push(...contacts);
        }
      }
    }
    
    // Also look for contacts by name if available
    const possibleNames: {first?: string, last?: string}[] = [];
    
    if (extractedData.contacts) {
      if (Array.isArray(extractedData.contacts)) {
        extractedData.contacts.forEach((contact: any) => {
          if (contact.name || contact.firstName || contact.lastName) {
            possibleNames.push({
              first: contact.firstName || (contact.name ? contact.name.split(' ')[0] : undefined),
              last: contact.lastName || (contact.name ? contact.name.split(' ').slice(1).join(' ') : undefined)
            });
          }
        });
      } else if (extractedData.contacts.name || extractedData.contacts.firstName || extractedData.contacts.lastName) {
        possibleNames.push({
          first: extractedData.contacts.firstName || (extractedData.contacts.name ? extractedData.contacts.name.split(' ')[0] : undefined),
          last: extractedData.contacts.lastName || (extractedData.contacts.name ? extractedData.contacts.name.split(' ').slice(1).join(' ') : undefined)
        });
      }
    }
    
    // If we found any names, look for matching contacts
    if (possibleNames.length > 0) {
      for (const name of possibleNames) {
        if (name.first && name.last) {
          const { data: contacts } = await supabase
            .from('contacts')
            .select('*')
            .ilike('firstname', `%${name.first}%`)
            .ilike('lastname', `%${name.last}%`);
          
          if (contacts && contacts.length > 0) {
            // Filter out any duplicates we might already have from email matching
            const newContacts = contacts.filter((contact: Contact) => 
              !relatedContacts.some(rc => rc.id === contact.id)
            );
            relatedContacts.push(...newContacts);
          }
        }
      }
    }
  }
  
  return relatedContacts;
}

/**
 * Find interactions related to a document and its contacts
 */
async function findRelatedInteractions(document: SupplierDocument, contacts: Contact[]): Promise<Interaction[]> {
  const supabase = await createClient();
  const relatedInteractions: Interaction[] = [];
  
  // If we have related contacts, find their interactions
  if (contacts && contacts.length > 0) {
    for (const contact of contacts as Contact[]) {
      const { data: interactions } = await supabase
        .from('interactions')
        .select('*')
        .eq('contact_id', contact.id)
        .order('interaction_date', { ascending: false })
        .limit(5);
      
      if (interactions && interactions.length > 0) {
        relatedInteractions.push(...interactions);
      }
    }
  }
  
  // Also search for interactions that might mention this document by name or ID
  if (document.file_name) {
    const { data: contentMatches } = await supabase
      .from('interactions')
      .select('*')
      .ilike('content', `%${document.file_name}%`);
    
    if (contentMatches && contentMatches.length > 0) {
      // Filter out any duplicates we might already have
      const newInteractions = contentMatches.filter((interaction: any) => 
        !relatedInteractions.some(ri => ri.id === interaction.id)
      );
      relatedInteractions.push(...newInteractions);
    }
  }
  
  return relatedInteractions;
}

/**
 * Get comprehensive context for AI query processing
 */
export async function getAIQueryContext(queryId: string) {
  const supabase = await createClient();
  
  // Fetch the query
  const { data: query, error } = await supabase
    .from('supplier_queries')
    .select('*')
    .eq('id', queryId)
    .single();
  
  if (error || !query) {
    console.error('Error fetching query:', error);
    return null;
  }
  
  // Fetch query results with supplier information
  const { data: queryResults } = await supabase
    .from('supplier_query_results')
    .select(`
      *,
      supplier:supplier_id (*)
    `)
    .eq('query_id', queryId);
  
  // For each result, fetch additional context
  const enrichedResults = await Promise.all((queryResults || []).map(async (result: any) => {
    // Get supplier with related data
    const supplierData = await getSupplierWithRelatedData(result.supplier_id);
    
    return {
      ...result,
      supplierData
    };
  }));
  
  return {
    query,
    results: enrichedResults
  };
}
