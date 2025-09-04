/**
 * Metakocka AI Integration Service
 * 
 * Provides AI context for product searches and shipment tracking
 */

import { createLazyServerClient } from '@/lib/supabase/lazy-client';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface MetakockaAIContext {
  products: ProductForAI[];
  shipments: ShipmentForAI[];
  customers: CustomerForAI[];
  orders: OrderForAI[];
  inventory: InventoryForAI[];
  metadata: {
    lastSync: string;
    dataFreshness: 'fresh' | 'stale' | 'expired';
    availableOperations: string[];
  };
}

export interface ProductForAI {
  id: string;
  name: string;
  code: string;
  description: string;
  category: string;
  subcategory?: string;
  brand?: string;
  model?: string;
  year?: number;
  price: number;
  currency: string;
  availability: {
    inStock: boolean;
    quantity: number;
    reserved: number;
    available: number;
  };
  specifications: {
    dimensions?: string;
    weight?: string;
    color?: string;
    material?: string;
    compatibility?: string[];
    fitment?: string;
  };
  images: string[];
  tags: string[];
  seoKeywords: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ShipmentForAI {
  id: string;
  trackingNumber: string;
  orderId: string;
  customerId: string;
  status: 'pending' | 'shipped' | 'in_transit' | 'delivered' | 'returned';
  carrier: string;
  trackingUrl?: string;
  estimatedDelivery?: string;
  actualDelivery?: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
  }[];
  addresses: {
    from: AddressForAI;
    to: AddressForAI;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CustomerForAI {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  phone?: string;
  addresses: AddressForAI[];
  orderHistory: {
    totalOrders: number;
    totalSpent: number;
    averageOrderValue: number;
    lastOrderDate?: string;
    preferredCategories: string[];
  };
  communication: {
    preferredLanguage: string;
    emailOptIn: boolean;
    lastContact?: string;
  };
}

export interface OrderForAI {
  id: string;
  orderNumber: string;
  customerId: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  items: {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
  totals: {
    subtotal: number;
    tax: number;
    shipping: number;
    total: number;
    currency: string;
  };
  dates: {
    ordered: string;
    confirmed?: string;
    shipped?: string;
    delivered?: string;
  };
  tracking?: {
    trackingNumber: string;
    carrier: string;
    status: string;
  };
}

export interface InventoryForAI {
  productId: string;
  productName: string;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  reorderPoint: number;
  maxStock: number;
  averageDailySales: number;
  estimatedDaysOfStock: number;
  lastRestocked?: string;
  nextReorderDate?: string;
}

export interface AddressForAI {
  street: string;
  city: string;
  postalCode: string;
  country: string;
  region?: string;
}

export class MetakockaAIIntegrationService {
  private supabase: ReturnType<typeof createLazyServerClient>;

  constructor() {
    this.supabase = createLazyServerClient();
  }

  // Helper method to get the awaited Supabase client
  private async getSupabase(): Promise<SupabaseClient> {
    return await this.supabase;
  }

  /**
   * Get comprehensive AI context data for a user
   */
  async getAIContext(userId: string): Promise<MetakockaAIContext> {
    console.log(`[Metakocka AI] Getting AI context for user ${userId}`);

    try {
      const supabase = await this.supabase;

      // Get user's organization
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        throw new Error(`User not found: ${userError?.message}`);
      }

      // Get Metakocka integration settings
      const { data: integration, error: integrationError } = await supabase
        .from('integrations')
        .select('*')
        .eq('organization_id', user.organization_id)
        .eq('integration_type', 'metakocka')
        .eq('is_active', true)
        .single();

      if (integrationError || !integration) {
        console.warn(`[Metakocka AI] No active Metakocka integration found for organization ${user.organization_id}`);
        return this.getEmptyContext();
      }

      // Fetch data from various sources
      const [products, shipments, customers, orders, inventory] = await Promise.all([
        this.getProductsForAI(user.organization_id),
        this.getShipmentsForAI(user.organization_id),
        this.getCustomersForAI(user.organization_id),
        this.getOrdersForAI(user.organization_id),
        this.getInventoryForAI(user.organization_id)
      ]);

      const context: MetakockaAIContext = {
        products,
        shipments,
        customers,
        orders,
        inventory,
        metadata: {
          lastSync: integration.last_sync_at || new Date().toISOString(),
          dataFreshness: this.calculateDataFreshness(integration.last_sync_at),
          availableOperations: [
            'product_search',
            'shipment_tracking',
            'customer_lookup',
            'order_status',
            'inventory_check'
          ]
        }
      };

      console.log(`[Metakocka AI] Context prepared: ${products.length} products, ${shipments.length} shipments, ${customers.length} customers`);
      return context;

    } catch (error) {
      console.error('[Metakocka AI] Error getting AI context:', error);
      return this.getEmptyContext();
    }
  }

  /**
   * Search products with AI-friendly data
   */
  async searchProductsForAI(
    organizationId: string,
    query: {
      searchTerm?: string;
      category?: string;
      brand?: string;
      model?: string;
      year?: number;
      minPrice?: number;
      maxPrice?: number;
      inStockOnly?: boolean;
    }
  ): Promise<ProductForAI[]> {
    console.log(`[Metakocka AI] Searching products for organization ${organizationId}`);

    try {
      const supabase = await this.supabase;

      let dbQuery = supabase
        .from('products')
        .select('*')
        .eq('organization_id', organizationId);

      // Apply filters
      if (query.searchTerm) {
        dbQuery = dbQuery.or(`name.ilike.%${query.searchTerm}%,description.ilike.%${query.searchTerm}%,code.ilike.%${query.searchTerm}%`);
      }

      if (query.category) {
        dbQuery = dbQuery.eq('category', query.category);
      }

      if (query.brand) {
        dbQuery = dbQuery.eq('brand', query.brand);
      }

      if (query.model) {
        dbQuery = dbQuery.eq('model', query.model);
      }

      if (query.year) {
        dbQuery = dbQuery.eq('year', query.year);
      }

      if (query.minPrice !== undefined) {
        dbQuery = dbQuery.gte('price', query.minPrice);
      }

      if (query.maxPrice !== undefined) {
        dbQuery = dbQuery.lte('price', query.maxPrice);
      }

      if (query.inStockOnly) {
        dbQuery = dbQuery.gt('quantity', 0);
      }

      const { data: products, error } = await dbQuery
        .order('name', { ascending: true })
        .limit(100);

      if (error) {
        throw error;
      }

      return (products || []).map(product => this.formatProductForAI(product));

    } catch (error) {
      console.error('[Metakocka AI] Error searching products:', error);
      return [];
    }
  }

  /**
   * Get shipment tracking information
   */
  async getShipmentTrackingForAI(
    organizationId: string,
    trackingIdentifier: string
  ): Promise<ShipmentForAI | null> {
    console.log(`[Metakocka AI] Getting shipment tracking for ${trackingIdentifier}`);

    try {
      const supabase = await this.supabase;

      const { data: shipment, error } = await supabase
        .from('shipments')
        .select('*')
        .eq('organization_id', organizationId)
        .or(`tracking_number.eq.${trackingIdentifier},order_id.eq.${trackingIdentifier}`)
        .single();

      if (error || !shipment) {
        console.warn(`[Metakocka AI] Shipment not found for ${trackingIdentifier}`);
        return null;
      }

      return this.formatShipmentForAI(shipment);

    } catch (error) {
      console.error('[Metakocka AI] Error getting shipment tracking:', error);
      return null;
    }
  }

  /**
   * Get customer information
   */
  async getCustomerForAI(
    organizationId: string,
    customerIdentifier: string
  ): Promise<CustomerForAI | null> {
    console.log(`[Metakocka AI] Getting customer info for ${customerIdentifier}`);

    try {
      const supabase = await this.supabase;

      const { data: customer, error } = await supabase
        .from('customers')
        .select('*')
        .eq('organization_id', organizationId)
        .or(`email.eq.${customerIdentifier},id.eq.${customerIdentifier}`)
        .single();

      if (error || !customer) {
        console.warn(`[Metakocka AI] Customer not found for ${customerIdentifier}`);
        return null;
      }

      return this.formatCustomerForAI(customer);

    } catch (error) {
      console.error('[Metakocka AI] Error getting customer:', error);
      return null;
    }
  }

  /**
   * Get products for AI context
   */
  private async getProductsForAI(organizationId: string): Promise<ProductForAI[]> {
    try {
      const supabase = await this.supabase;

      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .eq('organization_id', organizationId)
        .order('name', { ascending: true })
        .limit(500);

      if (error) {
        throw error;
      }

      return (products || []).map(product => this.formatProductForAI(product));

    } catch (error) {
      console.error('[Metakocka AI] Error getting products:', error);
      return [];
    }
  }

  /**
   * Get shipments for AI context
   */
  private async getShipmentsForAI(organizationId: string): Promise<ShipmentForAI[]> {
    try {
      const supabase = await this.supabase;

      const { data: shipments, error } = await supabase
        .from('shipments')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) {
        throw error;
      }

      return (shipments || []).map(shipment => this.formatShipmentForAI(shipment));

    } catch (error) {
      console.error('[Metakocka AI] Error getting shipments:', error);
      return [];
    }
  }

  /**
   * Get customers for AI context
   */
  private async getCustomersForAI(organizationId: string): Promise<CustomerForAI[]> {
    try {
      const supabase = await this.supabase;

      const { data: customers, error } = await supabase
        .from('customers')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) {
        throw error;
      }

      return (customers || []).map(customer => this.formatCustomerForAI(customer));

    } catch (error) {
      console.error('[Metakocka AI] Error getting customers:', error);
      return [];
    }
  }

  /**
   * Get orders for AI context
   */
  private async getOrdersForAI(organizationId: string): Promise<OrderForAI[]> {
    try {
      const supabase = await this.supabase;

      const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) {
        throw error;
      }

      return (orders || []).map(order => this.formatOrderForAI(order));

    } catch (error) {
      console.error('[Metakocka AI] Error getting orders:', error);
      return [];
    }
  }

  /**
   * Get inventory for AI context
   */
  private async getInventoryForAI(organizationId: string): Promise<InventoryForAI[]> {
    try {
      const supabase = await this.supabase;

      const { data: inventory, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('organization_id', organizationId)
        .order('product_name', { ascending: true })
        .limit(500);

      if (error) {
        throw error;
      }

      return (inventory || []).map(item => this.formatInventoryForAI(item));

    } catch (error) {
      console.error('[Metakocka AI] Error getting inventory:', error);
      return [];
    }
  }

  /**
   * Format product data for AI consumption
   */
  private formatProductForAI(product: any): ProductForAI {
    return {
      id: product.id,
      name: product.name,
      code: product.code || '',
      description: product.description || '',
      category: product.category || 'general',
      subcategory: product.subcategory,
      brand: product.brand,
      model: product.model,
      year: product.year,
      price: product.price || 0,
      currency: product.currency || 'EUR',
      availability: {
        inStock: (product.quantity || 0) > 0,
        quantity: product.quantity || 0,
        reserved: product.reserved || 0,
        available: Math.max(0, (product.quantity || 0) - (product.reserved || 0))
      },
      specifications: {
        dimensions: product.specifications?.dimensions,
        weight: product.specifications?.weight,
        color: product.specifications?.color,
        material: product.specifications?.material,
        compatibility: product.specifications?.compatibility || [],
        fitment: product.specifications?.fitment
      },
      images: product.images || [],
      tags: product.tags || [],
      seoKeywords: product.seo_keywords || [],
      createdAt: product.created_at,
      updatedAt: product.updated_at
    };
  }

  /**
   * Format shipment data for AI consumption
   */
  private formatShipmentForAI(shipment: any): ShipmentForAI {
    return {
      id: shipment.id,
      trackingNumber: shipment.tracking_number,
      orderId: shipment.order_id,
      customerId: shipment.customer_id,
      status: shipment.status,
      carrier: shipment.carrier,
      trackingUrl: shipment.tracking_url,
      estimatedDelivery: shipment.estimated_delivery,
      actualDelivery: shipment.actual_delivery,
      items: shipment.items || [],
      addresses: {
        from: shipment.from_address || {},
        to: shipment.to_address || {}
      },
      createdAt: shipment.created_at,
      updatedAt: shipment.updated_at
    };
  }

  /**
   * Format customer data for AI consumption
   */
  private formatCustomerForAI(customer: any): CustomerForAI {
    return {
      id: customer.id,
      email: customer.email,
      firstName: customer.first_name,
      lastName: customer.last_name,
      company: customer.company,
      phone: customer.phone,
      addresses: customer.addresses || [],
      orderHistory: {
        totalOrders: customer.order_history?.total_orders || 0,
        totalSpent: customer.order_history?.total_spent || 0,
        averageOrderValue: customer.order_history?.average_order_value || 0,
        lastOrderDate: customer.order_history?.last_order_date,
        preferredCategories: customer.order_history?.preferred_categories || []
      },
      communication: {
        preferredLanguage: customer.preferred_language || 'en',
        emailOptIn: customer.email_opt_in || false,
        lastContact: customer.last_contact
      }
    };
  }

  /**
   * Format order data for AI consumption
   */
  private formatOrderForAI(order: any): OrderForAI {
    return {
      id: order.id,
      orderNumber: order.order_number,
      customerId: order.customer_id,
      status: order.status,
      items: order.items || [],
      totals: {
        subtotal: order.subtotal || 0,
        tax: order.tax || 0,
        shipping: order.shipping || 0,
        total: order.total || 0,
        currency: order.currency || 'EUR'
      },
      dates: {
        ordered: order.created_at,
        confirmed: order.confirmed_at,
        shipped: order.shipped_at,
        delivered: order.delivered_at
      },
      tracking: order.tracking_number ? {
        trackingNumber: order.tracking_number,
        carrier: order.carrier,
        status: order.tracking_status
      } : undefined
    };
  }

  /**
   * Format inventory data for AI consumption
   */
  private formatInventoryForAI(inventory: any): InventoryForAI {
    return {
      productId: inventory.product_id,
      productName: inventory.product_name,
      currentStock: inventory.current_stock || 0,
      reservedStock: inventory.reserved_stock || 0,
      availableStock: Math.max(0, (inventory.current_stock || 0) - (inventory.reserved_stock || 0)),
      reorderPoint: inventory.reorder_point || 0,
      maxStock: inventory.max_stock || 0,
      averageDailySales: inventory.average_daily_sales || 0,
      estimatedDaysOfStock: inventory.estimated_days_of_stock || 0,
      lastRestocked: inventory.last_restocked,
      nextReorderDate: inventory.next_reorder_date
    };
  }

  /**
   * Calculate data freshness based on last sync
   */
  private calculateDataFreshness(lastSyncAt?: string): 'fresh' | 'stale' | 'expired' {
    if (!lastSyncAt) return 'expired';

    const lastSync = new Date(lastSyncAt);
    const now = new Date();
    const diffHours = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60);

    if (diffHours < 1) return 'fresh';
    if (diffHours < 24) return 'stale';
    return 'expired';
  }

  /**
   * Get empty context when no data is available
   */
  private getEmptyContext(): MetakockaAIContext {
    return {
      products: [],
      shipments: [],
      customers: [],
      orders: [],
      inventory: [],
      metadata: {
        lastSync: new Date().toISOString(),
        dataFreshness: 'expired',
        availableOperations: []
      }
    };
  }
}

// Export the main function for backward compatibility
export async function getMetakockaDataForAIContext(userId: string): Promise<MetakockaAIContext> {
  const service = new MetakockaAIIntegrationService();
  return service.getAIContext(userId);
}

/**
 * Get order details for AI context (backward compatibility)
 */
export async function getOrderDetailsForAI(orderId: string, userId: string): Promise<OrderForAI | null> {
  try {
    const service = new MetakockaAIIntegrationService();
    
    // Get user's organization first
    const supabase = await service['supabase'];
    
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      console.warn(`[Metakocka AI] User not found: ${userError?.message}`);
      return null;
    }

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('organization_id', user.organization_id)
      .single();

    if (orderError || !order) {
      console.warn(`[Metakocka AI] Order not found: ${orderError?.message}`);
      return null;
    }

    // Format order for AI using the service's private method
    const formatOrderForAI = (order: any): OrderForAI => {
      return {
        id: order.id,
        orderNumber: order.order_number,
        customerId: order.customer_id,
        status: order.status,
        items: order.items || [],
        totals: {
          subtotal: order.subtotal || 0,
          tax: order.tax || 0,
          shipping: order.shipping || 0,
          total: order.total || 0,
          currency: order.currency || 'EUR'
        },
        dates: {
          ordered: order.created_at,
          confirmed: order.confirmed_at,
          shipped: order.shipped_at,
          delivered: order.delivered_at
        },
        tracking: order.tracking_number ? {
          trackingNumber: order.tracking_number,
          carrier: order.carrier,
          status: order.tracking_status
        } : undefined
      };
    };

    return formatOrderForAI(order);
  } catch (error) {
    console.error('[Metakocka AI] Error getting order details:', error);
    return null;
  }
}
