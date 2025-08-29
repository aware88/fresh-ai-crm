/**
 * Intelligent Opportunity Calculator
 * 
 * Calculates real opportunity values based on:
 * 1. AI-extracted product requests from email content
 * 2. Actual pricing data from database/Metakocka
 * 3. Quantity and specification analysis
 * 4. Customer context and history
 */

import OpenAI from 'openai';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';

// Only initialize OpenAI on server side
const openai = typeof window === 'undefined' && process.env.OPENAI_API_KEY 
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
  : null;

export interface ProductRequest {
  productName: string;
  quantity?: number;
  unit?: string;
  specifications?: string[];
  context: string;
  confidence: number;
}

export interface OpportunityCalculation {
  productRequests: ProductRequest[];
  totalOpportunityValue: number;
  confidence: 'high' | 'medium' | 'low';
  breakdown: {
    productName: string;
    requestedQuantity?: number;
    unit?: string;
    estimatedPrice?: number;
    totalValue?: number;
    priceSource: 'database' | 'metakocka' | 'estimated';
    confidence: number;
  }[];
  reasoning: string;
}

export interface EmailWithIntelligentUpsell {
  hasUpsellOpportunity: boolean;
  calculation?: OpportunityCalculation;
  extractedAt: string;
}

/**
 * Main function to analyze email and calculate intelligent opportunities
 */
export async function calculateIntelligentOpportunity(email: {
  subject: string;
  body: string;
  from: string;
  organizationId?: string;
}): Promise<EmailWithIntelligentUpsell> {
  try {
    // Step 1: Extract product requests from email using AI
    const productRequests = await extractProductRequests(email.subject, email.body);
    
    if (productRequests.length === 0) {
      return {
        hasUpsellOpportunity: false,
        extractedAt: new Date().toISOString()
      };
    }

    // Step 2: Get pricing data for extracted products
    const breakdown = await calculatePricingBreakdown(productRequests, email.organizationId);
    
    // Step 3: Calculate total opportunity value
    const totalOpportunityValue = breakdown.reduce((sum, item) => sum + (item.totalValue || 0), 0);
    
    // Step 4: Determine overall confidence
    const avgConfidence = breakdown.reduce((sum, item) => sum + item.confidence, 0) / breakdown.length;
    const confidence = avgConfidence >= 0.8 ? 'high' : avgConfidence >= 0.5 ? 'medium' : 'low';
    
    // Step 5: Generate reasoning
    const reasoning = generateOpportunityReasoning(productRequests, breakdown, totalOpportunityValue);

    return {
      hasUpsellOpportunity: totalOpportunityValue > 0,
      calculation: {
        productRequests,
        totalOpportunityValue,
        confidence,
        breakdown,
        reasoning
      },
      extractedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('Error calculating intelligent opportunity:', error);
    return {
      hasUpsellOpportunity: false,
      extractedAt: new Date().toISOString()
    };
  }
}

/**
 * Extract product requests from email content using AI
 */
async function extractProductRequests(subject: string, body: string): Promise<ProductRequest[]> {
  try {
    // Return empty array if OpenAI is not available (client side)
    if (!openai) {
      return [];
    }
    
    const emailContent = `Subject: ${subject}\n\nBody: ${body}`;
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert at extracting product requests and pricing inquiries from business emails.

Analyze the email content and identify:
1. Specific products or services being requested
2. Quantities mentioned (with units like kg, tons, pieces, etc.)
3. Any specifications or requirements
4. Context of the request (quote, pricing, availability, etc.)

Return a JSON array of product requests with this structure:
[
  {
    "productName": "standardized product name",
    "quantity": number or null,
    "unit": "kg|tons|pieces|units|meters|etc" or null,
    "specifications": ["spec1", "spec2"] or [],
    "context": "relevant sentence or phrase from email",
    "confidence": 0.0-1.0
  }
]

Examples:
- "Can you quote 1mt of organic ashwagandha powder" -> 
  {"productName": "organic ashwagandha powder", "quantity": 1, "unit": "mt", "specifications": ["organic"], "context": "Can you quote 1mt of organic ashwagandha powder", "confidence": 0.95}

- "Looking for pricing on 500kg premium turmeric" ->
  {"productName": "turmeric", "quantity": 500, "unit": "kg", "specifications": ["premium"], "context": "Looking for pricing on 500kg premium turmeric", "confidence": 0.9}

- "Need quote for industrial pumps, high pressure rated" ->
  {"productName": "industrial pumps", "quantity": null, "unit": null, "specifications": ["high pressure rated"], "context": "Need quote for industrial pumps, high pressure rated", "confidence": 0.85}

Only extract clear product requests. Ignore general inquiries without specific products.`
        },
        {
          role: 'user',
          content: emailContent
        }
      ],
      temperature: 0.1,
      max_tokens: 1500
    });

    const responseText = response.choices[0].message.content;
    if (!responseText) return [];

    try {
      const requests = JSON.parse(responseText);
      return Array.isArray(requests) ? requests.filter(r => r.confidence >= 0.5) : [];
    } catch (parseError) {
      console.warn('Failed to parse product extraction response');
      return [];
    }

  } catch (error) {
    console.error('Error extracting product requests:', error);
    return [];
  }
}

/**
 * Calculate pricing breakdown for product requests
 */
async function calculatePricingBreakdown(
  productRequests: ProductRequest[],
  organizationId?: string
): Promise<OpportunityCalculation['breakdown']> {
  const breakdown: OpportunityCalculation['breakdown'] = [];
  
  for (const request of productRequests) {
    try {
      // Try to get pricing from database first
      let pricingInfo = await getPricingFromDatabase(request.productName, organizationId);
      let priceSource: 'database' | 'metakocka' | 'estimated' = 'database';
      
      // If not found in database, try Metakocka API
      if (!pricingInfo && organizationId) {
        pricingInfo = await getPricingFromMetakocka(request.productName, organizationId);
        priceSource = 'metakocka';
      }
      
      // If still not found, use AI estimation
      if (!pricingInfo) {
        pricingInfo = await getEstimatedPricing(request);
        priceSource = 'estimated';
      }
      
      const totalValue = pricingInfo && request.quantity 
        ? pricingInfo.price * request.quantity 
        : pricingInfo?.price || 0;
      
      breakdown.push({
        productName: request.productName,
        requestedQuantity: request.quantity,
        unit: request.unit,
        estimatedPrice: pricingInfo?.price,
        totalValue,
        priceSource,
        confidence: pricingInfo ? (priceSource === 'database' ? 0.95 : priceSource === 'metakocka' ? 0.85 : 0.6) : 0.3
      });
      
    } catch (error) {
      console.error(`Error calculating pricing for ${request.productName}:`, error);
      breakdown.push({
        productName: request.productName,
        requestedQuantity: request.quantity,
        unit: request.unit,
        priceSource: 'estimated',
        confidence: 0.2
      });
    }
  }
  
  return breakdown;
}

/**
 * Get pricing from database
 */
async function getPricingFromDatabase(
  productName: string,
  organizationId?: string
): Promise<{ price: number; currency: string; unit?: string } | null> {
  try {
    const supabase = createClientComponentClient<Database>();
    
    // Search for products by name (fuzzy matching)
    const { data: products } = await supabase
      .from('products')
      .select('id, name, selling_price')
      .eq('organization_id', organizationId)
      .ilike('name', `%${productName}%`)
      .limit(5);
    
    if (!products || products.length === 0) return null;
    
    // Find best match
    const bestMatch = products.find(p => 
      p.name.toLowerCase().includes(productName.toLowerCase()) ||
      productName.toLowerCase().includes(p.name.toLowerCase())
    ) || products[0];
    
    if (bestMatch?.selling_price) {
      return {
        price: bestMatch.selling_price,
        currency: 'EUR' // Default currency, should be configurable
      };
    }
    
    // Try supplier pricing table
    const { data: supplierPricing } = await supabase
      .from('supplier_product_pricing')
      .select('price, currency, unit, product_name')
      .eq('organization_id', organizationId)
      .ilike('product_name', `%${productName}%`)
      .limit(1);
    
    if (supplierPricing && supplierPricing.length > 0) {
      const pricing = supplierPricing[0];
      return {
        price: pricing.price,
        currency: pricing.currency || 'EUR',
        unit: pricing.unit || undefined
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching pricing from database:', error);
    return null;
  }
}

/**
 * Get pricing from Metakocka API
 */
async function getPricingFromMetakocka(
  productName: string,
  organizationId: string
): Promise<{ price: number; currency: string; unit?: string } | null> {
  try {
    // This would integrate with the existing Metakocka service
    // For now, return null as the integration needs to be implemented
    return null;
  } catch (error) {
    console.error('Error fetching pricing from Metakocka:', error);
    return null;
  }
}

/**
 * Get estimated pricing using AI when no database match is found
 */
async function getEstimatedPricing(
  request: ProductRequest
): Promise<{ price: number; currency: string; unit?: string } | null> {
  try {
    // Return null if OpenAI is not available (client side)
    if (!openai) {
      return null;
    }
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a pricing expert. Given a product request, provide a reasonable price estimate based on market knowledge.

Return a JSON object with this structure:
{
  "price": number, // Price per unit in EUR
  "currency": "EUR",
  "unit": "kg|pieces|units|etc",
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation"
}

Consider:
- Current market prices
- Product specifications
- Typical wholesale vs retail pricing
- Regional variations

If you cannot provide a reasonable estimate, return null.`
        },
        {
          role: 'user',
          content: `Product: ${request.productName}
Quantity: ${request.quantity || 'not specified'} ${request.unit || ''}
Specifications: ${request.specifications?.join(', ') || 'none'}
Context: ${request.context}`
        }
      ],
      temperature: 0.2,
      max_tokens: 300
    });

    const responseText = response.choices[0].message.content;
    if (!responseText) return null;

    try {
      const estimate = JSON.parse(responseText);
      return estimate.confidence >= 0.5 ? {
        price: estimate.price,
        currency: estimate.currency,
        unit: estimate.unit
      } : null;
    } catch (parseError) {
      return null;
    }

  } catch (error) {
    console.error('Error getting AI price estimate:', error);
    return null;
  }
}

/**
 * Generate human-readable reasoning for the opportunity
 */
function generateOpportunityReasoning(
  productRequests: ProductRequest[],
  breakdown: OpportunityCalculation['breakdown'],
  totalValue: number
): string {
  const validItems = breakdown.filter(item => item.totalValue && item.totalValue > 0);
  
  if (validItems.length === 0) {
    return 'No clear pricing information available for requested products.';
  }
  
  const itemDescriptions = validItems.map(item => {
    const qty = item.requestedQuantity ? `${item.requestedQuantity}${item.unit ? ' ' + item.unit : ''}` : '';
    const price = item.estimatedPrice ? `€${item.estimatedPrice.toFixed(2)}${item.unit ? '/' + item.unit : ''}` : '';
    const total = item.totalValue ? `€${item.totalValue.toLocaleString()}` : '';
    const source = item.priceSource === 'database' ? '(from database)' : 
                   item.priceSource === 'metakocka' ? '(from Metakocka)' : '(estimated)';
    
    return `${item.productName}: ${qty} at ${price} = ${total} ${source}`;
  });
  
  return `Customer requesting: ${itemDescriptions.join('; ')}. Total opportunity value: €${totalValue.toLocaleString()}.`;
}
