/**
 * Client-side API functions for email-Metakocka integration
 */

/**
 * Get Metakocka metadata for a specific email
 * @param emailId The ID of the email to fetch metadata for
 */
export async function getEmailMetakockaMetadata(emailId: string) {
  try {
    const response = await fetch(`/api/emails/metakocka?emailId=${encodeURIComponent(emailId)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error fetching email Metakocka metadata');
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error in getEmailMetakockaMetadata:', error);
    throw error;
  }
}

/**
 * Process an email to extract Metakocka metadata
 * @param emailId The ID of the email to process
 */
export async function processEmailForMetakocka(emailId: string) {
  try {
    const response = await fetch('/api/emails/metakocka', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ emailId })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error processing email for Metakocka');
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error in processEmailForMetakocka:', error);
    throw error;
  }
}

/**
 * Process multiple unprocessed emails to extract Metakocka metadata
 * @param limit Maximum number of emails to process (default: 10)
 */
export async function processUnprocessedEmailsForMetakocka(limit: number = 10) {
  try {
    const response = await fetch('/api/emails/metakocka', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ processBatch: true, limit })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error processing emails for Metakocka');
    }

    const data = await response.json();
    return {
      processed: data.processed,
      errors: data.errors,
      details: data.details
    };
  } catch (error) {
    console.error('Error in processUnprocessedEmailsForMetakocka:', error);
    throw error;
  }
}

/**
 * Service function to process an email (for use in background tasks)
 * @param emailId The ID of the email to process
 * @param userId The ID of the user who owns the email
 * @param serviceToken The service authentication token
 */
export async function processEmailWithServiceToken(
  emailId: string,
  userId: string,
  serviceToken: string
) {
  try {
    const response = await fetch('/api/emails/metakocka', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Service-Token': serviceToken
      },
      body: JSON.stringify({ emailId, userId })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error processing email with service token');
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error in processEmailWithServiceToken:', error);
    throw error;
  }
}
