import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { initializeSupplierData } from '@/lib/suppliers/init';
import OpenAI from 'openai';

// Function to create OpenAI client with fallback for missing API key
const createOpenAIClient = () => {
  if (!process.env.OPENAI_API_KEY) {
    console.warn('OPENAI_API_KEY environment variable is missing in suppliers queries. Using mock client.');
    // Use unknown as intermediate type before asserting as OpenAI
    const mockClient: unknown = {
      chat: {
        completions: {
          create: async () => ({
            choices: [{ message: { content: "I'm a mock AI response because the OpenAI API key is not configured. Please set up your API key in the environment variables to get actual AI responses." } }],
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

// Initialize Supabase connection
const initSupabaseConnection = async () => {
  // Keep the initialization function for backward compatibility
  await initializeSupplierData();
};

// Get all queries or a specific query
export async function GET(request: NextRequest) {
  await initSupabaseConnection();
  try {
    const { searchParams } = new URL(request.url);
    const queryId = searchParams.get('id');
    
    // Get the current user's ID
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Error getting user:', userError);
      return NextResponse.json(
        { error: 'Authentication error' },
        { status: 401 }
      );
    }
    
    const userId = userData.user?.id;
    if (!userId) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }
    
    if (queryId) {
      // Fetch specific query with its results
      const { data: query, error: queryError } = await supabase
        .from('supplier_queries')
        .select('*')
        .eq('id', queryId)
        .eq('created_by', userId)
        .single();
      
      if (queryError) {
        console.error('Error fetching supplier query:', queryError);
        return NextResponse.json(
          { error: 'Query not found' },
          { status: 404 }
        );
      }
      
      // Fetch query results
      const { data: results, error: resultsError } = await supabase
        .from('supplier_query_results')
        .select(`
          *,
          suppliers:supplier_id (id, name, email)
        `)
        .eq('query_id', queryId);
      
      if (resultsError) {
        console.error('Error fetching query results:', resultsError);
        return NextResponse.json(
          { error: 'Failed to fetch query results' },
          { status: 500 }
        );
      }
      
      return NextResponse.json({
        query,
        results
      });
    } else {
      // Fetch all queries
      const { data: queries, error } = await supabase
        .from('supplier_queries')
        .select('*')
        .eq('created_by', userId)
        .order('timestamp', { ascending: false });
      
      if (error) {
        console.error('Error fetching supplier queries:', error);
        return NextResponse.json(
          { error: 'Failed to fetch supplier queries' },
          { status: 500 }
        );
      }
      
      return NextResponse.json(queries);
    }
  } catch (error) {
    console.error('Error fetching supplier queries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch supplier queries' },
      { status: 500 }
    );
  }
}

// Create a new query
export async function POST(request: NextRequest) {
  await initSupabaseConnection();
  try {
    const { query, aiResponse, results } = await request.json();
    
    if (!query) {
      return NextResponse.json(
        { error: 'Query text is required' },
        { status: 400 }
      );
    }
    
    // Get the current user's ID
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Error getting user:', userError);
      return NextResponse.json(
        { error: 'Authentication error' },
        { status: 401 }
      );
    }
    
    const userId = userData.user?.id;
    if (!userId) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }
    
    // Fetch data to provide context for the AI
    const contextData = await fetchContextData(userId);
    
    // If no AI response was provided, generate one using the OpenAI API
    let finalAiResponse = aiResponse;
    if (!finalAiResponse) {
      finalAiResponse = await generateAIResponse(query, contextData);
    }
    
    // Create new query in Supabase
    const { data: newQuery, error: queryError } = await supabase
      .from('supplier_queries')
      .insert({
        query,
        ai_response: finalAiResponse || null,
        created_by: userId
      })
      .select()
      .single();
    
    if (queryError) {
      console.error('Error creating query in Supabase:', queryError);
      return NextResponse.json(
        { error: 'Failed to create query' },
        { status: 500 }
      );
    }
    
    // If results are provided, insert them
    if (results && Array.isArray(results) && results.length > 0) {
      const queryResults = results.map(result => ({
        query_id: newQuery.id,
        supplier_id: result.supplierId,
        relevance_score: result.relevanceScore || 0,
        product_match: result.productMatch || null,
        match_reason: result.matchReason || null,
        product_matches: result.productMatches || [],
        price: result.price || null,
        document_references: result.documentReferences || [],
        email_references: result.emailReferences || [],
        suggested_email: result.suggestedEmail || null
      }));
      
      const { error: resultsError } = await supabase
        .from('supplier_query_results')
        .insert(queryResults);
      
      if (resultsError) {
        console.error('Error creating query results in Supabase:', resultsError);
        // We don't return an error here, as the query was created successfully
        // Just log the error and continue
      }
    }
    
    return NextResponse.json({
      id: newQuery.id,
      query: newQuery.query,
      timestamp: newQuery.timestamp,
      aiResponse: newQuery.ai_response
    });
  } catch (error) {
    console.error('Error creating supplier query:', error);
    return NextResponse.json(
      { error: 'Failed to create supplier query' },
      { status: 500 }
    );
  }
}

// Delete a query
// Fetch context data for AI processing
async function fetchContextData(userId: string) {
  try {
    // Fetch suppliers
    const { data: suppliers } = await supabase
      .from('suppliers')
      .select('*')
      .eq('user_id', userId);
    
    // Fetch products
    const { data: products } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', userId);
    
    // Fetch supplier pricing
    const { data: pricing } = await supabase
      .from('supplier_pricing')
      .select(`
        *,
        supplier:supplier_id (id, name),
        product:product_id (id, name, description)
      `)
      .eq('user_id', userId);
    
    // Fetch recent documents
    const { data: documents } = await supabase
      .from('supplier_documents')
      .select(`
        id,
        supplier_id,
        file_name,
        document_type,
        file_type,
        processing_status,
        processed_at,
        created_at
      `)
      .eq('created_by', userId)
      .eq('processing_status', 'approved')
      .order('created_at', { ascending: false })
      .limit(10);
    
    return {
      suppliers: suppliers || [],
      products: products || [],
      pricing: pricing || [],
      documents: documents || []
    };
  } catch (error) {
    console.error('Error fetching context data:', error);
    return {
      suppliers: [],
      products: [],
      pricing: [],
      documents: []
    };
  }
}

// Generate AI response using OpenAI
async function generateAIResponse(query: string, contextData: any) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.warn('OpenAI API key not found, using fallback response');
      return `I'm sorry, I couldn't process your query because the AI service is not properly configured.`;
    }
    
    const openai = createOpenAIClient();
    
    // Format the context data for the AI
    const supplierContext = contextData.suppliers.map((s: any) => `Supplier: ${s.name}, Contact: ${s.contact_name || 'N/A'}, Email: ${s.email || 'N/A'}, Products: ${s.product_categories?.join(', ') || 'N/A'}`).join('\n');
    
    const productContext = contextData.products.map((p: any) => `Product: ${p.name}, Description: ${p.description || 'N/A'}, Category: ${p.category || 'N/A'}`).join('\n');
    
    const pricingContext = contextData.pricing.map((p: any) => `Product: ${p.product?.name || 'Unknown'}, Supplier: ${p.supplier?.name || 'Unknown'}, Price: ${p.price} ${p.currency || 'USD'} per ${p.unit || 'unit'}, Last Updated: ${p.updated_at}`).join('\n');
    
    const documentsContext = contextData.documents.map((d: any) => `Document: ${d.file_name}, Type: ${d.document_type}, From Supplier ID: ${d.supplier_id}, Processed: ${d.processed_at}`).join('\n');
    
    // Create the system prompt
    const systemPrompt = `You are an AI assistant for a CRM system that helps manage supplier relationships, products, and pricing.
    
You have access to the following data:

SUPPLIERS:\n${supplierContext}\n\nPRODUCTS:\n${productContext}\n\nPRICING:\n${pricingContext}\n\nRECENT DOCUMENTS:\n${documentsContext}\n\nWhen answering questions:
1. If asked about specific suppliers, products, or pricing, provide accurate information from the data above.
2. If asked to compare prices, calculate the best options based on the pricing data.
3. If asked about documents, reference the document information provided.
4. If you don't have enough information, acknowledge this and suggest what additional data might be needed.
5. Always maintain a professional, helpful tone.
6. Remember that all data is specific to the current user's company - this is a multi-tenant system.`;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: query }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });
    
    return response.choices[0]?.message?.content || "I couldn't generate a response to your query.";
  } catch (error) {
    console.error('Error generating AI response:', error);
    return `I'm sorry, I encountered an error while processing your query. Please try again later.`;
  }
}

export async function DELETE(request: NextRequest) {
  await initSupabaseConnection();
  try {
    const { searchParams } = new URL(request.url);
    const queryId = searchParams.get('id');
    
    if (!queryId) {
      return NextResponse.json(
        { error: 'Query ID is required' },
        { status: 400 }
      );
    }
    
    // Get the current user's ID
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Error getting user:', userError);
      return NextResponse.json(
        { error: 'Authentication error' },
        { status: 401 }
      );
    }
    
    const userId = userData.user?.id;
    if (!userId) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }
    
    // Check if query exists and belongs to the user
    const { data: query, error: checkError } = await supabase
      .from('supplier_queries')
      .select('id')
      .eq('id', queryId)
      .eq('created_by', userId)
      .single();
    
    if (checkError) {
      console.error('Error checking query existence:', checkError);
      return NextResponse.json(
        { error: 'Query not found' },
        { status: 404 }
      );
    }
    
    // Delete query from Supabase (cascade will delete results)
    const { error: deleteError } = await supabase
      .from('supplier_queries')
      .delete()
      .eq('id', queryId)
      .eq('created_by', userId);
    
    if (deleteError) {
      console.error('Error deleting query from Supabase:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete query' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting supplier query:', error);
    return NextResponse.json(
      { error: 'Failed to delete supplier query' },
      { status: 500 }
    );
  }
}
