import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getUID } from '@/lib/auth/utils';
import { UnifiedRAGService } from '@/lib/rag/unified-rag-service';
import { LiveMetakockaAdapter } from '@/lib/rag/adapters/live-metakocka-adapter';
import { MagentoMultiLanguageAdapter } from '@/lib/rag/adapters/magento-multi-language-adapter';
import { AILanguageService } from '@/lib/rag/ai-language-service';
import { getUserOrganization } from '@/lib/middleware/ai-limit-middleware-v2';
import { withAILimitCheckAndTopup } from '@/lib/middleware/ai-limit-middleware-v2';

/**
 * Withcar-Specific Email Generation API
 * POST /api/email/generate-withcar-response - Generate emails with live Metakocka + Magento integration
 * 
 * This is the PRODUCTION endpoint for Withcar that:
 * 1. Uses live Metakocka data (not stored locally)
 * 2. Uses cached Magento products by language
 * 3. Provides intelligent upsells based on customer history
 * 4. Responds in the customer's language
 */
export async function POST(request: NextRequest) {
  // Get user authentication
  const uid = await getUID();
  if (!uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check AI limits
  return withAILimitCheckAndTopup(request, uid, 'withcar_email_response', async () => {
    return await handleWithcarEmailGeneration(request, uid);
  });
}

async function handleWithcarEmailGeneration(request: NextRequest, uid: string) {
  try {
    // Get organization ID
    const organizationId = await getUserOrganization(uid);
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Parse request body
    const body = await request.json();
    const {
      originalEmail,
      senderEmail = '',
      contactId = '',
      tone = 'professional',
      customInstructions = '',
      includeUpsells = true,
      includeMagentoProducts = true,
      maxRecommendations = 5,
      customerCountry = null // Optional: if known from contact
    } = body;

    // Validate required fields
    if (!originalEmail) {
      return NextResponse.json({ 
        error: 'Original email content is required' 
      }, { status: 400 });
    }

    if (!senderEmail) {
      return NextResponse.json({ 
        error: 'Sender email is required for Withcar integration' 
      }, { status: 400 });
    }

    console.log(`[Withcar Email API] Generating response for ${senderEmail}`);

    // Create services
    const supabase = await createServerClient();
    const ragService = new UnifiedRAGService(supabase, process.env.OPENAI_API_KEY!);
    const liveMetakockaAdapter = new LiveMetakockaAdapter(ragService, supabase);
    const magentoAdapter = new MagentoMultiLanguageAdapter(ragService);
    const aiLanguageService = new AILanguageService(process.env.OPENAI_API_KEY!);

    // AI-powered language detection - detects ANY language and responds in the SAME language
    console.log(`[Withcar Email API] Using AI to detect language from email...`);
    const languageDetection = await aiLanguageService.detectLanguageFromEmail(originalEmail);
    
    console.log(`[Withcar Email API] Language detected:`, {
      language: languageDetection.language,
      code: languageDetection.languageCode,
      confidence: languageDetection.confidence,
      detectedBy: languageDetection.detectedBy
    });

    const detectedLanguage = languageDetection.languageCode;

    // 1. Get live Metakocka data + RAG recommendations
    const metakockaResult = await liveMetakockaAdapter.generateEmailWithLiveData(
      originalEmail,
      senderEmail,
      organizationId,
      uid
    );

    // 2. Get Magento product recommendations in customer's language
    let magentoRecommendations = { language: detectedLanguage, country: 'unknown', recommendations: [], emailResponse: '' };
    if (includeMagentoProducts) {
      try {
        magentoRecommendations = await magentoAdapter.generateLanguageAwareRecommendations(
          originalEmail,
          organizationId,
          customerCountry
        );
      } catch (error) {
        console.warn('[Withcar Email API] Magento recommendations failed:', error);
      }
    }

    // 3. Use AI to generate response in the SAME language as customer
    console.log(`[Withcar Email API] Generating AI response in ${languageDetection.language}...`);
    
    const aiResponse = await aiLanguageService.generateResponseInSameLanguage(
      originalEmail,
      languageDetection.language,
      languageDetection.languageCode,
      {
        customerInfo: metakockaResult.liveData.customerInfo,
        products: [
          ...metakockaResult.ragRecommendations.upsellProducts,
          ...magentoRecommendations.recommendations.slice(0, maxRecommendations)
        ],
        metakockaData: metakockaResult.liveData
      }
    );

    console.log(`[Withcar Email API] AI response generated with confidence: ${aiResponse.confidence}`);

    console.log(`[Withcar Email API] Generated comprehensive response in ${detectedLanguage}`);

    // Return comprehensive Withcar response
    return NextResponse.json({
      success: true,
      response: aiResponse.response,
      subject: aiResponse.subject,
      language: detectedLanguage,
      languageDetection: {
        detectedLanguage: languageDetection.language,
        confidence: languageDetection.confidence,
        detectedBy: languageDetection.detectedBy
      },
      confidence: aiResponse.confidence,
      
      // Live Metakocka data (source of truth)
      customerData: {
        found: !!metakockaResult.liveData.customerInfo,
        info: metakockaResult.liveData.customerInfo,
        recentOrders: metakockaResult.liveData.recentOrders,
        shippingStatus: metakockaResult.liveData.shippingStatus
      },

      // RAG-powered recommendations
      recommendations: {
        upsells: metakockaResult.ragRecommendations.upsellProducts,
        relatedProducts: metakockaResult.ragRecommendations.relatedProducts,
        magentoProducts: magentoRecommendations.recommendations.slice(0, maxRecommendations),
        documents: metakockaResult.ragRecommendations.relevantDocuments
      },

      // Intelligence summary
      intelligence: {
        dataSource: 'live_metakocka',
        ragEnhanced: true,
        languageDetected: detectedLanguage,
        customerFound: !!metakockaResult.liveData.customerInfo,
        totalRecommendations: 
          metakockaResult.ragRecommendations.upsellProducts.length +
          magentoRecommendations.recommendations.length,
        hasShippingInfo: metakockaResult.liveData.shippingStatus.length > 0,
        hasOrderHistory: metakockaResult.liveData.recentOrders.length > 0
      },

      processingInfo: {
        timestamp: new Date().toISOString(),
        processingTimeMs: Date.now() - Date.now(), // Will be calculated properly
        version: 'withcar-v1.0'
      }
    });

  } catch (error) {
    console.error('[Withcar Email API] Generation failed:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('429')) {
        return NextResponse.json({
          success: false,
          error: 'Rate limit exceeded. Please wait a moment and try again.',
          details: 'OpenAI API rate limit reached.'
        }, { status: 429 });
      }
      
      if (error.message.includes('metakocka')) {
        return NextResponse.json({
          success: false,
          error: 'Metakocka integration error. Please check your connection.',
          details: error.message
        }, { status: 400 });
      }
    }
    
    return NextResponse.json({
      success: false,
      error: 'Failed to generate Withcar email response',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * Combine Metakocka live data with Magento recommendations
 */
async function generateCombinedWithcarResponse(
  originalEmail: string,
  metakockaResult: any,
  magentoResult: any,
  language: string,
  options: any
): Promise<{ emailBody: string; subject: string }> {
  
  let emailBody = metakockaResult.response;
  
  // Add customer context if available
  if (metakockaResult.liveData.customerInfo) {
    const customer = metakockaResult.liveData.customerInfo;
    
    // Add personalized greeting based on language
    const greetings = {
      'it': `Gentile ${customer.name}`,
      'de': `Liebe/r ${customer.name}`,
      'sl': `Spoštovani ${customer.name}`,
      'hr': `Poštovani ${customer.name}`,
      'en': `Dear ${customer.name}`
    };
    
    const greeting = greetings[language as keyof typeof greetings] || greetings.en;
    emailBody = `${greeting},\n\n${emailBody}`;
  }

  // Add shipping status if relevant
  if (metakockaResult.liveData.shippingStatus.length > 0) {
    const shippingInfo = metakockaResult.liveData.shippingStatus[0];
    
    const statusTexts = {
      'it': `Stato della spedizione per ordine ${shippingInfo.orderNumber}: ${shippingInfo.status}`,
      'de': `Versandstatus für Bestellung ${shippingInfo.orderNumber}: ${shippingInfo.status}`,
      'sl': `Status dostave za naročilo ${shippingInfo.orderNumber}: ${shippingInfo.status}`,
      'hr': `Status dostave za narudžbu ${shippingInfo.orderNumber}: ${shippingInfo.status}`,
      'en': `Shipping status for order ${shippingInfo.orderNumber}: ${shippingInfo.status}`
    };
    
    const statusText = statusTexts[language as keyof typeof statusTexts] || statusTexts.en;
    emailBody += `\n\n${statusText}`;
  }

  // Add Magento product recommendations
  if (magentoResult.recommendations.length > 0 && options.includeUpsells) {
    const recommendationHeaders = {
      'it': 'Prodotti che potrebbero interessarla:',
      'de': 'Produkte, die Sie interessieren könnten:',
      'sl': 'Izdelki, ki vas lahko zanimajo:',
      'hr': 'Proizvodi koji vas mogu zanimati:',
      'en': 'Products that might interest you:'
    };
    
    const header = recommendationHeaders[language as keyof typeof recommendationHeaders] || recommendationHeaders.en;
    emailBody += `\n\n${header}\n`;
    
    magentoResult.recommendations.slice(0, 3).forEach((product: any, index: number) => {
      emailBody += `\n${index + 1}. ${product.name} - ${product.price} ${product.currency}`;
      if (product.url) {
        emailBody += `\n   ${product.url}`;
      }
    });
  }

  // Add signature based on language
  const signatures = {
    'it': '\n\nCordiali saluti,\nIl team Withcar',
    'de': '\n\nMit freundlichen Grüßen,\nIhr Withcar Team',
    'sl': '\n\nLep pozdrav,\nEkipa Withcar',
    'hr': '\n\nS poštovanjem,\nWithcar tim',
    'en': '\n\nBest regards,\nWithcar Team'
  };
  
  emailBody += signatures[language as keyof typeof signatures] || signatures.en;

  // Generate subject based on content and language
  const subjectPrefixes = {
    'it': 'Re: La sua richiesta',
    'de': 'Re: Ihre Anfrage', 
    'sl': 'Re: Vaše povpraševanje',
    'hr': 'Re: Vaš upit',
    'en': 'Re: Your inquiry'
  };
  
  const subject = subjectPrefixes[language as keyof typeof subjectPrefixes] || subjectPrefixes.en;

  return {
    emailBody,
    subject
  };
}

/**
 * GET /api/email/generate-withcar-response - Get Withcar email statistics
 */
export async function GET(request: NextRequest) {
  try {
    // Get user authentication
    const uid = await getUID();
    if (!uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get organization ID
    const organizationId = await getUserOrganization(uid);
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Create services
    const supabase = await createServerClient();
    const ragService = new UnifiedRAGService(supabase, process.env.OPENAI_API_KEY!);
    const magentoAdapter = new MagentoMultiLanguageAdapter(ragService);

    // Get statistics
    const [ragStats, magentoStats] = await Promise.all([
      ragService.getSystemStats(organizationId),
      magentoAdapter.getSyncStatsByLanguage(organizationId)
    ]);

    return NextResponse.json({
      success: true,
      withcarStats: {
        ragSystem: ragStats,
        magentoByLanguage: magentoStats,
        supportedLanguages: ['it', 'de', 'sl', 'hr', 'en'],
        integrations: {
          metakocka: 'live_data',
          magento: 'cached_products',
          rag: 'recommendations'
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Withcar Email API] Stats error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

