import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '../../../../lib/supabase/server';
import { getUID } from '../../../../lib/auth/utils';
import OpenAI from 'openai';
import { EmailContextAnalyzer } from '../../../../lib/email/context-analyzer';
import { getPersonalityDataForPrompt } from '../../../../lib/personality/data';
import { loadCsvData } from '../../../../lib/personality/flexible-data';
import { getMatchingSalesTactics } from '../../../../lib/ai/sales-tactics';

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

    // Parse request body
    const body = await request.json();
    const { originalEmail, tone = 'professional', customInstructions = '', senderEmail = '', contactId = '' } = body;

    if (!originalEmail) {
      return NextResponse.json({ error: 'Original email content is required' }, { status: 400 });
    }

    // Extract enhanced context from original email
    const emailContext = EmailContextAnalyzer.analyzeEmail(originalEmail);
    const contextSummary = EmailContextAnalyzer.generateContextSummary(emailContext);

    // Get personality profiles and contact context
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
    let salesTactics: any[] = [];
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
  
  // Core personality type
  if (aiProfilerData.Personality_Type) {
    traits.push(aiProfilerData.Personality_Type);
  }
  
  // Communication style
  if (aiProfilerData.Tone_Preference) {
    traits.push(`prefers ${aiProfilerData.Tone_Preference.toLowerCase()} tone`);
  }
  
  // Key behavioral traits (extract most important)
  if (aiProfilerData.Reading_Style) {
    traits.push(`${aiProfilerData.Reading_Style.toLowerCase()} reader`);
  }
  
  if (aiProfilerData.Stress_Response) {
    traits.push(`under pressure: ${aiProfilerData.Stress_Response.toLowerCase()}`);
  }
  
  return traits.slice(0, 3).join(', '); // Max 3 key traits
}

/**
 * Extract actionable sales tactics (not full descriptions)
 */
function extractSalesTactics(salesTactics: any[], aiProfilerData: any): string {
  if (!salesTactics || salesTactics.length === 0) return '';
  
  const tactics: string[] = [];
  
  // Get top 2 most relevant tactics
  const topTactics = salesTactics.slice(0, 2);
  
  for (const tactic of topTactics) {
    if (tactic.tactical_snippet) {
      // Extract key action from tactical snippet (first sentence or key phrase)
      const keyAction = tactic.tactical_snippet.split('.')[0].trim();
      if (keyAction.length > 10 && keyAction.length < 100) {
        tactics.push(keyAction);
      }
    }
  }
  
  // Add AI profiler specific tactics
  if (aiProfilerData) {
    if (aiProfilerData.Messaging_Do) {
      const doAction = aiProfilerData.Messaging_Do.split('.')[0].trim();
      if (doAction.length > 10 && doAction.length < 80) {
        tactics.push(`DO: ${doAction}`);
      }
    }
  }
  
  return tactics.slice(0, 3).join(' | '); // Max 3 tactics
}

/**
 * Extract relevant conversation context from history
 */
function extractConversationContext(analysisHistory: any[]): string {
  if (!analysisHistory || analysisHistory.length === 0) return '';
  
  const context: string[] = [];
  
  // Look at last 2-3 interactions for key context
  const recentHistory = analysisHistory.slice(0, 3);
  
  for (const entry of recentHistory) {
    if (entry.analysis_result) {
      // Extract key facts from previous analysis
      const analysis = entry.analysis_result;
      
      // Look for key information patterns
      if (typeof analysis === 'string') {
        // Extract dates mentioned
        const dateMatch = analysis.match(/\b(?:by|before|after|on|in)\s+(?:january|february|march|april|may|june|july|august|september|october|november|december|\d{1,2}\/\d{1,2})/i);
        if (dateMatch) {
          context.push(`timeline: ${dateMatch[0]}`);
        }
        
        // Extract status updates
        const statusMatch = analysis.match(/\b(?:approved|confirmed|completed|delivered|shipped|ready)\b/i);
        if (statusMatch) {
          context.push(`status: ${statusMatch[0]}`);
        }
        
        // Extract quantities/amounts
        const quantityMatch = analysis.match(/\b\d+\s*(?:tons?|kg|pieces?|units?|lots?)\b/i);
        if (quantityMatch) {
          context.push(`quantity: ${quantityMatch[0]}`);
        }
      }
    }
    
    // Limit context to avoid token bloat
    if (context.length >= 3) break;
  }
  
  return context.slice(0, 3).join(', ');
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
  try {
    const openai = createOpenAIClient();

    // CREATE SMART INTELLIGENCE SUMMARY (NEW OPTIMIZATION!)
    const intelligenceSummary = createIntelligenceSummary(personalityData, contextSummary);

    // Build OPTIMIZED system prompt using smart summaries
    let systemPrompt = `You are an intelligent email assistant. Write natural, human-like responses that avoid repetition.

CONTEXT: ${contextSummary.summary}
THEY PROVIDED: ${contextSummary.keyPoints.slice(0, 3).join(', ')}`;

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
      systemPrompt += `\nSALES_APPROACH: ${intelligenceSummary.keyTactics}`;
    }

    // Add conversation context (relevant history)
    if (intelligenceSummary.conversationContext) {
      systemPrompt += `\nHISTORY: ${intelligenceSummary.conversationContext}`;
    }

    // Add what to avoid repeating (critical for personalization)
    if (intelligenceSummary.avoidRepeating) {
      systemPrompt += `\nAVOID_REPEATING: ${intelligenceSummary.avoidRepeating}`;
    }

    systemPrompt += `\n\nRULES:
- Don't repeat what they told you
- Don't ask for info they provided
- Match their ${tone} tone
- Be human, not robotic
- Keep response under 150 words
- Use the personality and sales approach above
- Reference conversation history appropriately
${customInstructions ? `\nNOTES: ${customInstructions.substring(0, 100)}` : ''}`;

    // Truncate original email to prevent token overflow
    const truncatedEmail = originalEmail.length > 1000 
      ? originalEmail.substring(0, 1000) + '...[truncated]'
      : originalEmail;

    // Log token usage for debugging
    console.log('OPTIMIZED System prompt length:', systemPrompt.length);
    console.log('User prompt length:', truncatedEmail.length);
    console.log('Intelligence Summary:', intelligenceSummary);
    
    // Log the optimization impact
    console.log('🚀 OPTIMIZATION IMPACT:');
    console.log(`📊 Contact Data: ${personalityData.contactContext ? 'Available' : 'None'}`);
    console.log(`🧠 AI Profiler: ${personalityData.aiProfilerData ? 'Available' : 'None'}`);
    console.log(`🎯 Sales Tactics: ${personalityData.salesTactics?.length || 0} tactics`);
    console.log(`📚 History: ${personalityData.analysisHistory?.length || 0} entries`);
    console.log(`✨ Smart Summary Generated: ${Object.keys(intelligenceSummary).filter(k => intelligenceSummary[k as keyof typeof intelligenceSummary]).length}/5 fields`);
    
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
      console.log('OPTIMIZED Token usage:', response.usage);
    }

    return response.choices[0]?.message?.content || 'Unable to generate response. Please try again.';
  } catch (error) {
    console.error('Error generating response:', error);
    // Provide a simple fallback if OpenAI fails
    return 'Thank you for your email. I appreciate the information you provided and will review it carefully. I\'ll get back to you with any additional questions or next steps.\n\nBest regards';
  }
}

 