import { supabase } from '@/lib/supabaseClient';
import { getMetakockaCredentials } from './credentials';
import { logMetakockaError } from './error-logger';
import openai from '@/lib/email/openaiClient';

/**
 * Interface for email metadata extraction result
 */
interface MetakockaEmailMetadata {
  contactIds: string[];
  documentIds: string[];
  documentTypes: string[];
  productIds: string[];
  confidence: number;
  extractedData: {
    invoiceNumbers?: string[];
    offerNumbers?: string[];
    orderNumbers?: string[];
    amounts?: number[];
    dates?: string[];
    productNames?: string[];
  };
}

/**
 * Interface for email enrichment result
 */
interface EmailEnrichmentResult {
  emailId: string;
  metakockaMetadata: MetakockaEmailMetadata;
  contactMappings: Array<{
    metakocka_contact_id: string;
    confidence: number;
  }>;
  documentMappings: Array<{
    metakocka_document_id: string;
    document_type: string;
    confidence: number;
  }>;
  success: boolean;
  error?: string;
}

/**
 * Extract Metakocka-related information from an email
 * @param emailId ID of the email to process
 * @param userId User ID for multi-tenant isolation
 */
export async function enrichEmailWithMetakockaData(
  emailId: string,
  userId: string
): Promise<EmailEnrichmentResult> {
  console.log(`Enriching email ${emailId} with Metakocka data for user ${userId}`);
  
  try {
    // Step 1: Fetch the email content
    const { data: email, error: emailError } = await supabase
      .from('emails')
      .select('*')
      .eq('id', emailId)
      .eq('created_by', userId)
      .single();
    
    if (emailError || !email) {
      throw new Error(`Error fetching email: ${emailError?.message || 'Email not found'}`);
    }

    // Step 2: Get Metakocka credentials for this user
    const credentials = await getMetakockaCredentials(userId);
    if (!credentials) {
      throw new Error('Metakocka credentials not found for user');
    }

    // Step 3: Extract Metakocka-related information from the email
    const metadata = await extractMetakockaMetadata(
      email.raw_content,
      email.subject,
      credentials.company_id
    );

    // Step 4: Update the email with the extracted metadata
    const { error: updateError } = await supabase
      .from('emails')
      .update({
        metakocka_metadata: metadata
      })
      .eq('id', emailId)
      .eq('created_by', userId);

    if (updateError) {
      throw new Error(`Error updating email metadata: ${updateError.message}`);
    }

    // Step 5: Create mappings for contacts
    const contactMappings = [];
    for (const contactId of metadata.contactIds) {
      try {
        const { data: mapping, error: mappingError } = await supabase
          .from('email_metakocka_contact_mappings')
          .insert({
            email_id: emailId,
            metakocka_contact_id: contactId,
            confidence: metadata.confidence,
            created_by: userId
          })
          .select()
          .single();

        if (mappingError) {
          console.error(`Error creating contact mapping: ${mappingError.message}`);
        } else {
          contactMappings.push({
            metakocka_contact_id: contactId,
            confidence: metadata.confidence
          });
        }
      } catch (error) {
        console.error(`Error in contact mapping: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // Step 6: Create mappings for documents
    const documentMappings = [];
    for (let i = 0; i < metadata.documentIds.length; i++) {
      const docId = metadata.documentIds[i];
      const docType = metadata.documentTypes[i] || 'unknown';
      
      try {
        const { data: mapping, error: mappingError } = await supabase
          .from('email_metakocka_document_mappings')
          .insert({
            email_id: emailId,
            metakocka_document_id: docId,
            document_type: docType,
            confidence: metadata.confidence,
            created_by: userId
          })
          .select()
          .single();

        if (mappingError) {
          console.error(`Error creating document mapping: ${mappingError.message}`);
        } else {
          documentMappings.push({
            metakocka_document_id: docId,
            document_type: docType,
            confidence: metadata.confidence
          });
        }
      } catch (error) {
        console.error(`Error in document mapping: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return {
      emailId,
      metakockaMetadata: metadata,
      contactMappings,
      documentMappings,
      success: true
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logMetakockaError('email-enrichment', errorMessage, { emailId, userId });
    
    return {
      emailId,
      metakockaMetadata: {
        contactIds: [],
        documentIds: [],
        documentTypes: [],
        productIds: [],
        confidence: 0,
        extractedData: {}
      },
      contactMappings: [],
      documentMappings: [],
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Extract Metakocka-related metadata from email content using AI
 */
async function extractMetakockaMetadata(
  emailContent: string,
  emailSubject: string,
  companyId: string
): Promise<MetakockaEmailMetadata> {
  try {
    // Truncate long emails to avoid token limit issues
    const MAX_EMAIL_LENGTH = 6000;
    const truncatedEmail = emailContent.length > MAX_EMAIL_LENGTH 
      ? emailContent.substring(0, MAX_EMAIL_LENGTH) + "\n\n[Email truncated due to length]" 
      : emailContent;
    
    console.log(`Extracting Metakocka metadata from email (${truncatedEmail.length} chars)`);
    
    const prompt = `
      Extract Metakocka-related information from this email. 
      
      Subject: ${emailSubject}
      
      Content:
      ${truncatedEmail}
      
      Look for:
      1. Invoice numbers (format: INV-XXXXX)
      2. Offer numbers (format: OFF-XXXXX)
      3. Order numbers (format: ORD-XXXXX)
      4. Monetary amounts
      5. Dates related to documents
      6. Product names or codes
      7. Customer/contact identifiers
      
      Return the data in JSON format with these fields:
      {
        "contactIds": [], // List of possible Metakocka contact IDs mentioned
        "documentIds": [], // List of document IDs (invoice/offer/order numbers)
        "documentTypes": [], // Corresponding types for each documentId (invoice, offer, order)
        "productIds": [], // List of product IDs or codes mentioned
        "confidence": 0, // Confidence score from 0.0 to 1.0
        "extractedData": {
          "invoiceNumbers": [],
          "offerNumbers": [],
          "orderNumbers": [],
          "amounts": [],
          "dates": [],
          "productNames": []
        }
      }
    `;
    
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { 
          role: "system", 
          content: "You are an expert at extracting structured data from emails, particularly information related to business transactions, invoices, and customer communications. Return only valid JSON." 
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 500,
      response_format: { type: "json_object" }
    });
    
    const responseText = response.choices[0].message.content;
    if (!responseText) {
      throw new Error('Empty response from AI');
    }
    
    // Parse the JSON response
    try {
      const extractedData = JSON.parse(responseText) as MetakockaEmailMetadata;
      
      // Ensure all required fields exist
      return {
        contactIds: extractedData.contactIds || [],
        documentIds: extractedData.documentIds || [],
        documentTypes: extractedData.documentTypes || [],
        productIds: extractedData.productIds || [],
        confidence: extractedData.confidence || 0,
        extractedData: {
          invoiceNumbers: extractedData.extractedData?.invoiceNumbers || [],
          offerNumbers: extractedData.extractedData?.offerNumbers || [],
          orderNumbers: extractedData.extractedData?.orderNumbers || [],
          amounts: extractedData.extractedData?.amounts || [],
          dates: extractedData.extractedData?.dates || [],
          productNames: extractedData.extractedData?.productNames || []
        }
      };
    } catch (error) {
      console.error('Error parsing AI response:', error);
      console.error('Response text:', responseText);
      
      // Return empty metadata on error
      return {
        contactIds: [],
        documentIds: [],
        documentTypes: [],
        productIds: [],
        confidence: 0,
        extractedData: {}
      };
    }
  } catch (error) {
    console.error('Error in extractMetakockaMetadata:', error);
    
    // Return empty metadata on error
    return {
      contactIds: [],
      documentIds: [],
      documentTypes: [],
      productIds: [],
      confidence: 0,
      extractedData: {}
    };
  }
}

/**
 * Process all unprocessed emails for a user
 * @param userId User ID for multi-tenant isolation
 * @param limit Maximum number of emails to process
 */
export async function processUnprocessedEmails(
  userId: string,
  limit: number = 10
): Promise<{
  processed: number;
  errors: number;
  details: any[];
}> {
  console.log(`Processing unprocessed emails for user ${userId}, limit: ${limit}`);
  
  const result = {
    processed: 0,
    errors: 0,
    details: [] as any[]
  };
  
  try {
    // Find emails without Metakocka metadata
    const { data: emails, error: emailsError } = await supabase
      .from('emails')
      .select('id')
      .eq('created_by', userId)
      .is('metakocka_metadata', null)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (emailsError) {
      throw new Error(`Error fetching unprocessed emails: ${emailsError.message}`);
    }
    
    console.log(`Found ${emails?.length || 0} unprocessed emails`);
    
    // Process each email
    for (const email of emails || []) {
      try {
        const enrichmentResult = await enrichEmailWithMetakockaData(email.id, userId);
        
        if (enrichmentResult.success) {
          result.processed++;
          result.details.push({
            emailId: email.id,
            success: true,
            contactMappings: enrichmentResult.contactMappings.length,
            documentMappings: enrichmentResult.documentMappings.length
          });
        } else {
          result.errors++;
          result.details.push({
            emailId: email.id,
            success: false,
            error: enrichmentResult.error
          });
        }
      } catch (error) {
        result.errors++;
        result.details.push({
          emailId: email.id,
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
    
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logMetakockaError('batch-email-processing', errorMessage, { userId });
    
    throw error;
  }
}
