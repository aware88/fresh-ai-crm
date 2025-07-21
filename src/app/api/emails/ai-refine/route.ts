import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const {
      emailId,
      originalEmail,
      currentSubject,
      currentBody,
      refinementCommand,
      draftContext
    } = await request.json();

    if (!refinementCommand || !currentBody) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: refinementCommand and currentBody'
      }, { status: 400 });
    }

    // Create the refinement prompt
    const systemPrompt = `You are an expert email refinement assistant. Your job is to modify email drafts based on natural language instructions from the user.

CAPABILITIES:
- Change tone (formal/informal/friendly/urgent/apologetic)  
- Fix links and URLs
- Modify content (make shorter/longer/clearer)
- Adjust language style
- Fix technical details
- Change approach/strategy

IMPORTANT RULES:
1. Only modify what the user specifically requests
2. Preserve the email's core meaning and purpose
3. Maintain professional quality
4. If changing links, ensure they are valid
5. Keep the same email structure unless asked to change it
6. Respond with refined content only, not explanations

Original email context: "${originalEmail.subject}" from ${originalEmail.from}
Current tone: ${draftContext?.tone || 'professional'}`;

    const userPrompt = `Please refine this email draft based on this instruction: "${refinementCommand}"

CURRENT SUBJECT: ${currentSubject}

CURRENT BODY:
${currentBody}

Return the refined version in this exact JSON format:
{
  "subject": "refined subject line",
  "body": "refined email body",
  "primaryChange": "subject" or "body" (which was primarily modified),
  "message": "Brief description of what was changed"
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 1500
    });

    const result = completion.choices[0]?.message?.content;
    if (!result) {
      throw new Error('No response from AI');
    }

    // Parse the JSON response
    let refinedDraft;
    try {
      refinedDraft = JSON.parse(result);
    } catch (parseError) {
      // Fallback parsing if JSON is malformed
      console.error('JSON parsing failed, using fallback:', parseError);
      return NextResponse.json({
        success: false,
        error: 'AI response format error'
      }, { status: 500 });
    }

    // Validate the response structure
    if (!refinedDraft.subject || !refinedDraft.body) {
      throw new Error('Invalid AI response structure');
    }

    // Store refinement for learning (optional)
    try {
      const supabase = createClientComponentClient();
      await supabase.from('email_refinements').insert({
        email_id: emailId,
        original_subject: currentSubject,
        original_body: currentBody,
        refined_subject: refinedDraft.subject,
        refined_body: refinedDraft.body,
        refinement_command: refinementCommand,
        success: true,
        created_at: new Date().toISOString()
      });
    } catch (dbError) {
      console.error('Failed to store refinement for learning:', dbError);
      // Don't fail the request if learning storage fails
    }

    return NextResponse.json({
      success: true,
      subject: refinedDraft.subject,
      body: refinedDraft.body,
      primaryChange: refinedDraft.primaryChange || 'body',
      message: refinedDraft.message || 'Draft has been refined based on your request'
    });

  } catch (error) {
    console.error('Error refining draft:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to refine draft'
    }, { status: 500 });
  }
} 