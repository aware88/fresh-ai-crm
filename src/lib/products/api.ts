// Client-side API functions for products and pricing

// Product types
export interface Product {
  id: string;
  name: string;
  sku?: string;
  description?: string;
  category?: string;
  unit?: string;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

// Pricing types
export interface SupplierPricing {
  id: string;
  supplier_id: string;
  product_id: string;
  price: number;
  currency?: string;
  unit_price?: boolean;
  quantity?: number;
  unit?: string;
  valid_from?: string;
  valid_to?: string;
  source_document_id?: string;
  notes?: string;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

// Extended pricing from the view
export interface SupplierProductPricing extends SupplierPricing {
  supplier_name: string;
  product_name: string;
  sku?: string;
  category?: string;
}

// Product API functions
export async function fetchProducts(category?: string, query?: string): Promise<Product[]> {
  try {
    let url = '/api/products';
    const params = new URLSearchParams();
    
    if (category) params.append('category', category);
    if (query) params.append('query', query);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error fetching products');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
}

export async function createProduct(product: Omit<Product, 'id'>): Promise<Product> {
  try {
    const response = await fetch('/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(product),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error creating product');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
}

export async function updateProduct(product: Product): Promise<Product> {
  try {
    const response = await fetch('/api/products', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(product),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error updating product');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
}

export async function deleteProduct(id: string): Promise<void> {
  try {
    const response = await fetch(`/api/products?id=${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error deleting product');
    }
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
}

// Pricing API functions
export async function fetchPricing(
  productId?: string, 
  supplierId?: string,
  useView = true
): Promise<SupplierProductPricing[] | SupplierPricing[]> {
  try {
    let url = '/api/products/pricing';
    const params = new URLSearchParams();
    
    if (productId) params.append('productId', productId);
    if (supplierId) params.append('supplierId', supplierId);
    params.append('view', useView.toString());
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error fetching pricing data');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching pricing data:', error);
    throw error;
  }
}

export async function createPricing(
  pricing: Omit<SupplierPricing, 'id'>
): Promise<SupplierPricing> {
  try {
    const response = await fetch('/api/products/pricing', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pricing),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error creating pricing entry');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating pricing entry:', error);
    throw error;
  }
}

export async function updatePricing(
  pricing: SupplierPricing
): Promise<SupplierPricing> {
  try {
    const response = await fetch('/api/products/pricing', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pricing),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error updating pricing entry');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating pricing entry:', error);
    throw error;
  }
}

export async function deletePricing(id: string): Promise<void> {
  try {
    const response = await fetch(`/api/products/pricing?id=${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error deleting pricing entry');
    }
  } catch (error) {
    console.error('Error deleting pricing entry:', error);
    throw error;
  }
}
