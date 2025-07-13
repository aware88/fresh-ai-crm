import { Database } from '../../../types/supabase';
import { getMetakockaCredentials } from './metakocka-service';
import { fetchMetakockaContact, fetchMetakockaDocument, fetchMetakockaProduct } from './metakocka-client';
import { InventoryService } from './inventory-service';
import { getMatchingSalesTactics, formatSalesTacticsForAIContext, SalesTactic } from '@/lib/ai/sales-tactics';

/**
 * Extract enhanced Metakocka entities from email content
 * This function uses advanced pattern matching and NLP techniques to identify
 * products, contacts, and documents mentioned in email content with higher accuracy
 * @param emailContent The raw content of the email
 * @param emailSubject The subject of the email
 * @param userId User ID for multi-tenant isolation
 * @returns Object containing identified entities with confidence scores
 */
async function extractEnhancedMetakockaEntities(
  emailContent: string,
  emailSubject: string,
  userId: string
): Promise<{
  products: Array<{ id: string; name: string; confidence: number; context: string }>;
  contacts: Array<{ id: string; name: string; confidence: number; context: string }>;
  documents: Array<{ id: string; type: string; number?: string; confidence: number; context: string }>;
  orders: Array<{ id: string; number?: string; confidence: number; context: string }>;
}> {
  console.log(`Extracting enhanced Metakocka entities from email for user ${userId}`);
  
  // Initialize results
  const results = {
    products: [] as Array<{ id: string; name: string; confidence: number; context: string }>,
    contacts: [] as Array<{ id: string; name: string; confidence: number; context: string }>,
    documents: [] as Array<{ id: string; type: string; number?: string; confidence: number; context: string }>,
    orders: [] as Array<{ id: string; number?: string; confidence: number; context: string }>
  };
  
  // Dynamically import Supabase client
  let supabase;
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    // Check if Supabase env vars are available
    if (!supabaseUrl || !supabaseKey) {
      console.warn('Supabase environment variables not available, using mock client');
      // Return mock client for build-time safety
      supabase = {
        from: () => ({
          select: () => ({ eq: () => ({ data: [] }) })
        })
      };
    } else {
      // Create real client for runtime use
      supabase = createClient(supabaseUrl, supabaseKey);
    }
  } catch (error) {
    console.error('Error initializing Supabase client:', error);
    // Return mock client as fallback
    supabase = {
      from: () => ({
        select: () => ({ eq: () => ({ data: [] }) })
      })
    };
  }
  
  try {
    // Get all products for this user to use as a reference
    const { data: productMappings } = await supabase
      .from('metakocka_product_mappings')
      .select(`
        id,
        product_id,
        metakocka_id,
        products (id, name, sku, description)
      `)
      .eq('user_id', userId);
    
    // Get all contacts for this user to use as a reference
    const { data: contactMappings } = await supabase
      .from('metakocka_contact_mappings')
      .select(`
        id,
        contact_id,
        metakocka_id,
        contacts (id, firstname, lastname, email, company)
      `)
      .eq('user_id', userId);
    
    // Get all sales documents for this user to use as a reference
    const { data: documentMappings } = await supabase
      .from('metakocka_sales_document_mappings')
      .select(`
        id,
        sales_document_id,
        metakocka_id,
        sales_documents (id, document_type, document_number, customer_name)
      `)
      .eq('user_id', userId);
    
    // Combine email subject and content for analysis
    const fullText = `${emailSubject}\n${emailContent}`;
    
    // Extract product references
    if (productMappings && productMappings.length > 0) {
      for (const mapping of productMappings) {
        if (!mapping.products) continue;
        
        const product = mapping.products;
        const productName = product.name;
        const productSku = product.sku;
        
        // Check for exact product name matches
        if (productName && fullText.includes(productName)) {
          // Find the context around the mention (50 chars before and after)
          const index = fullText.indexOf(productName);
          const start = Math.max(0, index - 50);
          const end = Math.min(fullText.length, index + productName.length + 50);
          const context = fullText.substring(start, end);
          
          results.products.push({
            id: product.id,
            name: productName,
            confidence: 0.95, // High confidence for exact match
            context
          });
          continue;
        }
        
        // Check for SKU matches
        if (productSku && fullText.includes(productSku)) {
          const index = fullText.indexOf(productSku);
          const start = Math.max(0, index - 50);
          const end = Math.min(fullText.length, index + productSku.length + 50);
          const context = fullText.substring(start, end);
          
          results.products.push({
            id: product.id,
            name: productName,
            confidence: 0.9, // High confidence for SKU match
            context
          });
          continue;
        }
        
        // Check for partial matches (for longer product names)
        if (productName && productName.length > 5) {
          // For longer product names, check if significant parts are mentioned
          const words = productName.split(' ');
          if (words.length > 1) {
            // Check if at least 2 significant words appear close to each other
            const significantWords = words.filter(w => w.length > 3);
            if (significantWords.length >= 2) {
              let matchCount = 0;
              let lastIndex = -1;
              
              for (const word of significantWords) {
                const wordIndex = fullText.toLowerCase().indexOf(word.toLowerCase());
                if (wordIndex !== -1) {
                  matchCount++;
                  
                  // Check if words are within 100 chars of each other
                  if (lastIndex !== -1 && Math.abs(wordIndex - lastIndex) < 100) {
                    const start = Math.max(0, Math.min(lastIndex, wordIndex) - 25);
                    const end = Math.min(fullText.length, Math.max(lastIndex + word.length, wordIndex + word.length) + 25);
                    const context = fullText.substring(start, end);
                    
                    results.products.push({
                      id: product.id,
                      name: productName,
                      confidence: 0.7, // Medium confidence for partial match
                      context
                    });
                    break;
                  }
                  
                  lastIndex = wordIndex;
                }
              }
            }
          }
        }
      }
    }
    
    // Extract contact references
    if (contactMappings && contactMappings.length > 0) {
      for (const mapping of contactMappings) {
        if (!mapping.contacts) continue;
        
        const contact = mapping.contacts;
        const fullName = `${contact.firstname} ${contact.lastname}`.trim();
        const email = contact.email;
        const company = contact.company;
        
        // Check for full name matches
        if (fullName && fullText.includes(fullName)) {
          const index = fullText.indexOf(fullName);
          const start = Math.max(0, index - 50);
          const end = Math.min(fullText.length, index + fullName.length + 50);
          const context = fullText.substring(start, end);
          
          results.contacts.push({
            id: contact.id,
            name: fullName,
            confidence: 0.95, // High confidence for exact name match
            context
          });
          continue;
        }
        
        // Check for email matches
        if (email && fullText.includes(email)) {
          const index = fullText.indexOf(email);
          const start = Math.max(0, index - 50);
          const end = Math.min(fullText.length, index + email.length + 50);
          const context = fullText.substring(start, end);
          
          results.contacts.push({
            id: contact.id,
            name: fullName,
            confidence: 0.95, // High confidence for email match
            context
          });
          continue;
        }
        
        // Check for company name matches if available
        if (company && fullText.includes(company)) {
          const index = fullText.indexOf(company);
          const start = Math.max(0, index - 50);
          const end = Math.min(fullText.length, index + company.length + 50);
          const context = fullText.substring(start, end);
          
          results.contacts.push({
            id: contact.id,
            name: fullName,
            confidence: 0.8, // Medium-high confidence for company match
            context
          });
          continue;
        }
        
        // Check for partial name matches
        if (contact.firstname && contact.firstname.length > 2 && fullText.includes(contact.firstname)) {
          // Only consider first name matches if the name is somewhat unique (longer than 2 chars)
          const index = fullText.indexOf(contact.firstname);
          const start = Math.max(0, index - 50);
          const end = Math.min(fullText.length, index + contact.firstname.length + 50);
          const context = fullText.substring(start, end);
          
          results.contacts.push({
            id: contact.id,
            name: fullName,
            confidence: 0.6, // Medium confidence for first name only
            context
          });
        }
      }
    }
    
    // Extract document references
    if (documentMappings && documentMappings.length > 0) {
      for (const mapping of documentMappings) {
        if (!mapping.sales_documents) continue;
        
        const document = mapping.sales_documents;
        const documentNumber = document.document_number;
        const documentType = document.document_type;
        
        // Check for document number matches
        if (documentNumber && fullText.includes(documentNumber)) {
          const index = fullText.indexOf(documentNumber);
          const start = Math.max(0, index - 50);
          const end = Math.min(fullText.length, index + documentNumber.length + 50);
          const context = fullText.substring(start, end);
          
          // If this is an order, add it to both documents and orders
          if (documentType === 'order') {
            results.orders.push({
              id: document.id,
              number: documentNumber,
              confidence: 0.95, // High confidence for exact match
              context
            });
          }
          
          results.documents.push({
            id: document.id,
            type: documentType,
            number: documentNumber,
            confidence: 0.95, // High confidence for exact match
            context
          });
          continue;
        }
        
        // Check for references to document types with customer name
        if (document.customer_name && documentType) {
          const pattern = new RegExp(`${documentType}.*?${document.customer_name}|${document.customer_name}.*?${documentType}`, 'i');
          const match = fullText.match(pattern);
          
          if (match) {
            const matchText = match[0];
            const index = fullText.indexOf(matchText);
            const start = Math.max(0, index - 25);
            const end = Math.min(fullText.length, index + matchText.length + 25);
            const context = fullText.substring(start, end);
            
            // If this is an order, add it to both documents and orders
            if (documentType === 'order') {
              results.orders.push({
                id: document.id,
                number: documentNumber,
                confidence: 0.8, // Medium-high confidence for contextual match
                context
              });
            }
            
            results.documents.push({
              id: document.id,
              type: documentType,
              number: documentNumber,
              confidence: 0.8, // Medium-high confidence for contextual match
              context
            });
          }
        }
      }
    }
    
    // Deduplicate results by taking the highest confidence match for each entity
    const deduplicateById = (items) => {
      const map = new Map();
      items.forEach(item => {
        if (!map.has(item.id) || map.get(item.id).confidence < item.confidence) {
          map.set(item.id, item);
        }
      });
      return Array.from(map.values());
    };
    
    results.products = deduplicateById(results.products);
    results.contacts = deduplicateById(results.contacts);
    results.documents = deduplicateById(results.documents);
    results.orders = deduplicateById(results.orders);
    
  } catch (error) {
    console.error('Error extracting enhanced Metakocka entities:', error);
  }
  
  return results;
}

/**
 * Interface for email context with Metakocka data
 */
interface EmailMetakockaContext {
  emailId: string;
  emailSubject: string;
  emailSender: string;
  emailRecipients: string[];
  emailDate: string;
  emailLanguage?: string;
  
  metakockaContacts: Array<{
    id: string;
    name: string;
    email?: string;
    phone?: string;
    type?: string;
    recentInteractions?: Array<{
      date: string;
      type: string;
      summary: string;
    }>;
    purchaseHistory?: Array<{
      date: string;
      product: string;
      quantity: number;
      amount: number;
    }>;
    personalityProfile?: {
      type?: string;
      traits?: string;
      salesStrategy?: string;
      messagingDo?: string;
      messagingDont?: string;
      commonBiases?: string;
      emotionalTrigger?: string;
      tonePreference?: string;
      bestCtaType?: string;
      triggerSignalKeywords?: string;
      followUpTiming?: string;
      suggestedSubjectLines?: string;
    };
  }>;
  
  metakockaDocuments: Array<{
    id: string;
    type: string;
    number?: string;
    date?: string;
    dueDate?: string;
    status?: string;
    amount?: number;
    items?: Array<{
      name: string;
      quantity: number;
      price: number;
    }>;
  }>;
  
  metakockaProducts: Array<{
    id: string;
    name: string;
    code?: string;
    price?: number;
    inventory?: {
      quantityAvailable: number;
      quantityReserved: number;
      lastUpdated: string;
    };
    viewHistory?: Array<{
      date: string;
      contactId: string;
      contactName: string;
    }>;
  }>;
  
  productRecommendations?: Array<{
    type: string;
    sourceProductId?: string;
    productId: string;
    productName: string;
    reason: string;
    confidence: number;
  }>;
  
  companyContext: {
    name: string;
    industry?: string;
    communicationStyle?: string;
    preferredLanguage?: string;
    activePromotions?: Array<{
      id: string;
      name: string;
      description: string;
      startDate: string;
      endDate: string;
      discountType: string;
      discountValue: number;
      applicableProducts: string[];
    }>;
  };
  
  salesTactics?: SalesTactic[];
  
  suggestedActions?: string[];
}

/**
 * Build AI context for an email using Metakocka data
 * @param emailId ID of the email
 * @param userId User ID for multi-tenant isolation
 */
export async function buildEmailMetakockaContext(
  emailId: string,
  userId: string
): Promise<EmailMetakockaContext | null> {
  try {
    console.log(`Building Metakocka context for email ${emailId}`);
    
    // Dynamically import Supabase client
    let supabase;
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      // Check if Supabase env vars are available
      if (!supabaseUrl || !supabaseKey) {
        console.warn('Supabase environment variables not available, using mock client');
        // Return mock client for build-time safety
        supabase = {
          from: () => ({
            select: () => ({ eq: () => ({ single: () => ({ data: null, error: null }) }) })
          })
        };
      } else {
        // Create real client for runtime use
        supabase = createClient(supabaseUrl, supabaseKey);
      }
    } catch (error) {
      console.error('Error initializing Supabase client:', error);
      // Return mock client as fallback
      supabase = {
        from: () => ({
          select: () => ({ eq: () => ({ single: () => ({ data: null, error: null }) }) })
        })
      };
    }
    
    // Step 1: Fetch the email with its Metakocka metadata
    const { data: email, error: emailError } = await supabase
      .from('emails')
      .select(`
        id,
        subject,
        sender,
        recipients,
        sent_at,
        raw_content,
        metakocka_metadata,
        email_metakocka_contact_mappings (
          id,
          metakocka_contact_id,
          confidence
        ),
        email_metakocka_document_mappings (
          id,
          metakocka_document_id,
          document_type,
          confidence
        )
      `)
      .eq('id', emailId)
      .eq('created_by', userId)
      .single();
    
    if (emailError || !email) {
      console.error('Error fetching email:', emailError?.message || 'Email not found');
      return null;
    }

    // Step 2: Get Metakocka credentials for this user
    const credentials = await getMetakockaCredentials(userId);
    if (!credentials) {
      console.error('Metakocka credentials not found for user');
      return null;
    }

    // Step 3: Fetch company profile for context
    let companyProfile = null;
    try {
      const { data, error } = await supabase
        .from('company_profiles')
        .select('name, industry, communication_style, preferred_language')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching company profile:', error.message);
      } else {
        companyProfile = data;
      }
    } catch (error) {
      console.error('Exception fetching company profile:', error);
    }

    // Step 4: Detect email language
    const emailLanguage = await detectEmailLanguage(email.subject || '', email.raw_content || '');

    // Step 5: Build the context object
    const context: EmailMetakockaContext = {
      emailId: email.id,
      emailSubject: email.subject || '',
      emailSender: email.sender || '',
      emailRecipients: email.recipients || [],
      emailDate: email.sent_at || '',
      emailLanguage,
      metakockaContacts: [],
      metakockaDocuments: [],
      metakockaProducts: [],
      companyContext: {
        name: companyProfile?.name || credentials.company_id,
        industry: companyProfile?.industry,
        communicationStyle: companyProfile?.communication_style,
        preferredLanguage: companyProfile?.preferred_language
      }
    };

    // Step 6: Fetch active promotions
    const activePromotions = await fetchActivePromotions(userId);
    if (activePromotions.length > 0) {
      context.companyContext.activePromotions = activePromotions;
    }

    // Step 7: Fetch detailed information for each contact
    if (email.email_metakocka_contact_mappings && email.email_metakocka_contact_mappings.length > 0) {
      for (const mapping of email.email_metakocka_contact_mappings) {
        try {
          const contactData = await fetchMetakockaContact(
            mapping.metakocka_contact_id,
            credentials.secret_key,
            credentials.company_id
          );
          
          if (contactData) {
            // Fetch recent interactions for this contact
            const { data: interactions } = await supabase
              .from('interactions')
              .select('type, created_at, summary')
              .eq('metakocka_contact_id', mapping.metakocka_contact_id)
              .eq('created_by', userId)
              .order('created_at', { ascending: false })
              .limit(3);
            
            // Fetch purchase history for this contact
            const purchaseHistory = await fetchContactPurchaseHistory(mapping.metakocka_contact_id, userId);
            
            // Fetch contact preferences
            const { data: contactPreferences } = await supabase
              .from('contact_preferences')
              .select('preferred_language, communication_frequency, communication_channel, communication_style')
              .eq('contact_id', mapping.metakocka_contact_id)
              .eq('user_id', userId)
              .single();
            
            // Calculate lifetime value
            const { data: lifetimeValue } = await supabase
              .rpc('calculate_contact_lifetime_value', { contact_id: mapping.metakocka_contact_id, user_id: userId });
            
            context.metakockaContacts.push({
              id: mapping.metakocka_contact_id,
              name: contactData.name,
              email: contactData.email,
              phone: contactData.phone,
              address: contactData.address,
              type: contactData.type,
              confidence: mapping.confidence,
              recentInteractions: interactions?.map(int => ({
                type: int.type,
                date: int.created_at,
                summary: int.summary
              })) || [],
              purchaseHistory,
              preferredLanguage: contactPreferences?.preferred_language,
              communicationPreferences: contactPreferences ? {
                frequency: contactPreferences.communication_frequency,
                channel: contactPreferences.communication_channel,
                style: contactPreferences.communication_style
              } : undefined,
              lifetimeValue: lifetimeValue?.value
            });
          }
        } catch (error) {
          console.error(`Error fetching contact ${mapping.metakocka_contact_id}:`, error);
        }
      }
    }

    // Step 8: Fetch detailed information for each document
    if (email.email_metakocka_document_mappings && email.email_metakocka_document_mappings.length > 0) {
      for (const mapping of email.email_metakocka_document_mappings) {
        try {
          const documentData = await fetchMetakockaDocument(
            mapping.metakocka_document_id,
            mapping.document_type,
            credentials.secret_key,
            credentials.company_id
          );
          
          if (documentData) {
            // Fetch related documents
            const { data: relatedDocs } = await supabase
              .from('document_relations')
              .select(`
                related_document_id,
                relation_type,
                sales_documents!related_document_id (document_type, document_number)
              `)
              .eq('document_id', mapping.metakocka_document_id);
            
            context.metakockaDocuments.push({
              id: mapping.metakocka_document_id,
              type: mapping.document_type,
              number: documentData.number,
              date: documentData.date,
              dueDate: documentData.due_date,
              status: documentData.status,
              amount: documentData.amount,
              items: documentData.items?.map((item: { name: string; quantity: number; price: number; product_id?: string }) => ({
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                productId: item.product_id
              })),
              confidence: mapping.confidence,
              relatedDocuments: relatedDocs?.map(rel => ({
                id: rel.related_document_id,
                type: rel.sales_documents.document_type,
                number: rel.sales_documents.document_number,
                relation: rel.relation_type
              }))
            });
          }
        } catch (error) {
          console.error(`Error fetching document ${mapping.metakocka_document_id}:`, error);
        }
      }
    }

    // Step 9: Fetch detailed information for products mentioned in the email
    if (email.metakocka_metadata?.productIds && email.metakocka_metadata.productIds.length > 0) {
      for (const productId of email.metakocka_metadata.productIds) {
        try {
          const productData = await fetchMetakockaProduct(
            productId,
            credentials.secret_key,
            credentials.company_id
          );
          
          if (productData) {
            // Fetch detailed inventory information
            const inventoryData = await fetchProductInventory(productId, userId);
            
            // Fetch product view history
            const viewHistory = await fetchProductViewHistory(productId, userId);
            
            // Fetch product category and tags
            const { data: productDetails } = await supabase
              .from('products')
              .select('category, tags, seasonality, popularity')
              .eq('id', productId)
              .single();
            
            context.metakockaProducts.push({
              id: productId,
              name: productData.name,
              code: productData.code,
              price: productData.price,
              inventory: inventoryData || undefined,
              viewHistory: viewHistory.length > 0 ? viewHistory : undefined,
              confidence: email.metakocka_metadata.confidence || 0.5,
              category: productDetails?.category,
              tags: productDetails?.tags,
              seasonality: productDetails?.seasonality,
              popularity: productDetails?.popularity
            });
          }
        } catch (error) {
          console.error(`Error fetching product ${productId}:`, error);
        }
      }
    }

    // Step 10: Generate product recommendations
    context.productRecommendations = await generateProductRecommendations(context, userId);

    // Step 11: Generate suggested actions based on the context
    context.suggestedActions = generateSuggestedActions(context);

    // Fetch matching sales tactics if we have a personality profile
    if (email.email_metakocka_contact_mappings && email.email_metakocka_contact_mappings.length > 0) {
      try {
        // Get the email content for context
        let emailContent = null;
        try {
          const { data, error } = await supabase
            .from('emails')
            .select('subject, raw_content')
            .eq('id', emailId)
            .single();
            
          if (error) {
            console.error('Error fetching email content:', error.message);
          } else {
            emailContent = data;
          }
        } catch (error) {
          console.error('Exception fetching email content:', error);
        }
        
        // Fetch sales tactics that match the personality profile
        const salesTactics = await getMatchingSalesTactics(
          email.email_metakocka_contact_mappings[0].metakocka_contact_id,
          {
            subject: emailContent?.subject,
            content: emailContent?.raw_content
          }
        );
        
        // Add sales tactics to context
        if (salesTactics && salesTactics.length > 0) {
          context.salesTactics = salesTactics;
        }
      } catch (error) {
        console.error('Error fetching sales tactics:', error);
      }
    }
    
    return context;
  } catch (error) {
    console.error('Error building email Metakocka context:', error);
    return null;
  }
}

/**
 * Fetch purchase history for a contact
 */
async function fetchContactPurchaseHistory(contactId: string, userId: string) {
  try {
    let salesDocuments = [];
    try {
      const { data, error } = await supabase
        .from('sales_documents')
        .select(`
          id,
          document_number,
          document_type,
          issue_date,
          total_amount,
          sales_document_items (id, product_id, name, quantity, price)
        `)
        .eq('contact_id', contactId)
        .eq('created_by', userId)
        .order('issue_date', { ascending: false })
        .limit(5);
      
      if (error) {
        console.error('Error fetching sales documents:', error.message);
      } else {
        salesDocuments = data || [];
      }
    } catch (error) {
      console.error('Exception fetching sales documents:', error);
      salesDocuments = [];
    }
    
    return salesDocuments.map(doc => ({
      documentId: doc.id,
      documentType: doc.document_type,
      documentNumber: doc.document_number,
      date: doc.issue_date,
      amount: doc.total_amount,
      products: doc.sales_document_items.map((item: { product_id: string; product_name: string; quantity: number; price: number }) => ({
        id: item.product_id,
        name: item.product_name,
        quantity: item.quantity,
        price: item.price
      })) || []
    })) || [];
  } catch (error) {
    console.error(`Error fetching purchase history for contact ${contactId}:`, error);
    return [];
  }
}

/**
 * Fetch detailed inventory information for a product
 */
async function fetchProductInventory(productId: string, userId: string) {
  try {
    // Use the InventoryService to get detailed inventory information
    let inventory = null;
    try {
      const { data, error } = await supabase
        .from('product_inventory')
        .select('*')
        .eq('product_id', productId)
        .eq('user_id', userId)
        .single();
        
      if (error) {
        console.error('Error fetching product inventory:', error.message);
      } else {
        inventory = data;
      }
    } catch (error) {
      console.error('Exception fetching product inventory:', error);
    }
    
    if (!inventory) return null;
    
    return {
      quantityOnHand: inventory.quantity_on_hand || 0,
      quantityReserved: inventory.quantity_reserved || 0,
      quantityAvailable: inventory.quantity_available || 0,
      lastUpdated: inventory.last_updated || new Date().toISOString(),
      reorderPoint: inventory.reorder_point,
      estimatedRestockDate: inventory.estimated_restock_date
    };
  } catch (error) {
    console.error(`Error fetching inventory for product ${productId}:`, error);
    return null;
  }
}

/**
 * Fetch product view history
 */
async function fetchProductViewHistory(productId: string, userId: string) {
  try {
    let viewHistory = [];
    try {
      const { data, error } = await supabase
        .from('product_views')
        .select(`
          id,
          contact_id,
          contacts (name),
          viewed_at,
          duration,
          source
        `)
        .eq('product_id', productId)
        .eq('user_id', userId)
        .order('viewed_at', { ascending: false })
        .limit(5);
      
      if (error) {
        console.error('Error fetching product view history:', error.message);
      } else {
        viewHistory = data || [];
      }
    } catch (error) {
      console.error('Exception fetching product view history:', error);
    }
    
    return viewHistory.map(view => ({
      contactId: view.contact_id,
      contactName: view.contacts?.name,
      date: view.viewed_at,
      duration: view.duration,
      source: view.source
    })) || [];
  } catch (error) {
    console.error(`Error fetching view history for product ${productId}:`, error);
    return [];
  }
}

/**
 * Generate product recommendations based on context
 */
async function generateProductRecommendations(
  context: EmailMetakockaContext,
  userId: string
): Promise<Array<{
  type: string;
  sourceProductId?: string;
  productId: string;
  productName: string;
  reason: string;
  confidence: number;
}>> {
  const recommendations: Array<{
    type: string;
    sourceProductId?: string;
    productId: string;
    productName: string;
    reason: string;
    confidence: number;
  }> = [];
  
  try {
    // Get mentioned product IDs
    const mentionedProductIds = context.metakockaProducts.map(p => p.id);
    
    // 1. Similar products recommendations
    if (mentionedProductIds.length > 0) {
      for (const productId of mentionedProductIds) {
        try {
          // First get the product category
          let productCategory = null;
          try {
            const { data, error } = await supabase
              .from('products')
              .select('category')
              .eq('id', productId)
              .single();
              
            if (error) {
              console.error('Error fetching product category:', error.message);
            } else {
              productCategory = data?.category;
            }
          } catch (err) {
            console.error('Exception fetching product category:', err);
          }
          
          if (!productCategory) continue;
          
          // Find products in the same category
          let similarProducts = [];
          try {
            const { data, error } = await supabase
              .from('products')
              .select('id, name, category')
              .eq('user_id', userId)
              .eq('category', productCategory)
              .neq('id', productId)
              .limit(2);
            
            if (error) {
              console.error('Error fetching similar products:', error.message);
            } else {
              similarProducts = data || [];
            }
          } catch (err) {
            console.error('Exception fetching similar products:', err);
          }
          
          for (const similar of similarProducts) {
            recommendations.push({
              type: 'similar',
              sourceProductId: productId,
              productId: similar.id,
              productName: similar.name,
              reason: `Similar to ${context.metakockaProducts.find(p => p.id === productId)?.name || 'mentioned product'}`,
              confidence: 0.8
            });
          }
        } catch (productError) {
          console.error(`Error processing product recommendations for ${productId}:`, productError);
        }
      }
    }
    
    // 2. Complementary product recommendations based on purchase patterns
    if (mentionedProductIds.length > 0) {
      // Find products frequently bought together
      const { data: complementaryProducts } = await supabase
        .rpc('get_frequently_bought_together', { 
          product_ids: mentionedProductIds,
          user_id: userId,
          limit_count: 3
        });
      
      if (complementaryProducts) {
        for (const comp of complementaryProducts) {
          recommendations.push({
            type: 'complementary',
            productId: comp.product_id,
            productName: comp.product_name,
            reason: 'Frequently bought together',
            confidence: 0.7
          });
        }
      }
    }
    
    // 3. Seasonal recommendations
    const currentMonth = new Date().getMonth() + 1; // 1-12
    const { data: seasonalProducts } = await supabase
      .from('products')
      .select('id, name')
      .eq('user_id', userId)
      .eq('seasonal_relevance', currentMonth)
      .limit(2);
    
    if (seasonalProducts) {
      for (const seasonal of seasonalProducts) {
        recommendations.push({
          type: 'seasonal',
          productId: seasonal.id,
          productName: seasonal.name,
          reason: 'Seasonal product',
          confidence: 0.6
        });
      }
    }
    
    return recommendations;
  } catch (error) {
    console.error('Error generating product recommendations:', error);
    return [];
  }
}

/**
 * Detect language of the email content
 */
async function detectEmailLanguage(emailSubject: string, emailContent: string): Promise<string> {
  try {
    // Use OpenAI to detect language
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a language detection assistant. Respond with only the ISO language code (e.g., 'en', 'es', 'fr', 'de', etc.) for the provided text." },
        { role: "user", content: `Detect the language of this text: ${emailSubject}\n\n${emailContent?.substring(0, 500) || ''}` }
      ],
      temperature: 0.1,
      max_tokens: 10
    });
    
    const detectedLanguage = response.choices[0].message.content?.trim() || 'en';
    return detectedLanguage;
  } catch (error) {
    console.error('Error detecting email language:', error);
    return 'en'; // Default to English
  }
}

/**
 * Fetch active promotions
 */
async function fetchActivePromotions(userId: string) {
  try {
    // Dynamically import Supabase client
    let supabase;
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        console.warn('Missing Supabase environment variables for fetchActivePromotions');
        return [];
      }
      
      supabase = createClient(supabaseUrl, supabaseKey);
    } catch (importError) {
      console.error('Failed to initialize Supabase client:', importError);
      return [];
    }
    
    const currentDate = new Date().toISOString();
    
    try {
      const { data: promotions, error } = await supabase
        .from('promotions')
        .select(`
          id,
          name,
          description,
          start_date,
          end_date,
          discount_type,
          discount_value,
          applicable_products
        `)
        .eq('user_id', userId)
        .gte('end_date', currentDate)
        .lte('start_date', currentDate);
      
      if (error) {
        console.error('Error fetching promotions:', error.message);
        return [];
      }
      
      if (!promotions || promotions.length === 0) {
        return [];
      }
      
      return promotions.map(promo => ({
        id: promo.id,
        name: promo.name,
        description: promo.description,
        startDate: promo.start_date,
        endDate: promo.end_date,
        discountType: promo.discount_type,
        discountValue: promo.discount_value,
        applicableProducts: promo.applicable_products
      }));
    } catch (queryError) {
      console.error('Error executing Supabase query for promotions:', queryError);
      return [];
    }
  } catch (error) {
    console.error('Error fetching active promotions:', error);
    return [];
  }
}

/**
 * Generate suggested actions based on the email context
 */
function generateSuggestedActions(context: EmailMetakockaContext): string[] {
  const actions: string[] = [];
  
  // Check if there are overdue invoices
  const overdueInvoices = context.metakockaDocuments.filter(doc => 
    doc.type === 'invoice' && 
    doc.status !== 'paid' && 
    doc.dueDate && 
    new Date(doc.dueDate) < new Date()
  );
  
  if (overdueInvoices.length > 0) {
    actions.push('Follow up on overdue invoices');
  }
  
  // Check if there are pending offers
  const pendingOffers = context.metakockaDocuments.filter(doc => 
    doc.type === 'offer' && 
    doc.status === 'pending'
  );
  
  if (pendingOffers.length > 0) {
    actions.push('Follow up on pending offers');
  }
  
  // Check for products with low inventory
  const lowStockProducts = context.metakockaProducts.filter(product => 
    product.inventory && product.inventory.availableQuantity < 5
  );
  
  if (lowStockProducts.length > 0) {
    actions.push('Check inventory for low stock products');
  }
  
  // Check if there are new contacts without recent interactions
  const newContacts = context.metakockaContacts.filter(contact => 
    !contact.recentInteractions || 
    contact.recentInteractions.length === 0
  );
  
  if (newContacts.length > 0) {
    actions.push('Add new contacts to CRM');
  }
  
  // Check if there are product recommendations
  if (context.productRecommendations && context.productRecommendations.length > 0) {
    actions.push('Send product recommendations');
  }
  
  // Check if there are active promotions
  if (context.companyContext.activePromotions && context.companyContext.activePromotions.length > 0) {
    actions.push('Share current promotions');
  }
  
  // Check if language is different from company preferred language
  if (context.emailLanguage && 
      context.companyContext.preferredLanguage && 
      context.emailLanguage !== context.companyContext.preferredLanguage) {
    actions.push(`Respond in ${context.emailLanguage} language`);
  }
  
  return actions;
}

/**
 * Format the email context for AI consumption
 * @param context The email context with Metakocka data
 */
export function formatContextForAI(context: EmailMetakockaContext): string {
  if (!context) {
    return '';
  }
  
  let formattedContext = `
## Email Context
- Subject: ${context.emailSubject}
- From: ${context.emailSender}
- To: ${context.emailRecipients.join(', ')}
- Date: ${new Date(context.emailDate).toLocaleString()}

## Company Context
- Company: ${context.companyContext.name}
${context.companyContext.industry ? `- Industry: ${context.companyContext.industry}` : ''}
${context.companyContext.communicationStyle ? `- Communication Style: ${context.companyContext.communicationStyle}` : ''}
${context.companyContext.preferredLanguage ? `- Preferred Language: ${context.companyContext.preferredLanguage}` : ''}

`;

  // Add contacts information
  if (context.metakockaContacts.length > 0) {
    formattedContext += '## Related Contacts\n';
    context.metakockaContacts.forEach(contact => {
      formattedContext += `- ${contact.name || 'Unknown'} (ID: ${contact.id})`;
      if (contact.email) formattedContext += `, Email: ${contact.email}`;
      if (contact.phone) formattedContext += `, Phone: ${contact.phone}`;
      if (contact.type) formattedContext += `, Type: ${contact.type}`;
      formattedContext += '\n';
      
      if (contact.recentInteractions && contact.recentInteractions.length > 0) {
        formattedContext += '  Recent interactions:\n';
        contact.recentInteractions.forEach(interaction => {
          formattedContext += `  - ${new Date(interaction.date).toLocaleDateString()}: ${interaction.type} - ${interaction.summary}\n`;
        });
      }
    });
    formattedContext += '\n';
  }

  // Add documents information
  if (context.metakockaDocuments.length > 0) {
    formattedContext += '## Related Documents\n';
    context.metakockaDocuments.forEach(doc => {
      formattedContext += `- ${doc.type.toUpperCase()} ${doc.number || doc.id}`;
      if (doc.date) formattedContext += `, Date: ${doc.date}`;
      if (doc.dueDate) formattedContext += `, Due: ${doc.dueDate}`;
      if (doc.status) formattedContext += `, Status: ${doc.status}`;
      if (doc.amount) formattedContext += `, Amount: ${doc.amount}`;
      formattedContext += '\n';
      
      if (doc.items && doc.items.length > 0) {
        formattedContext += '  Items:\n';
        doc.items.forEach(item => {
          formattedContext += `  - ${item.name}, Qty: ${item.quantity}, Price: ${item.price}\n`;
        });
      }
    });
    formattedContext += '\n';
  }

  // Add products information
  if (context.metakockaProducts.length > 0) {
    formattedContext += '## Related Products\n';
    context.metakockaProducts.forEach(product => {
      formattedContext += `- ${product.name}`;
      if (product.code) formattedContext += ` (Code: ${product.code})`;
      if (product.price) formattedContext += `, Price: ${product.price}`;
      if (product.inventory?.quantityAvailable !== undefined) formattedContext += `, Stock: ${product.inventory.quantityAvailable}`;
      formattedContext += '\n';
    });
    formattedContext += '\n';
  }

  // Add suggested actions
  if (context.suggestedActions && context.suggestedActions.length > 0) {
    formattedContext += '## Suggested Actions\n';
    context.suggestedActions.forEach(action => {
      formattedContext += `- ${action}\n`;
    });
    formattedContext += '\n';
  }

  // Add contact personality profile information
  if (context.metakockaContacts.length > 0 && context.metakockaContacts[0].personalityProfile) {
    const profile = context.metakockaContacts[0].personalityProfile;
    formattedContext += '## Contact Personality Profile\n';
    if (profile.type) formattedContext += `- Type: ${profile.type}\n`;
    if (profile.traits) formattedContext += `- Traits: ${profile.traits}\n`;
    if (profile.salesStrategy) formattedContext += `- Sales Strategy: ${profile.salesStrategy}\n`;
    if (profile.messagingDo) formattedContext += `- Messaging Do: ${profile.messagingDo}\n`;
    if (profile.messagingDont) formattedContext += `- Messaging Don't: ${profile.messagingDont}\n`;
    if (profile.emotionalTrigger) formattedContext += `- Emotional Trigger: ${profile.emotionalTrigger}\n`;
    if (profile.tonePreference) formattedContext += `- Tone Preference: ${profile.tonePreference}\n`;
    formattedContext += '\n';
  }

  // Add sales tactics information
  if (context.salesTactics && context.salesTactics.length > 0) {
    formattedContext += formatSalesTacticsForAIContext(context.salesTactics);
  }

  return formattedContext;
}

/**
 * Get AI context for an email
 * @param emailId ID of the email
 * @param userId User ID for multi-tenant isolation
 */
export async function getEmailAIContext(
  emailId: string,
  userId: string
): Promise<string> {
  try {
    // Build the context
    const context = await buildEmailMetakockaContext(emailId, userId);
    
    if (!context) {
      return '';
    }
    
    // Format the context for AI consumption
    return formatContextForAI(context);
  } catch (error) {
    console.error('Error getting email AI context:', error);
    return '';
  }
}
