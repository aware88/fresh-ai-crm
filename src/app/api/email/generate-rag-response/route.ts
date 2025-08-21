import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getUID } from '@/lib/auth/utils';
import { UnifiedRAGService } from '@/lib/rag/unified-rag-service';
import { EnhancedEmailService } from '@/lib/rag/enhanced-email-service';
import { getUserOrganization } from '@/lib/middleware/ai-limit-middleware-v2';
import { withAILimitCheckAndTopup } from '@/lib/middleware/ai-limit-middleware-v2';

/**
 * RAG-Enhanced Email Generation API
 * POST /api/email/generate-rag-response - Generate email responses with comprehensive RAG context
 */
export async function POST(request: NextRequest) {
  // Get user authentication
  const uid = await getUID();
  if (!uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check AI limits and handle the request
  return withAILimitCheckAndTopup(request, uid, 'rag_email_response', async () => {
    return await handleRAGEmailGeneration(request, uid);
  });
}

async function handleRAGEmailGeneration(request: NextRequest, uid: string) {
  try {
    // Get organization ID
    const organizationId = await getUserOrganization(uid);
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Parse request body
    const body = await request.json();
    const {
      originalEmail,
      senderEmail = '',
      contactId = '',
      tone = 'professional',
      customInstructions = '',
      includeProducts = true,
      includeDocuments = true,
      includeMetakocka = true,
      maxContextChunks = 8,
      generateSubject = true
    } = body;

    // Validate required fields
    if (!originalEmail) {
      return NextResponse.json({ 
        error: 'Original email content is required' 
      }, { status: 400 });
    }

    console.log(`[RAG Email API] Generating RAG-enhanced response for user ${uid}`);

    // Create services
    const supabase = createServerClient();
    const ragService = new UnifiedRAGService(supabase, process.env.OPENAI_API_KEY!);
    const enhancedEmailService = new EnhancedEmailService(ragService, supabase);

    // Generate RAG-enhanced email response
    const result = await enhancedEmailService.generateRAGEnhancedResponse(
      originalEmail,
      organizationId,
      uid,
      {
        senderEmail,
        contactId,
        tone,
        customInstructions,
        includeProducts,
        includeDocuments,
        includeMetakocka,
        maxContextChunks
      }
    );

    console.log(`[RAG Email API] Generated response with ${result.ragContext.chunksUsed.length} RAG chunks in ${result.processingTimeMs}ms`);

    // Return comprehensive response
    return NextResponse.json({
      success: true,
      response: result.response,
      subject: generateSubject ? result.subject : undefined,
      confidence: result.confidence,
      processingTimeMs: result.processingTimeMs,
      ragContext: {
        chunksUsed: result.ragContext.chunksUsed.length,
        contextSummary: result.ragContext.contextSummary.substring(0, 200) + '...', // Truncate for response
        relevantProducts: result.ragContext.relevantProducts.map(chunk => ({
          id: chunk.source.sourceId,
          title: chunk.source.title,
          similarity: chunk.similarity
        })),
        relevantDocuments: result.ragContext.relevantDocuments.map(chunk => ({
          id: chunk.source.sourceId,
          title: chunk.source.title,
          similarity: chunk.similarity
        })),
        citations: result.ragContext.citations
      },
      intelligence: {
        ragEnhanced: true,
        contextSources: [
          ...(result.ragContext.relevantProducts.length > 0 ? ['products'] : []),
          ...(result.ragContext.relevantDocuments.length > 0 ? ['documents'] : []),
          ...(result.ragContext.chunksUsed.some(c => c.source.sourceType === 'metakocka') ? ['metakocka'] : [])
        ],
        totalContextChunks: result.ragContext.chunksUsed.length,
        highConfidence: result.confidence > 0.8
      }
    });

  } catch (error) {
    console.error('[RAG Email API] Generation failed:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('429')) {
        return NextResponse.json({
          success: false,
          error: 'Rate limit exceeded. Please wait a moment and try again.',
          details: 'OpenAI API rate limit reached.'
        }, { status: 429 });
      }
      
      if (error.message.includes('insufficient context')) {
        return NextResponse.json({
          success: false,
          error: 'Insufficient context available for RAG-enhanced response.',
          details: 'Try syncing your data sources or use the standard email generation.'
        }, { status: 400 });
      }
    }
    
    return NextResponse.json({
      success: false,
      error: 'Failed to generate RAG-enhanced email response',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * GET /api/email/generate-rag-response - Get RAG email generation statistics
 */
export async function GET(request: NextRequest) {
  try {
    // Get user authentication
    const uid = await getUID();
    if (!uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get organization ID
    const organizationId = await getUserOrganization(uid);
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    // Create services
    const supabase = createServerClient();
    const ragService = new UnifiedRAGService(supabase, process.env.OPENAI_API_KEY!);
    const enhancedEmailService = new EnhancedEmailService(ragService, supabase);

    // Get email statistics
    const stats = await enhancedEmailService.getEmailStats(organizationId, days);

    // Get RAG system stats
    const ragStats = await ragService.getSystemStats(organizationId);

    return NextResponse.json({
      success: true,
      emailStats: stats,
      ragSystemStats: ragStats,
      period: `${days} days`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[RAG Email API] Stats error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}


