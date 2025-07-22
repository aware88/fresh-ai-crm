import { NextRequest, NextResponse } from 'next/server';
import { getOpenAIClient } from '@/lib/openai/client';

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const openai = getOpenAIClient();
    if (!openai) {
      return NextResponse.json({ language: 'en' }); // Default to English
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { 
          role: 'system', 
          content: 'You are a language detection assistant. Respond with only the ISO language code (e.g., "en", "es", "fr", "de", "it", "sl", etc.) for the provided text.' 
        },
        { 
          role: 'user', 
          content: `Detect the language of this text: ${text.substring(0, 500)}` 
        }
      ],
      temperature: 0.1,
      max_tokens: 10
    });

    const detectedLanguage = response.choices[0].message.content?.trim() || 'en';
    console.log('🌍 Language detected:', detectedLanguage);

    return NextResponse.json({ 
      language: detectedLanguage,
      confidence: 0.9 
    });

  } catch (error) {
    console.error('Error detecting language:', error);
    return NextResponse.json({ language: 'en' }); // Default to English
  }
} 