import { UnifiedRAGService } from '../unified-rag-service';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import { MetakockaAIIntegrationService } from '@/lib/integrations/metakocka/metakocka-ai-integration';

/**
 * Live Metakocka Adapter
 * Uses Metakocka as source of truth - only queries RAG for recommendations
 * Gets live data directly from Metakocka API
 */
export class LiveMetakockaAdapter {
  private ragService: UnifiedRAGService;
  private supabase: SupabaseClient<Database>;
  private metakockaService: MetakockaAIIntegrationService;

  constructor(
    ragService: UnifiedRAGService,
    supabase: SupabaseClient<Database>
  ) {
    this.ragService = ragService;
    this.supabase = supabase;
    this.metakockaService = new MetakockaAIIntegrationService();
  }

  /**
   * Enhanced email response with live Metakocka data + RAG recommendations
   */
  async generateEmailWithLiveData(
    originalEmail: string,
    senderEmail: string,
    organizationId: string,
    userId: string
  ): Promise<{
    response: string;
    liveData: {
      customerInfo?: any;
      recentOrders?: any[];
      shippingStatus?: any[];
      availableProducts?: any[];
    };
    ragRecommendations: {
      upsellProducts: any[];
      relatedProducts: any[];
      relevantDocuments: any[];
    };
    confidence: number;
  }> {
    try {
      console.log('[Live Metakocka] Processing email with live data integration');

      // 1. Get live customer data from Metakocka (source of truth)
      const liveData = await this.getLiveCustomerData(senderEmail, userId);

      // 2. Use RAG for intelligent product recommendations based on email content
      const ragRecommendations = await this.getRAGRecommendations(
        originalEmail,
        liveData.customerInfo,
        organizationId
      );

      // 3. Generate contextual response combining live data + RAG insights
      const response = await this.generateContextualResponse(
        originalEmail,
        liveData,
        ragRecommendations,
        organizationId
      );

      return {
        response: response.answer,
        liveData,
        ragRecommendations,
        confidence: response.confidence
      };

    } catch (error) {
      console.error('[Live Metakocka] Email generation failed:', error);
      throw error;
    }
  }

  /**
   * Get live customer data from Metakocka API (not stored locally)
   */
  private async getLiveCustomerData(senderEmail: string, userId: string): Promise<{
    customerInfo?: any;
    recentOrders?: any[];
    shippingStatus?: any[];
    availableProducts?: any[];
  }> {
    try {
      // Get comprehensive AI context from Metakocka (live data)
      const aiContext = await this.metakockaService.getAIContext(userId);

      // Find customer by email in live Metakocka data
      const customer = aiContext.customers?.find(
        (c: any) => c.email?.toLowerCase() === senderEmail.toLowerCase()
      );

      if (!customer) {
        console.log(`[Live Metakocka] Customer not found for email: ${senderEmail}`);
        return {
          customerInfo: null,
          recentOrders: [],
          shippingStatus: [],
          availableProducts: aiContext.products?.slice(0, 10) || []
        };
      }

      // Get customer's recent orders
      const recentOrders = aiContext.orders?.filter(
        (order: any) => order.customerId === customer.id || 
                       order.customerEmail === senderEmail
      ).slice(0, 5) || [];

      // Get shipping status for recent orders
      const shippingStatus = recentOrders.map((order: any) => ({
        orderNumber: order.orderNumber,
        status: order.status,
        trackingNumber: order.trackingNumber,
        estimatedDelivery: order.estimatedDelivery,
        shippingAddress: order.shippingAddress
      }));

      return {
        customerInfo: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          company: customer.company,
          phone: customer.phone,
          address: customer.address,
          customerSince: customer.createdAt,
          totalOrders: recentOrders.length,
          lastOrderDate: recentOrders[0]?.orderDate,
          preferredPaymentMethod: customer.preferredPaymentMethod,
          creditLimit: customer.creditLimit,
          currentBalance: customer.currentBalance
        },
        recentOrders: recentOrders.map((order: any) => ({
          orderNumber: order.orderNumber,
          date: order.orderDate,
          total: order.totalAmount,
          currency: order.currency,
          status: order.status,
          items: order.items?.map((item: any) => ({
            productName: item.productName,
            quantity: item.quantity,
            price: item.price
          })) || []
        })),
        shippingStatus,
        availableProducts: aiContext.products?.slice(0, 20) || []
      };

    } catch (error) {
      console.error('[Live Metakocka] Failed to get live customer data:', error);
      return {
        customerInfo: null,
        recentOrders: [],
        shippingStatus: [],
        availableProducts: []
      };
    }
  }

  /**
   * Use RAG for intelligent product recommendations (not live data storage)
   */
  private async getRAGRecommendations(
    emailContent: string,
    customerInfo: any,
    organizationId: string
  ): Promise<{
    upsellProducts: any[];
    relatedProducts: any[];
    relevantDocuments: any[];
  }> {
    try {
      // Build intelligent query based on email content + customer context
      let ragQuery = emailContent;

      if (customerInfo?.lastOrderDate) {
        ragQuery += ` customer previous orders ${customerInfo.company}`;
      }

      // Get RAG recommendations for products and documents
      const ragResult = await this.ragService.retrieveRelevantContent(
        ragQuery,
        organizationId,
        {
          sourceTypes: ['product', 'document'],
          limit: 10,
          similarityThreshold: 0.6
        }
      );

      // Separate product recommendations from documents
      const productRecommendations = ragResult.chunks.filter(
        chunk => chunk.source.sourceType === 'product'
      );

      const documentRecommendations = ragResult.chunks.filter(
        chunk => chunk.source.sourceType === 'document'
      );

      // Intelligent upsell logic based on customer history
      const upsellProducts = this.generateUpsellRecommendations(
        productRecommendations,
        customerInfo
      );

      return {
        upsellProducts: upsellProducts.slice(0, 3),
        relatedProducts: productRecommendations.slice(0, 5).map(chunk => ({
          id: chunk.source.sourceId,
          title: chunk.source.title,
          similarity: chunk.similarity,
          reason: this.generateRecommendationReason(chunk, customerInfo)
        })),
        relevantDocuments: documentRecommendations.slice(0, 3).map(chunk => ({
          id: chunk.source.sourceId,
          title: chunk.source.title,
          similarity: chunk.similarity,
          type: chunk.metadata.documentType
        }))
      };

    } catch (error) {
      console.error('[Live Metakocka] RAG recommendations failed:', error);
      return {
        upsellProducts: [],
        relatedProducts: [],
        relevantDocuments: []
      };
    }
  }

  /**
   * Generate intelligent upsell recommendations
   */
  private generateUpsellRecommendations(
    productRecommendations: any[],
    customerInfo: any
  ): any[] {
    if (!customerInfo || !productRecommendations.length) {
      return [];
    }

    return productRecommendations
      .map(chunk => ({
        id: chunk.source.sourceId,
        title: chunk.source.title,
        similarity: chunk.similarity,
        upsellReason: this.generateUpsellReason(chunk, customerInfo),
        priority: this.calculateUpsellPriority(chunk, customerInfo)
      }))
      .sort((a, b) => b.priority - a.priority);
  }

  /**
   * Generate contextual response combining live data + RAG
   */
  private async generateContextualResponse(
    originalEmail: string,
    liveData: any,
    ragRecommendations: any,
    organizationId: string
  ): Promise<{ answer: string; confidence: number }> {
    // Build context from live Metakocka data
    let context = `Customer Context:\n`;
    
    if (liveData.customerInfo) {
      context += `- Customer: ${liveData.customerInfo.name} (${liveData.customerInfo.company})\n`;
      context += `- Customer since: ${liveData.customerInfo.customerSince}\n`;
      context += `- Total orders: ${liveData.customerInfo.totalOrders}\n`;
      
      if (liveData.customerInfo.currentBalance) {
        context += `- Current balance: ${liveData.customerInfo.currentBalance}\n`;
      }
    }

    if (liveData.recentOrders.length > 0) {
      context += `\nRecent Orders:\n`;
      liveData.recentOrders.slice(0, 2).forEach((order: any) => {
        context += `- Order ${order.orderNumber}: ${order.total} ${order.currency} (${order.status})\n`;
      });
    }

    if (liveData.shippingStatus.length > 0) {
      context += `\nShipping Status:\n`;
      liveData.shippingStatus.forEach((shipping: any) => {
        context += `- ${shipping.orderNumber}: ${shipping.status}\n`;
      });
    }

    // Add RAG recommendations
    if (ragRecommendations.upsellProducts.length > 0) {
      context += `\nRecommended Products:\n`;
      ragRecommendations.upsellProducts.slice(0, 2).forEach((product: any) => {
        context += `- ${product.title}: ${product.upsellReason}\n`;
      });
    }

    // Generate response using RAG service with enhanced context
    const queryContext = {
      userId: liveData.customerInfo?.id || 'unknown',
      organizationId,
      userIntent: 'customer_service',
      maxContextTokens: 3000
    };

    const response = await this.ragService.queryWithGeneration(
      `${originalEmail}\n\nContext: ${context}`,
      organizationId,
      queryContext
    );

    return {
      answer: response.answer,
      confidence: response.confidence
    };
  }

  private generateRecommendationReason(chunk: any, customerInfo: any): string {
    if (!customerInfo) return 'Related to your inquiry';
    
    return `Recommended for ${customerInfo.company} based on your business needs`;
  }

  private generateUpsellReason(chunk: any, customerInfo: any): string {
    if (!customerInfo) return 'Complementary product';
    
    const reasons = [
      'Frequently bought together with your previous orders',
      'Perfect complement to your existing setup',
      'Recommended upgrade based on your usage pattern',
      'Popular choice among similar businesses'
    ];

    return reasons[Math.floor(Math.random() * reasons.length)];
  }

  private calculateUpsellPriority(chunk: any, customerInfo: any): number {
    let priority = chunk.similarity * 100;
    
    // Boost priority for customers with higher order history
    if (customerInfo?.totalOrders > 5) {
      priority += 20;
    }
    
    // Boost for recent customers
    if (customerInfo?.lastOrderDate) {
      const daysSinceLastOrder = Math.floor(
        (Date.now() - new Date(customerInfo.lastOrderDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceLastOrder < 30) {
        priority += 15;
      }
    }

    return priority;
  }

  /**
   * Quick customer lookup by email (live data)
   */
  async findCustomerByEmail(email: string, userId: string): Promise<any> {
    try {
      const aiContext = await this.metakockaService.getAIContext(userId);
      return aiContext.customers?.find(
        (c: any) => c.email?.toLowerCase() === email.toLowerCase()
      );
    } catch (error) {
      console.error('[Live Metakocka] Customer lookup failed:', error);
      return null;
    }
  }

  /**
   * Get live shipping status for order
   */
  async getShippingStatus(orderNumber: string, userId: string): Promise<any> {
    try {
      const aiContext = await this.metakockaService.getAIContext(userId);
      return aiContext.orders?.find(
        (order: any) => order.orderNumber === orderNumber
      );
    } catch (error) {
      console.error('[Live Metakocka] Shipping status lookup failed:', error);
      return null;
    }
  }
}


