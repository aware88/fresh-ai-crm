/**
 * Client-side API functions for email templates and AI responses
 */

/**
 * Get all email templates
 */
export async function getEmailTemplates() {
  try {
    const response = await fetch('/api/emails/templates', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error fetching email templates');
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error in getEmailTemplates:', error);
    throw error;
  }
}

/**
 * Get a specific email template
 * @param templateId Template ID
 */
export async function getEmailTemplate(templateId: string) {
  try {
    const response = await fetch(`/api/emails/templates?templateId=${encodeURIComponent(templateId)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error fetching email template');
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error in getEmailTemplate:', error);
    throw error;
  }
}

/**
 * Get available Metakocka placeholders for templates
 */
export async function getAvailableMetakockaPlaceholders() {
  try {
    const response = await fetch('/api/emails/templates?placeholders=available', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error fetching available placeholders');
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error in getAvailableMetakockaPlaceholders:', error);
    throw error;
  }
}

/**
 * Create a new email template
 * @param template Template data
 */
export async function createEmailTemplate(template: {
  name: string;
  subject: string;
  body: string;
}) {
  try {
    const response = await fetch('/api/emails/templates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(template)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error creating email template');
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error in createEmailTemplate:', error);
    throw error;
  }
}

/**
 * Update an existing email template
 * @param templateId Template ID
 * @param template Template data to update
 */
export async function updateEmailTemplate(
  templateId: string,
  template: {
    name?: string;
    subject?: string;
    body?: string;
  }
) {
  try {
    const response = await fetch('/api/emails/templates', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: templateId,
        ...template
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error updating email template');
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error in updateEmailTemplate:', error);
    throw error;
  }
}

/**
 * Delete an email template
 * @param templateId Template ID
 */
export async function deleteEmailTemplate(templateId: string) {
  try {
    const response = await fetch(`/api/emails/templates?id=${encodeURIComponent(templateId)}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error deleting email template');
    }

    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Error in deleteEmailTemplate:', error);
    throw error;
  }
}

/**
 * Apply a template to an email with Metakocka context
 * @param templateId Template ID
 * @param emailId Email ID
 */
export async function applyTemplateWithMetakockaContext(
  templateId: string,
  emailId: string
) {
  try {
    const response = await fetch('/api/emails/templates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        apply: true,
        templateId,
        emailId
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error applying template');
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error in applyTemplateWithMetakockaContext:', error);
    throw error;
  }
}

/**
 * Get AI context for an email
 * @param emailId Email ID
 */
export async function getEmailAIContext(emailId: string) {
  try {
    const response = await fetch(`/api/emails/ai-context?emailId=${encodeURIComponent(emailId)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error fetching email AI context');
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error in getEmailAIContext:', error);
    throw error;
  }
}

/**
 * Generate AI response for an email
 * @param emailId Email ID
 * @param prompt Prompt for the AI
 */
export async function generateEmailAIResponse(
  emailId: string,
  prompt: string
) {
  try {
    const response = await fetch('/api/emails/ai-context', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        emailId,
        prompt
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error generating AI response');
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error in generateEmailAIResponse:', error);
    throw error;
  }
}
