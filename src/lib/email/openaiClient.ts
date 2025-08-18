import OpenAI from 'openai';

// Use unified client manager for optimized OpenAI client handling
import { getOpenAIClient } from '../clients/unified-client-manager';

// Function to create OpenAI client with fallback for missing API key
const createOpenAIClient = () => {
  try {
    // Use unified client manager for better performance
    return getOpenAIClient();
  } catch (error) {
    console.warn('Unified OpenAI client failed, using fallback:', error);
    
    // Fallback implementation
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
  }
};

// Initialize the OpenAI client using unified manager
const openai = createOpenAIClient();

export default openai;
