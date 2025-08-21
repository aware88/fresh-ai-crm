import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getUID } from '@/lib/auth/utils';
import { UnifiedRAGService } from '@/lib/rag/unified-rag-service';
import { MetakockaRAGAdapter } from '@/lib/rag/adapters/metakocka-rag-adapter';
import { DocumentRAGAdapter } from '@/lib/rag/adapters/document-rag-adapter';
import { ProductRAGAdapter } from '@/lib/rag/adapters/product-rag-adapter';
import { getUserOrganization } from '@/lib/middleware/ai-limit-middleware-v2';
import { RAGSourceType } from '@/types/rag';

/**
 * RAG Sync API
 * POST /api/rag/sync - Sync data sources into the RAG system
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
      sourceTypes = [], 
      options = {},
      force = false 
    } = body;

    // Validate source types
    const validSourceTypes: RAGSourceType[] = [
      'product', 'document', 'metakocka', 'magento'
    ];
    
    if (sourceTypes.length === 0) {
      return NextResponse.json({ 
        error: 'At least one source type must be specified' 
      }, { status: 400 });
    }

    const invalidTypes = sourceTypes.filter((type: string) => !validSourceTypes.includes(type as RAGSourceType));
    if (invalidTypes.length > 0) {
      return NextResponse.json({ 
        error: `Invalid source types: ${invalidTypes.join(', ')}. Valid types: ${validSourceTypes.join(', ')}` 
      }, { status: 400 });
    }

    // Create services
    const supabase = createServerClient();
    const ragService = new UnifiedRAGService(supabase, process.env.OPENAI_API_KEY!);
    
    const metakockaAdapter = new MetakockaRAGAdapter(ragService, supabase);
    const documentAdapter = new DocumentRAGAdapter(ragService, supabase);
    const productAdapter = new ProductRAGAdapter(ragService, supabase);

    const syncResults: Record<string, any> = {};
    const startTime = Date.now();

    console.log(`[RAG Sync] Starting sync for organization ${organizationId}, sources: ${sourceTypes.join(', ')}`);

    // Sync each source type
    for (const sourceType of sourceTypes) {
      const sourceStartTime = Date.now();
      
      try {
        switch (sourceType) {
          case 'metakocka':
            console.log('[RAG Sync] Syncing Metakocka data...');
            syncResults.metakocka = await metakockaAdapter.syncAllMetakockaData(organizationId, uid);
            break;

          case 'document':
            console.log('[RAG Sync] Syncing documents...');
            syncResults.document = await documentAdapter.ingestExistingDocuments(
              organizationId,
              uid,
              {
                batchSize: options.batchSize || 10,
                documentTypes: options.documentTypes,
                skipProcessed: !force
              }
            );
            break;

          case 'product':
            console.log('[RAG Sync] Syncing products...');
            if (options.recentOnly) {
              syncResults.product = await productAdapter.syncRecentlyUpdatedProducts(
                organizationId,
                options.hoursBack || 24
              );
            } else if (options.categories && options.categories.length > 0) {
              syncResults.product = await productAdapter.syncProductsByCategory(
                organizationId,
                options.categories
              );
            } else {
              syncResults.product = await productAdapter.syncAllProducts(organizationId);
            }
            break;

          case 'magento':
            // Placeholder for future Magento integration
            console.log('[RAG Sync] Magento sync not yet implemented');
            syncResults.magento = {
              processed: 0,
              successful: 0,
              failed: 0,
              errors: ['Magento integration not yet implemented']
            };
            break;

          default:
            syncResults[sourceType] = {
              processed: 0,
              successful: 0,
              failed: 0,
              errors: [`Unknown source type: ${sourceType}`]
            };
        }

        const sourceProcessingTime = Date.now() - sourceStartTime;
        syncResults[sourceType].processingTimeMs = sourceProcessingTime;
        
        console.log(`[RAG Sync] ${sourceType} sync completed in ${sourceProcessingTime}ms`);

      } catch (error) {
        console.error(`[RAG Sync] ${sourceType} sync failed:`, error);
        syncResults[sourceType] = {
          processed: 0,
          successful: 0,
          failed: 1,
          errors: [error instanceof Error ? error.message : 'Unknown error'],
          processingTimeMs: Date.now() - sourceStartTime
        };
      }
    }

    const totalProcessingTime = Date.now() - startTime;

    // Calculate totals
    const totals = {
      processed: 0,
      successful: 0,
      failed: 0,
      errors: [] as string[]
    };

    Object.values(syncResults).forEach((result: any) => {
      if (result && typeof result === 'object') {
        totals.processed += result.processed || 0;
        totals.successful += result.successful || 0;
        totals.failed += result.failed || 0;
        if (result.errors && Array.isArray(result.errors)) {
          totals.errors.push(...result.errors);
        }
      }
    });

    console.log(`[RAG Sync] Sync completed: ${totals.successful}/${totals.processed} successful in ${totalProcessingTime}ms`);

    return NextResponse.json({
      success: true,
      syncResults,
      totals: {
        ...totals,
        processingTimeMs: totalProcessingTime
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[RAG Sync] Sync error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * GET /api/rag/sync - Get sync status and statistics
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

    // Create services
    const supabase = createServerClient();
    const ragService = new UnifiedRAGService(supabase, process.env.OPENAI_API_KEY!);
    
    const metakockaAdapter = new MetakockaRAGAdapter(ragService, supabase);
    const documentAdapter = new DocumentRAGAdapter(ragService, supabase);
    const productAdapter = new ProductRAGAdapter(ragService, supabase);

    // Get status from each adapter
    const [
      metakockaStatus,
      documentStatus,
      productStatus,
      systemStats
    ] = await Promise.all([
      metakockaAdapter.getSyncStatus(organizationId),
      documentAdapter.getProcessingStats(organizationId),
      productAdapter.getSyncStats(organizationId),
      ragService.getSystemStats(organizationId)
    ]);

    return NextResponse.json({
      success: true,
      syncStatus: {
        metakocka: metakockaStatus,
        documents: documentStatus,
        products: productStatus
      },
      systemStats,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('[RAG Sync] Status error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * DELETE /api/rag/sync - Clean up old or orphaned data
 */
export async function DELETE(request: NextRequest) {
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
      sourceTypes = [],
      olderThanDays = 30,
      cleanupOrphaned = true
    } = body;

    // Create services
    const supabase = createServerClient();
    const ragService = new UnifiedRAGService(supabase, process.env.OPENAI_API_KEY!);
    
    const metakockaAdapter = new MetakockaRAGAdapter(ragService, supabase);
    const productAdapter = new ProductRAGAdapter(ragService, supabase);

    const cleanupResults: Record<string, number> = {};

    // Clean up each source type
    for (const sourceType of sourceTypes) {
      try {
        switch (sourceType) {
          case 'metakocka':
            cleanupResults.metakocka = await metakockaAdapter.cleanupOldData(organizationId, olderThanDays);
            break;

          case 'product':
            if (cleanupOrphaned) {
              cleanupResults.product = await productAdapter.cleanupDeletedProducts(organizationId);
            }
            break;

          default:
            console.warn(`[RAG Cleanup] Unknown source type: ${sourceType}`);
        }
      } catch (error) {
        console.error(`[RAG Cleanup] ${sourceType} cleanup failed:`, error);
        cleanupResults[sourceType] = 0;
      }
    }

    const totalCleaned = Object.values(cleanupResults).reduce((sum, count) => sum + count, 0);

    console.log(`[RAG Cleanup] Cleaned up ${totalCleaned} items from RAG system`);

    return NextResponse.json({
      success: true,
      cleanupResults,
      totalCleaned,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[RAG Cleanup] Cleanup error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}


