import { NextRequest, NextResponse } from 'next/server';
import { ProductRecommendationService } from '@/services/product-recommendation';

/**
 * GET handler for personalized product recommendations
 * 
 * @param request - The incoming request
 * @returns A response with personalized product recommendations
 */
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const contactId = searchParams.get('contactId');
    const limit = searchParams.has('limit') ? parseInt(searchParams.get('limit')!, 10) : 5;

    // Validate required fields
    if (!contactId) {
      return NextResponse.json(
        { error: 'Contact ID is required' },
        { status: 400 }
      );
    }

    // Create service and get recommendations
    const recommendationService = new ProductRecommendationService();
    const result = await recommendationService.getPersonalizedRecommendations(contactId, limit);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in personalized recommendations API:', error);
    return NextResponse.json(
      { error: 'Failed to get personalized recommendations', message: error.message },
      { status: 500 }
    );
  }
}
