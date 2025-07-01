import { supabase } from '@/lib/supabaseClient';
import { getMetakockaCredentials } from './credentials';
import { fetchMetakockaContact } from './contacts-api';
import { fetchMetakockaDocument } from './documents-api';
import { fetchMetakockaProduct } from './products-api';

/**
 * Interface for email context with Metakocka data
 */
interface EmailMetakockaContext {
  emailId: string;
  emailSubject: string;
  emailSender: string;
  emailRecipients: string[];
  emailDate: string;
  metakockaContacts: Array<{
    id: string;
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    type?: string;
    confidence: number;
    recentInteractions?: Array<{
      type: string;
      date: string;
      summary: string;
    }>;
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
    confidence: number;
  }>;
  metakockaProducts: Array<{
    id: string;
    name: string;
    code?: string;
    price?: number;
    stock?: number;
    confidence: number;
  }>;
  companyContext: {
    name: string;
    industry?: string;
    communicationStyle?: string;
    preferredLanguage?: string;
  };
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
    
    // Step 1: Fetch the email with its Metakocka metadata
    const { data: email, error: emailError } = await supabase
      .from('emails')
      .select(`
        id,
        subject,
        sender,
        recipients,
        sent_at,
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
    const { data: companyProfile, error: companyError } = await supabase
      .from('company_profiles')
      .select('name, industry, communication_style, preferred_language')
      .eq('user_id', userId)
      .single();
    
    if (companyError) {
      console.error('Error fetching company profile:', companyError.message);
    }

    // Step 4: Build the context object
    const context: EmailMetakockaContext = {
      emailId: email.id,
      emailSubject: email.subject || '',
      emailSender: email.sender || '',
      emailRecipients: email.recipients || [],
      emailDate: email.sent_at || '',
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

    // Step 5: Fetch detailed information for each contact
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
              })) || []
            });
          }
        } catch (error) {
          console.error(`Error fetching contact ${mapping.metakocka_contact_id}:`, error);
        }
      }
    }

    // Step 6: Fetch detailed information for each document
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
            context.metakockaDocuments.push({
              id: mapping.metakocka_document_id,
              type: mapping.document_type,
              number: documentData.number,
              date: documentData.date,
              dueDate: documentData.due_date,
              status: documentData.status,
              amount: documentData.amount,
              items: documentData.items?.map(item => ({
                name: item.name,
                quantity: item.quantity,
                price: item.price
              })),
              confidence: mapping.confidence
            });
          }
        } catch (error) {
          console.error(`Error fetching document ${mapping.metakocka_document_id}:`, error);
        }
      }
    }

    // Step 7: Fetch detailed information for products mentioned in the email
    if (email.metakocka_metadata?.productIds && email.metakocka_metadata.productIds.length > 0) {
      for (const productId of email.metakocka_metadata.productIds) {
        try {
          const productData = await fetchMetakockaProduct(
            productId,
            credentials.secret_key,
            credentials.company_id
          );
          
          if (productData) {
            context.metakockaProducts.push({
              id: productId,
              name: productData.name,
              code: productData.code,
              price: productData.price,
              stock: productData.stock,
              confidence: email.metakocka_metadata.confidence || 0.5
            });
          }
        } catch (error) {
          console.error(`Error fetching product ${productId}:`, error);
        }
      }
    }

    // Step 8: Generate suggested actions based on the context
    context.suggestedActions = generateSuggestedActions(context);

    return context;
  } catch (error) {
    console.error('Error building email Metakocka context:', error);
    return null;
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
  
  // Check if there are low stock products mentioned
  const lowStockProducts = context.metakockaProducts.filter(product => 
    product.stock !== undefined && 
    product.stock < 5
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
      if (product.stock !== undefined) formattedContext += `, Stock: ${product.stock}`;
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
