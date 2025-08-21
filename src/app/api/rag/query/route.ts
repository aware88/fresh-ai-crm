import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getUID } from '@/lib/auth/utils';
import { UnifiedRAGService } from '@/lib/rag/unified-rag-service';
import { getUserOrganization } from '@/lib/middleware/ai-limit-middleware-v2';
import { RAGSourceType } from '@/types/rag';

/**
 * RAG Query API
 * POST /api/rag/query - Query the RAG system for relevant content
 */
export async function POST(request: NextRequest) {
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

    // Parse request body
    const body = await request.json();
    const { 
      query, 
      sourceTypes = [], 
      limit = 10, 
      similarityThreshold = 0.7,
      includeMetadata = true,
      generateResponse = false,
      context = {}
    } = body;

    // Validate required fields
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json({ 
        error: 'Query is required and must be a non-empty string' 
      }, { status: 400 });
    }

    // Validate source types
    const validSourceTypes: RAGSourceType[] = [
      'product', 'document', 'metakocka', 'magento', 'manual', 'email', 'contact', 'supplier'
    ];
    
    if (sourceTypes.length > 0) {
      const invalidTypes = sourceTypes.filter((type: string) => !validSourceTypes.includes(type as RAGSourceType));
      if (invalidTypes.length > 0) {
        return NextResponse.json({ 
          error: `Invalid source types: ${invalidTypes.join(', ')}. Valid types: ${validSourceTypes.join(', ')}` 
        }, { status: 400 });
      }
    }

    // Create RAG service
    const supabase = createServerClient();
    const ragService = new UnifiedRAGService(supabase, process.env.OPENAI_API_KEY!);

    if (generateResponse) {
      // Generate complete response with AI
      const queryContext = {
        ...context,
        userId: uid,
        organizationId
      };

      const ragResponse = await ragService.queryWithGeneration(
        query,
        organizationId,
        queryContext
      );

      console.log(`[RAG API] Generated response for query: "${query.substring(0, 50)}..."`);

      return NextResponse.json({
        success: true,
        type: 'generated_response',
        answer: ragResponse.answer,
        confidence: ragResponse.confidence,
        sources: ragResponse.sources,
        citations: ragResponse.citations,
        contextUsed: ragResponse.contextUsed,
        tokensUsed: ragResponse.tokensUsed,
        processingTimeMs: ragResponse.processingTimeMs,
        queryId: ragResponse.queryId
      });
    } else {
      // Just retrieve relevant content
      const retrievalOptions = {
        sourceTypes: sourceTypes.length > 0 ? sourceTypes : undefined,
        limit: Math.min(limit, 50), // Cap at 50 results
        similarityThreshold: Math.max(0.1, Math.min(1.0, similarityThreshold)), // Clamp between 0.1 and 1.0
        includeMetadata
      };

      const retrievalResult = await ragService.retrieveRelevantContent(
        query,
        organizationId,
        retrievalOptions
      );

      console.log(`[RAG API] Retrieved ${retrievalResult.chunks.length} chunks for query: "${query.substring(0, 50)}..."`);

      return NextResponse.json({
        success: true,
        type: 'retrieval_only',
        chunks: retrievalResult.chunks,
        totalFound: retrievalResult.totalFound,
        processingTimeMs: retrievalResult.processingTimeMs,
        queryId: retrievalResult.queryId
      });
    }

  } catch (error) {
    console.error('[RAG API] Query error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * GET /api/rag/query - Get recent queries and analytics
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
    const limit = parseInt(searchParams.get('limit') || '20');
    const includeEmbeddings = searchParams.get('include_embeddings') === 'true';

    // Create Supabase client
    const supabase = createServerClient();

    // Get recent queries
    let query = supabase
      .from('rag_query_history')
      .select(includeEmbeddings ? '*' : 'id, query_text, source_types, chunk_ids, response_generated, processing_time_ms, created_at')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(Math.min(limit, 100));

    const { data: recentQueries, error: queriesError } = await query;

    if (queriesError) {
      console.error('[RAG API] Failed to fetch queries:', queriesError);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch query history'
      }, { status: 500 });
    }

    // Get usage analytics for the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: analytics, error: analyticsError } = await supabase
      .from('rag_usage_analytics')
      .select('*')
      .eq('organization_id', organizationId)
      .gte('date', sevenDaysAgo.toISOString().split('T')[0])
      .order('date', { ascending: false });

    // Calculate summary statistics
    const totalQueries = recentQueries?.length || 0;
    const successfulQueries = recentQueries?.filter(q => q.response_generated).length || 0;
    const avgProcessingTime = totalQueries > 0 
      ? recentQueries!.reduce((sum, q) => sum + (q.processing_time_ms || 0), 0) / totalQueries
      : 0;

    // Get most common source types
    const sourceTypeCount: Record<string, number> = {};
    recentQueries?.forEach(q => {
      if (q.source_types) {
        q.source_types.forEach((type: string) => {
          sourceTypeCount[type] = (sourceTypeCount[type] || 0) + 1;
        });
      }
    });

    return NextResponse.json({
      success: true,
      recentQueries: recentQueries || [],
      analytics: analytics || [],
      summary: {
        totalQueries,
        successfulQueries,
        successRate: totalQueries > 0 ? (successfulQueries / totalQueries) * 100 : 0,
        avgProcessingTimeMs: Math.round(avgProcessingTime),
        mostUsedSourceTypes: Object.entries(sourceTypeCount)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([type, count]) => ({ type, count }))
      }
    });

  } catch (error) {
    console.error('[RAG API] Query history error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}


