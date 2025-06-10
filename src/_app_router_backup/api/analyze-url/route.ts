import { NextResponse } from 'next/server';
import { analyzeUrl } from '@/lib/openai/client';
import { marked } from 'marked';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }
    
    // Analyze the URL
    const analysis = await analyzeUrl(url);
    
    // Convert markdown to HTML for rendering
    const htmlAnalysis = marked.parse(analysis);
    
    return NextResponse.json({
      analysis: htmlAnalysis,
      raw: analysis
    });
  } catch (error) {
    console.error('Error in analyze-url API:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
