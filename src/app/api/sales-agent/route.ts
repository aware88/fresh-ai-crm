import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { analyzeSalesOpportunity } from '@/lib/openai/client';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { classifyEmail, getResponseStrategy, type EmailContext } from '@/lib/email/email-classifier';
import { createMetakockaClientForUser } from '@/lib/integrations/metakocka';
import { getLearnedPatterns } from '@/lib/learning/email-pattern-analyzer';
import { UnifiedAIDraftingService } from '@/lib/ai/unified-drafting-service';
import OpenAI from 'openai';

// Use unified client manager for optimized OpenAI client handling
import { getOpenAIClient as getUnifiedOpenAIClient } from '@/lib/clients/unified-client-manager';

// Lazy initialization to avoid build-time errors
const getOpenAIClient = () => {
  try {
    // Use unified client manager for better performance
    return getUnifiedOpenAIClient();
  } catch (error) {
    console.warn('Unified OpenAI client failed, using fallback:', error);
    
    // Fallback implementation
    if (!process.env.OPENAI_API_KEY) {
      console.warn('OPENAI_API_KEY environment variable is missing. Using mock client.');
      return null;
    }
    return new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
};

export async function POST(request: NextRequest) {
  try {
    const __debug = process.env.NODE_ENV !== 'production';
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
      if (__debug) console.log('Using email content from frontend');
      subject = passedEmailContent.subject || '(No Subject)';
      from = passedEmailContent.from || 'Unknown Sender';
      date = passedEmailContent.date || new Date().toISOString();
      body = passedEmailContent.body || '';
    } else if (dbEmail && !dbEmailError) {
      // Use email from database
      if (__debug) console.log('Using email from database');
      subject = dbEmail.subject || '(No Subject)';
      from = dbEmail.from_address || dbEmail.sender || 'Unknown Sender';
      date = dbEmail.received_date || dbEmail.created_at;
      body = dbEmail.text_content || dbEmail.raw_content || dbEmail.content || '';
    } else {
      // Try to fetch from provider API based on account type
      const account = accounts[0];
      if (__debug) console.log(`Trying to fetch email from ${account.provider_type} provider`);
      
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
        if (__debug) console.log('IMAP account - email content should be provided by frontend');
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

    // Get learned patterns for this category
    const learnedPatterns = await getLearnedPatterns(session.user.id, classification.category);

    // Get organization ID for user using unified context service
    let organizationId;
    try {
      const { getUserOrganization } = await import('@/lib/context/unified-user-context-service');
      organizationId = await getUserOrganization(session.user.id);
      if (__debug) {
        if (organizationId) {
          console.log('[Sales Agent] ✅ Found organization via unified context');
        } else {
          console.log('[Sales Agent] ❌ No organization found for user');
        }
      }
    } catch (error) {
      if (__debug) console.warn('[Sales Agent] Unified context failed, using fallback:', error);
      // Fallback to legacy implementation
      try {
        const { data: userOrg } = await supabase
          .from('user_organizations')
          .select('organization_id')
          .eq('user_id', session.user.id)
          .single();
        organizationId = userOrg?.organization_id;
      } catch (fallbackError) {
        if (__debug) console.log('[Sales Agent] No organization found for user (fallback)');
      }
    }

    try {
      const openai = getOpenAIClient();
      if (!openai) {
        return NextResponse.json({
          success: false,
          error: 'OpenAI service is not available'
        }, { status: 503 });
      }

      // Initialize unified AI drafting service
      const unifiedService = new UnifiedAIDraftingService(supabase, openai, organizationId || '', session.user.id);

      // Prepare sales context with all gathered data
      const salesContext = {
        analysis: {
          lead_qualification: { score: 7, level: 'warm', reasoning: 'Email analysis in progress' },
          opportunity_assessment: { potential_value: 'medium', timeline: 'short-term', decision_maker: 'unknown', budget_indicators: [] },
          sales_insights: { pain_points: [], buying_signals: [], objection_likelihood: 'medium' },
          recommendations: { next_actions: ['Follow up'], approach: responseStrategy.approach, urgency: responseStrategy.priority }
        },
        classification,
        responseStrategy,
        learnedPatterns,
        customerContext,
        orderContext
      };

      // Prepare drafting context for unified service
      const draftingContext = {
        emailId: `sales-${Date.now()}`, // Virtual email ID
        originalEmail: {
          from,
          to: '',
          subject,
          body,
          date
        },
        userId: session.user.id,
        organizationId,
        settings: {
          responseStyle: responseStrategy.tone,
          responseLength: 'detailed',
          includeContext: true
        },
        isVirtual: true,
        salesContext,
        customInstructions: `Sales analysis context active. Classification: ${classification.category}/${classification.intent}. Customer context: ${customerContext ? 'Available' : 'None'}. Order history: ${orderContext?.length || 0} orders.`
      };

      // Generate draft using unified service
      const result = await unifiedService.generateDraft(draftingContext);

      if (!result.success) {
        throw new Error(result.error || 'Failed to generate sales draft');
      }

      // Generate sales analysis separately using existing logic
      const analysisPrompt = `Analyze this email for sales opportunity:
FROM: ${from}
SUBJECT: ${subject}
EMAIL: ${body}

${customerContext ? `CUSTOMER: ${customerContext.name} - ${customerContext.totalOrders} orders, status: ${customerContext.status}` : ''}

Return JSON with lead_qualification (score 1-10, level hot/warm/cold, reasoning), opportunity_assessment (potential_value, timeline, decision_maker, budget_indicators), sales_insights (pain_points, buying_signals, objection_likelihood), recommendations (next_actions, approach, urgency).`;

      const analysisResponse = await openai.chat.completions.create({
        model: 'gpt-4o-mini', // Use cheaper model for analysis
        messages: [{ role: 'user', content: analysisPrompt }],
        temperature: 0.3,
        max_tokens: 800,
        response_format: { type: 'json_object' }
      });

      let parsedAnalysis;
      try {
        parsedAnalysis = JSON.parse(analysisResponse.choices[0]?.message?.content || '{}');
      } catch (parseError) {
        parsedAnalysis = {
          lead_qualification: { score: 5, level: 'warm', reasoning: 'Analysis parsing failed' },
          opportunity_assessment: { potential_value: 'medium', timeline: 'standard', decision_maker: 'unknown', budget_indicators: [] },
          sales_insights: { pain_points: [], buying_signals: [], objection_likelihood: 'medium' },
          recommendations: { next_actions: ['Follow up'], approach: 'Standard approach', urgency: 'medium' }
        };
      }
      
      if (__debug) console.log(`✅ Sales draft generated: ${result.metadata.tokensUsed} tokens, $${result.metadata.costUsd.toFixed(4)} using ${result.metadata.modelUsed}`);

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
          analysis_result: parsedAnalysis,
          generated_draft: result.draft,
          customer_context: customerContext,
          version_number: versionNumber,
          detected_language: result.metadata.languageDetected,
          metadata: {
            versionInfo: `Unified sales analysis v${versionNumber} - Generated ${new Date().toISOString()}`,
            languageDetected: result.metadata.languageDetected,
            responseLanguage: result.metadata.languageDetected,
            modelUsed: result.metadata.modelUsed,
            tokensUsed: result.metadata.tokensUsed,
            costUsd: result.metadata.costUsd
          },
          created_at: new Date().toISOString()
        });
        
        if (__debug) console.log(`💾 Saved unified sales analysis v${versionNumber} for email ${emailId}`);
      } catch (dbError) {
        console.error('Failed to store analysis for learning:', dbError);
      }

      return NextResponse.json({
        success: true,
        analysis: parsedAnalysis,
        generated_response: result.draft!.body,
        draft_subject: result.draft!.subject,
        classification: classification,
        customer_context: customerContext,
        order_context: orderContext?.slice(0, 3), // Limit to 3 most recent orders
        detected_language: result.metadata.languageDetected,
        metadata: result.metadata, // Include performance metrics
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
