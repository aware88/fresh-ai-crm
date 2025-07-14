import OpenAI from 'openai';

// Function to create OpenAI client with fallback for missing API key
const createOpenAIClient = () => {
  if (!process.env.OPENAI_API_KEY) {
    console.warn('OPENAI_API_KEY environment variable is missing. Using mock client.');
    // Use unknown as intermediate type before asserting as OpenAI
    const mockClient: unknown = {
      chat: {
        completions: {
          create: async () => ({
            choices: [{ message: { content: JSON.stringify({
              contactIds: [],
              documentIds: [],
              documentTypes: [],
              productIds: [],
              confidence: 0.5,
              extractedData: {
                invoiceNumbers: [],
                offerNumbers: [],
                orderNumbers: [],
                amounts: [],
                dates: [],
                productNames: []
              }
            })} }],
            usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
          })
        }
      }
    };
    return mockClient as OpenAI;
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
};

// Initialize the OpenAI client
const openai = createOpenAIClient();

export default openai;
