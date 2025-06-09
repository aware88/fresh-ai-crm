import OpenAI from 'openai';
import { getPersonalityDataForPrompt } from '../personality/data';

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

export const analyzeEmail = async (emailContent: string) => {
  try {
    const openai = getOpenAIClient();
    
    // Get personality profile data from CSV
    const personalityData = getPersonalityDataForPrompt();
    
    const systemPrompt = `You are an advanced AI sales assistant specializing in psychological profiling based on written communication, such as emails or LinkedIn messages.

Your job is to:

1. Analyze the message provided by the user.
2. Determine the sender's psychological profile: tone, values, personality traits, emotional vs. rational, cautious vs. decisive, open vs. reserved.
3. Based on this profile, suggest:
   - The optimal communication/sales approach (e.g., logical, emotional, friendly, data-driven, storytelling, direct, etc.)
   - What to emphasize in future communication
   - What to avoid or be cautious about
4. Then write a personalized draft response in the same language as the original message (English, Slovenian, etc.). The tone should be natural, friendly, and thoughtful — not pushy or too "salesy."

${personalityData}

Use the personality profiles above to help identify the sender's traits and tailor your recommendations accordingly. Match the sender to the most relevant profile(s).

---

Your output must always follow this structure:

**🧠 Psychological Profile:**  
(A short summary of the person's tone and mindset, referencing which personality profile(s) they match from the reference data)

**🎯 Recommended Approach:**  
(What kind of communication style will work best; what to highlight or avoid)

**✉️ Suggested Response:**  
(A short, effective email or message draft)

Always respond with confidence, empathy, and a tone aligned with the analyzed profile.`;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: emailContent
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
