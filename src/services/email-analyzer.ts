/**
 * Email Analyzer Service
 * 
 * This service analyzes email content to extract metadata, detect language,
 * classify intent, and determine priority for the email queue system.
 */

import { OpenAI } from 'openai';

export interface EmailAnalysis {
  language: string;
  intent: string;
  priority: string;
  sentiment: {
    score: number;
    label: string;
  };
  keywords: string[];
  summary: string;
  confidence: number;
  requiresAttention: boolean;
}

export class EmailAnalyzerService {
  private openai: OpenAI;
  
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }
  
  /**
   * Analyze email content to extract metadata
   */
  async analyzeEmail(content: string, subject?: string): Promise<EmailAnalysis> {
    try {
      // Prepare the prompt for OpenAI
      const prompt = `
        Analyze the following email${subject ? ` with subject "${subject}"` : ''}:
        
        ${content}
        
        Provide a structured analysis with the following information:
        1. Language: The primary language of the email
        2. Intent: The main purpose (inquiry, complaint, feedback, order, support, etc.)
        3. Priority: How urgent this email is (low, medium, high, urgent)
        4. Sentiment: A score from -1 (very negative) to 1 (very positive) and a label
        5. Keywords: Up to 5 key terms that represent the main topics
        6. Summary: A brief 1-2 sentence summary of the email
        7. Confidence: Your confidence in this analysis from 0 to 1
        8. Requires Attention: Whether this email needs human attention (true/false)
        
        Format your response as a JSON object with these fields.
      `;
      
      // Call OpenAI API
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are an email analysis assistant that extracts metadata from emails.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      });
      
      // Parse the response
      const analysisText = response.choices[0]?.message?.content;
      if (!analysisText) {
        throw new Error('No analysis received from OpenAI');
      }
      
      const analysis = JSON.parse(analysisText) as EmailAnalysis;
      
      return analysis;
    } catch (error) {
      console.error('Error analyzing email:', error);
      
      // Return a fallback analysis
      return {
        language: 'unknown',
        intent: 'unknown',
        priority: 'medium',
        sentiment: {
          score: 0,
          label: 'neutral'
        },
        keywords: [],
        summary: 'Failed to analyze email content.',
        confidence: 0,
        requiresAttention: true
      };
    }
  }
  
  /**
   * Detect the language of the email
   */
  async detectLanguage(text: string): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'Identify the language of the following text. Respond with only the language name in English.' },
          { role: 'user', content: text.substring(0, 500) } // Use just the first 500 chars for efficiency
        ],
        temperature: 0.3,
        max_tokens: 10
      });
      
      return response.choices[0]?.message?.content?.trim() || 'unknown';
    } catch (error) {
      console.error('Error detecting language:', error);
      return 'unknown';
    }
  }
  
  /**
   * Classify the intent of the email
   */
  async classifyIntent(text: string, subject?: string): Promise<string> {
    try {
      const prompt = `
        Classify the intent of this email${subject ? ` with subject "${subject}"` : ''}:
        
        ${text.substring(0, 1000)}
        
        Choose one of the following intents:
        - inquiry (asking for information)
        - complaint (expressing dissatisfaction)
        - feedback (providing opinions)
        - order (placing or asking about an order)
        - support (requesting technical help)
        - urgent (requires immediate attention)
        - other (doesn't fit the above categories)
        
        Respond with only the intent name.
      `;
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are an email intent classifier.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 10
      });
      
      return response.choices[0]?.message?.content?.trim().toLowerCase() || 'other';
    } catch (error) {
      console.error('Error classifying intent:', error);
      return 'other';
    }
  }
}
