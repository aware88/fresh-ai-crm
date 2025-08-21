import { UnifiedRAGService } from '../unified-rag-service';
import { IngestContent, RAGSourceType } from '@/types/rag';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

/**
 * Product RAG Adapter
 * Integrates local products with the RAG system
 * Handles both individual products and bulk operations
 */
export class ProductRAGAdapter {
  private ragService: UnifiedRAGService;
  private supabase: SupabaseClient<Database>;

  constructor(
    ragService: UnifiedRAGService,
    supabase: SupabaseClient<Database>
  ) {
    this.ragService = ragService;
    this.supabase = supabase;
  }

  /**
   * Sync all products for an organization into RAG
   */
  async syncAllProducts(organizationId: string): Promise<{
    processed: number;
    successful: number;
    failed: number;
    errors: string[];
  }> {
    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
      errors: [] as string[]
    };

    try {
      console.log(`[Product RAG] Starting product sync for organization ${organizationId}`);

      // Get all active products for the organization
      const { data: products, error } = await this.supabase
        .from('products')
        .select('*')
        .eq('organization_id', organizationId);

      if (error) {
        results.errors.push(`Failed to fetch products: ${error.message}`);
        return results;
      }

      if (!products || products.length === 0) {
        console.log('[Product RAG] No products found to sync');
        return results;
      }

      console.log(`[Product RAG] Found ${products.length} products to sync`);

      // Process each product
      for (const product of products) {
        results.processed++;

        try {
          const success = await this.syncSingleProduct(organizationId, product);
          
          if (success) {
            results.successful++;
          } else {
            results.failed++;
            results.errors.push(`Failed to sync product: ${product.name}`);
          }
        } catch (error) {
          results.failed++;
          results.errors.push(`Error syncing product ${product.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        // Small delay to prevent overwhelming the system
        await this.delay(100);
      }

      console.log(`[Product RAG] Product sync completed: ${results.successful}/${results.processed} successful`);

      return results;
    } catch (error) {
      console.error('[Product RAG] Product sync failed:', error);
      results.errors.push(`Product sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return results;
    }
  }

  /**
   * Sync a single product into RAG
   */
  async syncSingleProduct(organizationId: string, product: any): Promise<boolean> {
    try {
      // Get additional product data (pricing, mappings, etc.)
      const enrichedProduct = await this.enrichProductData(product);

      // Format for RAG ingestion
      const content = this.formatProductForRAG(enrichedProduct);

      // Ingest into RAG system
      const result = await this.ragService.ingestContent(
        organizationId,
        content,
        {
          chunkSize: 600, // Smaller chunks for structured product data
          chunkOverlap: 100,
          preserveStructure: true,
          skipIfExists: false // Always update products to keep them fresh
        }
      );

      if (result.success) {
        console.log(`[Product RAG] Successfully synced product: ${product.name} (${result.chunksCreated} chunks)`);
      } else {
        console.error(`[Product RAG] Failed to sync product ${product.name}:`, result.error);
      }

      return result.success;
    } catch (error) {
      console.error(`[Product RAG] Error syncing product ${product.name}:`, error);
      return false;
    }
  }

  /**
   * Sync products that have been recently updated
   */
  async syncRecentlyUpdatedProducts(
    organizationId: string,
    hoursBack: number = 24
  ): Promise<{
    processed: number;
    successful: number;
    failed: number;
  }> {
    const results = {
      processed: 0,
      successful: 0,
      failed: 0
    };

    try {
      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() - hoursBack);

      const { data: recentProducts, error } = await this.supabase
        .from('products')
        .select('*')
        .eq('organization_id', organizationId)
        .gte('updated_at', cutoffTime.toISOString());

      if (error || !recentProducts || recentProducts.length === 0) {
        return results;
      }

      console.log(`[Product RAG] Found ${recentProducts.length} recently updated products`);

      for (const product of recentProducts) {
        results.processed++;
        
        const success = await this.syncSingleProduct(organizationId, product);
        
        if (success) {
          results.successful++;
        } else {
          results.failed++;
        }

        await this.delay(100);
      }

      return results;
    } catch (error) {
      console.error('[Product RAG] Recent products sync failed:', error);
      return results;
    }
  }

  /**
   * Sync products by category
   */
  async syncProductsByCategory(
    organizationId: string,
    categories: string[]
  ): Promise<{
    processed: number;
    successful: number;
    failed: number;
    byCategory: Record<string, number>;
  }> {
    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
      byCategory: {} as Record<string, number>
    };

    try {
      const { data: products, error } = await this.supabase
        .from('products')
        .select('*')
        .eq('organization_id', organizationId)
        .in('category', categories);

      if (error || !products || products.length === 0) {
        return results;
      }

      for (const product of products) {
        results.processed++;
        const category = product.category || 'uncategorized';
        results.byCategory[category] = (results.byCategory[category] || 0) + 1;

        const success = await this.syncSingleProduct(organizationId, product);
        
        if (success) {
          results.successful++;
        } else {
          results.failed++;
        }

        await this.delay(100);
      }

      return results;
    } catch (error) {
      console.error('[Product RAG] Category sync failed:', error);
      return results;
    }
  }

  /**
   * Enrich product data with additional information
   */
  private async enrichProductData(product: any): Promise<any> {
    const enrichedProduct = { ...product };

    try {
      // Get pricing information
      const { data: pricing } = await this.supabase
        .from('supplier_pricing')
        .select('*')
        .eq('product_id', product.id);

      if (pricing && pricing.length > 0) {
        enrichedProduct.pricing = pricing.map(p => ({
          supplier_id: p.supplier_id,
          price: p.price,
          currency: p.currency,
          unit: p.unit
        }));

        // Calculate price ranges
        const prices = pricing.map(p => p.price);
        enrichedProduct.priceRange = {
          min: Math.min(...prices),
          max: Math.max(...prices),
          average: prices.reduce((sum, price) => sum + price, 0) / prices.length
        };
      }

      // Get Metakocka mapping if exists
      const { data: metakockaMapping } = await this.supabase
        .from('metakocka_product_mappings')
        .select('*')
        .eq('product_id', product.id)
        .single();

      if (metakockaMapping) {
        enrichedProduct.metakockaMapping = {
          metakockaId: metakockaMapping.metakocka_id,
          metakockaCode: metakockaMapping.metakocka_code,
          syncStatus: metakockaMapping.sync_status,
          lastSynced: metakockaMapping.last_synced_at
        };
      }

      // Get supplier information
      if (enrichedProduct.pricing) {
        const supplierIds = enrichedProduct.pricing.map((p: any) => p.supplier_id);
        const { data: suppliers } = await this.supabase
          .from('suppliers')
          .select('id, name, reliability_score')
          .in('id', supplierIds);

        if (suppliers) {
          enrichedProduct.suppliers = suppliers.map(s => ({
            id: s.id,
            name: s.name,
            reliabilityScore: s.reliability_score
          }));
        }
      }

      return enrichedProduct;
    } catch (error) {
      console.warn(`[Product RAG] Failed to enrich product ${product.name}:`, error);
      return product; // Return original product if enrichment fails
    }
  }

  /**
   * Format product for RAG ingestion
   */
  private formatProductForRAG(product: any): IngestContent {
    const sections: string[] = [];

    // Basic product information
    sections.push(`Product: ${product.name}`);
    
    if (product.sku) {
      sections.push(`SKU: ${product.sku}`);
    }

    if (product.category) {
      sections.push(`Category: ${product.category}`);
    }

    if (product.description) {
      sections.push(`Description: ${product.description}`);
    }

    if (product.unit) {
      sections.push(`Unit: ${product.unit}`);
    }

    // Pricing information
    if (product.pricing && product.pricing.length > 0) {
      const pricingInfo = product.pricing
        .map((p: any) => `${p.price} ${p.currency} per ${p.unit || 'unit'}`)
        .join(', ');
      sections.push(`Pricing: ${pricingInfo}`);

      if (product.priceRange) {
        sections.push(`Price Range: ${product.priceRange.min} - ${product.priceRange.max} (avg: ${product.priceRange.average.toFixed(2)})`);
      }
    }

    // Supplier information
    if (product.suppliers && product.suppliers.length > 0) {
      const supplierInfo = product.suppliers
        .map((s: any) => {
          const reliability = s.reliabilityScore ? ` (reliability: ${s.reliabilityScore})` : '';
          return `${s.name}${reliability}`;
        })
        .join(', ');
      sections.push(`Suppliers: ${supplierInfo}`);
    }

    // Metakocka integration info
    if (product.metakockaMapping) {
      sections.push(`Metakocka Code: ${product.metakockaMapping.metakockaCode}`);
      sections.push(`Sync Status: ${product.metakockaMapping.syncStatus}`);
    }

    // Metadata information
    if (product.metadata && typeof product.metadata === 'object') {
      const metadataEntries = Object.entries(product.metadata)
        .filter(([key, value]) => value !== null && value !== undefined && value !== '')
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');
      
      if (metadataEntries) {
        sections.push(`Additional Information:\n${metadataEntries}`);
      }
    }

    return {
      title: product.name,
      content: sections.join('\n\n'),
      sourceType: 'product' as RAGSourceType,
      sourceId: product.id,
      metadata: {
        productId: product.id,
        sku: product.sku,
        category: product.category,
        unit: product.unit,
        hasMetakockaMapping: !!product.metakockaMapping,
        supplierCount: product.suppliers?.length || 0,
        priceRange: product.priceRange,
        createdAt: product.created_at,
        updatedAt: product.updated_at,
        userId: product.user_id,
        organizationId: product.organization_id
      }
    };
  }

  /**
   * Get product sync statistics
   */
  async getSyncStats(organizationId: string): Promise<{
    totalProducts: number;
    syncedToRAG: number;
    lastSyncAt: string | null;
    byCategory: Record<string, { total: number; synced: number }>;
    recentActivity: Array<{
      productName: string;
      action: string;
      timestamp: string;
    }>;
  }> {
    try {
      // Get total products
      const { data: products, error: productsError } = await this.supabase
        .from('products')
        .select('name, category, updated_at')
        .eq('organization_id', organizationId);

      if (productsError || !products) {
        return {
          totalProducts: 0,
          syncedToRAG: 0,
          lastSyncAt: null,
          byCategory: {},
          recentActivity: []
        };
      }

      // Get RAG knowledge bases for products
      const { data: ragProducts, error: ragError } = await this.supabase
        .from('rag_knowledge_base')
        .select('source_id, title, updated_at, metadata')
        .eq('organization_id', organizationId)
        .eq('source_type', 'product')
        .eq('status', 'active');

      const syncedCount = ragProducts?.length || 0;
      const lastSyncAt = ragProducts && ragProducts.length > 0
        ? ragProducts
            .map(r => new Date(r.updated_at))
            .sort((a, b) => b.getTime() - a.getTime())[0]
            .toISOString()
        : null;

      // Calculate by category
      const byCategory: Record<string, { total: number; synced: number }> = {};
      const syncedProductIds = new Set(ragProducts?.map(r => r.source_id) || []);

      products.forEach(product => {
        const category = product.category || 'uncategorized';
        if (!byCategory[category]) {
          byCategory[category] = { total: 0, synced: 0 };
        }
        byCategory[category].total++;
        if (syncedProductIds.has(product.id)) {
          byCategory[category].synced++;
        }
      });

      // Recent activity (last 10 updated products)
      const recentActivity = products
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        .slice(0, 10)
        .map(product => ({
          productName: product.name,
          action: syncedProductIds.has(product.id) ? 'synced' : 'pending',
          timestamp: product.updated_at
        }));

      return {
        totalProducts: products.length,
        syncedToRAG: syncedCount,
        lastSyncAt,
        byCategory,
        recentActivity
      };
    } catch (error) {
      console.error('[Product RAG] Failed to get sync stats:', error);
      return {
        totalProducts: 0,
        syncedToRAG: 0,
        lastSyncAt: null,
        byCategory: {},
        recentActivity: []
      };
    }
  }

  /**
   * Remove products from RAG that no longer exist
   */
  async cleanupDeletedProducts(organizationId: string): Promise<number> {
    try {
      // Get all product IDs in RAG
      const { data: ragProducts } = await this.supabase
        .from('rag_knowledge_base')
        .select('id, source_id')
        .eq('organization_id', organizationId)
        .eq('source_type', 'product')
        .eq('status', 'active');

      if (!ragProducts || ragProducts.length === 0) {
        return 0;
      }

      // Get all existing product IDs
      const { data: existingProducts } = await this.supabase
        .from('products')
        .select('id')
        .eq('organization_id', organizationId);

      const existingProductIds = new Set(existingProducts?.map(p => p.id) || []);

      // Find RAG entries for deleted products
      const deletedProductRAGs = ragProducts.filter(
        rag => !existingProductIds.has(rag.source_id)
      );

      if (deletedProductRAGs.length === 0) {
        return 0;
      }

      // Delete RAG entries for deleted products
      let cleanedCount = 0;
      for (const ragEntry of deletedProductRAGs) {
        const success = await this.ragService.deleteKnowledgeBase(
          ragEntry.id,
          organizationId
        );
        if (success) cleanedCount++;
      }

      console.log(`[Product RAG] Cleaned up ${cleanedCount} deleted products from RAG`);
      return cleanedCount;
    } catch (error) {
      console.error('[Product RAG] Cleanup failed:', error);
      return 0;
    }
  }

  /**
   * Search for products in RAG system
   */
  async searchProducts(
    organizationId: string,
    query: string,
    options: {
      category?: string;
      maxResults?: number;
      similarityThreshold?: number;
    } = {}
  ): Promise<Array<{
    productId: string;
    name: string;
    content: string;
    similarity: number;
    category?: string;
    sku?: string;
  }>> {
    try {
      const sourceTypes = ['product'] as const;
      const retrievalResult = await this.ragService.retrieveRelevantContent(
        query,
        organizationId,
        {
          sourceTypes,
          limit: options.maxResults || 10,
          similarityThreshold: options.similarityThreshold || 0.6
        }
      );

      return retrievalResult.chunks
        .filter(chunk => {
          // Filter by category if specified
          if (options.category) {
            return chunk.metadata.category === options.category;
          }
          return true;
        })
        .map(chunk => ({
          productId: chunk.source.sourceId || '',
          name: chunk.source.title,
          content: chunk.content,
          similarity: chunk.similarity,
          category: chunk.metadata.category,
          sku: chunk.metadata.sku
        }));
    } catch (error) {
      console.error('[Product RAG] Product search failed:', error);
      return [];
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}


