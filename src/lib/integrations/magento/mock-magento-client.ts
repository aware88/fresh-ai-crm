/**
 * Mock Magento API Client for Development/Testing
 * 
 * This client provides mock data when the real Magento API is not accessible
 * It implements the same interface as the real MagentoApiClient
 */

import { MagentoOrder, MagentoCustomer, MagentoProduct, MagentoApiClient } from './magento-api-client';

export class MockMagentoApiClient {
  private credentials: any;

  constructor(credentials: any) {
    this.credentials = credentials;
  }

  /**
   * Mock: Get orders by customer email
   */
  async getOrdersByEmail(email: string): Promise<MagentoOrder[]> {
    console.log(`[Mock Magento] Fetching orders for email: ${email}`);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Return mock orders for testing
    const mockOrders: MagentoOrder[] = [
      {
        entity_id: '1001',
        increment_id: '100001001',
        customer_email: email,
        customer_firstname: 'Test',
        customer_lastname: 'Customer',
        status: 'complete',
        state: 'complete',
        created_at: '2024-01-15T10:30:00Z',
        updated_at: '2024-01-16T14:20:00Z',
        grand_total: 149.99,
        base_currency_code: 'EUR',
        order_currency_code: 'EUR',
        items: [
          {
            item_id: '2001',
            name: 'Gledring Rubber Floor Mats - BMW 3 Series',
            sku: 'GLD-BMW-3-MATS',
            qty_ordered: 1,
            price: 89.99,
            row_total: 89.99,
            product_type: 'simple'
          },
          {
            item_id: '2002',
            name: 'Trunk Liner - BMW 3 Series',
            sku: 'GLD-BMW-3-TRUNK',
            qty_ordered: 1,
            price: 59.99,
            row_total: 59.99,
            product_type: 'simple'
          }
        ],
        billing_address: {
          firstname: 'Test',
          lastname: 'Customer',
          street: ['Test Street 123'],
          city: 'Ljubljana',
          postcode: '1000',
          country_id: 'SI',
          telephone: '+386 1 234 5678'
        }
      },
      {
        entity_id: '1002',
        increment_id: '100001002',
        customer_email: email,
        customer_firstname: 'Test',
        customer_lastname: 'Customer',
        status: 'processing',
        state: 'processing',
        created_at: '2024-02-01T09:15:00Z',
        updated_at: '2024-02-01T09:15:00Z',
        grand_total: 75.50,
        base_currency_code: 'EUR',
        order_currency_code: 'EUR',
        items: [
          {
            item_id: '2003',
            name: 'Car Accessories Set - Universal',
            sku: 'GLD-UNIV-SET',
            qty_ordered: 1,
            price: 75.50,
            row_total: 75.50,
            product_type: 'bundle'
          }
        ],
        billing_address: {
          firstname: 'Test',
          lastname: 'Customer',
          street: ['Test Street 123'],
          city: 'Ljubljana',
          postcode: '1000',
          country_id: 'SI',
          telephone: '+386 1 234 5678'
        }
      }
    ];

    // Filter orders based on email (for realism)
    if (email.includes('test') || email.includes('tim')) {
      return mockOrders;
    }
    
    // Return empty for other emails
    return [];
  }

  /**
   * Mock: Search customers by criteria
   */
  async searchCustomers(criteria: { email?: string; firstname?: string; lastname?: string }): Promise<MagentoCustomer[]> {
    console.log(`[Mock Magento] Searching customers:`, criteria);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const mockCustomers: MagentoCustomer[] = [
      {
        id: '501',
        email: criteria.email || 'test@example.com',
        firstname: 'Test',
        lastname: 'Customer',
        created_at: '2023-12-01T10:00:00Z',
        updated_at: '2024-01-15T10:30:00Z',
        group_id: 1,
        addresses: [
          {
            id: '1001',
            customer_id: '501',
            region: {
              region_code: 'SI',
              region: 'Slovenia',
              region_id: 1
            },
            country_id: 'SI',
            street: ['Test Street 123'],
            postcode: '1000',
            city: 'Ljubljana',
            firstname: 'Test',
            lastname: 'Customer',
            telephone: '+386 1 234 5678',
            default_billing: true,
            default_shipping: true
          }
        ]
      }
    ];

    if (criteria.email && (criteria.email.includes('test') || criteria.email.includes('tim'))) {
      return mockCustomers;
    }

    return [];
  }

  /**
   * Mock: Get orders by customer ID
   */
  async getOrdersByCustomerId(customerId: string): Promise<MagentoOrder[]> {
    console.log(`[Mock Magento] Fetching orders for customer ID: ${customerId}`);
    
    // Use the same mock data as getOrdersByEmail
    return this.getOrdersByEmail('mock@example.com');
  }

  /**
   * Mock: Get order items
   */
  async getOrderItems(orderId: string): Promise<any[]> {
    console.log(`[Mock Magento] Fetching items for order: ${orderId}`);
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return [
      {
        item_id: '2001',
        name: 'Gledring Rubber Floor Mats - BMW 3 Series',
        sku: 'GLD-BMW-3-MATS',
        qty_ordered: 1,
        price: 89.99,
        row_total: 89.99,
        product_type: 'simple'
      }
    ];
  }

  /**
   * Mock: Get product by ID
   */
  async getProductById(productId: string): Promise<MagentoProduct | null> {
    console.log(`[Mock Magento] Fetching product: ${productId}`);
    
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const mockProduct: MagentoProduct = {
      id: productId,
      sku: 'GLD-BMW-3-MATS',
      name: 'Gledring Rubber Floor Mats - BMW 3 Series',
      price: 89.99,
      status: 1,
      visibility: 4,
      type_id: 'simple',
      created_at: '2023-10-01T10:00:00Z',
      updated_at: '2024-01-01T10:00:00Z',
      attribute_set_id: 4,
      custom_attributes: [
        {
          attribute_code: 'description',
          value: 'High-quality rubber floor mats specifically designed for BMW 3 Series vehicles.'
        },
        {
          attribute_code: 'manufacturer',
          value: 'Gledring'
        }
      ]
    };

    return mockProduct;
  }

  /**
   * Mock: Test connection
   */
  async testConnection(): Promise<{ success: boolean; message: string; data?: any }> {
    console.log('[Mock Magento] Testing connection (mock)...');
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      message: 'Mock connection successful - API is not accessible, using mock data',
      data: {
        mode: 'mock',
        apiUrl: this.credentials.apiUrl,
        user: this.credentials.apiUser,
        note: 'Real API returned redirects - using mock data for development'
      }
    };
  }

  /**
   * Clear cache (no-op for mock)
   */
  clearCache(): void {
    console.log('[Mock Magento] Cache cleared (mock)');
  }
}

/**
 * Factory function that returns either real or mock client based on environment
 */
export async function createMagentoClient(credentials: any): Promise<MagentoApiClient | MockMagentoApiClient> {
  // For now, always use mock client since the real API is not accessible
  // In the future, you can add logic here to test the real API first
  
  console.log('[Magento Factory] Creating mock client due to API accessibility issues');
  return new MockMagentoApiClient(credentials);
}

export default MockMagentoApiClient;


