import { Contact } from '../contacts/types';
import { 
  DisputeDetails, 
  DisputeResolutionRequest, 
  DisputeResolutionResponse,
  ResolutionStrategy 
} from './types';
import { getContactById } from '../contacts/data';
import { createDispute, updateDisputeWithResolution } from './data';
import { getOpenAIClient } from '../openai/client';
import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';

/**
 * Generate a resolution strategy for a dispute
 */
export async function generateResolutionStrategy(
  disputeRequest: DisputeResolutionRequest,
  uploadedFilePath?: string
): Promise<DisputeResolutionResponse> {
  try {
    // Get contact details
    const contact = await getContactById(disputeRequest.contactId);
    if (!contact) {
      return {
        success: false,
        message: `Contact with ID ${disputeRequest.contactId} not found`
      };
    }
    
    // Create the dispute record
    const dispute = await createDispute(disputeRequest);
    if (!dispute) {
      return {
        success: false,
        message: 'Failed to create dispute record'
      };
    }
    
    // Generate resolution strategy using OpenAI
    const resolutionStrategy = await createResolutionStrategy(contact, dispute, uploadedFilePath);
    if (!resolutionStrategy) {
      return {
        success: false,
        message: 'Failed to generate resolution strategy',
        dispute
      };
    }
    
    // Update dispute with resolution strategy
    const updatedDispute = await updateDisputeWithResolution(dispute.id, resolutionStrategy);
    if (!updatedDispute) {
      return {
        success: false,
        message: 'Failed to update dispute with resolution strategy',
        dispute
      };
    }
    
    return {
      success: true,
      message: 'Resolution strategy generated successfully',
      dispute: updatedDispute
    };
  } catch (error) {
    console.error('Error generating resolution strategy:', error);
    return {
      success: false,
      message: 'An error occurred while generating resolution strategy'
    };
  }
}

/**
 * Create a resolution strategy using OpenAI
 * This leverages specialized dispute resolution prompting with additional data sources
 */
async function createResolutionStrategy(
  contact: Contact,
  dispute: DisputeDetails,
  uploadedFilePath?: string
): Promise<ResolutionStrategy | null> {
  try {
    const openai = getOpenAIClient();
    
    // Extract additional context from uploaded files if available
    let additionalContext = '';
    if (uploadedFilePath) {
      additionalContext = await extractContextFromFile(uploadedFilePath, contact);
    }
    
    const systemPrompt = `
You are an expert conflict resolution consultant specializing in business disputes with deep knowledge of personality psychology, negotiation tactics, and communication strategies.
Your task is to create a highly personalized dispute resolution strategy based on the contact's personality profile, communication preferences, and the specific dispute details.

You excel at analyzing personality types and adapting conflict resolution approaches to match individual communication styles. Your recommendations should be practical, actionable, and tailored specifically to this situation.

Contact Information:
- Name: ${contact.firstName} ${contact.lastName}
- Company: ${contact.company || 'Not specified'}
- Personality Type: ${contact.personalityType || 'Not specified'}
- Personality Notes: ${contact.personalityNotes || 'Not specified'}

Additional Context from Data Files:
${additionalContext}

Dispute Information:
- Category: ${dispute.category}
- Severity: ${dispute.severity}
- Description: ${dispute.description}
- Context: ${dispute.context}
- Desired Outcome: ${dispute.desiredOutcome}

Based on this information, create a comprehensive resolution strategy that includes:
1. A brief summary of your recommended approach that addresses the specific personality type
2. 3-5 specific steps to take, in order, with rationale for each step and how it aligns with the contact's personality
3. Communication tips tailored to this person's personality with specific reference to their communication style
4. Specific phrases to use that would resonate with this personality type, considering their position and the dispute context
5. Phrases or approaches to avoid with this personality type that could escalate the conflict
6. A recommendation for follow-up after the initial resolution attempt with timing suggestions
7. Alternative approaches if the primary strategy doesn't yield results

Format your response as a JSON object with the following structure:
{
  "summary": "Brief summary of the approach",
  "approachSteps": [
    {
      "order": 1,
      "action": "Specific action to take",
      "rationale": "Why this approach works for this personality",
      "expectedResponse": "What you might expect as a response"
    }
  ],
  "communicationTips": ["Tip 1", "Tip 2", "Tip 3"],
  "phrasesToUse": ["Phrase 1", "Phrase 2", "Phrase 3"],
  "phrasesToAvoid": ["Phrase 1", "Phrase 2", "Phrase 3"],
  "followUpRecommendation": "Recommendation for follow-up",
  "alternativeApproaches": ["Alternative 1", "Alternative 2"]
}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // Using the most advanced model for dispute resolution
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Please generate a personalized dispute resolution strategy." }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content || '';
    
    if (!content) {
      return null;
    }
    
    return JSON.parse(content) as ResolutionStrategy;
  } catch (error) {
    console.error('Error creating resolution strategy:', error);
    return null;
  }
}

/**
 * Extract relevant context from uploaded files
 * Supports Excel files with personality data or interaction history
 */
async function extractContextFromFile(filePath: string, contact: Contact): Promise<string> {
  try {
    if (!fs.existsSync(filePath)) {
      return 'No additional file data available.';
    }
    
    const fileExt = path.extname(filePath).toLowerCase();
    
    // Handle Excel files
    if (fileExt === '.xlsx' || fileExt === '.xls') {
      return extractFromExcel(filePath, contact);
    }
    
    // Handle CSV files
    if (fileExt === '.csv') {
      const content = fs.readFileSync(filePath, 'utf8');
      return `Additional data from CSV file: ${content.substring(0, 500)}...`;
    }
    
    // Handle text files
    if (fileExt === '.txt') {
      const content = fs.readFileSync(filePath, 'utf8');
      return `Additional context from text file: ${content.substring(0, 500)}...`;
    }
    
    return 'Unsupported file format for additional context.';
  } catch (error) {
    console.error('Error extracting context from file:', error);
    return 'Error extracting additional context from file.';
  }
}

/**
 * Extract personality data or interaction history from Excel files
 */
function extractFromExcel(filePath: string, contact: Contact): string {
  try {
    const workbook = XLSX.readFile(filePath);
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    // Look for rows related to this contact
    const contactRows = data.filter((row: any) => {
      // Match by email or name
      return (
        (row.email && row.email.toLowerCase() === contact.email.toLowerCase()) ||
        (row.firstName && row.lastName && 
         row.firstName.toLowerCase() === contact.firstName.toLowerCase() && 
         row.lastName.toLowerCase() === contact.lastName.toLowerCase())
      );
    });
    
    if (contactRows.length === 0) {
      return 'No specific data found for this contact in the uploaded file.';
    }
    
    // Extract personality data if available
    const personalityData = contactRows
      .filter((row: any) => row.personalityType || row.personalityNotes || row.communicationPreferences)
      .map((row: any) => {
        return `
- Personality Type: ${row.personalityType || 'Not specified in file'}
- Personality Notes: ${row.personalityNotes || 'Not specified in file'}
- Communication Preferences: ${row.communicationPreferences || 'Not specified in file'}
- Conflict Resolution History: ${row.conflictHistory || 'No history available'}
`;
      })
      .join('\n');
    
    if (personalityData) {
      return `Additional personality data from uploaded file:\n${personalityData}`;
    }
    
    // If no specific personality data, return general info
    return `Found ${contactRows.length} entries for this contact in the uploaded file, but no specific personality data.`;
  } catch (error) {
    console.error('Error extracting data from Excel:', error);
    return 'Error extracting data from Excel file.';
  }
}
