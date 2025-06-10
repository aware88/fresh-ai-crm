import { NextResponse } from 'next/server';
import { saveContactFromEmail } from '@/lib/contacts/extraction';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { emailContent, personalityAnalysis } = body;
    
    if (!emailContent) {
      return NextResponse.json(
        { error: 'Missing email content' },
        { status: 400 }
      );
    }
    
    const result = await saveContactFromEmail(emailContent, personalityAnalysis || '');
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error extracting contact:', error);
    return NextResponse.json(
      { error: 'Failed to extract contact information' },
      { status: 500 }
    );
  }
}
