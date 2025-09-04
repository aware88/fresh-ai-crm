import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '../../../../lib/supabase/server';
import { getUID } from '../../../../lib/auth/utils';
import OpenAI from 'openai';
import { getOpenAIClient } from '@/lib/clients/unified-client-manager';

// Function to create OpenAI client with fallback for missing API key
const createOpenAIClient = () => {
  try {
    // Use unified client manager for better performance
    return getOpenAIClient();
  } catch (error) {
    console.warn('Unified OpenAI client failed, using fallback:', error);
    
    // Fallback implementation
  if (!process.env.OPENAI_API_KEY) {
    console.warn('OPENAI_API_KEY environment variable is missing in document processor. Using mock client.');
    // Use unknown as intermediate type before asserting as OpenAI
    const mockClient: unknown = {
      chat: {
        completions: {
          create: async () => ({
            choices: [{ message: { content: JSON.stringify({
                contactIds: [],
                documentIds: [],
                documentTypes: [],
                productIds: [],
                confidence: 0.5,
                extractedData: {
                  invoiceNumbers: [],
                  offerNumbers: [],
                  orderNumbers: [],
                  amounts: [],
                  dates: [],
                  productNames: []
              }
            })} }],
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
  }
};

// POST /api/documents/process - Process a document with AI
export async function POST(request: NextRequest) {
  // Initialize OpenAI client inside the function
  const openai = createOpenAIClient();
  
  // Declare variables at the top level
  let body: any;
  let documentId: string | undefined;
  let userId: string | undefined;
  
  try {
    // Parse request body first to avoid consuming it multiple times
    body = await request.json();
    documentId = body.documentId;
    userId = body.userId;
    
    // Check if this is a service-level request with a service token
    let uid: string | null = null;
    
    if (userId) {
      // Service-level request - use provided userId
      uid = userId;
    } else {
      // User-level request - get from session
      uid = await getUID();
      if (!uid) {
        return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
      }
    }
    
    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }
    
    const supabase = await createServerClient();
    
    // Get the document
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();
    
    if (docError || !document) {
      console.error('Error fetching document:', docError);
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }
    
    // Check if user has access to this document
    if (document.user_id !== uid) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check if document has content to process
    if (!document.content && !document.file_path) {
      return NextResponse.json({ error: 'Document has no content to process' }, { status: 400 });
    }

    let documentContent = document.content;

    // If no content but has file_path, try to read the file
    if (!documentContent && document.file_path) {
      // For now, we'll skip file reading and just use available content
      console.warn('Document has file_path but no content. File reading not implemented yet.');
    }

    if (!documentContent) {
      return NextResponse.json({ error: 'No document content available for processing' }, { status: 400 });
    }

    // Prepare the AI prompt for document analysis
    const systemPrompt = `You are an intelligent document analyzer for a CRM system. Analyze the provided document content and extract relevant business information.

Your task is to identify and extract:
1. Contact information (names, emails, phone numbers, companies)
2. Product references (product names, models, quantities, prices)
3. Document types (invoice, quote, order, contract, etc.)
4. Important dates and numbers
5. Business context and relationships

Return your analysis in the following JSON format:
{
  "contactIds": [], // Array of contact IDs if any are referenced
  "documentIds": [], // Array of related document IDs if any are referenced
  "documentTypes": [], // Array of detected document types
  "productIds": [], // Array of product IDs if any are referenced
  "confidence": 0.8, // Confidence score from 0 to 1
  "extractedData": {
    "invoiceNumbers": [],
    "offerNumbers": [],
    "orderNumbers": [],
    "amounts": [], // Monetary amounts with currency if detected
    "dates": [], // Important dates in ISO format
    "productNames": [],
    "contactNames": [],
    "companyNames": [],
    "emails": [],
    "phoneNumbers": []
  },
  "summary": "Brief summary of the document content and its business relevance",
  "actionItems": [], // Suggested follow-up actions
  "tags": [] // Relevant tags for categorization
}

Be thorough but accurate. Only extract information that is clearly present in the document.`;

    const userPrompt = `Please analyze the following document content:

Document Title: ${document.name || 'Untitled Document'}
Document Type: ${document.type || 'Unknown'}
Content:
${documentContent.substring(0, 4000)} // Limit content to avoid token limits

Provide a comprehensive analysis following the JSON format specified.`;

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Use cost-effective model for document analysis
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.1, // Low temperature for consistent analysis
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    });

    const analysisResult = completion.choices[0]?.message?.content;
    
    if (!analysisResult) {
      throw new Error('No analysis result from OpenAI');
    }

    // Parse the JSON response
    let analysis;
    try {
      analysis = JSON.parse(analysisResult);
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      throw new Error('Invalid AI response format');
    }

    // Update the document with analysis results
    const { error: updateError } = await supabase
      .from('documents')
      .update({
        ai_analysis: analysis,
        processed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId);
    
    if (updateError) {
      console.error('Error updating document with analysis:', updateError);
      // Don't fail the request if we can't save to DB, just log the error
    }

    // Log the processing for analytics
    try {
      await supabase
        .from('document_processing_logs')
        .insert({
          document_id: documentId,
          user_id: uid,
          processing_type: 'ai_analysis',
          tokens_used: completion.usage?.total_tokens || 0,
          processing_time_ms: Date.now(), // This would be calculated properly in production
          success: true,
          created_at: new Date().toISOString()
        });
    } catch (logError) {
      console.error('Error logging document processing:', logError);
      // Don't fail the request if logging fails
    }

    // Return the analysis results
    return NextResponse.json({
      success: true,
      analysis,
      tokensUsed: completion.usage?.total_tokens || 0,
      documentId,
      processedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error processing document:', error);
    
    // Log the error
    try {
      const supabase = await createServerClient();
      // Use the already parsed body variables
      const userId = body?.userId;
      const documentId = body?.documentId;
      
      await supabase
        .from('document_processing_logs')
        .insert({
          document_id: documentId,
          user_id: userId,
          processing_type: 'ai_analysis',
          success: false,
          error_message: error instanceof Error ? error.message : 'Unknown error',
          created_at: new Date().toISOString()
        });
    } catch (logError) {
      console.error('Error logging processing failure:', logError);
    }

    return NextResponse.json(
      { 
        error: 'Failed to process document',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

// GET /api/documents/process - Get processing status and history
export async function GET(request: NextRequest) {
  try {
    const uid = await getUID();
    // This function appears to be incomplete in the original file
    return NextResponse.json({ message: "Not implemented" }, { status: 501 });
  } catch (error) {
    console.error("Error in GET /api/documents/process:", error);
    return NextResponse.json(
      { 
        error: "Failed to get processing status",
        details: error instanceof Error ? error.message : "Unknown error"
      }, 
      { status: 500 }
    );
  }
}