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
    const personalityProfiles = getPersonalityDataForPrompt();
    const flexibleProfiles = loadCsvData('personality_profiles');
    
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
 * Generate a comprehensive email response using all available intelligence
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

    // Create comprehensive system prompt with ALL available intelligence
    const systemPrompt = `You are an intelligent email assistant with access to comprehensive contact intelligence and sales psychology. Write natural, human-like responses that leverage ALL available data to craft the most effective response.

CONTEXT FROM THEIR EMAIL:
${contextSummary.summary}

WHAT THEY ALREADY TOLD YOU:
${contextSummary.keyPoints.join('\n')}

${personalityData.contactContext ? `CONTACT CONTEXT:
Name: ${personalityData.contactContext.name}
Company: ${personalityData.contactContext.company || 'Not specified'}
Position: ${personalityData.contactContext.position || 'Not specified'}
Personality Type: ${personalityData.contactContext.personalityType || 'Not analyzed'}
Last Interaction: ${personalityData.contactContext.lastInteraction || 'Not available'}
Notes: ${personalityData.contactContext.notes || 'No notes available'}

${personalityData.contactContext.personalityAnalysis ? `PERSONALITY ANALYSIS:
${JSON.stringify(personalityData.contactContext.personalityAnalysis, null, 2)}` : ''}

${personalityData.contactContext.personalityNotes ? `PERSONALITY NOTES:
${personalityData.contactContext.personalityNotes}` : ''}` : ''}

${personalityData.aiProfilerData ? `AI PROFILER DATA:
Personality Type: ${(personalityData.aiProfilerData as any)?.Personality_Type || 'Not specified'}
Traits: ${(personalityData.aiProfilerData as any)?.Traits || 'Not specified'}
Sales Strategy: ${(personalityData.aiProfilerData as any)?.Sales_Strategy || 'Not specified'}
Messaging Do: ${(personalityData.aiProfilerData as any)?.Messaging_Do || 'Not specified'}
Messaging Don't: ${(personalityData.aiProfilerData as any)?.Messaging_Dont || 'Not specified'}
Emotional Trigger: ${(personalityData.aiProfilerData as any)?.Emotional_Trigger || 'Not specified'}
Tone Preference: ${(personalityData.aiProfilerData as any)?.Tone_Preference || 'Not specified'}
Best CTA Type: ${(personalityData.aiProfilerData as any)?.Best_CTA_Type || 'Not specified'}
Trigger Keywords: ${(personalityData.aiProfilerData as any)?.Trigger_Signal_Keywords || 'Not specified'}
Avoid Words: ${(personalityData.aiProfilerData as any)?.Avoid_Words || 'Not specified'}
Lead Score: ${(personalityData.aiProfilerData as any)?.Lead_Score || 'Not specified'}
Conversion Likelihood: ${(personalityData.aiProfilerData as any)?.Conversion_Likelihood || 'Not specified'}` : ''}

${personalityData.salesTactics && personalityData.salesTactics.length > 0 ? `RELEVANT SALES TACTICS:
${personalityData.salesTactics.map((tactic: any, index: number) => 
  `${index + 1}. ${tactic.category}: "${tactic.tactical_snippet}" (Expert: ${tactic.expert})`
).join('\n')}` : ''}

${personalityData.analysisHistory && personalityData.analysisHistory.length > 0 ? `ANALYSIS HISTORY:
${personalityData.analysisHistory.map((history: any, index: number) => 
  `${index + 1}. ${history.created_at}: ${history.analysis_summary || 'No summary'}`
).join('\n')}` : ''}

${personalityData.personalityProfiles ? `PERSONALITY PROFILES REFERENCE:
${personalityData.personalityProfiles}` : ''}

COMPREHENSIVE RESPONSE STRATEGY:
- Acknowledge their information naturally without repeating it
- Don't ask for details they already provided
- Focus on what you actually need from them
- Match their tone and urgency level based on personality insights
- Use AI profiler data to tailor communication style perfectly
- Incorporate relevant sales tactics naturally and subtly
- Leverage personality profiles to optimize persuasion approach
- Consider their communication preferences and interaction history
- Apply psychological triggers appropriate to their personality type
- Use language patterns that resonate with their cognitive style
- Sound like a real person, not a template or robot

TONE: ${tone}
${customInstructions ? `ADDITIONAL NOTES: ${customInstructions}` : ''}

Write a natural, conversational response that leverages ALL available intelligence for maximum effectiveness. Be strategic but authentic, persuasive but genuine.`;

    const userPrompt = `Please respond to this email using all available intelligence:

"${originalEmail}"

Craft a response that demonstrates deep understanding of who they are, what they need, and how to communicate with them most effectively. Use everything you know about their personality, preferences, and psychology to create the perfect response.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 600
    });

    return response.choices[0]?.message?.content || 'Unable to generate response. Please try again.';
  } catch (error) {
    console.error('Error generating comprehensive response:', error);
    return 'Thank you for your email. I appreciate the information you provided and will review it carefully. I\'ll get back to you with any additional questions or next steps.\n\nBest regards';
  }
}

 