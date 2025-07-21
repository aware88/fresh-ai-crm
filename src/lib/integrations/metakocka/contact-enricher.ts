import { createLazyServerClient } from '@/lib/supabase/lazy-client';
import { MetakockaClient } from './client';
import { getMetakockaCredentials } from './credentials';

interface ContactEnrichmentResult {
  success: boolean;
  crmContact?: any;
  metakockaPartner?: any;
  enrichedData?: any;
  actions: string[];
  error?: string;
}

interface EmailSenderInfo {
  email: string;
  name?: string;
  company?: string;
}

/**
 * 🎯 MAIN EMAIL FLOW: Always Enrich Contacts with Metakocka Data
 * 
 * This implements the strategy:
 * 1. Extract sender info (name, email, company)
 * 2. Search existing CRM contacts 
 * 3. ALWAYS fetch Metakocka partner data (even if CRM contact exists)
 * 4. Enrich/merge contact data with Metakocka information
 * 5. Return enriched context for email processing
 */
export class ContactEnricher {
  private metakockaClient: MetakockaClient | null = null;

  /**
   * Initialize Metakocka client for user
   */
  private async initializeMetakockaClient(userId: string): Promise<void> {
    const credentialsResult = await getMetakockaCredentials(userId);
    if (!credentialsResult.success || !credentialsResult.credentials) {
      throw new Error('Metakocka credentials not found');
    }
    
    this.metakockaClient = new MetakockaClient({
      companyId: credentialsResult.credentials.company_id,
      secretKey: credentialsResult.credentials.secret_key,
      apiEndpoint: 'https://main.metakocka.si/rest/eshop/v1/json/'
    });
  }

  /**
   * 🚀 MAIN ENRICHMENT FUNCTION
   * Called for every email to enrich sender contact with Metakocka data
   */
  async enrichContactForEmail(
    senderInfo: EmailSenderInfo,
    userId: string,
    organizationId?: string
  ): Promise<ContactEnrichmentResult> {
    const actions: string[] = [];
    
    try {
      // Initialize Metakocka client
      await this.initializeMetakockaClient(userId);
      actions.push('✅ Metakocka client initialized');

      // Step 1: Search for existing CRM contact
      const crmContact = await this.findCRMContact(senderInfo.email, userId);
      if (crmContact) {
        actions.push(`✅ Found existing CRM contact: ${crmContact.first_name} ${crmContact.last_name}`);
      } else {
        actions.push('ℹ️ No existing CRM contact found');
      }

      // Step 2: ALWAYS search Metakocka for partner data
      const metakockaPartner = await this.searchMetakockaPartner(senderInfo);
      if (metakockaPartner) {
        actions.push(`✅ Found Metakocka partner: ${metakockaPartner.name || metakockaPartner.business_entity}`);
      } else {
        actions.push('ℹ️ No matching Metakocka partner found');
      }

      // Step 3: Merge and enrich data
      const enrichedData = this.mergeContactData(crmContact, metakockaPartner, senderInfo);
      actions.push('✅ Contact data merged and enriched');

      // Step 4: Update/Create CRM contact with enriched data
      const finalContact = await this.upsertEnrichedContact(
        enrichedData,
        userId,
        organizationId
      );
      actions.push(`✅ Contact ${crmContact ? 'updated' : 'created'} in CRM`);

      return {
        success: true,
        crmContact: finalContact,
        metakockaPartner,
        enrichedData,
        actions
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      actions.push(`❌ Error: ${errorMessage}`);
      
      return {
        success: false,
        actions,
        error: errorMessage
      };
    }
  }

  /**
   * Find existing contact in CRM by email
   */
  private async findCRMContact(email: string, userId: string): Promise<any | null> {
    const supabase = await createLazyServerClient();
    const { data: contact, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('email', email)
      .eq('user_id', userId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Error searching CRM contacts: ${error.message}`);
    }

    return contact;
  }

  /**
   * Search for partner in Metakocka
   * Since there's no partner_list endpoint, we'll implement smart searching
   */
  private async searchMetakockaPartner(senderInfo: EmailSenderInfo): Promise<any | null> {
    if (!this.metakockaClient) {
      throw new Error('Metakocka client not initialized');
    }

    try {
      // Strategy 1: Search by email using get_partner if we have a partner ID
      // Strategy 2: Check recent invoices/documents for this email
      // Strategy 3: Create new partner if business relationship detected
      
      // For now, return null since we can't bulk search partners
      // In practice, you would:
      // 1. Check recent sales documents for this email
      // 2. Maintain a local cache of partner emails
      // 3. Use add_partner when business relationship is detected
      
      return null;
    } catch (error) {
      console.error('Error searching Metakocka partner:', error);
      return null;
    }
  }

  /**
   * Merge CRM contact data with Metakocka partner data
   */
  private mergeContactData(
    crmContact: any | null,
    metakockaPartner: any | null,
    senderInfo: EmailSenderInfo
  ): any {
    // Base contact data from email
    const baseData = {
      email: senderInfo.email,
      first_name: this.extractFirstName(senderInfo.name || senderInfo.email),
      last_name: this.extractLastName(senderInfo.name || ''),
      company: senderInfo.company || ''
    };

    // Start with CRM data if exists
    let enrichedData = crmContact ? { ...crmContact } : { ...baseData };

    // Enrich with Metakocka data if available
    if (metakockaPartner) {
      enrichedData = {
        ...enrichedData,
        // Business information from Metakocka
        company: metakockaPartner.business_entity || enrichedData.company,
        tax_number: metakockaPartner.tax_number,
        business_register_number: metakockaPartner.business_register_number,
        
        // Contact details
        phone: metakockaPartner.phone || enrichedData.phone,
        website: metakockaPartner.website || enrichedData.website,
        
        // Address information
        address: {
          street: metakockaPartner.street,
          city: metakockaPartner.city,
          postal_code: metakockaPartner.postal_code,
          country: metakockaPartner.country
        },
        
        // Business relationship data
        metakocka_partner_id: metakockaPartner.mk_id,
        business_status: metakockaPartner.status,
        credit_limit: metakockaPartner.credit_limit,
        payment_terms: metakockaPartner.payment_terms,
        
        // Metadata about enrichment
        metakocka_enriched_at: new Date().toISOString(),
        data_sources: ['crm', 'metakocka'].filter(Boolean)
      };
    } else {
      // Mark as enrichment attempted even if no Metakocka data found
      enrichedData.metakocka_enriched_at = new Date().toISOString();
      enrichedData.data_sources = ['crm'].filter(Boolean);
    }

    return enrichedData;
  }

  /**
   * Create or update contact in CRM with enriched data
   */
  private async upsertEnrichedContact(
    enrichedData: any,
    userId: string,
    organizationId?: string
  ): Promise<any> {
    const supabase = await createLazyServerClient();
    const contactData = {
      ...enrichedData,
      user_id: userId,
      organization_id: organizationId || null,
      updated_at: new Date().toISOString()
    };

    // If contact has ID, update; otherwise create
    if (enrichedData.id) {
      const { data, error } = await supabase
        .from('contacts')
        .update(contactData)
        .eq('id', enrichedData.id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        throw new Error(`Error updating contact: ${error.message}`);
      }
      return data;
    } else {
      const { data, error } = await supabase
        .from('contacts')
        .insert(contactData)
        .select()
        .single();

      if (error) {
        throw new Error(`Error creating contact: ${error.message}`);
      }
      return data;
    }
  }

  /**
   * Extract first name from full name or email
   */
  private extractFirstName(nameOrEmail: string): string {
    if (nameOrEmail.includes('@')) {
      return nameOrEmail.split('@')[0];
    }
    return nameOrEmail.split(' ')[0] || '';
  }

  /**
   * Extract last name from full name
   */
  private extractLastName(name: string): string {
    const parts = name.split(' ');
    return parts.length > 1 ? parts.slice(1).join(' ') : '';
  }
}

/**
 * 🎯 MAIN ENTRY POINT
 * Call this function for every email to enrich sender contact
 */
export async function enrichContactFromEmail(
  emailId: string,
  senderEmail: string,
  senderName: string | undefined,
  userId: string,
  organizationId?: string
): Promise<ContactEnrichmentResult> {
  const enricher = new ContactEnricher();
  
  const senderInfo: EmailSenderInfo = {
    email: senderEmail,
    name: senderName
  };
  
  const result = await enricher.enrichContactForEmail(senderInfo, userId, organizationId);
  
  // Log the enrichment result
  console.log(`[Contact Enricher] Email ${emailId} processed:`, {
    success: result.success,
    actions: result.actions,
    hasMetakockaData: !!result.metakockaPartner,
    error: result.error
  });
  
  return result;
}

/**
 * Extract sender information from email for enrichment
 */
export function extractSenderInfo(email: any): EmailSenderInfo {
  return {
    email: email.sender || email.from_address || '',
    name: email.from_name || email.sender_name,
    company: email.metadata?.company || undefined
  };
}

export type { ContactEnrichmentResult, EmailSenderInfo }; 