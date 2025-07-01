import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '../../../../lib/supabase/server';
import { getUID } from '../../../../lib/auth/utils';
import OpenAI from 'openai';

/**
 * POST /api/suppliers/compose-email
 * Generate an email draft using AI based on supplier data and user instructions
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
    const { supplierId, purpose, additionalContext, tone } = body;

    if (!supplierId) {
      return NextResponse.json({ error: 'Supplier ID is required' }, { status: 400 });
    }

    if (!purpose) {
      return NextResponse.json({ error: 'Email purpose is required' }, { status: 400 });
    }

    // Create Supabase client
    const supabase = createServerClient();

    // Fetch supplier data
    const { data: supplier, error: supplierError } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', supplierId)
      .eq('created_by', uid)
      .single();

    if (supplierError || !supplier) {
      console.error('Error fetching supplier:', supplierError);
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }

    // Fetch recent interactions with this supplier
    const { data: recentEmails } = await supabase
      .from('supplier_emails')
      .select('*')
      .eq('supplier_id', supplierId)
      .eq('created_by', uid)
      .order('created_at', { ascending: false })
      .limit(3);

    // Fetch products and pricing from this supplier
    const { data: pricing } = await supabase
      .from('supplier_pricing')
      .select(`
        *,
        product:product_id (id, name, description, category)
      `)
      .eq('supplier_id', supplierId)
      .eq('user_id', uid);

    // Generate email draft using OpenAI
    const emailDraft = await generateEmailDraft(
      supplier,
      purpose,
      additionalContext || '',
      tone || 'professional',
      recentEmails || [],
      pricing || []
    );

    return NextResponse.json({
      success: true,
      emailDraft,
      supplier
    });
  } catch (error) {
    console.error('Error in compose-email API:', error);
    return NextResponse.json(
      { error: 'Failed to generate email draft' },
      { status: 500 }
    );
  }
}

/**
 * Generate an email draft using OpenAI
 */
async function generateEmailDraft(
  supplier: any,
  purpose: string,
  additionalContext: string,
  tone: string,
  recentEmails: any[],
  pricing: any[]
) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return {
        subject: `[Draft] Email to ${supplier.name}`,
        body: `[Error: OpenAI API key not configured. Please set up the API key to use AI-generated emails.]`
      };
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    // Format recent emails for context
    const emailHistory = recentEmails.map(email => 
      `Date: ${new Date(email.created_at).toLocaleDateString()}
       Subject: ${email.subject}
       Content: ${email.body?.substring(0, 100)}...`
    ).join('\n\n');

    // Format product and pricing information
    const productInfo = pricing.map(item => 
      `Product: ${item.product?.name || 'Unknown'}, Price: ${item.price} ${item.currency || 'USD'} per ${item.unit || 'unit'}`
    ).join('\n');

    // Create system prompt
    const systemPrompt = `You are an AI assistant helping to draft an email to a supplier named ${supplier.name}.

SUPPLIER INFORMATION:
Name: ${supplier.name}
Contact: ${supplier.contact_name || 'N/A'}
Email: ${supplier.email || 'N/A'}
Phone: ${supplier.phone || 'N/A'}
Address: ${supplier.address || 'N/A'}
Product Categories: ${supplier.product_categories?.join(', ') || 'N/A'}
Notes: ${supplier.notes || 'N/A'}

RECENT EMAIL HISTORY:
${emailHistory || 'No recent emails'}

PRODUCT AND PRICING INFORMATION:
${productInfo || 'No product information available'}

TASK:
Draft an email for the following purpose: "${purpose}"

ADDITIONAL CONTEXT:
${additionalContext || 'No additional context provided'}

TONE:
The email should be written in a ${tone} tone.

INSTRUCTIONS:
1. Create a clear, concise email with an appropriate subject line and body.
2. The email should be professionally formatted with a greeting, body paragraphs, and closing.
3. Reference relevant product information or pricing when appropriate.
4. Maintain continuity with previous communications if relevant.
5. Return the response as a JSON object with "subject" and "body" fields.
6. Do not include any explanations or notes outside the email content itself.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Please draft this email for me." }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0]?.message?.content || '';
    
    try {
      // Parse the JSON response
      const parsedContent = JSON.parse(content);
      return {
        subject: parsedContent.subject || `[Draft] Email to ${supplier.name}`,
        body: parsedContent.body || `[Error: Could not generate email body]`
      };
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      // If JSON parsing fails, try to extract subject and body using regex
      const subjectMatch = content.match(/subject["\s:]+([^"]+)/i);
      const bodyMatch = content.match(/body["\s:]+([^"]+)/i);
      
      return {
        subject: subjectMatch ? subjectMatch[1] : `[Draft] Email to ${supplier.name}`,
        body: bodyMatch ? bodyMatch[1] : content
      };
    }
  } catch (error) {
    console.error('Error generating email draft:', error);
    return {
      subject: `[Draft] Email to ${supplier.name}`,
      body: `[Error: Failed to generate email. Please try again later.]`
    };
  }
}
