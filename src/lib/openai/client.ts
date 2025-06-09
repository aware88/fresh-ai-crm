import OpenAI from 'openai';
import { getPersonalityDataForPrompt, loadPersonalityProfiles } from '../personality/data';

let openAIClient: OpenAI | null = null;

export const getOpenAIClient = () => {
  // Create a singleton instance
  if (!openAIClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error('Missing OpenAI API key');
    }
    
    openAIClient = new OpenAI({
      apiKey,
    });
  }
  
  return openAIClient;
};

// Helper function to limit the number of profiles to avoid token limit issues
const getLimitedPersonalityData = (maxProfiles: number = 5) => {
  const profiles = loadPersonalityProfiles();
  
  if (profiles.length === 0) {
    return '';
  }

  // Take only a subset of profiles
  const limitedProfiles = profiles.slice(0, maxProfiles);
  
  // Format the data for inclusion in the prompt
  let formattedData = 'PERSONALITY PROFILES REFERENCE:\n\n';
  
  limitedProfiles.forEach((profile, index) => {
    formattedData += `PROFILE ${index + 1}: ${profile['Personality_Type']}\n`;
    formattedData += `Traits: ${profile['Traits']}\n`;
    formattedData += `Sales Strategy: ${profile['Sales_Strategy']}\n`;
    formattedData += `Messaging Do: ${profile['Messaging_Do']}\n`;
    formattedData += `Messaging Don't: ${profile['Messaging_Dont']}\n`;
    // Include only the most important fields to reduce token count
    formattedData += `Description: ${profile['Description']}\n\n`;
  });
  
  return formattedData;
};

export const analyzeEmail = async (emailContent: string) => {
  try {
    const openai = getOpenAIClient();
    
    // Get limited personality profile data to avoid token limit
    const personalityData = getLimitedPersonalityData(5); // Limit to 5 profiles
    
    const systemPrompt = `You are an advanced AI sales assistant specializing in psychological profiling based on written communication, such as emails or LinkedIn messages.

IMPORTANT: Before analyzing the message, you MUST follow these steps:

1. CAREFULLY REVIEW the personality profiles provided below. These are from the uploaded CSV data and contain crucial information for your analysis.
2. For each profile, note the key traits, communication preferences, and recommended approaches.
3. ONLY AFTER reviewing all profiles, proceed to analyze the message.

Your job is to:

1. Analyze the message provided by the user.
2. Match the sender's communication style and traits to the most relevant profile(s) from the CSV data.
3. Determine the sender's psychological profile by comparing their message to the CSV data, considering:
   - Tone and language patterns
   - Values and priorities
   - Personality traits
   - Emotional vs. rational indicators
   - Decision-making style
   - Communication preferences
4. Based on the matched profile(s), provide:
   - The optimal communication/sales approach (e.g., logical, emotional, friendly, data-driven, storytelling, direct, etc.)
   - Specific elements to emphasize based on the profile's 'Messaging_Do' and 'Best_For' fields
   - What to avoid based on the profile's 'Messaging_Dont' and 'Common_Biases' fields
5. Write a personalized draft response that aligns with the identified profile's preferences.

${personalityData}

CRITICAL: You MUST explicitly reference which profile(s) from the CSV data you're using for your analysis. If no profile matches well, explain why and provide a general approach.

---

Your output must always follow this structure:

**🔍 Profile Match:**  
- Which profile(s) from the CSV data best match the sender and why
- Confidence level in the match (High/Medium/Low)
- Key traits and communication preferences from the matched profile(s)

**🧠 Psychological Analysis:**  
(A detailed analysis of the sender's tone, mindset, and how it aligns with the matched profile(s))

**🎯 Recommended Approach:**  
(Specific communication strategies based on the profile's 'Sales_Strategy' and 'Framework' fields)
- What to emphasize: [specific elements from the profile]
- What to avoid: [specific elements from the profile]
- Suggested frameworks/methods: [from the profile's 'Framework' field]

**✉️ Suggested Response:**  
(A personalized response that demonstrates understanding of the profile's preferences)

**📝 Notes on Profile Alignment:**  
- How the response aligns with the profile's preferences
- Any adjustments made for tone or style
- Why this approach should be effective

Always ensure your response is natural, empathetic, and tailored to the specific profile's communication style.`;
    
    // Limit email content length if it's too long
    const maxEmailLength = 1500;
    const truncatedEmail = emailContent.length > maxEmailLength 
      ? emailContent.substring(0, maxEmailLength) + '... [content truncated for length]'
      : emailContent;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: truncatedEmail
        }
      ],
      temperature: 0.7,
      max_tokens: 1500,
      top_p: 1,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error analyzing email:', error);
    throw new Error('Failed to analyze email');
  }
};
