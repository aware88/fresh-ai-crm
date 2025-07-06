import { NextRequest, NextResponse } from 'next/server';
import { ProductRecommendationService, ProductRecommendationOptions } from '@/services/product-recommendation';
import { createServerClient } from '@/lib/supabase/server';

/**
 * GET handler for product recommendations
 * 
 * @param request - The incoming request
 * @returns A response with product recommendations
 */
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query') || undefined;
    const contactId = searchParams.get('contactId') || undefined;
    const categoryId = searchParams.get('categoryId') || undefined;
    const limit = searchParams.has('limit') ? parseInt(searchParams.get('limit')!, 10) : undefined;
    const includeOutOfStock = searchParams.has('includeOutOfStock') 
      ? searchParams.get('includeOutOfStock') === 'true' 
      : undefined;
    const minPrice = searchParams.has('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined;
    const maxPrice = searchParams.has('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined;
    const sortBy = searchParams.get('sortBy') as ProductRecommendationOptions['sortBy'] || undefined;

    // Create service and get recommendations
    const recommendationService = new ProductRecommendationService();
    const result = await recommendationService.recommendProducts({
      query,
      contactId,
      categoryId,
      limit,
      includeOutOfStock,
      minPrice,
      maxPrice,
      sortBy
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in product recommendations API:', error);
    return NextResponse.json(
      { error: 'Failed to get product recommendations', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST handler for email-based product recommendations
 * 
 * @param request - The incoming request
 * @returns A response with product recommendations
 */
export async function POST(request: NextRequest) {
  try {
    // Get request body
    const body = await request.json();
    const { emailContent, contactId, limit } = body;

    // Validate required fields
    if (!emailContent) {
      return NextResponse.json(
        { error: 'Email content is required' },
        { status: 400 }
      );
    }

    // Create service and get recommendations
    const recommendationService = new ProductRecommendationService();
    const result = await recommendationService.recommendProductsFromEmail(
      emailContent,
      contactId,
      limit
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in email-based product recommendations API:', error);
    return NextResponse.json(
      { error: 'Failed to get product recommendations', message: error.message },
      { status: 500 }
    );
  }
}
