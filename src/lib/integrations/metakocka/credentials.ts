/**
 * Metakocka Credentials Management
 * 
 * This module handles retrieval and management of Metakocka API credentials
 */

// Import lazy server client function for initialization
import { createLazyServerClient } from '@/lib/supabase/lazy-client';

export interface MetakockaCredentials {
  secret_key: string;
  company_id: string;
}

export interface CredentialsStoreResult {
  success: boolean;
  error?: string;
  credentials?: MetakockaCredentials;
}

/**
 * Retrieve Metakocka credentials for a specific organization
 * @param organizationId The organization ID
 * @returns The credentials if found, or error information
 */
export async function getMetakockaCredentials(
  organizationId: string
): Promise<CredentialsStoreResult> {
  try {
    // Get initialized Supabase client
    const supabase = await createLazyServerClient();
    
    const { data, error } = await supabase
      .from('integration_credentials')
      .select('credentials')
      .eq('organization_id', organizationId)
      .eq('provider', 'metakocka')
      .single();
    
    if (error) {
      return {
        success: false,
        error: `Failed to retrieve Metakocka credentials: ${error.message}`
      };
    }
    
    if (!data) {
      return {
        success: false,
        error: 'No Metakocka credentials found for this organization'
      };
    }
    
    return {
      success: true,
      credentials: data.credentials as MetakockaCredentials
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Error retrieving Metakocka credentials: ${error.message}`
    };
  }
}

/**
 * Store Metakocka credentials for a specific organization
 * @param organizationId The organization ID
 * @param credentials The credentials to store
 * @returns Result of the operation
 */
export async function storeMetakockaCredentials(
  organizationId: string,
  credentials: MetakockaCredentials
): Promise<CredentialsStoreResult> {
  try {
    // Get initialized Supabase client
    const supabase = await createLazyServerClient();
    
    // Check if credentials already exist
    const { data: existing } = await supabase
      .from('integration_credentials')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('provider', 'metakocka')
      .single();
    
    if (existing) {
      // Update existing credentials
      const { error } = await supabase
        .from('integration_credentials')
        .update({ credentials, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
      
      if (error) {
        return {
          success: false,
          error: `Failed to update Metakocka credentials: ${error.message}`
        };
      }
    } else {
      // Insert new credentials
      const { error } = await supabase
        .from('integration_credentials')
        .insert({
          organization_id: organizationId,
          provider: 'metakocka',
          credentials,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (error) {
        return {
          success: false,
          error: `Failed to store Metakocka credentials: ${error.message}`
        };
      }
    }
    
    return {
      success: true,
      credentials
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Error storing Metakocka credentials: ${error.message}`
    };
  }
}

/**
 * Delete Metakocka credentials for a specific organization
 * @param organizationId The organization ID
 * @returns Result of the operation
 */
export async function deleteMetakockaCredentials(
  organizationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get initialized Supabase client
    const supabase = await createLazyServerClient();
    
    const { error } = await supabase
      .from('integration_credentials')
      .delete()
      .eq('organization_id', organizationId)
      .eq('provider', 'metakocka');
    
    if (error) {
      return {
        success: false,
        error: `Failed to delete Metakocka credentials: ${error.message}`
      };
    }
    
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: `Error deleting Metakocka credentials: ${error.message}`
    };
  }
}
