/**
 * Metakocka AI API
 * 
 * Client-side API functions for retrieving Metakocka data for AI context
 * and UI components.
 */

import { getBaseUrl } from '@/lib/utils/api-utils';

/**
 * Fetch Metakocka data for a specific document
 * 
 * @param documentId The ID of the document
 * @param userId The ID of the user who owns the document
 * @returns Formatted Metakocka data for UI display
 */
export async function getMetakockaDataForDocument(documentId: string, userId: string) {
  try {
    const response = await fetch(
      `${getBaseUrl()}/api/integrations/metakocka/ai-context?documentId=${documentId}&userId=${userId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch Metakocka data');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching Metakocka data for document:', error);
    throw error;
  }
}

/**
 * Fetch Metakocka data for a specific user
 * 
 * @param userId The ID of the user
 * @returns Formatted Metakocka data for UI display
 */
export async function getMetakockaDataForUser(userId: string) {
  try {
    const response = await fetch(
      `${getBaseUrl()}/api/integrations/metakocka/ai-context?userId=${userId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch Metakocka data');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching Metakocka data for user:', error);
    throw error;
  }
}
