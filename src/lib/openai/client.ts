import OpenAI from 'openai';

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
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert email analyst for CRM purposes. Analyze the provided email 
          and extract the following information:
          1. Key points and intentions
          2. Sentiment analysis (positive, neutral, negative)
          3. Customer needs and pain points
          4. Recommended follow-up actions
          5. Urgency level (low, medium, high)
          
          Format your response in clear sections with markdown headings.`
        },
        {
          role: "user",
          content: emailContent
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
      top_p: 1,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error analyzing email:', error);
    throw new Error('Failed to analyze email');
  }
};
