import { getContactByEmail, updateContact } from './data';
import { analyzeEmail } from '../openai/client';
import { ContactUpdateInput } from './types';

/**
 * Extract personality information from email analysis and update contact
 * @param email Email address of the contact
 * @param emailContent Content of the email to analyze
 * @returns True if contact was updated, false otherwise
 */
export const updateContactPersonalityFromEmail = async (
  email: string,
  emailContent: string
): Promise<boolean> => {
  try {
    // Get the contact by email
    const contact = getContactByEmail(email);
    if (!contact) {
      console.warn(`No contact found with email: ${email}`);
      return false;
    }

    // Analyze the email content
    const analysisResult = await analyzeEmail(emailContent);
    
    // Extract personality type from analysis
    let personalityType = '';
    let personalityNotes = '';
    
    // Make sure we have analysis result
    if (analysisResult) {
      // Look for profile match in the analysis
      const profileMatchRegex = /\*\*🔍\s*Profile Match:\*\*\s*([\s\S]*?)(?=\*\*🧠|$)/i;
      const profileMatch = analysisResult.match(profileMatchRegex);
      
      if (profileMatch && profileMatch[1]) {
        // Extract personality type - look for specific profile mention
        const typeRegex = /best match(?:es)? (?:the|is|are) ([^,\n]+)/i;
        const typeMatch = profileMatch[1].match(typeRegex);
        
        if (typeMatch && typeMatch[1]) {
          personalityType = typeMatch[1].trim();
        }
        
        // Use the entire profile match section as notes
        personalityNotes = profileMatch[1].trim();
      }
      
      // If no personality type was found, try to extract it from the psychological analysis section
      if (!personalityType) {
        const analysisRegex = /\*\*🧠\s*Psychological Analysis:\*\*\s*([\s\S]*?)(?=\*\*🎯|$)/i;
        const analysisMatch = analysisResult.match(analysisRegex);
        
        if (analysisMatch && analysisMatch[1]) {
          // Use the first sentence or two as the personality type
          const firstSentenceRegex = /^([^.!?]+[.!?])/;
          const firstSentence = analysisMatch[1].match(firstSentenceRegex);
          
          if (firstSentence && firstSentence[1]) {
            personalityType = firstSentence[1].trim();
          }
          
          // Use the entire analysis as notes if we don't have notes yet
          if (!personalityNotes) {
            personalityNotes = analysisMatch[1].trim();
          }
        }
      }
    }
    
    // If we still don't have a personality type or notes, use a generic placeholder
    if (!personalityType) {
      personalityType = 'Analysis Pending';
    }
    
    if (!personalityNotes) {
      personalityNotes = 'Full analysis in progress. Check email analysis for details.';
    }
    
    // Update the contact with personality information
    const updateData: ContactUpdateInput = {
      id: contact.id,
      personalityType,
      personalityNotes
    };
    
    // Update the contact
    const updatedContact = updateContact(updateData);
    return updatedContact !== null;
  } catch (error) {
    console.error('Error updating contact personality:', error);
    return false;
  }
};
