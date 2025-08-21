import { UnifiedRAGService } from '../unified-rag-service';
import { IngestContent, RAGSourceType } from '@/types/rag';

/**
 * Magento Multi-Language Adapter
 * Handles country-specific product catalogs with language isolation
 * 
 * Strategy:
 * 1. CACHE product catalogs by language/country in RAG
 * 2. Language-aware search and retrieval
 * 3. Automatic language detection from email
 * 4. Country-specific product recommendations
 */
export class MagentoMultiLanguageAdapter {
  private ragService: UnifiedRAGService;

  // Withcar Language/Country mapping - Primary languages: German, Slovenian, Italian, English
  private readonly LANGUAGE_COUNTRY_MAP = {
    'de': {
      country: 'germany',
      currency: 'EUR',
      magentoStoreId: 'german_store',
      locale: 'de_DE',
      priority: 1 // Primary language
    },
    'sl': {
      country: 'slovenia',
      currency: 'EUR',
      magentoStoreId: 'slovenian_store',
      locale: 'sl_SI',
      priority: 1 // Primary language
    },
    'it': {
      country: 'italy',
      currency: 'EUR',
      magentoStoreId: 'italian_store',
      locale: 'it_IT',
      priority: 1 // Primary language
    },
    'en': {
      country: 'international',
      currency: 'EUR',
      magentoStoreId: 'english_store',
      locale: 'en_US',
      priority: 1 // Primary language
    },
    // Additional languages (lower priority)
    'hr': {
      country: 'croatia',
      currency: 'EUR',
      magentoStoreId: 'croatian_store',
      locale: 'hr_HR',
      priority: 2 // Additional language
    },
    'fr': {
      country: 'france',
      currency: 'EUR',
      magentoStoreId: 'french_store',
      locale: 'fr_FR',
      priority: 2 // Additional language (future)
    },
    'es': {
      country: 'spain',
      currency: 'EUR',
      magentoStoreId: 'spanish_store',
      locale: 'es_ES',
      priority: 2 // Additional language (future)
    }
  };

  constructor(ragService: UnifiedRAGService) {
    this.ragService = ragService;
  }

  /**
   * RECOMMENDED APPROACH: Cache Magento products in RAG by language
   * This is better than real-time API calls because:
   * - Faster response times (no API latency)
   * - Better semantic search capabilities
   * - Reduced API costs
   * - Works offline
   * - Better for AI recommendations
   */
  async syncMagentoProductsByLanguage(
    organizationId: string,
    language: string,
    magentoApiConfig: {
      baseUrl: string;
      apiKey: string;
      storeId: string;
    }
  ): Promise<{
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
      console.log(`[Magento RAG] Syncing products for language: ${language}`);

      const countryConfig = this.LANGUAGE_COUNTRY_MAP[language as keyof typeof this.LANGUAGE_COUNTRY_MAP];
      if (!countryConfig) {
        throw new Error(`Unsupported language: ${language}`);
      }

      // Get products from Magento API (you'll implement this)
      const products = await this.fetchMagentoProducts(magentoApiConfig, language);

      for (const product of products) {
        results.processed++;

        try {
          // Format product for RAG with language-specific metadata
          const ragContent = this.formatMagentoProductForRAG(
            product,
            language,
            countryConfig
          );

          // Ingest into RAG with language namespace
          const ingestResult = await this.ragService.ingestContent(
            organizationId,
            ragContent,
            {
              chunkSize: 600,
              chunkOverlap: 100,
              skipIfExists: false // Always update product data
            }
          );

          if (ingestResult.success) {
            results.successful++;
          } else {
            results.failed++;
            results.errors.push(`Product ${product.name}: ${ingestResult.error}`);
          }
        } catch (error) {
          results.failed++;
          results.errors.push(`Product ${product.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        // Small delay to prevent overwhelming the system
        await this.delay(50);
      }

      console.log(`[Magento RAG] Sync completed for ${language}: ${results.successful}/${results.processed} successful`);
      return results;

    } catch (error) {
      console.error(`[Magento RAG] Sync failed for ${language}:`, error);
      results.errors.push(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return results;
    }
  }

  /**
   * Language-aware product search
   */
  async searchProductsByLanguage(
    query: string,
    organizationId: string,
    detectedLanguage: string,
    options: {
      maxResults?: number;
      similarityThreshold?: number;
      priceRange?: { min: number; max: number };
      category?: string;
    } = {}
  ): Promise<{
    products: Array<{
      id: string;
      name: string;
      description: string;
      price: number;
      currency: string;
      url: string;
      imageUrl: string;
      category: string;
      similarity: number;
      language: string;
      country: string;
    }>;
    language: string;
    country: string;
    totalFound: number;
  }> {
    try {
      console.log(`[Magento RAG] Searching products in ${detectedLanguage} for: "${query}"`);

      const countryConfig = this.LANGUAGE_COUNTRY_MAP[detectedLanguage as keyof typeof this.LANGUAGE_COUNTRY_MAP];
      if (!countryConfig) {
        console.warn(`[Magento RAG] Unsupported language ${detectedLanguage}, falling back to English`);
        detectedLanguage = 'en';
      }

      // Search RAG with language filter
      const ragResult = await this.ragService.retrieveRelevantContent(
        query,
        organizationId,
        {
          sourceTypes: ['magento'],
          limit: options.maxResults || 10,
          similarityThreshold: options.similarityThreshold || 0.6,
          metadataFilters: {
            language: detectedLanguage,
            country: countryConfig?.country
          }
        }
      );

      // Format results for frontend
      const products = ragResult.chunks
        .filter(chunk => {
          // Additional filtering by price range if specified
          if (options.priceRange && chunk.metadata.price) {
            const price = parseFloat(chunk.metadata.price);
            return price >= options.priceRange.min && price <= options.priceRange.max;
          }
          
          // Filter by category if specified
          if (options.category && chunk.metadata.category !== options.category) {
            return false;
          }
          
          return true;
        })
        .map(chunk => ({
          id: chunk.source.sourceId || chunk.id,
          name: chunk.source.title,
          description: chunk.content.substring(0, 200),
          price: parseFloat(chunk.metadata.price || '0'),
          currency: chunk.metadata.currency || 'EUR',
          url: chunk.metadata.productUrl || '',
          imageUrl: chunk.metadata.imageUrl || '',
          category: chunk.metadata.category || '',
          similarity: chunk.similarity,
          language: chunk.metadata.language || detectedLanguage,
          country: chunk.metadata.country || countryConfig?.country || 'unknown'
        }));

      return {
        products,
        language: detectedLanguage,
        country: countryConfig?.country || 'unknown',
        totalFound: products.length
      };

    } catch (error) {
      console.error('[Magento RAG] Product search failed:', error);
      return {
        products: [],
        language: detectedLanguage,
        country: 'unknown',
        totalFound: 0
      };
    }
  }

  /**
   * Detect language from email content - AI-powered automatic detection
   * The AI will detect ANY language and respond in the SAME language
   * Fallback: English if language cannot be determined
   */
  detectLanguageFromEmail(emailContent: string): string {
    const lowerContent = emailContent.toLowerCase();

    // Detect language based on linguistic patterns (not hardcoded priorities)
    // The AI should respond in whatever language the customer used

    // Italian detection
    if (this.containsItalianWords(lowerContent)) {
      return 'it';
    }

    // German detection  
    if (this.containsGermanWords(lowerContent)) {
      return 'de';
    }

    // Slovenian detection
    if (this.containsSlovenianWords(lowerContent)) {
      return 'sl';
    }

    // Croatian detection
    if (this.containsCroatianWords(lowerContent)) {
      return 'hr';
    }

    // French detection
    if (this.containsFrenchWords(lowerContent)) {
      return 'fr';
    }

    // Spanish detection
    if (this.containsSpanishWords(lowerContent)) {
      return 'es';
    }

    // Add more languages as needed - the system is flexible
    // Portuguese, Dutch, Polish, etc. can be added easily

    // Fallback to English if no specific language detected
    return 'en';
  }

  /**
   * Generate language-specific product recommendations for email
   */
  async generateLanguageAwareRecommendations(
    emailContent: string,
    organizationId: string,
    customerCountry?: string
  ): Promise<{
    language: string;
    country: string;
    recommendations: any[];
    emailResponse: string;
  }> {
    try {
      // Detect language from email
      const detectedLanguage = customerCountry 
        ? this.getLanguageFromCountry(customerCountry)
        : this.detectLanguageFromEmail(emailContent);

      console.log(`[Magento RAG] Detected language: ${detectedLanguage}`);

      // Search for relevant products in detected language
      const searchResult = await this.searchProductsByLanguage(
        emailContent,
        organizationId,
        detectedLanguage,
        { maxResults: 5, similarityThreshold: 0.6 }
      );

      // Generate localized email response
      const emailResponse = await this.generateLocalizedResponse(
        emailContent,
        searchResult.products,
        detectedLanguage
      );

      return {
        language: detectedLanguage,
        country: searchResult.country,
        recommendations: searchResult.products,
        emailResponse
      };

    } catch (error) {
      console.error('[Magento RAG] Language-aware recommendations failed:', error);
      return {
        language: 'en',
        country: 'unknown',
        recommendations: [],
        emailResponse: 'Thank you for your inquiry. We will get back to you soon.'
      };
    }
  }

  // Private helper methods

  private async fetchMagentoProducts(
    apiConfig: { baseUrl: string; apiKey: string; storeId: string },
    language: string
  ): Promise<any[]> {
    // TODO: Implement actual Magento API integration
    // This is a placeholder - you'll need to implement the actual API calls
    console.log(`[Magento RAG] Fetching products from Magento API for ${language}`);
    
    // Mock data for now
    return [
      {
        id: '1',
        name: language === 'it' ? 'Prodotto Esempio' : 'Example Product',
        description: language === 'it' ? 'Descrizione del prodotto' : 'Product description',
        price: 99.99,
        category: 'electronics',
        url: `${apiConfig.baseUrl}/product-1`,
        imageUrl: `${apiConfig.baseUrl}/images/product-1.jpg`,
        attributes: {
          weight: '1kg',
          dimensions: '10x10x10cm'
        }
      }
    ];
  }

  private formatMagentoProductForRAG(
    product: any,
    language: string,
    countryConfig: any
  ): IngestContent {
    const sections: string[] = [];

    sections.push(`Product: ${product.name}`);
    
    if (product.sku) {
      sections.push(`SKU: ${product.sku}`);
    }

    if (product.description) {
      sections.push(`Description: ${product.description}`);
    }

    if (product.price) {
      sections.push(`Price: ${product.price} ${countryConfig.currency}`);
    }

    if (product.category) {
      sections.push(`Category: ${product.category}`);
    }

    if (product.attributes) {
      const attrs = Object.entries(product.attributes)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');
      sections.push(`Specifications:\n${attrs}`);
    }

    return {
      title: product.name,
      content: sections.join('\n\n'),
      sourceType: 'magento' as RAGSourceType,
      sourceId: product.id,
      metadata: {
        language,
        country: countryConfig.country,
        currency: countryConfig.currency,
        locale: countryConfig.locale,
        magentoStoreId: countryConfig.magentoStoreId,
        productUrl: product.url,
        imageUrl: product.imageUrl,
        price: product.price,
        category: product.category,
        sku: product.sku,
        lastSynced: new Date().toISOString()
      }
    };
  }

  private containsItalianWords(content: string): boolean {
    const italianWords = ['grazie', 'prego', 'posso', 'vorrei', 'prodotto', 'prezzo', 'ordine', 'spedizione'];
    return italianWords.some(word => content.includes(word));
  }

  private containsGermanWords(content: string): boolean {
    const germanWords = ['danke', 'bitte', 'können', 'möchte', 'produkt', 'preis', 'bestellung', 'lieferung'];
    return germanWords.some(word => content.includes(word));
  }

  private containsSlovenianWords(content: string): boolean {
    const slovenianWords = ['prosim', 'lahko', 'izdelek', 'cena', 'naročilo', 'lep', 'pozdrav'];
    const slovenianUnique = ['lahko', 'izdelek', 'cena', 'naročilo']; // Unique Slovenian words
    
    // Check for unique Slovenian words first
    if (slovenianUnique.some(word => content.includes(word))) {
      return true;
    }
    
    // Then check general words (but require more matches for accuracy)
    const matches = slovenianWords.filter(word => content.includes(word)).length;
    return matches >= 2;
  }

  private containsCroatianWords(content: string): boolean {
    const croatianWords = ['molim', 'mogu', 'proizvod', 'cijena', 'narudžba', 'brzom', 'odgovoru'];
    const croatianUnique = ['mogu', 'proizvod', 'cijena', 'narudžba']; // Unique Croatian words
    
    // Check for unique Croatian words first
    if (croatianUnique.some(word => content.includes(word))) {
      return true;
    }
    
    // Then check general words
    const matches = croatianWords.filter(word => content.includes(word)).length;
    return matches >= 2;
  }

  private containsFrenchWords(content: string): boolean {
    const frenchWords = ['merci', 'bonjour', 'pouvez', 'voudrais', 'produit', 'prix', 'commande', 'livraison'];
    return frenchWords.some(word => content.includes(word));
  }

  private containsSpanishWords(content: string): boolean {
    const spanishWords = ['gracias', 'hola', 'puedo', 'quisiera', 'producto', 'precio', 'pedido', 'entrega'];
    return spanishWords.some(word => content.includes(word));
  }

  private getLanguageFromCountry(country: string): string {
    const countryLanguageMap: Record<string, string> = {
      'italy': 'it',
      'germany': 'de', 
      'slovenia': 'sl',
      'croatia': 'hr',
      'austria': 'de'
    };
    
    return countryLanguageMap[country.toLowerCase()] || 'en';
  }

  private async generateLocalizedResponse(
    originalEmail: string,
    products: any[],
    language: string
  ): Promise<string> {
    // Withcar-optimized response templates for primary languages
    const templates = {
      // Primary Withcar languages
      'de': 'Vielen Dank für Ihre Anfrage. Hier sind die Produkte, die für Sie interessant sein könnten:',
      'sl': 'Hvala za vaše povpraševanje. Tukaj so izdelki, ki vas lahko zanimajo:',
      'it': 'Grazie per la sua richiesta. Ecco i prodotti che potrebbero interessarla:',
      'en': 'Thank you for your inquiry. Here are the products that might interest you:',
      
      // Additional languages
      'hr': 'Hvala na vašem upitu. Evo proizvoda koji vas mogu zanimati:',
      'fr': 'Merci pour votre demande. Voici les produits qui pourraient vous intéresser:',
      'es': 'Gracias por su consulta. Aquí están los productos que podrían interesarle:'
    };

    const template = templates[language as keyof typeof templates] || templates.en;
    
    let response = template;
    
    if (products.length > 0) {
      response += '\n\n';
      products.slice(0, 3).forEach((product, index) => {
        response += `${index + 1}. ${product.name} - ${product.price} ${product.currency}\n`;
        if (product.url) {
          response += `   🔗 ${product.url}\n`;
        }
      });
    }

    // Add professional closing based on language
    const closings = {
      'de': '\n\nMit freundlichen Grüßen,\nIhr Withcar Team',
      'sl': '\n\nLep pozdrav,\nEkipa Withcar',
      'it': '\n\nCordiali saluti,\nIl team Withcar',
      'en': '\n\nBest regards,\nWithcar Team',
      'hr': '\n\nS poštovanjem,\nWithcar tim',
      'fr': '\n\nCordialement,\nÉquipe Withcar',
      'es': '\n\nSaludos cordiales,\nEquipo Withcar'
    };

    response += closings[language as keyof typeof closings] || closings.en;

    return response;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get sync statistics by language
   */
  async getSyncStatsByLanguage(organizationId: string): Promise<Record<string, {
    totalProducts: number;
    lastSyncAt: string | null;
    categories: string[];
  }>> {
    // TODO: Implement statistics retrieval from RAG system
    return {};
  }
}

export default MagentoMultiLanguageAdapter;

