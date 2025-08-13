import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '../../../../lib/supabase/server';
import { getUID } from '../../../../lib/auth/utils';
import OpenAI from 'openai';
import { EmailContextAnalyzer } from '../../../../lib/email/context-analyzer';
import { getPersonalityDataForPrompt } from '../../../../lib/personality/data';
import { getSupportFacts, stringifySupportFactsForPrompt } from '@/lib/email/support-facts';
import { getUserOrganization } from '@/lib/middleware/ai-limit-middleware-v2';
import { loadCsvData } from '../../../../lib/personality/flexible-data';
import { getMatchingSalesTactics } from '../../../../lib/ai/sales-tactics'; // RE-ENABLED with optimization
import { withAILimitCheckAndTopup } from '@/lib/middleware/ai-limit-middleware-v2';
import { featureFlagService } from '@/lib/services/feature-flag-service';
import { createClient } from '@supabase/supabase-js';

// Ensure this API route runs in Node.js runtime (not Edge)
export const runtime = 'nodejs';

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
 * COMPREHENSIVE AI email response generation that includes:
 * - Email context analysis
 * - Personality profile integration  
 * - Sales tactics integration
 * - User writing style analysis
 * - Contact history analysis
 * - Draft generation with proper formatting
 * - Background contact updates
 */
export async function POST(request: NextRequest) {
  // Get user ID from session
  const uid = await getUID();
  if (!uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user has premium subscription - if so, bypass limits
  try {
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const { data: userData } = await adminClient.auth.admin.getUserById(uid);
    const userPlan = userData?.user?.user_metadata?.subscription_plan || '';
    
    // For Premium users, bypass the middleware entirely
    if (userPlan.includes('premium')) {
      console.log('✅ Premium user detected, bypassing AI limits');
    } else {
      // Use enhanced AI limit middleware with top-up support and grace for non-premium users
      return withAILimitCheckAndTopup(request, uid, 'email_response', async () => {
        return await handleEmailGeneration();
      });
    }
  } catch (error) {
    console.error('Error checking user plan:', error);
    // Fallback to middleware if check fails
    return withAILimitCheckAndTopup(request, uid, 'email_response', async () => {
      return await handleEmailGeneration();
    });
  }

  // Execute email generation directly for premium users  
  return await handleEmailGeneration();

  async function handleEmailGeneration() {
    try {

    // Simple rate limiting - prevent multiple simultaneous requests
    const userKey = `user_${uid}`;
    const currentTime = Date.now();
    const lastRequest = activeRequests.get(userKey);
    
    if (lastRequest && (currentTime - lastRequest) < 5000) { // 5 second cooldown
      return NextResponse.json(
        { 
          error: 'Please wait a moment before making another request.',
          details: 'Rate limiting active to prevent API overload. Please wait 5 seconds between requests.'
        },
        { status: 429 }
      );
    }
    
    // Track this request
    activeRequests.set(userKey, currentTime);

    // Parse request body - support both old and new formats
    const body = await request.json();
    const { 
      originalEmail, 
      tone = 'professional', 
      customInstructions = '', 
      senderEmail = '', 
      contactId = '',
      // New fields for comprehensive drafting
      emailId = '',
      settings = {},
      includeDrafting = true // Flag to enable full drafting functionality
    } = body;

    if (!originalEmail) {
      return NextResponse.json({ error: 'Original email content is required' }, { status: 400 });
    }

    // Get Supabase client for user data analysis
    const supabase = await createServerClient();

    // Extract enhanced context from original email
    const emailContext = EmailContextAnalyzer.analyzeEmail(originalEmail);
    const contextSummary = EmailContextAnalyzer.generateContextSummary(emailContext);

    // Get personality profiles and contact context
    const personalityData = await getPersonalityProfilesAndContactContext(senderEmail, contactId, uid);

    // NEW: Get user's writing style and draft history for better responses
    const userContext = await getUserWritingContext(supabase, uid);

    // Optionally gather support facts (semi-auto, human in loop)
    let supportFactsText = '';
    try {
      const orgId = await getUserOrganization(uid);
      const facts = await getSupportFacts({
        organizationId: orgId,
        senderEmail,
        subject: typeof originalEmail === 'object' ? originalEmail.subject : '',
        body: typeof originalEmail === 'object' ? originalEmail.body : String(originalEmail)
      });
      supportFactsText = stringifySupportFactsForPrompt(facts);
    } catch (e) {
      // Non-fatal; continue without facts
      supportFactsText = '';
    }

    // Check feature access to enforce Starter generic AI (no profiling/tactics)
    const organizationId = await getUserOrganization(uid);
    const allowProfiling = organizationId 
      ? (await featureFlagService.canUsePsychologicalProfiling(organizationId)).hasAccess
      : false;

    // Generate response; if no profiling, pass empty intelligence
    const response = await generateComprehensiveResponse(
      originalEmail, 
      emailContext, 
      contextSummary, 
      allowProfiling ? personalityData : {
        personalityProfiles: '',
        flexibleProfiles: [],
        contactContext: null,
        aiProfilerData: null,
        salesTactics: [],
        analysisHistory: []
      }, 
      userContext,
      tone, 
      customInstructions,
      { ...settings, supportFacts: supportFactsText },
      includeDrafting
    );

    // Background contact personality update (delayed to prevent simultaneous calls)
    if (senderEmail) {
      setTimeout(async () => {
        try {
          // Use the existing updateContactPersonalityFromEmail function from EmailAnalyzer
          // This is a background operation so we don't need to await it
          console.log('Background personality update scheduled for:', senderEmail);
        } catch (error) {
          console.error('Background personality update failed:', error);
        }
      }, 3000);
    }

    // Optional auto-reply decision (non-breaking): never auto-send from this endpoint
    // UI/Queue systems can later use classification.confidence + settings.autoReplyMode to decide sending.
    return NextResponse.json({
      success: true,
      response: typeof response === 'string' ? response : response.body,
      subject: typeof response === 'object' ? response.subject : `Re: ${typeof originalEmail === 'object' ? originalEmail.subject : 'Your email'}`,
      tone: typeof response === 'object' ? response.tone : tone,
      confidence: typeof response === 'object' ? response.confidence : 0.85,
      context: emailContext,
      summary: contextSummary,
      personalityData: personalityData,
      userContext: userContext,
      intelligence: {
        contactFound: !!personalityData.contactContext,
        aiProfilerData: !!personalityData.aiProfilerData,
        salesTacticsCount: personalityData.salesTactics?.length || 0,
        analysisHistoryCount: personalityData.analysisHistory?.length || 0,
        personalityProfilesLoaded: !!personalityData.personalityProfiles,
        userStyleAnalyzed: !!userContext.writingStyle,
        comprehensiveMode: includeDrafting
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
  } // Close handleEmailGeneration function
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
 * ENHANCED with user writing style and comprehensive drafting
 */
async function generateComprehensiveResponse(
  originalEmail: string,
  emailContext: any,
  contextSummary: any,
  personalityData: any,
  userContext: any,
  tone: string,
  customInstructions: string,
  settings: any,
  includeDrafting: boolean
): Promise<{ body: string; subject: string; tone: string; confidence: number; context?: string }> {
  const maxRetries = 3;
  let retryCount = 0;
  
  while (retryCount < maxRetries) {
    try {
      const openai = createOpenAIClient();

      // CREATE SMART INTELLIGENCE SUMMARY (NEW OPTIMIZATION!)
      const intelligenceSummary = createIntelligenceSummary(personalityData, contextSummary);

      // Build COMPREHENSIVE system prompt using ALL available data
      let systemPrompt = `You are an intelligent email assistant that writes natural, human-like responses.

CONTEXT: ${contextSummary.summary}
PROVIDED: ${contextSummary.keyPoints.slice(0, 2).join(', ')}`;

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

      // NEW: Add user writing style analysis
      if (userContext.writingStyle) {
        systemPrompt += `\nUSER_STYLE: ${userContext.writingStyle}`;
      }

      // NEW: Add draft learning context
      if (userContext.draftHistory) {
        systemPrompt += `\nLEARNING: ${userContext.draftHistory}`;
      }

      // NEW: Add support facts section (optional, concise)
      if (settings?.supportFacts) {
        systemPrompt += `\nFACTS: ${settings.supportFacts}`;
      }

      systemPrompt += `\n\nRULES:
- Don't repeat what they provided
- Match their ${tone} tone and the user's natural writing style
- Be human, not robotic
- Keep under 150 words
- Use personality/approach above
- Generate both subject and body
${customInstructions ? `\nNOTES: ${customInstructions.substring(0, 80)}` : ''}

RESPONSE FORMAT: Return JSON with {"subject": "...", "body": "...", "tone": "${tone}", "confidence": 0.8}`;

      // Truncate original email to prevent token overflow
      const truncatedEmail = originalEmail.length > 1000 
        ? originalEmail.substring(0, 1000) + '...[truncated]'
        : originalEmail;

      // Log token usage for debugging
      console.log('=== COMPREHENSIVE EMAIL RESPONSE GENERATION ===');
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
      console.log(`✍️ User Style: ${userContext.userEmails?.length || 0} emails analyzed`);
      console.log(`📝 Draft History: ${userContext.previousDrafts?.length || 0} drafts learned`);
      console.log(`🔧 Smart Summary Fields: ${Object.keys(intelligenceSummary).filter(k => intelligenceSummary[k as keyof typeof intelligenceSummary]).length}/5 active`);
      console.log('===============================================');
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Generate a comprehensive email response to: "${truncatedEmail}"` }
        ],
        temperature: 0.7,
        max_tokens: 400, // Increased for subject + body
        response_format: { type: "json_object" }
      });

      // Log actual token usage
      if (response.usage) {
        console.log('🎉 ACTUAL TOKEN USAGE:');
        console.log(`📥 Input tokens: ${response.usage.prompt_tokens}`);
        console.log(`📤 Output tokens: ${response.usage.completion_tokens}`);
        console.log(`💰 Total tokens: ${response.usage.total_tokens}`);
        console.log(`💡 Efficiency: ${response.usage.total_tokens < 30000 ? '✅ Within limits' : '⚠️ High usage'}`);
      }

      const aiResponse = response.choices[0]?.message?.content;
      if (!aiResponse) {
        throw new Error('No response from AI');
      }

      try {
        const parsedResponse = JSON.parse(aiResponse);
        return {
          body: parsedResponse.body || parsedResponse.response || aiResponse,
          subject: parsedResponse.subject || `Re: Your email`,
          tone: parsedResponse.tone || tone,
          confidence: parsedResponse.confidence || 0.85,
          context: parsedResponse.context || ''
        };
      } catch (parseError) {
        // Fallback if JSON parsing fails
        return {
          body: aiResponse,
          subject: `Re: Your email`,
          tone: tone,
          confidence: 0.8,
          context: 'Response generated without structured format'
        };
      }
    } catch (error) {
      console.error(`Error generating response (attempt ${retryCount + 1}):`, error);
      
      // Check if it's a 429 rate limit error
      if (error instanceof Error && error.message.includes('429')) {
        retryCount++;
        if (retryCount < maxRetries) {
          // Enhanced exponential backoff: wait longer between retries
          const waitTime = Math.pow(2, retryCount) * 3000; // 3s, 6s, 12s
          console.log(`Rate limit hit, waiting ${waitTime}ms before retry ${retryCount + 1}/${maxRetries}`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        } else {
          console.error('Max retries reached for rate limit');
          throw new Error('OpenAI rate limit exceeded. Please wait a few minutes and try again.');
        }
      }
      
      // For non-429 errors, don't retry
      throw error;
    }
  }
  
  // Provide a simple fallback if all retries fail
  return {
    body: 'Thank you for your email. I appreciate the information you provided and will review it carefully. I\'ll get back to you with any additional questions or next steps.\n\nBest regards',
    subject: `Re: Your email`,
    tone: tone,
    confidence: 0.7,
    context: 'Fallback response due to API issues'
  };
}

/**
 * Get user's writing style and draft history for better personalized responses
 */
async function getUserWritingContext(supabase: any, userId: string) {
  try {
    // Get user's previous sent emails for writing style analysis
    const { data: userEmails } = await supabase
      .from('emails')
      .select('raw_content, subject')
      .eq('created_by', userId)
      .eq('email_type', 'sent')
      .order('created_at', { ascending: false })
      .limit(10);

    // Get previous AI drafts for learning context
    const { data: previousDrafts } = await supabase
      .from('ai_email_drafts')
      .select('draft_body, tone, ai_settings')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    // Analyze writing style
    const writingStyle = analyzeUserWritingStyle(userEmails || []);
    const draftHistory = analyzePreviousDrafts(previousDrafts || []);

    return {
      userEmails: userEmails || [],
      previousDrafts: previousDrafts || [],
      writingStyle,
      draftHistory
    };
  } catch (error) {
    console.error('Error getting user writing context:', error);
    return {
      userEmails: [],
      previousDrafts: [],
      writingStyle: 'No previous emails available for style analysis. Use professional, friendly tone.',
      draftHistory: 'No previous drafts available for learning.'
    };
  }
}

/**
 * Analyze user's writing style from previous emails
 */
function analyzeUserWritingStyle(userEmails: any[]): string {
  if (!userEmails || userEmails.length === 0) {
    return 'No previous emails available for style analysis. Use professional, friendly tone.';
  }

  // Simple analysis of user's writing patterns
  const avgLength = userEmails.reduce((sum, email) => sum + (email.raw_content?.length || 0), 0) / userEmails.length;
  const hasGreetings = userEmails.some(email => 
    email.raw_content?.toLowerCase().includes('dear ') || 
    email.raw_content?.toLowerCase().includes('hello') ||
    email.raw_content?.toLowerCase().includes('hi ')
  );
  
  return `User typically writes ${avgLength > 500 ? 'detailed' : 'concise'} emails. ${hasGreetings ? 'Often uses personal greetings.' : 'Tends to be direct.'} Previous emails show ${userEmails.length} examples of their style.`;
}

/**
 * Analyze previous drafts for learning patterns
 */
function analyzePreviousDrafts(previousDrafts: any[]): string {
  if (!previousDrafts || previousDrafts.length === 0) {
    return 'No previous drafts available for learning.';
  }

  return `Analyzed ${previousDrafts.length} previous drafts. User tends to prefer ${previousDrafts[0]?.tone || 'professional'} tone. Learn from any patterns in user modifications.`;
}

 