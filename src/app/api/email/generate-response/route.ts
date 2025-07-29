import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '../../../../lib/supabase/server';
import { getUID } from '../../../../lib/auth/utils';
import OpenAI from 'openai';
import { EmailContextAnalyzer } from '../../../../lib/email/context-analyzer';
import { getPersonalityDataForPrompt } from '../../../../lib/personality/data';
import { loadCsvData } from '../../../../lib/personality/flexible-data';
import { getMatchingSalesTactics } from '../../../../lib/ai/sales-tactics'; // RE-ENABLED with optimization

// Simple in-memory rate limiting
const activeRequests = new Map<string, number>();

// Function to create OpenAI client with fallback for missing API key
const createOpenAIClient = () => {
  if (!process.env.OPENAI_API_KEY) {
    console.warn('OPENAI_API_KEY environment variable is missing. Using mock client.');
    const mockClient: unknown = {
      chat: {
        completions: {
          create: async () => ({
            choices: [{ message: { content: "Thank you for your email. I'll review your message and get back to you soon.\n\nBest regards" } }],
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

/**
 * Extract key information from original email to avoid repetition
 * @deprecated Use EmailContextAnalyzer.analyzeEmail() instead
 */
function extractEmailContext(emailContent: string) {
  // Use the enhanced context analyzer
  return EmailContextAnalyzer.analyzeEmail(emailContent);
}

/**
 * POST /api/email/generate-response
 * Generate an improved AI email response that avoids repetition
 */
export async function POST(request: NextRequest) {
  try {
    // Get user ID from session
    const uid = await getUID();
    if (!uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Simple rate limiting - prevent multiple simultaneous requests
    const userKey = `user_${uid}`;
    const currentTime = Date.now();
    const lastRequest = activeRequests.get(userKey);
    
    if (lastRequest && (currentTime - lastRequest) < 2000) { // 2 second cooldown
      return NextResponse.json(
        { 
          error: 'Please wait a moment before making another request.',
          details: 'Rate limiting active to prevent API overload.'
        },
        { status: 429 }
      );
    }
    
    // Track this request
    activeRequests.set(userKey, currentTime);

    // Parse request body
    const body = await request.json();
    const { originalEmail, tone = 'professional', customInstructions = '', senderEmail = '', contactId = '' } = body;

    if (!originalEmail) {
      return NextResponse.json({ error: 'Original email content is required' }, { status: 400 });
    }

    // Extract enhanced context from original email
    const emailContext = EmailContextAnalyzer.analyzeEmail(originalEmail);
    const contextSummary = EmailContextAnalyzer.generateContextSummary(emailContext);

    // Get personality profiles and contact context (WITHOUT sales tactics to reduce tokens)
    const personalityData = await getPersonalityProfilesAndContactContext(senderEmail, contactId, uid);

    // Generate improved response with full context
    const response = await generateImprovedResponse(originalEmail, emailContext, contextSummary, personalityData, tone, customInstructions);

    return NextResponse.json({
      success: true,
      response: response,
      context: emailContext, // Return context for debugging
      summary: contextSummary, // Return summary for debugging
      personalityData: personalityData, // Return comprehensive personality data for debugging
      intelligence: {
        contactFound: !!personalityData.contactContext,
        aiProfilerData: !!personalityData.aiProfilerData,
        salesTacticsCount: personalityData.salesTactics?.length || 0,
        analysisHistoryCount: personalityData.analysisHistory?.length || 0,
        personalityProfilesLoaded: !!personalityData.personalityProfiles
      }
    });
  } catch (error) {
    console.error('Error in generate-response API:', error);
    
    // Handle 429 rate limit errors specifically
    if (error instanceof Error && error.message.includes('429')) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded. Please wait a moment and try again.',
          details: 'OpenAI API rate limit reached. The system is temporarily overloaded.'
        },
        { status: 429 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to generate email response' },
      { status: 500 }
    );
  }
}

/**
 * Get comprehensive data including AI profiler and sales tactics
 */
async function getPersonalityProfilesAndContactContext(senderEmail: string, contactId: string, userId: string) {
  const supabase = await createServerClient();
  
  try {
    // Get personality profiles from CSV/database
    // Removed to save tokens - using AI profiler data instead
    const personalityProfiles = '';
    const flexibleProfiles: any[] = [];
    
    // Get contact information with AI profiler relationship
    let contactContext = null;
    let aiProfilerData = null;
    let salesTactics: any[] = []; // TEMPORARILY DISABLED
    let analysisHistory = [];

    if (contactId) {
      // Get contact by ID with AI profiler relationship
      const { data: contact } = await supabase
        .from('contacts')
        .select(`
          id,
          firstname,
          lastname,
          email,
          company,
          position,
          personalitytype,
          personalityanalysis,
          personalitynotes,
          lastinteraction,
          notes,
          ai_profiler_id,
          ai_profiler (
            id, Personality_Type, Traits, Sales_Strategy, Messaging_Do, Messaging_Dont,
            Common_Biases, Emotional_Trigger, Objection, Reframe, Copywriting_Style,
            Tone_Preference, Best_CTA_Type, Preferred_Visual_Format, Trigger_Signal_Keywords,
            Follow_Up_Timing, Suggested_Subject_Lines, Cognitive_Bias, Bias_Use_Tip,
            Reading_Style, Stress_Response, Top_Trigger_Words, Avoid_Words,
            Emotional_Intent, Cultural_Tone, Lead_Score, Conversion_Likelihood,
            Scraped_Signal_Summary, Recommended_Channel, Estimated_Deal_Tier
          )
        `)
        .eq('id', contactId)
        .eq('user_id', userId)
        .single();
      
      if (contact) {
        contactContext = {
          id: contact.id,
          name: `${contact.firstname || ''} ${contact.lastname || ''}`.trim(),
          email: contact.email,
          company: contact.company,
          position: contact.position,
          personalityType: contact.personalitytype,
          personalityAnalysis: contact.personalityanalysis,
          personalityNotes: contact.personalitynotes,
          lastInteraction: contact.lastinteraction,
          notes: contact.notes,
          aiProfilerId: contact.ai_profiler_id
        };

        // Extract AI profiler data
        if (contact.ai_profiler) {
          aiProfilerData = contact.ai_profiler;

          // Get matching sales tactics based on personality profile
          try {
            salesTactics = await getMatchingSalesTactics(
              contact.ai_profiler,
              { subject: '', content: '' } // We'll use the email content from the main function
            );
          } catch (error) {
            console.error('Error fetching sales tactics:', error);
          }
        }
      }
    } else if (senderEmail) {
      // Try to find contact by email with AI profiler relationship
      const { data: contact } = await supabase
        .from('contacts')
        .select(`
          id,
          firstname,
          lastname,
          email,
          company,
          position,
          personalitytype,
          personalityanalysis,
          personalitynotes,
          lastinteraction,
          notes,
          ai_profiler_id,
          ai_profiler (
            id, Personality_Type, Traits, Sales_Strategy, Messaging_Do, Messaging_Dont,
            Common_Biases, Emotional_Trigger, Objection, Reframe, Copywriting_Style,
            Tone_Preference, Best_CTA_Type, Preferred_Visual_Format, Trigger_Signal_Keywords,
            Follow_Up_Timing, Suggested_Subject_Lines, Cognitive_Bias, Bias_Use_Tip,
            Reading_Style, Stress_Response, Top_Trigger_Words, Avoid_Words,
            Emotional_Intent, Cultural_Tone, Lead_Score, Conversion_Likelihood,
            Scraped_Signal_Summary, Recommended_Channel, Estimated_Deal_Tier
          )
        `)
        .eq('email', senderEmail)
        .eq('user_id', userId)
        .single();
      
      if (contact) {
        contactContext = {
          id: contact.id,
          name: `${contact.firstname || ''} ${contact.lastname || ''}`.trim(),
          email: contact.email,
          company: contact.company,
          position: contact.position,
          personalityType: contact.personalitytype,
          personalityAnalysis: contact.personalityanalysis,
          personalityNotes: contact.personalitynotes,
          lastInteraction: contact.lastinteraction,
          notes: contact.notes,
          aiProfilerId: contact.ai_profiler_id
        };

        // Extract AI profiler data
        if (contact.ai_profiler) {
          aiProfilerData = contact.ai_profiler;

          // Get matching sales tactics based on personality profile
          try {
            salesTactics = await getMatchingSalesTactics(
              contact.ai_profiler,
              { subject: '', content: '' } // We'll use the email content from the main function
            );
          } catch (error) {
            console.error('Error fetching sales tactics:', error);
          }
        }
      }
    }

    // Get contact analysis history if we have a contact
    if (contactContext?.id) {
      try {
        const { data: history } = await supabase
          .from('contact_analysis_history')
          .select('*')
          .eq('contact_id', contactContext.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (history) {
          analysisHistory = history;
        }
      } catch (error) {
        console.error('Error fetching analysis history:', error);
      }
    }

    return {
      personalityProfiles,
      flexibleProfiles,
      contactContext,
      aiProfilerData,
      salesTactics,
      analysisHistory
    };
  } catch (error) {
    console.error('Error getting comprehensive data context:', error);
    return {
      personalityProfiles: '',
      flexibleProfiles: [],
      contactContext: null,
      aiProfilerData: null,
      salesTactics: [],
      analysisHistory: []
    };
  }
}

/**
 * Smart Intelligence Summarization Functions
 * Convert raw personality/sales/history data into actionable intelligence
 */

/**
 * Extract key sales personality traits for prompt optimization
 */
function extractSalesPersonality(aiProfilerData: any): string {
  if (!aiProfilerData) return '';
  
  const traits: string[] = [];
  
  // Core personality type (most important)
  if (aiProfilerData.Personality_Type) {
    traits.push(aiProfilerData.Personality_Type);
  }
  
  // Communication style (second most important)
  if (aiProfilerData.Tone_Preference) {
    traits.push(`prefers ${aiProfilerData.Tone_Preference.toLowerCase()} tone`);
  }
  
  // Only include one additional trait to keep it concise
  if (aiProfilerData.Reading_Style && traits.length < 2) {
    traits.push(`${aiProfilerData.Reading_Style.toLowerCase()} reader`);
  }
  
  return traits.slice(0, 2).join(', '); // Max 2 key traits (reduced from 3)
}

/**
 * Extract actionable sales tactics (not full descriptions)
 */
function extractSalesTactics(salesTactics: any[], aiProfilerData: any): string {
  if (!salesTactics || salesTactics.length === 0) return '';
  
  const tactics: string[] = [];
  
  // Get top 1 most relevant tactic only (reduced from 2)
  const topTactics = salesTactics.slice(0, 1);
  
  for (const tactic of topTactics) {
    if (tactic.tactical_snippet) {
      // Extract key action from tactical snippet (first sentence or key phrase)
      const keyAction = tactic.tactical_snippet.split('.')[0].trim();
      if (keyAction.length > 10 && keyAction.length < 60) { // Reduced max length
        tactics.push(keyAction);
      }
    }
  }
  
  // Add AI profiler specific tactics (more concise)
  if (aiProfilerData) {
    if (aiProfilerData.Messaging_Do) {
      const doAction = aiProfilerData.Messaging_Do.split('.')[0].trim();
      if (doAction.length > 10 && doAction.length < 50) { // Reduced max length
        tactics.push(`DO: ${doAction}`);
      }
    }
  }
  
  return tactics.slice(0, 2).join(' | '); // Max 2 tactics (reduced from 3)
}

/**
 * Extract relevant conversation context from history
 */
function extractConversationContext(analysisHistory: any[]): string {
  if (!analysisHistory || analysisHistory.length === 0) return '';
  
  const context: string[] = [];
  
  // Look at last 2 interactions only (reduced from 3)
  const recentHistory = analysisHistory.slice(0, 2);
  
  for (const entry of recentHistory) {
    if (entry.analysis_result) {
      // Extract key facts from previous analysis
      const analysis = entry.analysis_result;
      
      // Look for key information patterns
      if (typeof analysis === 'string') {
        // Extract dates mentioned (more concise)
        const dateMatch = analysis.match(/\b(?:by|before|after|on|in)\s+(?:january|february|march|april|may|june|july|august|september|october|november|december|\d{1,2}\/\d{1,2})/i);
        if (dateMatch && context.length < 2) { // Limit context items
          context.push(`timeline: ${dateMatch[0]}`);
        }
        
        // Extract status updates (more concise)
        const statusMatch = analysis.match(/\b(?:approved|confirmed|completed|delivered|shipped|ready)\b/i);
        if (statusMatch && context.length < 2) { // Limit context items
          context.push(`status: ${statusMatch[0]}`);
        }
      }
    }
    
    // Limit context to avoid token bloat (reduced limit)
    if (context.length >= 2) break;
  }
  
  return context.slice(0, 2).join(', '); // Max 2 context items
}

/**
 * Identify what to avoid repeating from previous conversations
 */
function extractAvoidRepeating(analysisHistory: any[], contextSummary: any): string {
  if (!analysisHistory || analysisHistory.length === 0) return '';
  
  const avoid: string[] = [];
  
  // Check what was already provided in current email
  if (contextSummary.avoidAsking && contextSummary.avoidAsking.length > 0) {
    avoid.push(...contextSummary.avoidAsking.slice(0, 2));
  }
  
  // Check recent history for repeated topics
  const recentHistory = analysisHistory.slice(0, 2);
  for (const entry of recentHistory) {
    if (entry.analysis_result && typeof entry.analysis_result === 'string') {
      const analysis = entry.analysis_result.toLowerCase();
      
      // Common topics to avoid repeating
      if (analysis.includes('price') || analysis.includes('cost')) {
        avoid.push('pricing info');
      }
      if (analysis.includes('delivery') || analysis.includes('timeline')) {
        avoid.push('delivery timeline');
      }
      if (analysis.includes('document') || analysis.includes('certificate')) {
        avoid.push('documentation');
      }
    }
    
    if (avoid.length >= 3) break;
  }
  
  return avoid.slice(0, 3).join(', ');
}

/**
 * Create optimized intelligence summary for AI prompt
 */
function createIntelligenceSummary(personalityData: any, contextSummary: any): {
  salesPersonality: string;
  keyTactics: string;
  conversationContext: string;
  avoidRepeating: string;
  contactInfo: string;
} {
  return {
    salesPersonality: extractSalesPersonality(personalityData.aiProfilerData),
    keyTactics: extractSalesTactics(personalityData.salesTactics, personalityData.aiProfilerData),
    conversationContext: extractConversationContext(personalityData.analysisHistory),
    avoidRepeating: extractAvoidRepeating(personalityData.analysisHistory, contextSummary),
    contactInfo: personalityData.contactContext 
      ? `${personalityData.contactContext.name} (${personalityData.contactContext.company || 'Unknown Company'})`
      : ''
  };
}

/**
 * Generate a comprehensive email response using all available intelligence
 * OPTIMIZED with Smart Intelligence Summarization
 */
async function generateImprovedResponse(
  originalEmail: string,
  emailContext: any,
  contextSummary: any,
  personalityData: any,
  tone: string,
  customInstructions: string
) {
  const maxRetries = 3;
  let retryCount = 0;
  
  while (retryCount < maxRetries) {
    try {
      const openai = createOpenAIClient();

      // CREATE SMART INTELLIGENCE SUMMARY (NEW OPTIMIZATION!)
      const intelligenceSummary = createIntelligenceSummary(personalityData, contextSummary);

      // Build OPTIMIZED system prompt using smart summaries
      let systemPrompt = `You are an intelligent email assistant. Write natural, human-like responses that avoid repetition.

CONTEXT: ${contextSummary.summary}
PROVIDED: ${contextSummary.keyPoints.slice(0, 2).join(', ')}`; // Reduced from 3 to 2

      // Add contact info (concise)
      if (intelligenceSummary.contactInfo) {
        systemPrompt += `\nCONTACT: ${intelligenceSummary.contactInfo}`;
      }

      // Add sales personality (optimized)
      if (intelligenceSummary.salesPersonality) {
        systemPrompt += `\nPERSONALITY: ${intelligenceSummary.salesPersonality}`;
      }

      // Add key sales tactics (actionable, not full descriptions)
      if (intelligenceSummary.keyTactics) {
        systemPrompt += `\nAPPROACH: ${intelligenceSummary.keyTactics}`;
      }

      // Add conversation context (relevant history)
      if (intelligenceSummary.conversationContext) {
        systemPrompt += `\nHISTORY: ${intelligenceSummary.conversationContext}`;
      }

      // Add what to avoid repeating (critical for personalization)
      if (intelligenceSummary.avoidRepeating) {
        systemPrompt += `\nAVOID: ${intelligenceSummary.avoidRepeating}`;
      }

      systemPrompt += `\n\nRULES:
- Don't repeat what they provided
- Match their ${tone} tone
- Be human, not robotic
- Keep under 150 words
- Use personality/approach above
${customInstructions ? `\nNOTES: ${customInstructions.substring(0, 80)}` : ''}`; // Reduced from 100 to 80

      // Truncate original email to prevent token overflow
      const truncatedEmail = originalEmail.length > 1000 
        ? originalEmail.substring(0, 1000) + '...[truncated]'
        : originalEmail;

      // Log token usage for debugging
      console.log('=== OPTIMIZED EMAIL RESPONSE GENERATION ===');
      console.log('📊 System prompt length:', systemPrompt.length);
      console.log('📝 User prompt length:', truncatedEmail.length);
      console.log('🎯 Total estimated tokens:', Math.ceil((systemPrompt.length + truncatedEmail.length) / 4));
      console.log('✨ Intelligence Summary:', intelligenceSummary);
      
      // Log the optimization impact
      console.log('🚀 COMPREHENSIVE DATA INTEGRATION:');
      console.log(`📊 Contact Data: ${personalityData.contactContext ? '✅ Available' : '❌ None'}`);
      console.log(`🧠 AI Profiler: ${personalityData.aiProfilerData ? '✅ Available' : '❌ None'}`);
      console.log(`🎯 Sales Tactics: ${personalityData.salesTactics?.length || 0} tactics loaded`);
      console.log(`📚 History: ${personalityData.analysisHistory?.length || 0} entries`);
      console.log(`🔧 Smart Summary Fields: ${Object.keys(intelligenceSummary).filter(k => intelligenceSummary[k as keyof typeof intelligenceSummary]).length}/5 active`);
      console.log('===============================================');
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Respond to: "${truncatedEmail}"` }
        ],
        temperature: 0.7,
        max_tokens: 300
      });

      // Log actual token usage
      if (response.usage) {
        console.log('🎉 ACTUAL TOKEN USAGE:');
        console.log(`📥 Input tokens: ${response.usage.prompt_tokens}`);
        console.log(`📤 Output tokens: ${response.usage.completion_tokens}`);
        console.log(`💰 Total tokens: ${response.usage.total_tokens}`);
        console.log(`💡 Efficiency: ${response.usage.total_tokens < 30000 ? '✅ Within limits' : '⚠️ High usage'}`);
      }

      return response.choices[0]?.message?.content || 'Unable to generate response. Please try again.';
    } catch (error) {
      console.error(`Error generating response (attempt ${retryCount + 1}):`, error);
      
      // Check if it's a 429 rate limit error
      if (error instanceof Error && error.message.includes('429')) {
        retryCount++;
        if (retryCount < maxRetries) {
          // Exponential backoff: wait 2^retryCount seconds
          const waitTime = Math.pow(2, retryCount) * 1000;
          console.log(`Rate limit hit, waiting ${waitTime}ms before retry ${retryCount + 1}/${maxRetries}`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        } else {
          console.error('Max retries reached for rate limit');
          throw new Error('Rate limit exceeded after multiple retries. Please try again later.');
        }
      }
      
      // For non-429 errors, don't retry
      throw error;
    }
  }
  
  // Provide a simple fallback if all retries fail
  return 'Thank you for your email. I appreciate the information you provided and will review it carefully. I\'ll get back to you with any additional questions or next steps.\n\nBest regards';
}

 