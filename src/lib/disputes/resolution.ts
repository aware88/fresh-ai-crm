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
import { getCompanyInfo, generateCompanyContextPrompt } from '../company/websiteScanner';
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
    
    // Get company information for context
    const companyInfo = getCompanyInfo();
    const companyContext = companyInfo ? generateCompanyContextPrompt(companyInfo) : '';
    
    const systemPrompt = `
You are an advanced AI conflict resolution expert specializing in **B2B dispute resolution** through psychological profiling and adaptive communication strategies.

Your role is to generate a complete, personalized **resolution plan** based on:

- The personality profile of the contact (from structured datasets)
- Their preferred communication style and biases
- The specific nature and context of the dispute
- Desired resolution goals from the business perspective

---

### 🔍 DATA SOURCES TO ANALYZE FIRST

You MUST first review:

1. All personality profiles from the **\`ai_profiler\`** dataset (e.g., Excel or Supabase table)  
   → Fields to analyze:  
   \`Personality_Type\`, \`Sales_Strategy\`, \`Framework\`, \`Messaging_Do\`, \`Messaging_Dont\`,  
   \`Cognitive_Biases\`, \`Emotional_Triggers\`, \`Tone_Preference\`, \`Best_For\`

2. Any supporting profiles from **\`test_profiles\`** or fallback personality models.

3. Contact and dispute information:
- Name: ${contact.firstName} ${contact.lastName}
- Company: ${contact.company || 'Not specified'}
- Personality Type: ${contact.personalityType || 'Not specified'}
- Personality Notes: ${contact.personalityNotes || 'Not specified'}
- Category: ${dispute.category}
- Severity: ${dispute.severity}
- Description: ${dispute.description}
- Context: ${dispute.context}
- Desired Outcome: ${dispute.desiredOutcome}

Additional Context from Data Files:
${additionalContext}

${companyContext ? `Your Company Context:
${companyContext}

Use this company information to personalize the resolution strategy and ensure it aligns with your company's values, products/services, and target audience.` : ''}

---

### 🎯 YOUR TASK

Use personality-driven negotiation tactics and communication psychology to design a resolution plan that:

- Avoids escalation
- Builds trust
- Aligns emotionally with the contact
- Increases the likelihood of a fair and positive outcome

---

### 📦 OUTPUT FORMAT

Please return a **JSON object** with the following structure:

{
  "summary": "Brief summary of the recommended approach, referencing the matched personality and how you'll resolve the issue",
  "approachSteps": [
    {
      "order": 1,
      "action": "Specific action to take",
      "rationale": "Why this action works for this contact's personality and dispute type",
      "expectedResponse": "What behavior or reply to expect from the contact"
    }
    // Repeat 3–5 steps
  ],
  "communicationTips": [
    "Tip 1 – based on Tone_Preference or Messaging_Do",
    "Tip 2 – specific to Emotional_Triggers or Cognitive_Biases",
    "Tip 3 – optional fallback method"
  ],
  "phrasesToUse": [
    "Phrase that emotionally reassures the contact",
    "Phrase that aligns with their decision-making style",
    "Phrase that shows empathy while guiding toward resolution"
  ],
  "phrasesToAvoid": [
    "Trigger phrases that might escalate based on profile",
    "Language that conflicts with their communication preferences",
    "Common mistakes made with this personality type"
  ],
  "followUpRecommendation": "When and how to follow up after initial outreach (e.g. 'Wait 48h, then call directly with neutral tone')",
  "alternativeApproaches": [
    "Plan B if first attempt fails (e.g., escalate internally, or offer call)",
    "Optional third-party resolution or neutral third option"
  ]
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
