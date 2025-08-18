import { NextRequest, NextResponse } from 'next/server';
import { getOpenAIClient } from '@/lib/openai/client';
import { createServerClient } from '@/lib/supabase/server';
import { UnifiedAIAnalysisService } from '@/lib/ai/unified-analysis-service';
import { getUID } from '@/lib/auth/utils';

// Ensure this API route runs in Node.js runtime (not Edge)
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // Use unified analysis service for more accurate language detection
    try {
      const userId = await getUID();
      const supabase = await createServerClient();
      const openai = getOpenAIClient();
      
      if (!openai || !userId) {
        throw new Error('Required services not available');
      }
      
      // Get organization ID for user
      let organizationId;
      try {
        const { data: userOrg } = await supabase
          .from('user_organizations')
          .select('organization_id')
          .eq('user_id', userId)
          .single();
        organizationId = userOrg?.organization_id;
      } catch (error) {
        console.log('[LanguageDetection] No organization found for user');
      }

      const analysisService = new UnifiedAIAnalysisService(supabase, openai, organizationId || '', userId);
      
      const result = await analysisService.analyzeEmail({
        emailId: `lang-detect-${Date.now()}`,
        emailContent: {
          from: 'unknown',
          to: '',
          subject: 'Language Detection',
          body: text
        },
        userId,
        organizationId,
        options: {
          includePersonality: false,
          includeContext: false,
          includeRecommendations: false,
          cacheResults: true
        }
      });
      
      if (result.success && result.analysis) {
        console.log(`🌍 Language detected via unified service: ${result.analysis.language.code} (${result.analysis.language.confidence})`);
        return NextResponse.json({
          language: result.analysis.language.code,
          confidence: result.analysis.language.confidence,
          languageName: result.analysis.language.name,
          culturalContext: result.analysis.language.culturalContext
        });
      } else {
        throw new Error(result.error || 'Unified analysis failed');
      }
    } catch (unifiedError) {
      console.warn('[LanguageDetection] Unified service failed, falling back to direct OpenAI:', unifiedError);
      
      // Fallback to direct OpenAI call
      const openai = getOpenAIClient();
      if (!openai) {
        return NextResponse.json({ language: 'en', confidence: 0.5 });
      }

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini', // Use cheaper model for fallback
        messages: [
          { 
            role: 'system', 
            content: 'You are a language detection assistant. Analyze the text carefully and respond with only the ISO language code. Common codes: "en" (English), "sl" (Slovenian), "de" (German), "it" (Italian), "es" (Spanish), "fr" (French), "hr" (Croatian), "sr" (Serbian). Pay special attention to Slavic languages which may contain characters like č, š, ž, ć, đ.' 
          },
          { 
            role: 'user', 
            content: `Detect the language of this text. Look for Slavic language indicators like č, š, ž, ć, đ, and typical Slovenian words like "je", "in", "na", "za", "se", "da", "bo", "so", "ali", "tudi", "lahko", "samo", "še", "že", "kot", "ker", "če", "bi", "pri", "od", "do", "po", "iz", "s", "z", "v", "o":\n\n${text.substring(0, 800)}` 
          }
        ],
        temperature: 0.1,
        max_tokens: 10
      });

      const detectedLanguage = response.choices[0].message.content?.trim() || 'en';
      console.log('🌍 Language detected via fallback:', detectedLanguage);

      return NextResponse.json({ 
        language: detectedLanguage,
        confidence: 0.8 // Lower confidence for fallback
      });
    }

  } catch (error) {
    console.error('Error detecting language:', error);
    return NextResponse.json({ language: 'en', confidence: 0.5 }); // Default to English
  }
} 