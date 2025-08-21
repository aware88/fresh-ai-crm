import { UnifiedRAGService } from '../unified-rag-service';
import { IngestContent, RAGSourceType } from '@/types/rag';
import { MetakockaAIIntegrationService } from '@/lib/integrations/metakocka/metakocka-ai-integration';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

/**
 * Metakocka RAG Adapter
 * Integrates existing Metakocka data with the RAG system
 * Works with the existing MetakockaAIIntegrationService
 */
export class MetakockaRAGAdapter {
  private ragService: UnifiedRAGService;
  private metakockaService: MetakockaAIIntegrationService;
  private supabase: SupabaseClient<Database>;

  constructor(
    ragService: UnifiedRAGService,
    supabase: SupabaseClient<Database>
  ) {
    this.ragService = ragService;
    this.supabase = supabase;
    this.metakockaService = new MetakockaAIIntegrationService();
  }

  /**
   * Sync all Metakocka data for an organization into RAG
   */
  async syncAllMetakockaData(organizationId: string, userId: string): Promise<{
    products: number;
    customers: number;
    orders: number;
    totalIngested: number;
    errors: string[];
  }> {
    const results = {
      products: 0,
      customers: 0,
      orders: 0,
      totalIngested: 0,
      errors: [] as string[]
    };

    try {
      console.log(`[Metakocka RAG] Starting full sync for organization ${organizationId}`);

      // Get comprehensive AI context from existing service
      const aiContext = await this.metakockaService.getAIContext(userId);

      // Sync products
      if (aiContext.products && aiContext.products.length > 0) {
        const productResults = await this.syncProducts(organizationId, aiContext.products);
        results.products = productResults.success;
        results.errors.push(...productResults.errors);
      }

      // Sync customers
      if (aiContext.customers && aiContext.customers.length > 0) {
        const customerResults = await this.syncCustomers(organizationId, aiContext.customers);
        results.customers = customerResults.success;
        results.errors.push(...customerResults.errors);
      }

      // Sync orders
      if (aiContext.orders && aiContext.orders.length > 0) {
        const orderResults = await this.syncOrders(organizationId, aiContext.orders);
        results.orders = orderResults.success;
        results.errors.push(...orderResults.errors);
      }

      results.totalIngested = results.products + results.customers + results.orders;

      console.log(`[Metakocka RAG] Sync completed: ${results.totalIngested} items ingested, ${results.errors.length} errors`);

      return results;
    } catch (error) {
      console.error('[Metakocka RAG] Sync failed:', error);
      results.errors.push(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return results;
    }
  }

  /**
   * Sync Metakocka products into RAG
   */
  async syncProducts(organizationId: string, products: any[]): Promise<{
    success: number;
    errors: string[];
  }> {
    const results = { success: 0, errors: [] as string[] };

    for (const product of products) {
      try {
        const content = this.formatProductForRAG(product);
        
        const result = await this.ragService.ingestContent(
          organizationId,
          content,
          { skipIfExists: true }
        );

        if (result.success) {
          results.success++;
        } else {
          results.errors.push(`Product ${product.name}: ${result.error}`);
        }
      } catch (error) {
        results.errors.push(`Product ${product.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return results;
  }

  /**
   * Sync Metakocka customers into RAG
   */
  async syncCustomers(organizationId: string, customers: any[]): Promise<{
    success: number;
    errors: string[];
  }> {
    const results = { success: 0, errors: [] as string[] };

    for (const customer of customers) {
      try {
        const content = this.formatCustomerForRAG(customer);
        
        const result = await this.ragService.ingestContent(
          organizationId,
          content,
          { skipIfExists: true }
        );

        if (result.success) {
          results.success++;
        } else {
          results.errors.push(`Customer ${customer.name}: ${result.error}`);
        }
      } catch (error) {
        results.errors.push(`Customer ${customer.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return results;
  }

  /**
   * Sync Metakocka orders into RAG
   */
  async syncOrders(organizationId: string, orders: any[]): Promise<{
    success: number;
    errors: string[];
  }> {
    const results = { success: 0, errors: [] as string[] };

    for (const order of orders) {
      try {
        const content = this.formatOrderForRAG(order);
        
        const result = await this.ragService.ingestContent(
          organizationId,
          content,
          { skipIfExists: true }
        );

        if (result.success) {
          results.success++;
        } else {
          results.errors.push(`Order ${order.orderNumber}: ${result.error}`);
        }
      } catch (error) {
        results.errors.push(`Order ${order.orderNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return results;
  }

  /**
   * Sync specific product by ID
   */
  async syncProductById(
    organizationId: string, 
    userId: string, 
    metakockaProductId: string
  ): Promise<boolean> {
    try {
      // Get product data from existing Metakocka integration
      const { data: mapping } = await this.supabase
        .from('metakocka_product_mappings')
        .select('*')
        .eq('metakocka_id', metakockaProductId)
        .eq('user_id', userId)
        .single();

      if (!mapping) {
        console.warn(`[Metakocka RAG] No mapping found for product ${metakockaProductId}`);
        return false;
      }

      // Get the full product data
      const { data: product } = await this.supabase
        .from('products')
        .select('*')
        .eq('id', mapping.product_id)
        .single();

      if (!product) {
        console.warn(`[Metakocka RAG] Product not found: ${mapping.product_id}`);
        return false;
      }

      // Convert to RAG format and ingest
      const content = this.formatProductForRAG({
        id: product.id,
        name: product.name,
        code: product.sku || mapping.metakocka_code,
        description: product.description,
        category: product.category,
        metadata: product.metadata,
        metakockaId: metakockaProductId
      });

      const result = await this.ragService.ingestContent(
        organizationId,
        content,
        { forceUpdate: true }
      );

      return result.success;
    } catch (error) {
      console.error('[Metakocka RAG] Failed to sync product:', error);
      return false;
    }
  }

  /**
   * Format product data for RAG ingestion
   */
  private formatProductForRAG(product: any): IngestContent {
    const sections: string[] = [];

    sections.push(`Product: ${product.name}`);
    
    if (product.code) {
      sections.push(`Code/SKU: ${product.code}`);
    }

    if (product.description) {
      sections.push(`Description: ${product.description}`);
    }

    if (product.category) {
      sections.push(`Category: ${product.category}`);
    }

    if (product.price !== undefined) {
      sections.push(`Price: ${product.price} ${product.currency || 'EUR'}`);
    }

    if (product.stockQuantity !== undefined) {
      sections.push(`Stock: ${product.stockQuantity} ${product.unit || 'units'}`);
    }

    if (product.specifications) {
      const specs = Object.entries(product.specifications)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');
      sections.push(`Specifications:\n${specs}`);
    }

    if (product.attributes) {
      const attrs = Object.entries(product.attributes)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');
      sections.push(`Attributes:\n${attrs}`);
    }

    return {
      title: product.name,
      content: sections.join('\n\n'),
      sourceType: 'metakocka' as RAGSourceType,
      sourceId: product.id || product.metakockaId,
      metadata: {
        metakockaId: product.metakockaId || product.id,
        code: product.code,
        category: product.category,
        price: product.price,
        currency: product.currency || 'EUR',
        stockQuantity: product.stockQuantity,
        unit: product.unit,
        lastSynced: new Date().toISOString()
      }
    };
  }

  /**
   * Format customer data for RAG ingestion
   */
  private formatCustomerForRAG(customer: any): IngestContent {
    const sections: string[] = [];

    sections.push(`Customer: ${customer.name}`);
    
    if (customer.code) {
      sections.push(`Customer Code: ${customer.code}`);
    }

    if (customer.email) {
      sections.push(`Email: ${customer.email}`);
    }

    if (customer.phone) {
      sections.push(`Phone: ${customer.phone}`);
    }

    if (customer.address) {
      sections.push(`Address: ${customer.address}`);
    }

    if (customer.taxNumber) {
      sections.push(`Tax Number: ${customer.taxNumber}`);
    }

    if (customer.notes) {
      sections.push(`Notes: ${customer.notes}`);
    }

    if (customer.tags && customer.tags.length > 0) {
      sections.push(`Tags: ${customer.tags.join(', ')}`);
    }

    return {
      title: customer.name,
      content: sections.join('\n\n'),
      sourceType: 'metakocka' as RAGSourceType,
      sourceId: customer.id || customer.metakockaId,
      metadata: {
        metakockaId: customer.metakockaId || customer.id,
        code: customer.code,
        email: customer.email,
        phone: customer.phone,
        taxNumber: customer.taxNumber,
        tags: customer.tags,
        lastSynced: new Date().toISOString()
      }
    };
  }

  /**
   * Format order data for RAG ingestion
   */
  private formatOrderForRAG(order: any): IngestContent {
    const sections: string[] = [];

    sections.push(`Order: ${order.orderNumber}`);
    
    if (order.customerName) {
      sections.push(`Customer: ${order.customerName}`);
    }

    if (order.orderDate) {
      sections.push(`Date: ${order.orderDate}`);
    }

    if (order.totalAmount !== undefined) {
      sections.push(`Total: ${order.totalAmount} ${order.currency || 'EUR'}`);
    }

    if (order.status) {
      sections.push(`Status: ${order.status}`);
    }

    if (order.items && order.items.length > 0) {
      const itemsList = order.items
        .map((item: any) => `- ${item.productName} (Qty: ${item.quantity}, Price: ${item.price})`)
        .join('\n');
      sections.push(`Items:\n${itemsList}`);
    }

    if (order.notes) {
      sections.push(`Notes: ${order.notes}`);
    }

    if (order.deliveryAddress) {
      sections.push(`Delivery Address: ${order.deliveryAddress}`);
    }

    return {
      title: `Order ${order.orderNumber}`,
      content: sections.join('\n\n'),
      sourceType: 'metakocka' as RAGSourceType,
      sourceId: order.id || order.metakockaId,
      metadata: {
        metakockaId: order.metakockaId || order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        orderDate: order.orderDate,
        totalAmount: order.totalAmount,
        currency: order.currency || 'EUR',
        status: order.status,
        itemCount: order.items?.length || 0,
        lastSynced: new Date().toISOString()
      }
    };
  }

  /**
   * Get sync status for organization
   */
  async getSyncStatus(organizationId: string): Promise<{
    lastSyncAt: string | null;
    totalItems: number;
    productCount: number;
    customerCount: number;
    orderCount: number;
    lastErrors: string[];
  }> {
    try {
      const { data: knowledgeBases } = await this.supabase
        .from('rag_knowledge_base')
        .select('source_type, updated_at, metadata')
        .eq('organization_id', organizationId)
        .eq('source_type', 'metakocka')
        .eq('status', 'active');

      if (!knowledgeBases || knowledgeBases.length === 0) {
        return {
          lastSyncAt: null,
          totalItems: 0,
          productCount: 0,
          customerCount: 0,
          orderCount: 0,
          lastErrors: []
        };
      }

      const productCount = knowledgeBases.filter(kb => 
        kb.metadata?.metakockaId && !kb.metadata?.orderNumber && !kb.metadata?.email
      ).length;

      const customerCount = knowledgeBases.filter(kb => 
        kb.metadata?.email || (kb.metadata?.metakockaId && kb.title.startsWith('Customer'))
      ).length;

      const orderCount = knowledgeBases.filter(kb => 
        kb.metadata?.orderNumber
      ).length;

      const lastSyncAt = knowledgeBases
        .map(kb => new Date(kb.updated_at))
        .sort((a, b) => b.getTime() - a.getTime())[0]
        .toISOString();

      return {
        lastSyncAt,
        totalItems: knowledgeBases.length,
        productCount,
        customerCount,
        orderCount,
        lastErrors: [] // Could be populated from error logs
      };
    } catch (error) {
      console.error('[Metakocka RAG] Failed to get sync status:', error);
      return {
        lastSyncAt: null,
        totalItems: 0,
        productCount: 0,
        customerCount: 0,
        orderCount: 0,
        lastErrors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Clean up old Metakocka data from RAG
   */
  async cleanupOldData(organizationId: string, olderThanDays: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const { data: oldKnowledgeBases } = await this.supabase
        .from('rag_knowledge_base')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('source_type', 'metakocka')
        .lt('updated_at', cutoffDate.toISOString());

      if (!oldKnowledgeBases || oldKnowledgeBases.length === 0) {
        return 0;
      }

      let deletedCount = 0;
      for (const kb of oldKnowledgeBases) {
        const success = await this.ragService.deleteKnowledgeBase(kb.id, organizationId);
        if (success) deletedCount++;
      }

      console.log(`[Metakocka RAG] Cleaned up ${deletedCount} old knowledge bases`);
      return deletedCount;
    } catch (error) {
      console.error('[Metakocka RAG] Cleanup failed:', error);
      return 0;
    }
  }
}


