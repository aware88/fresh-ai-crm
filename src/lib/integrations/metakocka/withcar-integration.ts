/**
 * Withcar-Specific Metakocka Integration
 * 
 * This service handles Withcar's specific product catalog structure,
 * brand codes, and integration with their Metakocka Company ID: 2889
 */

import { createLazyServerClient } from '@/lib/supabase/lazy-client';

export interface WithcarProduct {
  id: string;
  name: string;
  brandCode: string;
  modelCode: string;
  variantCode: string;
  yearCode: string;
  url: string;
  category: string;
  compatibility: {
    brand: string;
    model: string;
    variant: string;
    yearRange: string;
  };
  metakockaId?: string;
  gledringProduct?: boolean;
}

export interface WithcarCatalogData {
  products: WithcarProduct[];
  brandMapping: { [key: string]: string };
  modelMapping: { [key: string]: string };
  categoryMapping: { [key: string]: string };
}

export class WithcarIntegrationService {
  private supabase = createLazyServerClient();
  private companyId = '2889';
  private apiKey = 'd1233595-4309-4ff2-aaf0-5e2b2a191270';
  
  // Withcar brand code mappings (from their Excel data)
  private brandCodeMapping: { [key: string]: string } = {
    '1618': 'Alfa Romeo',
    '1619': 'Audi',
    '1620': 'BMW',
    '1621': 'Mercedes-Benz',
    '1622': 'Volkswagen',
    '1623': 'Skoda',
    '1624': 'Seat',
    '1625': 'Citroën',
    '1626': 'Peugeot',
    '1627': 'Renault',
    '1628': 'Ford',
    '1629': 'Opel',
    '1630': 'Toyota',
    '1631': 'Honda',
    '1632': 'Nissan',
    '1633': 'Hyundai',
    '1634': 'Kia',
    '1635': 'Mazda',
    '1636': 'Volvo'
  };

  // Withcar product categories
  private productCategories = {
    'gumijasti_tepihi': 'Gumijasti tepihi',
    'gumi_korito': 'Gumi korito Gledring',
    'tekstilne_preproge': 'Tekstilne preproge',
    'korita_prtljaznik': 'Korita za prtljažnik',
    'snezne_verige': 'Snežne verige',
    'sencniki': 'Tipski senčniki za avto',
    'pokrivalo_toca': 'Pokrivalo proti toči',
    'stresni_nosilci': 'Strešni nosilci',
    'stresni_kovcki': 'Strešni kovčki',
    'zracni_odbojniki': 'Zračni odbojniki',
    'zascitne_nalepke': 'Zaščitne nalepke za odbijač',
    'nosilci_kolesa': 'Nosilci za kolesa',
    'zascitne_podloge': 'Zaščitne podloge za tovorna vozila',
    'delilne_mreze': 'Tipske delilne mreže',
    'pokrivalo_prestige': 'Pokrivalo za avto Prestige',
    'brisalci': 'Brisalci za avto Beast Wipers',
    'avto_kozmetika': 'Avto kozmetika'
  };

  /**
   * Search for Withcar products by vehicle specification
   */
  async searchProductsByVehicle(
    brand: string,
    model: string,
    year: number,
    variant?: string,
    category?: string
  ): Promise<WithcarProduct[]> {
    try {
      console.log(`[Withcar Integration] Searching products for ${brand} ${model} ${year}`);
      
      // Get brand code
      const brandCode = this.getBrandCode(brand);
      if (!brandCode) {
        console.warn(`[Withcar Integration] Unknown brand: ${brand}`);
        return [];
      }

      // For now, we'll simulate the product search based on the pattern from their Excel
      // In a real implementation, this would query their Metakocka API or database
      const mockProducts = await this.getMockWithcarProducts(brandCode, model, year, variant, category);
      
      return mockProducts;

    } catch (error) {
      console.error(`[Withcar Integration] Error searching products:`, error);
      return [];
    }
  }

  /**
   * Get product details by URL (extracted from their Excel data)
   */
  async getProductByUrl(url: string): Promise<WithcarProduct | null> {
    try {
      // Parse Withcar URL to extract product information
      const urlParams = this.parseWithcarUrl(url);
      if (!urlParams) {
        return null;
      }

      const product: WithcarProduct = {
        id: `withcar_${Date.now()}`,
        name: urlParams.productName,
        brandCode: urlParams.brandCode,
        modelCode: urlParams.modelCode,
        variantCode: urlParams.variantCode,
        yearCode: urlParams.yearCode,
        url: url,
        category: urlParams.category,
        compatibility: {
          brand: this.brandCodeMapping[urlParams.brandCode] || 'Unknown',
          model: urlParams.modelName,
          variant: urlParams.variantName,
          yearRange: urlParams.yearRange
        },
        gledringProduct: urlParams.category === 'gumijasti_tepihi' || urlParams.category === 'gumi_korito'
      };

      return product;

    } catch (error) {
      console.error(`[Withcar Integration] Error getting product by URL:`, error);
      return null;
    }
  }

  /**
   * Get Withcar product recommendations for AI context
   */
  async getProductRecommendations(
    brand: string,
    model: string,
    year: number,
    customerQuery: string
  ): Promise<any> {
    try {
      const products = await this.searchProductsByVehicle(brand, model, year);
      
      // Filter products based on customer query
      const relevantProducts = products.filter(product => {
        const queryLower = customerQuery.toLowerCase();
        const productName = product.name.toLowerCase();
        const category = product.category.toLowerCase();
        
        // Check for relevant keywords
        if (queryLower.includes('tepih') || queryLower.includes('mat')) {
          return category.includes('tepih') || category.includes('mat');
        }
        if (queryLower.includes('korito') || queryLower.includes('trunk')) {
          return category.includes('korito') || category.includes('trunk');
        }
        if (queryLower.includes('verige') || queryLower.includes('chain')) {
          return category.includes('verige') || category.includes('chain');
        }
        if (queryLower.includes('nosilec') || queryLower.includes('rack')) {
          return category.includes('nosilec') || category.includes('rack');
        }
        
        return productName.includes(queryLower) || category.includes(queryLower);
      });

      return {
        products: relevantProducts,
        total: relevantProducts.length,
        brand: brand,
        model: model,
        year: year,
        gledringProducts: relevantProducts.filter(p => p.gledringProduct),
        categories: [...new Set(relevantProducts.map(p => p.category))]
      };

    } catch (error) {
      console.error(`[Withcar Integration] Error getting product recommendations:`, error);
      return {
        products: [],
        total: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get brand code from brand name
   */
  private getBrandCode(brandName: string): string | null {
    const normalizedBrand = brandName.toLowerCase().replace(/[^a-z]/g, '');
    
    // Find matching brand code
    for (const [code, name] of Object.entries(this.brandCodeMapping)) {
      if (name.toLowerCase().replace(/[^a-z]/g, '') === normalizedBrand) {
        return code;
      }
    }
    
    return null;
  }

  /**
   * Parse Withcar URL to extract product information
   */
  private parseWithcarUrl(url: string): any | null {
    try {
      // Example URL: https://www.withcar.it/Avtomobili/index/search?znamka=1618&model=2913&oblika=1564&letnik=3426
      const urlObj = new URL(url);
      const params = new URLSearchParams(urlObj.search);
      
      const brandCode = params.get('znamka');
      const modelCode = params.get('model');
      const variantCode = params.get('oblika');
      const yearCode = params.get('letnik');
      
      if (!brandCode || !modelCode) {
        return null;
      }

      return {
        brandCode,
        modelCode,
        variantCode,
        yearCode,
        productName: `${this.brandCodeMapping[brandCode]} Product`,
        modelName: `Model ${modelCode}`,
        variantName: `Variant ${variantCode}`,
        yearRange: `Year ${yearCode}`,
        category: 'gumijasti_tepihi' // Default category
      };

    } catch (error) {
      console.error(`[Withcar Integration] Error parsing URL:`, error);
      return null;
    }
  }

  /**
   * Get mock Withcar products (replace with real API call)
   */
  private async getMockWithcarProducts(
    brandCode: string,
    model: string,
    year: number,
    variant?: string,
    category?: string
  ): Promise<WithcarProduct[]> {
    // This would be replaced with actual Metakocka API calls
    // For now, returning mock data based on Withcar's product structure
    
    const brandName = this.brandCodeMapping[brandCode] || 'Unknown';
    const baseId = `${brandCode}_${model}_${year}`;
    
    const mockProducts: WithcarProduct[] = [];
    
    // Add Gledring rubber floor mats (their main product)
    mockProducts.push({
      id: `${baseId}_gumijasti_tepihi`,
      name: `Gumijasti tepihi Gledring - ${brandName} ${model} ${year}`,
      brandCode,
      modelCode: model,
      variantCode: variant || '',
      yearCode: year.toString(),
      url: `https://www.withcar.si/Avtomobili/index/search?znamka=${brandCode}&model=${model}&oblika=${variant}&letnik=${year}`,
      category: 'gumijasti_tepihi',
      compatibility: {
        brand: brandName,
        model: model,
        variant: variant || '',
        yearRange: year.toString()
      },
      gledringProduct: true
    });

    // Add Gledring trunk liner
    mockProducts.push({
      id: `${baseId}_gumi_korito`,
      name: `Gumi korito Gledring - ${brandName} ${model} ${year}`,
      brandCode,
      modelCode: model,
      variantCode: variant || '',
      yearCode: year.toString(),
      url: `https://www.withcar.si/Avtomobili/index/search?znamka=${brandCode}&model=${model}&oblika=${variant}&letnik=${year}`,
      category: 'gumi_korito',
      compatibility: {
        brand: brandName,
        model: model,
        variant: variant || '',
        yearRange: year.toString()
      },
      gledringProduct: true
    });

    // Add other products based on season and category
    if (!category || category === 'stresni_nosilci') {
      mockProducts.push({
        id: `${baseId}_stresni_nosilci`,
        name: `Strešni nosilci Nordrive - ${brandName} ${model} ${year}`,
        brandCode,
        modelCode: model,
        variantCode: variant || '',
        yearCode: year.toString(),
        url: `https://www.withcar.si/Avtomobili/index/search?znamka=${brandCode}&model=${model}&oblika=${variant}&letnik=${year}`,
        category: 'stresni_nosilci',
        compatibility: {
          brand: brandName,
          model: model,
          variant: variant || '',
          yearRange: year.toString()
        },
        gledringProduct: false
      });
    }

    return mockProducts;
  }

  /**
   * Get Withcar-specific AI context for product matching
   */
  async getWithcarAIContext(
    brand: string,
    model: string,
    year: number,
    customerQuery: string
  ): Promise<any> {
    try {
      const recommendations = await this.getProductRecommendations(brand, model, year, customerQuery);
      
      return {
        withcarContext: {
          companyId: this.companyId,
          isGledringManufacturer: true,
          mainProducts: ['gumijasti_tepihi', 'gumi_korito'],
          qualityFocus: 'precision_fit',
          manufacturingOrigin: 'Slovenia',
          familyBusiness: true,
          since: 1949
        },
        availableProducts: recommendations.products,
        gledringProducts: recommendations.gledringProducts,
        productCategories: Object.values(this.productCategories),
        recommendations: recommendations
      };

    } catch (error) {
      console.error(`[Withcar Integration] Error getting AI context:`, error);
      return {
        withcarContext: {
          companyId: this.companyId,
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        availableProducts: [],
        gledringProducts: [],
        productCategories: Object.values(this.productCategories)
      };
    }
  }
} 