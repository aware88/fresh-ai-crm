import { ContactCreateInput } from './types';
import { createContact, getContactByEmail, updateContact, updateContactLastInteraction } from './data';
import { getOpenAIClient } from '../openai/client';

/**
 * Extract contact information from an email
 */
export async function extractContactFromEmail(
  emailContent: string,
  personalityAnalysis: string
): Promise<ContactCreateInput | null> {
  try {
    const openai = getOpenAIClient();
    
    // Truncate long emails to avoid token limits
    const truncatedEmail = emailContent.length > 10000 
      ? emailContent.substring(0, 10000) + "..." 
      : emailContent;
    
    const systemPrompt = `
You are a contact information extraction assistant. Your task is to extract contact details from the email content.
Focus on identifying the sender's information (not the recipient).

Extract the following information if present:
1. First name
2. Last name
3. Email address
4. Company name (if mentioned)

If the email is part of a thread, focus on the most recent sender who is not the user.
If you cannot confidently extract some information, leave those fields empty.
Return the information in a structured JSON format.

Example response format:
{
  "firstName": "John",
  "lastName": "Smith",
  "email": "john.smith@company.com",
  "company": "Acme Inc."
}

If you cannot extract any useful contact information, return null.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: truncatedEmail }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content || '';
    
    if (!content || content.toLowerCase().includes('null')) {
      return null;
    }
    
    try {
      const contactData = JSON.parse(content) as ContactCreateInput;
      
      // Validate required fields
      if (!contactData.firstName || !contactData.email) {
        return null;
      }
      
      // Extract personality type and notes from analysis if available
      if (personalityAnalysis) {
        // Extract personality type
        const personalityMatch = personalityAnalysis.match(/Personality Type:\s*([^\n]+)/i);
        if (personalityMatch && personalityMatch[1]) {
          contactData.personalityType = personalityMatch[1].trim();
        }
        
        // Extract personality notes - try different patterns to be more robust
        let personalityNotes = '';
        
        // Try to extract Key Traits section
        const keyTraitsMatch = personalityAnalysis.match(/Key Traits:[^\n]*([\s\S]*?)(?=\n\n|$)/i);
        if (keyTraitsMatch && keyTraitsMatch[1]) {
          personalityNotes += keyTraitsMatch[1].trim();
        }
        
        // Try to extract Communication Style section
        const commStyleMatch = personalityAnalysis.match(/Communication Style:[^\n]*([\s\S]*?)(?=\n\n|$)/i);
        if (commStyleMatch && commStyleMatch[1]) {
          personalityNotes += '\n\nCommunication Style: ' + commStyleMatch[1].trim();
        }
        
        // If we still don't have notes, try to get any content after "Personality Type:"
        if (!personalityNotes) {
          const fullAnalysisMatch = personalityAnalysis.match(/Personality Type:[^\n]*\n([\s\S]*)/i);
          if (fullAnalysisMatch && fullAnalysisMatch[1]) {
            personalityNotes = fullAnalysisMatch[1].trim();
          }
        }
        
        if (personalityNotes) {
          contactData.personalityNotes = personalityNotes;
        }
      }
      
      return contactData;
    } catch (error) {
      console.error('Error parsing contact data:', error);
      return null;
    }
  } catch (error) {
    console.error('Error extracting contact from email:', error);
    return null;
  }
}

/**
 * Save contact extracted from email
 */
export async function saveContactFromEmail(
  emailContent: string,
  personalityAnalysis: string
): Promise<{ success: boolean; message: string; contactId?: string }> {
  try {
    const contactData = await extractContactFromEmail(emailContent, personalityAnalysis);
    
    if (!contactData) {
      return { 
        success: false, 
        message: 'Could not extract valid contact information from the email' 
      };
    }
    
    // Check if contact already exists
    const existingContact = getContactByEmail(contactData.email);
    
    if (existingContact) {
      // Update existing contact with new personality information if available
      if (contactData.personalityType || contactData.personalityNotes) {
        const updatedContact = await updateContact({
          id: existingContact.id,
          personalityType: contactData.personalityType || existingContact.personalityType,
          personalityNotes: contactData.personalityNotes || existingContact.personalityNotes
        });
        
        // Update the last interaction separately
        await updateContactLastInteraction(existingContact.email);
        
        if (updatedContact) {
          return {
            success: true,
            message: 'Contact updated with new personality information',
            contactId: updatedContact.id
          };
        }
      }
      
      return {
        success: true,
        message: 'Contact already exists',
        contactId: existingContact.id
      };
    }
    
    // Create new contact with current date as last interaction
    const contactWithInteraction = {
      ...contactData,
      lastInteraction: new Date().toISOString()
    };
    
    const newContact = await createContact(contactWithInteraction);
    
    if (!newContact) {
      return {
        success: false,
        message: 'Failed to create contact'
      };
    }
    
    return {
      success: true,
      message: 'Contact created successfully',
      contactId: newContact.id
    };
  } catch (error) {
    console.error('Error saving contact from email:', error);
    return {
      success: false,
      message: 'An error occurred while processing the contact'
    };
  }
}
