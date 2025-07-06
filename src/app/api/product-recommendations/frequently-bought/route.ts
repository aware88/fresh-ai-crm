import { NextRequest, NextResponse } from 'next/server';
import { ProductRecommendationService } from '@/services/product-recommendation';

/**
 * GET handler for frequently bought together product recommendations
 * 
 * @param request - The incoming request
 * @returns A response with frequently bought together products
 */
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const productId = searchParams.get('productId');
    const limit = searchParams.has('limit') ? parseInt(searchParams.get('limit')!, 10) : 5;

    // Validate required fields
    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Create service and get recommendations
    const recommendationService = new ProductRecommendationService();
    const result = await recommendationService.getFrequentlyBoughtTogether(productId, limit);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in frequently bought together API:', error);
    return NextResponse.json(
      { error: 'Failed to get frequently bought together products', message: error.message },
      { status: 500 }
    );
  }
}
