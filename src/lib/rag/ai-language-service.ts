import OpenAI from 'openai';

/**
 * AI-Powered Language Detection and Response Service
 * Uses OpenAI to detect language and generate responses in the SAME language
 */
export class AILanguageService {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  /**
   * AI-powered language detection - detects ANY language, not just predefined ones
   */
  async detectLanguageFromEmail(emailContent: string): Promise<{
    language: string;
    languageCode: string;
    confidence: number;
    detectedBy: 'ai' | 'patterns';
  }> {
    try {
      // First try AI detection for more accurate results
      const aiDetection = await this.aiDetectLanguage(emailContent);
      
      if (aiDetection.confidence > 0.8) {
        return {
          language: aiDetection.language,
          languageCode: aiDetection.languageCode,
          confidence: aiDetection.confidence,
          detectedBy: 'ai'
        };
      }
      
      // Fallback to pattern-based detection
      const patternDetection = this.patternDetectLanguage(emailContent);
      
      return {
        language: patternDetection.language,
        languageCode: patternDetection.languageCode,
        confidence: patternDetection.confidence,
        detectedBy: 'patterns'
      };

    } catch (error) {
      console.error('[AI Language Service] Detection failed:', error);
      
      // Final fallback to pattern detection
      const fallback = this.patternDetectLanguage(emailContent);
      return {
        language: fallback.language,
        languageCode: fallback.languageCode,
        confidence: 0.5,
        detectedBy: 'patterns'
      };
    }
  }

  /**
   * AI-powered language detection using OpenAI
   */
  private async aiDetectLanguage(emailContent: string): Promise<{
    language: string;
    languageCode: string;
    confidence: number;
  }> {
    const prompt = `Detect the language of this email and respond with JSON:

Email: "${emailContent.substring(0, 500)}"

Respond with:
{
  "language": "Language name in English",
  "languageCode": "ISO 639-1 code (2 letters)",
  "confidence": 0.95
}

Examples:
- Italian → {"language": "Italian", "languageCode": "it", "confidence": 0.95}
- German → {"language": "German", "languageCode": "de", "confidence": 0.95}
- Slovenian → {"language": "Slovenian", "languageCode": "sl", "confidence": 0.95}`;

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini', // Fast and cost-effective for language detection
      messages: [
        {
          role: 'system',
          content: 'You are a language detection expert. Detect the language accurately and respond only with valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 100,
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(completion.choices[0]?.message?.content || '{}');
    
    return {
      language: result.language || 'English',
      languageCode: result.languageCode || 'en',
      confidence: result.confidence || 0.8
    };
  }

  /**
   * Pattern-based language detection (fallback)
   */
  private patternDetectLanguage(emailContent: string): {
    language: string;
    languageCode: string;
    confidence: number;
  } {
    const lowerContent = emailContent.toLowerCase();

    // Language patterns
    const patterns = {
      it: {
        words: ['grazie', 'prego', 'vorrei', 'ciao', 'buongiorno', 'cordiali', 'saluti', 'prodotto', 'prezzo'],
        name: 'Italian'
      },
      de: {
        words: ['danke', 'bitte', 'können', 'hallo', 'guten', 'tag', 'produkt', 'preis', 'mit', 'freundlichen', 'grüßen'],
        name: 'German'
      },
      sl: {
        words: ['hvala', 'prosim', 'lahko', 'izdelek', 'cena', 'naročilo', 'lep', 'pozdrav'],
        name: 'Slovenian'
      },
      hr: {
        words: ['hvala', 'molim', 'mogu', 'proizvod', 'cijena', 'narudžba', 'poštovanje'],
        name: 'Croatian'
      },
      fr: {
        words: ['merci', 'bonjour', 'pouvez', 'voudrais', 'produit', 'prix', 'cordialement'],
        name: 'French'
      },
      es: {
        words: ['gracias', 'hola', 'puedo', 'producto', 'precio', 'saludos', 'cordiales'],
        name: 'Spanish'
      }
    };

    let bestMatch = { code: 'en', name: 'English', confidence: 0.3 };

    for (const [code, pattern] of Object.entries(patterns)) {
      const matches = pattern.words.filter(word => lowerContent.includes(word)).length;
      const confidence = Math.min(matches / pattern.words.length, 0.95);
      
      if (confidence > bestMatch.confidence) {
        bestMatch = { code, name: pattern.name, confidence };
      }
    }

    return {
      language: bestMatch.name,
      languageCode: bestMatch.code,
      confidence: bestMatch.confidence
    };
  }

  /**
   * Generate response in the SAME language as the input
   * Uses AI to ensure natural, native-level responses
   */
  async generateResponseInSameLanguage(
    originalEmail: string,
    detectedLanguage: string,
    languageCode: string,
    contextData: {
      customerInfo?: any;
      products?: any[];
      metakockaData?: any;
    }
  ): Promise<{
    response: string;
    subject: string;
    confidence: number;
  }> {
    try {
      // Build context for AI response
      let context = '';
      
      if (contextData.customerInfo) {
        context += `Customer: ${contextData.customerInfo.name}\n`;
        context += `Recent orders: ${contextData.customerInfo.recentOrders?.length || 0}\n`;
      }

      if (contextData.products && contextData.products.length > 0) {
        context += `\nRelevant products:\n`;
        contextData.products.slice(0, 3).forEach((product, i) => {
          context += `${i + 1}. ${product.name} - ${product.price} ${product.currency}\n`;
        });
      }

      const systemPrompt = `You are a professional customer service assistant for Withcar, an automotive company.

CRITICAL RULES:
1. RESPOND IN THE EXACT SAME LANGUAGE as the customer's email
2. If customer wrote in ${detectedLanguage}, you MUST respond in ${detectedLanguage}
3. Use professional, helpful tone appropriate for automotive business
4. Include relevant product recommendations if provided
5. Keep response concise and actionable

Customer wrote in: ${detectedLanguage}
Context: ${context}

Generate a professional email response that:
- Acknowledges their inquiry
- Provides helpful information
- Includes product recommendations if relevant
- Uses proper business language for ${detectedLanguage}
- Ends with appropriate closing for ${detectedLanguage}`;

      const userPrompt = `Customer email (in ${detectedLanguage}):
"${originalEmail}"

Please respond in the SAME language (${detectedLanguage}) with:
1. Professional greeting
2. Response to their inquiry  
3. Product recommendations (if products provided)
4. Professional closing

Respond with JSON:
{
  "response": "Full email response in ${detectedLanguage}",
  "subject": "Email subject in ${detectedLanguage}",
  "confidence": 0.9
}`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o', // Use more capable model for response generation
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 800,
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(completion.choices[0]?.message?.content || '{}');

      return {
        response: result.response || `Thank you for your inquiry. We will respond soon.`,
        subject: result.subject || `Re: Your inquiry`,
        confidence: result.confidence || 0.8
      };

    } catch (error) {
      console.error('[AI Language Service] Response generation failed:', error);
      
      // Fallback response
      const fallbackResponses = {
        'it': {
          response: 'Grazie per la sua richiesta. La contatteremo presto.\n\nCordiali saluti,\nIl team Withcar',
          subject: 'Re: La sua richiesta'
        },
        'de': {
          response: 'Vielen Dank für Ihre Anfrage. Wir werden uns bald bei Ihnen melden.\n\nMit freundlichen Grüßen,\nIhr Withcar Team',
          subject: 'Re: Ihre Anfrage'
        },
        'sl': {
          response: 'Hvala za vaše povpraševanje. Kmalu se bomo oglasili.\n\nLep pozdrav,\nEkipa Withcar',
          subject: 'Re: Vaše povpraševanje'
        },
        'en': {
          response: 'Thank you for your inquiry. We will respond soon.\n\nBest regards,\nWithcar Team',
          subject: 'Re: Your inquiry'
        }
      };

      const fallback = fallbackResponses[languageCode as keyof typeof fallbackResponses] || fallbackResponses.en;
      
      return {
        response: fallback.response,
        subject: fallback.subject,
        confidence: 0.6
      };
    }
  }

  /**
   * Get Magento store for detected language
   */
  getMagentoStoreForLanguage(languageCode: string): {
    storeId: string;
    country: string;
    currency: string;
    locale: string;
  } {
    const storeMapping: Record<string, any> = {
      'it': { storeId: 'italian_store', country: 'italy', currency: 'EUR', locale: 'it_IT' },
      'de': { storeId: 'german_store', country: 'germany', currency: 'EUR', locale: 'de_DE' },
      'sl': { storeId: 'slovenian_store', country: 'slovenia', currency: 'EUR', locale: 'sl_SI' },
      'hr': { storeId: 'croatian_store', country: 'croatia', currency: 'EUR', locale: 'hr_HR' },
      'fr': { storeId: 'french_store', country: 'france', currency: 'EUR', locale: 'fr_FR' },
      'es': { storeId: 'spanish_store', country: 'spain', currency: 'EUR', locale: 'es_ES' },
      'en': { storeId: 'english_store', country: 'international', currency: 'EUR', locale: 'en_US' }
    };

    return storeMapping[languageCode] || storeMapping.en;
  }
}

