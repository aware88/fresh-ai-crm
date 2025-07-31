import { NextRequest, NextResponse } from 'next/server';
import { getOpenAIClient } from '@/lib/openai/client';

// Ensure this API route runs in Node.js runtime (not Edge)
export const runtime = 'nodejs';

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