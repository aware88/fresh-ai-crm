import { supabase } from '@/lib/supabaseClient';
import { buildEmailMetakockaContext } from './email-context-builder';

/**
 * Interface for email template
 */
interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  metakocka_placeholders?: string[];
}

/**
 * Interface for template placeholder values
 */
interface PlaceholderValues {
  [key: string]: string | number | undefined;
}

/**
 * Get all email templates for a user
 * @param userId User ID for multi-tenant isolation
 */
export async function getEmailTemplates(userId: string): Promise<EmailTemplate[]> {
  try {
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('created_by', userId)
      .order('updated_at', { ascending: false });
    
    if (error) {
      throw new Error(`Error fetching email templates: ${error.message}`);
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getEmailTemplates:', error);
    throw error;
  }
}

/**
 * Get a specific email template
 * @param templateId Template ID
 * @param userId User ID for multi-tenant isolation
 */
export async function getEmailTemplate(
  templateId: string,
  userId: string
): Promise<EmailTemplate | null> {
  try {
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('id', templateId)
      .eq('created_by', userId)
      .single();
    
    if (error) {
      throw new Error(`Error fetching email template: ${error.message}`);
    }
    
    return data;
  } catch (error) {
    console.error('Error in getEmailTemplate:', error);
    throw error;
  }
}

/**
 * Create a new email template
 * @param template Template data
 * @param userId User ID for multi-tenant isolation
 */
export async function createEmailTemplate(
  template: Omit<EmailTemplate, 'id' | 'created_by' | 'created_at' | 'updated_at'>,
  userId: string
): Promise<EmailTemplate> {
  try {
    const { data, error } = await supabase
      .from('email_templates')
      .insert({
        ...template,
        created_by: userId
      })
      .select()
      .single();
    
    if (error) {
      throw new Error(`Error creating email template: ${error.message}`);
    }
    
    return data;
  } catch (error) {
    console.error('Error in createEmailTemplate:', error);
    throw error;
  }
}

/**
 * Update an existing email template
 * @param templateId Template ID
 * @param template Template data to update
 * @param userId User ID for multi-tenant isolation
 */
export async function updateEmailTemplate(
  templateId: string,
  template: Partial<Omit<EmailTemplate, 'id' | 'created_by' | 'created_at' | 'updated_at'>>,
  userId: string
): Promise<EmailTemplate> {
  try {
    const { data, error } = await supabase
      .from('email_templates')
      .update(template)
      .eq('id', templateId)
      .eq('created_by', userId)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Error updating email template: ${error.message}`);
    }
    
    return data;
  } catch (error) {
    console.error('Error in updateEmailTemplate:', error);
    throw error;
  }
}

/**
 * Delete an email template
 * @param templateId Template ID
 * @param userId User ID for multi-tenant isolation
 */
export async function deleteEmailTemplate(
  templateId: string,
  userId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('email_templates')
      .delete()
      .eq('id', templateId)
      .eq('created_by', userId);
    
    if (error) {
      throw new Error(`Error deleting email template: ${error.message}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error in deleteEmailTemplate:', error);
    throw error;
  }
}

/**
 * Extract all Metakocka placeholders from a template
 * @param template Template text (subject or body)
 */
export function extractMetakockaPlaceholders(template: string): string[] {
  const placeholderRegex = /{{metakocka\.([\w\.]+)}}/g;
  const placeholders: string[] = [];
  let match;
  
  while ((match = placeholderRegex.exec(template)) !== null) {
    placeholders.push(match[1]);
  }
  
  return [...new Set(placeholders)]; // Remove duplicates
}

/**
 * Get placeholder values from Metakocka context
 * @param emailId Email ID to build context from
 * @param userId User ID for multi-tenant isolation
 * @param placeholders List of placeholders to extract values for
 */
export async function getPlaceholderValues(
  emailId: string,
  userId: string,
  placeholders: string[]
): Promise<PlaceholderValues> {
  try {
    // Build the Metakocka context for this email
    const context = await buildEmailMetakockaContext(emailId, userId);
    
    if (!context) {
      throw new Error('Failed to build email context');
    }
    
    const values: PlaceholderValues = {};
    
    // Process each placeholder and extract the corresponding value from the context
    for (const placeholder of placeholders) {
      const parts = placeholder.split('.');
      let value: any = context;
      
      // Navigate through the context object based on the placeholder path
      for (const part of parts) {
        if (value && typeof value === 'object' && part in value) {
          value = value[part];
        } else {
          value = undefined;
          break;
        }
      }
      
      // Store the value if it's a primitive type
      if (value !== undefined && (typeof value === 'string' || typeof value === 'number')) {
        values[placeholder] = value;
      }
    }
    
    return values;
  } catch (error) {
    console.error('Error getting placeholder values:', error);
    return {};
  }
}

/**
 * Apply placeholder values to a template
 * @param template Template text (subject or body)
 * @param values Placeholder values
 */
export function applyPlaceholders(template: string, values: PlaceholderValues): string {
  let result = template;
  
  // Replace each placeholder with its value
  for (const [placeholder, value] of Object.entries(values)) {
    const regex = new RegExp(`{{metakocka\\.${placeholder}}}`, 'g');
    result = result.replace(regex, value !== undefined ? String(value) : '');
  }
  
  // Replace any remaining placeholders with empty strings
  result = result.replace(/{{metakocka\.\w+(\.\w+)*}}/g, '');
  
  return result;
}

/**
 * Apply Metakocka context to an email template
 * @param templateId Template ID
 * @param emailId Email ID to build context from
 * @param userId User ID for multi-tenant isolation
 */
export async function applyTemplateWithMetakockaContext(
  templateId: string,
  emailId: string,
  userId: string
): Promise<{ subject: string; body: string }> {
  try {
    // Get the template
    const template = await getEmailTemplate(templateId, userId);
    
    if (!template) {
      throw new Error('Template not found');
    }
    
    // Extract placeholders from the template
    const subjectPlaceholders = extractMetakockaPlaceholders(template.subject);
    const bodyPlaceholders = extractMetakockaPlaceholders(template.body);
    const allPlaceholders = [...new Set([...subjectPlaceholders, ...bodyPlaceholders])];
    
    // Get values for the placeholders
    const values = await getPlaceholderValues(emailId, userId, allPlaceholders);
    
    // Apply the values to the template
    const subject = applyPlaceholders(template.subject, values);
    const body = applyPlaceholders(template.body, values);
    
    return { subject, body };
  } catch (error) {
    console.error('Error applying template with Metakocka context:', error);
    throw error;
  }
}

/**
 * Get available Metakocka placeholders for templates
 */
export function getAvailableMetakockaPlaceholders(): { category: string; placeholders: string[] }[] {
  return [
    {
      category: 'Email',
      placeholders: [
        'emailSubject',
        'emailSender',
        'emailRecipients',
        'emailDate'
      ]
    },
    {
      category: 'Company',
      placeholders: [
        'companyContext.name',
        'companyContext.industry',
        'companyContext.communicationStyle',
        'companyContext.preferredLanguage'
      ]
    },
    {
      category: 'Contacts',
      placeholders: [
        'metakockaContacts[0].name',
        'metakockaContacts[0].email',
        'metakockaContacts[0].phone',
        'metakockaContacts[0].address',
        'metakockaContacts[0].type'
      ]
    },
    {
      category: 'Documents',
      placeholders: [
        'metakockaDocuments[0].type',
        'metakockaDocuments[0].number',
        'metakockaDocuments[0].date',
        'metakockaDocuments[0].dueDate',
        'metakockaDocuments[0].status',
        'metakockaDocuments[0].amount'
      ]
    },
    {
      category: 'Products',
      placeholders: [
        'metakockaProducts[0].name',
        'metakockaProducts[0].code',
        'metakockaProducts[0].price',
        'metakockaProducts[0].stock'
      ]
    }
  ];
}
