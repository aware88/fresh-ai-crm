import { createServerClient } from '@/lib/supabase/server';
import { Database } from '@/types/supabase';
import { Product } from '@/types/product';

export interface ProductRecommendationOptions {
  query?: string;
  contactId?: string;
  categoryId?: string;
  limit?: number;
  includeOutOfStock?: boolean;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc';
}

export interface RecommendationResult {
  products: Product[];
  totalCount: number;
  query?: string;
  metadata?: {
    processingTimeMs?: number;
    contactHistory?: boolean;
    categoryFiltered?: boolean;
  };
}

export class ProductRecommendationService {
  /**
   * Recommends products based on the provided options
   * 
   * @param options - Product recommendation options
   * @returns A promise that resolves to the recommendation result
   */
  async recommendProducts(options: ProductRecommendationOptions): Promise<RecommendationResult> {
    const startTime = Date.now();
    const supabase = await createServerClient();
    
    // Default options
    const {
      query = '',
      contactId,
      categoryId,
      limit = 5,
      includeOutOfStock = false,
      minPrice,
      maxPrice,
      sortBy = 'relevance'
    } = options;
    
    // Start building the query
    let productQuery = supabase
      .from('products')
      .select('*')
      .limit(limit);
    
    // Apply filters
    if (query) {
      productQuery = productQuery.textSearch('name', query, {
        type: 'websearch',
        config: 'english'
      });
    }
    
    if (categoryId) {
      productQuery = productQuery.eq('category_id', categoryId);
    }
    
    if (!includeOutOfStock) {
      productQuery = productQuery.gt('stock', 0);
    }
    
    if (minPrice !== undefined) {
      productQuery = productQuery.gte('price', minPrice);
    }
    
    if (maxPrice !== undefined) {
      productQuery = productQuery.lte('price', maxPrice);
    }
    
    // Apply sorting
    switch (sortBy) {
      case 'price_asc':
        productQuery = productQuery.order('price', { ascending: true });
        break;
      case 'price_desc':
        productQuery = productQuery.order('price', { ascending: false });
        break;
      case 'name_asc':
        productQuery = productQuery.order('name', { ascending: true });
        break;
      case 'name_desc':
        productQuery = productQuery.order('name', { ascending: false });
        break;
      case 'relevance':
      default:
        // For relevance, if there's a search query, the results are already ordered by relevance
        // If no search query, default to name ascending
        if (!query) {
          productQuery = productQuery.order('name', { ascending: true });
        }
        break;
    }
    
    // Execute the query
    const { data: products, error, count } = await productQuery;
    
    if (error) {
      console.error('Error recommending products:', error);
      throw new Error(`Failed to recommend products: ${error.message}`);
    }
    
    // Get contact purchase history if contactId is provided
    let contactHistory = false;
    if (contactId) {
      contactHistory = true;
      // We could use this to boost products the contact has purchased before
      // or to recommend complementary products
    }
    
    return {
      products: products as Product[],
      totalCount: count || products.length,
      query,
      metadata: {
        processingTimeMs: Date.now() - startTime,
        contactHistory,
        categoryFiltered: !!categoryId
      }
    };
  }

  /**
   * Recommends products based on email content
   * 
   * @param emailContent - The content of the email
   * @param contactId - Optional contact ID
   * @param limit - Maximum number of products to recommend
   * @returns A promise that resolves to the recommendation result
   */
  async recommendProductsFromEmail(
    emailContent: string,
    contactId?: string,
    limit = 3
  ): Promise<RecommendationResult> {
    // Extract keywords from email content
    const keywords = await this.extractKeywordsFromEmail(emailContent);
    
    // Use the extracted keywords to recommend products
    return this.recommendProducts({
      query: keywords.join(' '),
      contactId,
      limit,
      includeOutOfStock: false,
      sortBy: 'relevance'
    });
  }

  /**
   * Extracts keywords from email content for product recommendations
   * 
   * @param emailContent - The content of the email
   * @returns A promise that resolves to an array of keywords
   */
  private async extractKeywordsFromEmail(emailContent: string): Promise<string[]> {
    // Simple keyword extraction for now
    // In a real implementation, we would use NLP or AI to extract relevant keywords
    
    // Remove common words, punctuation, etc.
    const cleanedContent = emailContent
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Split into words
    const words = cleanedContent.split(' ');
    
    // Filter out common words (stop words)
    const stopWords = new Set([
      'a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were',
      'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
      'to', 'from', 'in', 'out', 'on', 'off', 'over', 'under', 'again',
      'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why',
      'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other',
      'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so',
      'than', 'too', 'very', 'can', 'will', 'just', 'should', 'now'
    ]);
    
    const keywords = words.filter(word => 
      word.length > 2 && !stopWords.has(word)
    );
    
    // Get unique keywords
    const uniqueKeywords = [...new Set(keywords)];
    
    // Return the top keywords (limit to 10)
    return uniqueKeywords.slice(0, 10);
  }

  /**
   * Recommends products that are frequently bought together with the specified product
   * 
   * @param productId - The ID of the product
   * @param limit - Maximum number of products to recommend
   * @returns A promise that resolves to the recommendation result
   */
  async getFrequentlyBoughtTogether(productId: string, limit = 3): Promise<RecommendationResult> {
    const supabase = await createServerClient();
    
    // This is a simplified implementation
    // In a real system, we would analyze order history to find products frequently bought together
    
    // Get the product's category
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('category_id')
      .eq('id', productId)
      .single();
    
    if (productError) {
      console.error('Error getting product:', productError);
      throw new Error(`Failed to get product: ${productError.message}`);
    }
    
    // Get other products in the same category
    return this.recommendProducts({
      categoryId: product.category_id,
      limit,
      includeOutOfStock: false,
      sortBy: 'relevance'
    });
  }

  /**
   * Recommends products based on a contact's purchase history
   * 
   * @param contactId - The ID of the contact
   * @param limit - Maximum number of products to recommend
   * @returns A promise that resolves to the recommendation result
   */
  async getPersonalizedRecommendations(contactId: string, limit = 5): Promise<RecommendationResult> {
    // This is a simplified implementation
    // In a real system, we would analyze the contact's purchase history and preferences
    
    // For now, just return some products
    return this.recommendProducts({
      contactId,
      limit,
      includeOutOfStock: false,
      sortBy: 'relevance'
    });
  }
}
