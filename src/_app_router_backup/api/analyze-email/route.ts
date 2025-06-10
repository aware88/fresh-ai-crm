import { NextResponse } from 'next/server';
import { analyzeEmail } from '@/lib/openai/client';

export async function POST(request: Request) {
  try {
    const { emailContent } = await request.json();

    if (!emailContent || typeof emailContent !== 'string') {
      return NextResponse.json(
        { error: 'Email content is required' }, 
        { status: 400 }
      );
    }

    // Store the analysis in Supabase (future implementation)
    // For now, just return the analysis
    const analysis = await analyzeEmail(emailContent);

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error('Error in analyze-email API:', error);
    return NextResponse.json(
      { error: 'Failed to analyze email' }, 
      { status: 500 }
    );
  }
}
