/**
 * Top-Up Packages API
 * 
 * GET: Returns available top-up packages
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUID } from '@/lib/auth/utils';
import { topUpService } from '@/lib/services/topup-service';
import { formatPriceEUR } from '@/lib/subscription-plans-v2';

export async function GET(request: NextRequest) {
  try {
    // Get user ID from session (optional for viewing packages)
    const uid = await getUID();

    // Get available packages
    const packages = topUpService.getAvailablePackages();

    // Format packages for API response
    const formattedPackages = packages.map(pkg => ({
      id: pkg.id,
      name: pkg.name,
      description: pkg.description,
      messages: pkg.messages,
      priceEur: pkg.priceEur,
      priceFormatted: formatPriceEUR(pkg.priceEur),
      pricePerMessage: pkg.pricePerMessage,
      discountPercent: pkg.discountPercent,
      popular: pkg.popular,
      savings: pkg.discountPercent ? {
        percent: pkg.discountPercent,
        amount: pkg.messages * 0.05 - pkg.priceEur, // Compared to base rate of €0.05
        description: `Save ${pkg.discountPercent}% vs individual message pricing`
      } : null
    }));

    return NextResponse.json({
      packages: formattedPackages,
      currency: 'EUR',
      baseMessagePrice: 0.05,
      recommendations: {
        light: 'topup_100',
        regular: 'topup_500', 
        heavy: 'topup_1000'
      }
    });

  } catch (error) {
    console.error('Error in top-up packages API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}