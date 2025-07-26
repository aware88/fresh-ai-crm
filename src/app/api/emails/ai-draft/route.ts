import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createServerClient } from '../../../../lib/supabase/server';
import { getOpenAIClient } from '../../../../lib/openai/client';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { emailId, originalEmail, settings } = await req.json();

    if (!emailId || !originalEmail) {
      return NextResponse.json(
        { success: false, message: 'Email ID and original email are required' },
        { status: 400 }
      );
    }

    // Get Supabase client
    const supabase = await createServerClient();

    // Get email context and history
    const { data: emailData, error: emailError } = await supabase
      .from('emails')
      .select('*')
      .eq('id', emailId)
      .eq('created_by', userId)
      .single();

    // Handle virtual emails (like sales context emails that don't exist in database)
    let contextEmailData = emailData;
    if (emailError || !emailData) {
      // Check if this is a virtual email ID (starts with 'sales-', 'analysis-', etc.)
      if (emailId.startsWith('sales-') || emailId.startsWith('analysis-') || emailId.startsWith('virtual-')) {
        // Create virtual email data from the originalEmail
        contextEmailData = {
          id: emailId,
          subject: originalEmail.subject,
          raw_content: originalEmail.body,
          from_email: originalEmail.from,
          to_email: originalEmail.to,
          analysis: null,
          metadata: { virtual: true, context: 'sales_agent' },
          created_at: new Date().toISOString(),
          created_by: userId
        };
      } else {
        // Real email ID but not found in database
        return NextResponse.json(
          { success: false, message: 'Email not found' },
          { status: 404 }
        );
      }
    }

    // Get previous email drafts for learning context
    const { data: previousDrafts } = await supabase
      .from('ai_email_drafts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    // Get user's writing style from previous sent emails
    const { data: userEmails } = await supabase
      .from('emails')
      .select('raw_content, subject')
      .eq('created_by', userId)
      .eq('email_type', 'sent')
      .order('created_at', { ascending: false })
      .limit(10);

    // Generate AI draft
    const openai = getOpenAIClient();
    const draftId = uuidv4();
    
    const systemPrompt = buildSystemPrompt(settings, userEmails, previousDrafts);
    const userPrompt = buildUserPrompt(originalEmail, contextEmailData, settings);

    const response = await openai.chat.completions.create({
      model: settings?.model || 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: settings?.temperature || 0.7,
      max_tokens: settings?.maxTokens || 1000,
      response_format: { type: 'json_object' }
    });

    const aiResponse = response.choices[0]?.message?.content;
    if (!aiResponse) {
      throw new Error('No response from AI');
    }

    // Parse the AI response
    const parsedResponse = JSON.parse(aiResponse);
    
    // Save the draft to database with version control
    const isVirtualEmail = emailId.startsWith('sales-') || emailId.startsWith('analysis-') || emailId.startsWith('virtual-');
    
    if (!isVirtualEmail) {
      // Get the current version number for this email
      const { data: existingDrafts, error: countError } = await supabase
        .from('ai_email_drafts')
        .select('id')
        .eq('email_id', emailId)
        .eq('user_id', userId);
      
      const versionNumber = (existingDrafts?.length || 0) + 1;
      
      // Only save to database if it's a real email ID that exists in emails table
      const { error: saveError } = await supabase
        .from('ai_email_drafts')
        .insert({
          id: draftId,
          user_id: userId,
          email_id: emailId,
          original_email: originalEmail,
          draft_subject: parsedResponse.subject,
          draft_body: parsedResponse.body,
          ai_settings: settings,
          confidence_score: parsedResponse.confidence || 0.8,
          tone: parsedResponse.tone || settings?.responseStyle || 'professional',
          version_number: versionNumber,
          context_used: {
            userEmails: userEmails?.length || 0,
            previousDrafts: previousDrafts?.length || 0,
            emailContext: contextEmailData.analysis || {},
            versionInfo: `Draft v${versionNumber} - Generated ${new Date().toISOString()}`
          },
          created_at: new Date().toISOString()
        });

      if (saveError) {
        console.error('Error saving AI draft:', saveError);
        // Continue anyway, don't fail the request
      } else {
        console.log(`💾 Saved draft v${versionNumber} for email ${emailId}`);
      }
    }

    return NextResponse.json({
      success: true,
      id: draftId,
      subject: parsedResponse.subject,
      body: parsedResponse.body,
      tone: parsedResponse.tone || settings?.responseStyle || 'professional',
      confidence: parsedResponse.confidence || 0.8,
      context: parsedResponse.context || ''
    });

  } catch (error) {
    console.error('Error generating AI draft:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Server error' 
      },
      { status: 500 }
    );
  }
}

function buildSystemPrompt(settings: any, userEmails: any[], previousDrafts: any[]): string {
  const userStyle = analyzeUserWritingStyle(userEmails);
  const learningContext = analyzePreviousDrafts(previousDrafts);
  const hasSalesContext = settings?.salesContext;
  
  let systemPrompt = `You are an AI email assistant that helps users write professional email replies. 

CRITICAL: Always respond in the exact same language as the original email. If the email is in Slovenian, respond in Slovenian. If German, respond in German. If Italian, respond in Italian. Match the language perfectly. 

IMPORTANT: Your response must be a valid JSON object with the following structure:
{
  "subject": "Reply subject line",
  "body": "Email body content",
  "tone": "professional|friendly|formal|casual",
  "confidence": 0.8,
  "context": "Brief explanation of approach"
}

USER PREFERENCES:
- Style: ${settings?.responseStyle || 'professional'}
- Length: ${settings?.responseLength || 'detailed'}
- Include context: ${settings?.includeContext ? 'Yes' : 'No'}

USER WRITING STYLE ANALYSIS:
${userStyle}

LEARNING FROM PREVIOUS DRAFTS:
${learningContext}`;

  // Add sales-specific instructions if this is a sales context
  if (hasSalesContext) {
    systemPrompt += `

SALES CONTEXT ACTIVE:
You are now operating in SALES MODE. This means:

1. RELATIONSHIP BUILDING: Focus on building trust and rapport first
2. VALUE PROPOSITION: Clearly articulate how you can solve their problems
3. CONSULTATIVE APPROACH: Ask questions to understand their needs better
4. SOFT SELLING: Be helpful and informative, not pushy or aggressive
5. PERSONALIZATION: Reference specific details from the sales analysis
6. NEXT STEPS: Always include a clear, low-pressure call to action
7. TIMING: Respect their timeline and decision-making process
8. SOCIAL PROOF: Subtly mention relevant success stories if appropriate

SALES TACTICS TO USE:
- Mirror their communication style (formal/informal)
- Address pain points directly but tactfully
- Use scarcity or urgency only if genuinely applicable
- Offer multiple options to give them control
- Build credibility through expertise demonstration`;
  }

  systemPrompt += `

GUIDELINES:
1. Match the user's typical writing style and tone
2. Be concise but comprehensive
3. Maintain professional courtesy
4. Address all points raised in the original email
5. Include appropriate greeting and closing
6. Use natural, conversational language
7. Avoid overly formal or robotic language
8. Consider cultural context if apparent from the email

Generate a response that the user would likely write themselves, incorporating their style preferences and past patterns.`;

  return systemPrompt;
}

function buildUserPrompt(originalEmail: any, emailData: any, settings?: any): string {
  const hasSalesContext = settings?.salesContext;
  
  let prompt = `Please generate a reply to this email:

FROM: ${originalEmail.from}
TO: ${originalEmail.to}
SUBJECT: ${originalEmail.subject}

EMAIL CONTENT:
${originalEmail.body}

ADDITIONAL CONTEXT:
- Email analysis: ${emailData.analysis || 'No analysis available'}
- Email metadata: ${JSON.stringify(emailData.metadata || {})}`;

  // Add sales context if available
  if (hasSalesContext) {
    const salesData = settings.salesContext;
    prompt += `

SALES ANALYSIS CONTEXT:
- Lead Score: ${salesData.analysis?.lead_qualification?.score || 'Unknown'}/100
- Lead Level: ${salesData.analysis?.lead_qualification?.level || 'Unknown'}
- Opportunity Value: ${salesData.analysis?.opportunity_assessment?.potential_value || 'Unknown'}
- Timeline: ${salesData.analysis?.opportunity_assessment?.timeline || 'Unknown'}
- Pain Points: ${salesData.analysis?.sales_insights?.pain_points?.join(', ') || 'None identified'}
- Buying Signals: ${salesData.analysis?.sales_insights?.buying_signals?.join(', ') || 'None identified'}

SALES INSTRUCTIONS:
- Craft a response that addresses their specific pain points
- Use the appropriate level of formality for a ${salesData.analysis?.lead_qualification?.level || 'standard'} lead
- Include subtle sales tactics based on their buying signals
- Match the urgency to their timeline: ${salesData.analysis?.opportunity_assessment?.timeline || 'standard'}
- Be consultative rather than pushy - build trust and provide value`;
  }

  prompt += `

Generate an appropriate reply that addresses the sender's needs while maintaining a professional and helpful tone.`;

  return prompt;
}

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

function analyzePreviousDrafts(previousDrafts: any[]): string {
  if (!previousDrafts || previousDrafts.length === 0) {
    return 'No previous drafts available for learning.';
  }

  return `Analyzed ${previousDrafts.length} previous drafts. User tends to prefer ${previousDrafts[0]?.tone || 'professional'} tone. Learn from any patterns in user modifications.`;
} 