export interface MetakockaConfig {
  companyId: string;
  secretKey: string;
  apiUrl?: string;
}

export interface MetakockaOrder {
  id: string;
  orderNumber: string;
  customerEmail: string;
  customerName: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    sku?: string;
  }>;
  total: number;
  orderDate: string;
  shippingAddress?: {
    name: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
  };
}

export interface MetakockaCustomer {
  id: string;
  email: string;
  name: string;
  totalOrders: number;
  lastOrderDate: string;
  status: 'active' | 'inactive';
}

export class MetakockaClient {
  private config: MetakockaConfig;
  private apiUrl: string;

  constructor(config: MetakockaConfig) {
    this.config = config;
    this.apiUrl = config.apiUrl || 'https://api.metakocka.si/v1';
  }

  /**
   * Get authentication headers for Metakocka API
   */
  private getAuthHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.secretKey}`,
      'Company-Id': this.config.companyId
    };
  }

  /**
   * Look up customer by email address
   */
  async getCustomerByEmail(email: string): Promise<MetakockaCustomer | null> {
    try {
      const response = await fetch(`${this.apiUrl}/customers/search?email=${encodeURIComponent(email)}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null; // Customer not found
        }
        throw new Error(`Metakocka API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.customers || data.customers.length === 0) {
        return null;
      }

      const customer = data.customers[0];
      return {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        totalOrders: customer.total_orders || 0,
        lastOrderDate: customer.last_order_date || '',
        status: customer.status || 'active'
      };

    } catch (error) {
      console.error('Error fetching customer from Metakocka:', error);
      return null;
    }
  }

  /**
   * Get customer's recent orders
   */
  async getCustomerOrders(customerEmail: string, limit: number = 10): Promise<MetakockaOrder[]> {
    try {
      const customer = await this.getCustomerByEmail(customerEmail);
      if (!customer) {
        return [];
      }

      const response = await fetch(`${this.apiUrl}/orders?customer_id=${customer.id}&limit=${limit}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Metakocka API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.orders) {
        return [];
      }

      return data.orders.map((order: any) => ({
        id: order.id,
        orderNumber: order.order_number,
        customerEmail: order.customer_email,
        customerName: order.customer_name,
        status: this.mapOrderStatus(order.status),
        items: order.items.map((item: any) => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          sku: item.sku
        })),
        total: order.total,
        orderDate: order.order_date,
        shippingAddress: order.shipping_address ? {
          name: order.shipping_address.name,
          address: order.shipping_address.address,
          city: order.shipping_address.city,
          postalCode: order.shipping_address.postal_code,
          country: order.shipping_address.country
        } : undefined
      }));

    } catch (error) {
      console.error('Error fetching orders from Metakocka:', error);
      return [];
    }
  }

  /**
   * Look up order by order number
   */
  async getOrderByNumber(orderNumber: string): Promise<MetakockaOrder | null> {
    try {
      const response = await fetch(`${this.apiUrl}/orders/search?order_number=${encodeURIComponent(orderNumber)}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Metakocka API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.order) {
        return null;
      }

      const order = data.order;
      return {
        id: order.id,
        orderNumber: order.order_number,
        customerEmail: order.customer_email,
        customerName: order.customer_name,
        status: this.mapOrderStatus(order.status),
        items: order.items.map((item: any) => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          sku: item.sku
        })),
        total: order.total,
        orderDate: order.order_date,
        shippingAddress: order.shipping_address ? {
          name: order.shipping_address.name,
          address: order.shipping_address.address,
          city: order.shipping_address.city,
          postalCode: order.shipping_address.postal_code,
          country: order.shipping_address.country
        } : undefined
      };

    } catch (error) {
      console.error('Error fetching order from Metakocka:', error);
      return null;
    }
  }

  /**
   * Map Metakocka order status to our standard status
   */
  private mapOrderStatus(status: string): 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' {
    const statusMap: Record<string, 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'> = {
      'draft': 'pending',
      'confirmed': 'confirmed',
      'processing': 'confirmed',
      'shipped': 'shipped',
      'delivered': 'delivered',
      'cancelled': 'cancelled',
      'refunded': 'cancelled'
    };

    return statusMap[status.toLowerCase()] || 'pending';
  }

  /**
   * Test connection to Metakocka API
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.apiUrl}/health`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (response.ok) {
        return {
          success: true,
          message: 'Successfully connected to Metakocka API'
        };
      } else {
        return {
          success: false,
          message: `Connection failed: HTTP ${response.status}`
        };
      }

    } catch (error) {
      return {
        success: false,
        message: `Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

/**
 * Get Metakocka configuration from app settings for a user
 */
export async function getMetakockaConfigForUser(userId: string): Promise<MetakockaConfig | null> {
  try {
    // This will be called from server-side code, so we import the service here
    const { MetakockaService } = await import('./metakocka/service');
    const credentials = await MetakockaService.getUserCredentials(userId);
    
    if (!credentials) {
      return null;
    }

    return {
      companyId: credentials.companyId,
      secretKey: credentials.secretKey,
      apiUrl: credentials.apiEndpoint
    };
  } catch (error) {
    console.error('Error getting Metakocka config for user:', error);
    return null;
  }
}

/**
 * Create Metakocka client instance with user settings
 */
export async function createMetakockaClientForUser(userId: string): Promise<MetakockaClient | null> {
  const config = await getMetakockaConfigForUser(userId);
  if (!config) {
    return null;
  }
  
  return new MetakockaClient(config);
}

/**
 * @deprecated Use createMetakockaClientForUser instead
 * Legacy method for backwards compatibility
 */
export function createMetakockaClient(): MetakockaClient | null {
  console.warn('createMetakockaClient() is deprecated. Use createMetakockaClientForUser(userId) instead.');
  return null;
} 