import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { checkRateLimit } from '@/lib/rate-limit';
// Use unified client manager for optimized OpenAI client handling
import { getOpenAIClient } from '@/lib/clients/unified-client-manager';

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
              choices: [{ message: { content: "This is a mock response as no OpenAI API key is configured." } }],
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

// Initialize OpenAI client using unified manager
const openai = createOpenAIClient();

// Maximum number of tokens allowed per request
const MAX_TOKENS = process.env.OPENAI_MAX_TOKENS 
  ? parseInt(process.env.OPENAI_MAX_TOKENS) 
  : 1000;

// Maximum number of characters allowed in the prompt
const MAX_PROMPT_LENGTH = 4000;

export async function POST(request: NextRequest) {
  try {
    // Check rate limit
    const rateLimit = await checkRateLimit(request);
    if (!rateLimit.success) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          retryAfter: rateLimit.error?.retryAfter,
          limit: rateLimit.error?.limit,
          remaining: rateLimit.error?.remaining
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.error?.retryAfter || 10),
            'X-RateLimit-Limit': String(rateLimit.error?.limit || 5),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(rateLimit.error?.retryAfter ? 
              Math.floor(Date.now() / 1000) + rateLimit.error.retryAfter : 
              Math.floor(Date.now() / 1000) + 10)
          }
        }
      );
    }

    const { prompt } = await request.json();

    // Validate input
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Invalid prompt provided' },
        { status: 400 }
      );
    }

    // Limit prompt length to prevent abuse
    const truncatedPrompt = prompt.length > MAX_PROMPT_LENGTH 
      ? prompt.substring(0, MAX_PROMPT_LENGTH) + ' [truncated]' 
      : prompt;

    // Call OpenAI API with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a helpful AI assistant for a CRM system. You provide concise, professional advice for business contexts. Format your responses with markdown for readability. Focus on being practical and solution-oriented."
          },
          {
            role: "user",
            content: truncatedPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: MAX_TOKENS,
      }, { signal: controller.signal });

      clearTimeout(timeout);

      // Extract the response content
      const content = response.choices[0]?.message?.content || "Sorry, I couldn't generate a response.";

      return NextResponse.json({ 
        content,
        usage: {
          prompt_tokens: response.usage?.prompt_tokens,
          completion_tokens: response.usage?.completion_tokens,
          total_tokens: response.usage?.total_tokens,
        }
      }, {
        headers: {
          'X-RateLimit-Limit': String(rateLimit.limit),
          'X-RateLimit-Remaining': String(rateLimit.remaining),
          'X-RateLimit-Reset': String(Math.floor((rateLimit.resetTime || Date.now() + 10000) / 1000))
        }
      });
    } catch (error: any) {
      clearTimeout(timeout);
      
      if (error.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Request timed out' },
          { status: 504 }
        );
      }
      throw error;
    }
  } catch (error: any) {
    console.error('Error in custom prompt API:', error);
    
    return NextResponse.json(
      { 
        error: error.message || 'An error occurred while processing your request',
        code: error.code
      },
      { status: error.status || 500 }
    );
  }
}
