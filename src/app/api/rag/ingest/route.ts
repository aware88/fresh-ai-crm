import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getUID } from '@/lib/auth/utils';
import { UnifiedRAGService } from '@/lib/rag/unified-rag-service';
import { getUserOrganization } from '@/lib/middleware/ai-limit-middleware-v2';
import { IngestContent, RAGSourceType } from '@/types/rag';

/**
 * RAG Ingestion API
 * POST /api/rag/ingest - Ingest content into the RAG system
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
      title, 
      content, 
      sourceType, 
      sourceId, 
      metadata = {},
      options = {} 
    } = body;

    // Validate required fields
    if (!title || !content || !sourceType) {
      return NextResponse.json({ 
        error: 'Missing required fields: title, content, sourceType' 
      }, { status: 400 });
    }

    // Validate source type
    const validSourceTypes: RAGSourceType[] = [
      'product', 'document', 'metakocka', 'magento', 'manual', 'email', 'contact', 'supplier'
    ];
    if (!validSourceTypes.includes(sourceType)) {
      return NextResponse.json({ 
        error: `Invalid source type. Must be one of: ${validSourceTypes.join(', ')}` 
      }, { status: 400 });
    }

    // Create Supabase client and RAG service
    const supabase = createServerClient();
    const ragService = new UnifiedRAGService(supabase, process.env.OPENAI_API_KEY!);

    // Prepare content for ingestion
    const ingestContent: IngestContent = {
      title,
      content,
      sourceType,
      sourceId,
      metadata: {
        ...metadata,
        ingestedBy: uid,
        ingestedAt: new Date().toISOString()
      }
    };

    // Ingest content
    const result = await ragService.ingestContent(
      organizationId,
      ingestContent,
      options
    );

    if (result.success) {
      console.log(`[RAG API] Successfully ingested content: ${title}`);
      return NextResponse.json({
        success: true,
        knowledgeBaseId: result.knowledgeBaseId,
        chunksCreated: result.chunksCreated,
        tokensProcessed: result.tokensProcessed,
        processingTimeMs: result.processingTimeMs
      });
    } else {
      console.error(`[RAG API] Ingestion failed: ${result.error}`);
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 });
    }

  } catch (error) {
    console.error('[RAG API] Ingestion error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * GET /api/rag/ingest - Get ingestion status and statistics
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

    // Create RAG service
    const supabase = createServerClient();
    const ragService = new UnifiedRAGService(supabase, process.env.OPENAI_API_KEY!);

    // Get system statistics
    const stats = await ragService.getSystemStats(organizationId);

    return NextResponse.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('[RAG API] Stats error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}


