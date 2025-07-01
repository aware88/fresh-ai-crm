/**
 * Client-side API functions for Metakocka integration
 */

/**
 * Metakocka credentials interface for client-side use
 * Note: secretKey is only included when creating/updating credentials
 */
export interface MetakockaCredentialsForm {
  companyId: string;
  secretKey?: string;
  apiEndpoint?: string;
}

/**
 * Check if Metakocka credentials exist for the current user
 * @returns Credentials info if they exist
 */
export async function checkMetakockaCredentials(): Promise<{ 
  exists: boolean; 
  companyId?: string;
  apiEndpoint?: string;
}> {
  const response = await fetch('/api/integrations/metakocka/credentials', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to check Metakocka credentials');
  }
  
  return response.json();
}

/**
 * Save Metakocka credentials
 * @param credentials Metakocka credentials
 * @param testConnection Whether to test the connection before saving
 * @returns Success status
 */
export async function saveMetakockaCredentials(
  credentials: MetakockaCredentialsForm,
  testConnection: boolean = true
): Promise<{ success: boolean }> {
  const response = await fetch('/api/integrations/metakocka/credentials', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...credentials,
      testConnection,
    }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to save Metakocka credentials');
  }
  
  return response.json();
}

/**
 * Delete Metakocka credentials
 * @returns Success status
 */
export async function deleteMetakockaCredentials(): Promise<{ success: boolean }> {
  const response = await fetch('/api/integrations/metakocka/credentials', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete Metakocka credentials');
  }
  
  return response.json();
}

/**
 * Test Metakocka connection with provided credentials
 * @param credentials Metakocka credentials
 * @returns Success status
 */
export async function testMetakockaConnection(
  credentials: MetakockaCredentialsForm
): Promise<{ success: boolean; error?: string; type?: string; code?: string }> {
  const response = await fetch('/api/integrations/metakocka/test-connection', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });
  
  return response.json();
}
