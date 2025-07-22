import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { analyzeSalesOpportunity } from '@/lib/openai/client';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { classifyEmail, getResponseStrategy, type EmailContext } from '@/lib/email/email-classifier';
import { createMetakockaClientForUser } from '@/lib/integrations/metakocka';
import { getLearnedPatterns } from '@/lib/learning/email-pattern-analyzer';
import OpenAI from 'openai';

// Lazy initialization to avoid build-time errors
const getOpenAIClient = () => {
  if (!process.env.OPENAI_API_KEY) {
    console.warn('OPENAI_API_KEY environment variable is missing. Using mock client.');
    return null;
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
};

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { emailId, emailContent: passedEmailContent } = await request.json();
    
    if (!emailId) {
      return NextResponse.json({ error: 'Email ID is required' }, { status: 400 });
    }

    // Get Supabase client
    const supabase = createServiceRoleClient();

    // Get user's email accounts (any provider type)
    const { data: accounts, error: accountsError } = await supabase
      .from('email_accounts')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('is_active', true);

    if (accountsError || !accounts || accounts.length === 0) {
      return NextResponse.json({ error: 'No email account found' }, { status: 404 });
    }

    // First, try to get the email from our database
    const { data: dbEmail, error: dbEmailError } = await supabase
      .from('emails')
      .select('*')
      .eq('id', emailId)
      .eq('user_id', session.user.id)
      .single();

    let subject = '';
    let from = '';
    let date = '';
    let body = '';

    if (passedEmailContent) {
      // Use email content passed from frontend (for IMAP emails)
      console.log('Using email content from frontend');
      subject = passedEmailContent.subject || '(No Subject)';
      from = passedEmailContent.from || 'Unknown Sender';
      date = passedEmailContent.date || new Date().toISOString();
      body = passedEmailContent.body || '';
    } else if (dbEmail && !dbEmailError) {
      // Use email from database
      console.log('Using email from database');
      subject = dbEmail.subject || '(No Subject)';
      from = dbEmail.from_address || dbEmail.sender || 'Unknown Sender';
      date = dbEmail.received_date || dbEmail.created_at;
      body = dbEmail.text_content || dbEmail.raw_content || dbEmail.content || '';
    } else {
      // Try to fetch from provider API based on account type
      const account = accounts[0];
      console.log(`Trying to fetch email from ${account.provider_type} provider`);
      
      if (account.provider_type === 'google' && account.access_token) {
        // Gmail API logic
        let accessToken = account.access_token;

        // Check if token is expired and refresh if needed
        if (account.token_expires_at) {
          const now = new Date();
          const tokenExpiry = new Date(account.token_expires_at);
          
          if (tokenExpiry <= now) {
            // Refresh token logic
            const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: new URLSearchParams({
                client_id: process.env.GOOGLE_CLIENT_ID!,
                client_secret: process.env.GOOGLE_CLIENT_SECRET!,
                refresh_token: account.refresh_token,
                grant_type: 'refresh_token',
              }),
            });

            if (refreshResponse.ok) {
              const tokenData = await refreshResponse.json();
              accessToken = tokenData.access_token;
              
              // Update the account with new token
              await supabase
                .from('email_accounts')
                .update({
                  access_token: tokenData.access_token,
                  token_expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
                })
                .eq('id', account.id);
            }
          }
        }

        // Fetch the specific email from Gmail API
        const messageResponse = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${emailId}`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Accept': 'application/json'
            }
          }
        );

        if (messageResponse.ok) {
          const messageData = await messageResponse.json();
          
          // Extract email details
          const headers = messageData.payload.headers;
          subject = headers.find((h: any) => h.name === 'Subject')?.value || '(No Subject)';
          from = headers.find((h: any) => h.name === 'From')?.value || 'Unknown Sender';
          date = headers.find((h: any) => h.name === 'Date')?.value;
          
          // Get email body
          if (messageData.payload.body && messageData.payload.body.data) {
            body = Buffer.from(messageData.payload.body.data, 'base64').toString('utf-8');
          } else if (messageData.payload.parts) {
            // Handle multipart messages
            const textPart = messageData.payload.parts.find((part: any) => 
              part.mimeType === 'text/plain' || part.mimeType === 'text/html'
            );
            if (textPart && textPart.body && textPart.body.data) {
              body = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
            }
          }
        }
      } else if (account.provider_type === 'imap') {
        // For IMAP accounts, email content should be passed from frontend
        console.log('IMAP account - email content should be provided by frontend');
        if (!body && !subject) {
          return NextResponse.json({ error: 'Email content not available. Please refresh your emails and try again.' }, { status: 404 });
        }
      }
    }

    if (!body && !subject) {
      return NextResponse.json({ error: 'Email content could not be retrieved' }, { status: 404 });
    }

    // Step 1: Classify the email
    const emailContext: EmailContext = {
      from,
      subject,
      body
    };

    // Check for existing customer in Metakocka
    const metakockaClient = await createMetakockaClientForUser(session.user.id);
    let customerContext = null;
    let orderContext = null;

    if (metakockaClient) {
      try {
        const customer = await metakockaClient.getCustomerByEmail(from);
        if (customer) {
          customerContext = customer;
          emailContext.customerHistory = {
            isExistingCustomer: true,
            previousOrders: customer.totalOrders,
            lastInteraction: customer.lastOrderDate
          };

          // For support/dispute emails, get recent orders
          const orders = await metakockaClient.getCustomerOrders(from, 5);
          orderContext = orders;
        }
      } catch (error) {
        console.error('Error fetching customer data from Metakocka:', error);
      }
    }

    const classification = await classifyEmail(emailContext);
    const responseStrategy = getResponseStrategy(classification);

    // Detect email language
    let detectedLanguage = 'en';
    try {
      const languageDetectionResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/ai/detect-language`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: `${subject}\n\n${body}` })
      });
      
      if (languageDetectionResponse.ok) {
        const langResult = await languageDetectionResponse.json();
        detectedLanguage = langResult.language || 'en';
        console.log('🌍 Detected email language:', detectedLanguage);
      }
    } catch (error) {
      console.error('Language detection failed:', error);
    }

    // Get learned patterns for this category
    const learnedPatterns = await getLearnedPatterns(session.user.id, classification.category);
    
    // Step 2: Generate comprehensive analysis and draft in one call
    const systemPrompt = `🌍 CRITICAL: EMAIL LANGUAGE DETECTED AS "${detectedLanguage.toUpperCase()}"
${detectedLanguage === 'sl' ? '🇸🇮 YOU MUST RESPOND ENTIRELY IN SLOVENIAN. Use "Pozdravljeni", "Hvala za vaš mail", "Lep pozdrav".' : 
  detectedLanguage === 'de' ? '🇩🇪 YOU MUST RESPOND ENTIRELY IN GERMAN.' :
  detectedLanguage === 'it' ? '🇮🇹 YOU MUST RESPOND ENTIRELY IN ITALIAN.' :
  '🇬🇧 Respond in the detected language.'}

You are an intelligent email assistant for Withcar, a car accessories company. Based on the email classification and context, provide both analysis and a ready-to-send draft response.

EMAIL CLASSIFICATION:
- Category: ${classification.category}
- Intent: ${classification.intent}
- Urgency: ${classification.urgency}
- Sentiment: ${classification.sentiment}
- Keywords: ${classification.keywords.join(', ')}

RESPONSE STRATEGY:
- Tone: ${responseStrategy.tone}
- Approach: ${responseStrategy.approach}
- Priority: ${responseStrategy.priority}

${learnedPatterns.length > 0 ? `LEARNED WITHCAR EMAIL PATTERNS:
Use these patterns to match the company's established communication style:

GREETINGS: ${learnedPatterns.filter(p => p.patternType === 'greeting').map(p => `"${p.patternText}" (${p.context})`).slice(0, 3).join(', ')}

CLOSINGS: ${learnedPatterns.filter(p => p.patternType === 'closing').map(p => `"${p.patternText}" (${p.context})`).slice(0, 3).join(', ')}

COMMON PHRASES: ${learnedPatterns.filter(p => p.patternType === 'phrase').map(p => `"${p.patternText}"`).slice(0, 5).join(', ')}

TONE PATTERNS: ${learnedPatterns.filter(p => p.patternType === 'tone').map(p => p.patternText).slice(0, 3).join(', ')}

IMPORTANT: Incorporate these learned patterns naturally into your response to maintain consistency with Withcar's established communication style.` : ''}

${customerContext ? `CUSTOMER CONTEXT:
- Name: ${customerContext.name}
- Total Orders: ${customerContext.totalOrders}
- Status: ${customerContext.status}
- Last Order: ${customerContext.lastOrderDate}` : ''}

${orderContext && orderContext.length > 0 ? `RECENT ORDERS:
${orderContext.map((order: any) => `- Order #${order.orderNumber}: ${order.items.map((item: any) => item.name).join(', ')} (${order.status})`).join('\n')}` : ''}

INSTRUCTIONS:
1. For disputes/support: Reference specific orders if available, be apologetic and solution-focused
2. For sales: Be enthusiastic, highlight value, provide product links
3. For general inquiries: Be helpful and professional
4. Always maintain Withcar's friendly but professional tone
5. Include relevant product links to https://withcar.eu/shop when appropriate

${detectedLanguage === 'sl' ? '🇸🇮 REMEMBER: Write the draft.body in SLOVENIAN language!' : 
  detectedLanguage !== 'en' ? `🌍 REMEMBER: Write the draft.body in ${detectedLanguage.toUpperCase()} language!` : ''}

IMPORTANT: Return ONLY valid JSON in this exact format (no additional text before or after):
{
  "analysis": {
    "lead_qualification": {
      "score": 1-10,
      "level": "hot/warm/cold",
      "reasoning": "detailed reasoning"
    },
    "opportunity_assessment": {
      "potential_value": "high/medium/low",
      "timeline": "immediate/short-term/long-term",
      "decision_maker": "status assessment",
      "budget_indicators": ["indicator1", "indicator2"]
    },
    "sales_insights": {
      "pain_points": ["point1", "point2"],
      "buying_signals": ["signal1", "signal2"],
      "objection_likelihood": "high/medium/low"
    },
    "recommendations": {
      "next_actions": ["action1", "action2"],
      "approach": "recommended approach",
      "urgency": "high/medium/low"
    }
  },
  "draft": {
    "subject": "Re: [original subject]",
    "body": "Complete email response ready to send",
    "tone": "${responseStrategy.tone}",
    "confidence": 0.8
  },
  "classification": {
    "category": "${classification.category}",
    "intent": "${classification.intent}",
    "urgency": "${classification.urgency}",
    "sentiment": "${classification.sentiment}"
  }
}`;

    const userPrompt = `Please analyze this email and generate both analysis and draft response:

FROM: ${from}
SUBJECT: ${subject}
DATE: ${date}

EMAIL CONTENT:
${body}`;

    try {
      const openai = getOpenAIClient();
      if (!openai) {
        return NextResponse.json({
          success: false,
          error: 'OpenAI service is not available'
        }, { status: 503 });
      }

      // Debug logging to see the actual prompt being sent
      console.log('🔍 SYSTEM PROMPT START:');
      console.log(systemPrompt.substring(0, 300));
      console.log('🔍 SYSTEM PROMPT END:');
      console.log(systemPrompt.substring(systemPrompt.length - 300));
      console.log('🌍 DETECTED LANGUAGE:', detectedLanguage);
      console.log('🎯 SLOVENIAN INSTRUCTIONS:', systemPrompt.includes('SLOVENIAN'));

      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 2000
      });

      const result = completion.choices[0]?.message?.content;
      if (!result) {
        throw new Error('No response from AI');
      }

      let parsedResult;
      try {
        // Clean the result to ensure it's valid JSON
        let cleanedResult = result.trim();
        
        // Remove any text before the first {
        const jsonStart = cleanedResult.indexOf('{');
        if (jsonStart > 0) {
          cleanedResult = cleanedResult.substring(jsonStart);
        }
        
        // Remove any text after the last }
        const jsonEnd = cleanedResult.lastIndexOf('}');
        if (jsonEnd !== -1 && jsonEnd < cleanedResult.length - 1) {
          cleanedResult = cleanedResult.substring(0, jsonEnd + 1);
        }
        
        console.log('🔧 Cleaned AI response for parsing:', cleanedResult.substring(0, 200) + '...');
        parsedResult = JSON.parse(cleanedResult);
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
        console.error('Raw response:', result);
        throw new Error('Invalid AI response format');
      }

      // Store the analysis and draft for learning with versioning
      try {
        // Get existing drafts count for this email to determine version
        const { data: existingAnalyses } = await supabase
          .from('email_analysis')
          .select('id')
          .eq('email_id', emailId)
          .eq('user_id', session.user.id);
        
        const versionNumber = (existingAnalyses?.length || 0) + 1;
        
        await supabase.from('email_analysis').insert({
          email_id: emailId,
          user_id: session.user.id,
          classification: classification,
          analysis_result: parsedResult.analysis,
          generated_draft: parsedResult.draft,
          customer_context: customerContext,
          version_number: versionNumber,
          detected_language: detectedLanguage,
          metadata: {
            versionInfo: `Sales analysis v${versionNumber} - Generated ${new Date().toISOString()}`,
            languageDetected: detectedLanguage,
            responseLanguage: detectedLanguage
          },
          created_at: new Date().toISOString()
        });
        
        console.log(`💾 Saved sales analysis v${versionNumber} for email ${emailId} in language ${detectedLanguage}`);
      } catch (dbError) {
        console.error('Failed to store analysis for learning:', dbError);
      }

      return NextResponse.json({
        success: true,
        analysis: parsedResult.analysis,
        generated_response: parsedResult.draft.body,
        draft_subject: parsedResult.draft.subject,
        classification: parsedResult.classification,
        customer_context: customerContext,
        order_context: orderContext?.slice(0, 3), // Limit to 3 most recent orders
        detected_language: detectedLanguage,
        email: {
          from: from,
          subject: subject,
          id: emailId,
          date: date
        }
      });

    } catch (aiError) {
      console.error('Error in AI analysis:', aiError);
      
      // Fallback to original analysis if AI fails
      const analysisResult = await analyzeSalesOpportunity(`From: ${from}\nSubject: ${subject}\nDate: ${date}\n\n${body}`);
      
      let parsedAnalysis;
      try {
        parsedAnalysis = JSON.parse(analysisResult);
      } catch (parseError) {
        parsedAnalysis = {
          opportunity: { score: 5, priority: 'Medium', category: 'General' },
          insights: { key_indicators: ['Analysis unavailable'], decision_timeline: 'Unknown', budget_signals: [] },
          recommendations: { immediate_actions: ['Follow up'], follow_up_strategy: 'Standard approach', talking_points: [] }
        };
      }

      return NextResponse.json({
        success: true,
        analysis: parsedAnalysis,
        generated_response: "Thank you for your email. We'll review your request and get back to you shortly.",
        classification: classification,
        customer_context: customerContext,
        email: { from, subject, id: emailId, date },
        note: 'Using fallback analysis due to system limitations'
      });
    }
  } catch (error) {
    console.error('Error analyzing email for sales opportunity:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 