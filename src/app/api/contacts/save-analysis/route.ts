import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { ContactAnalysisService } from '@/lib/contacts/analysis-service';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      emailInfo, 
      analysisResult, 
      salesResult 
    } = await request.json();

    if (!emailInfo) {
      return NextResponse.json({ 
        error: 'Email info is required' 
      }, { status: 400 });
    }

    // Either analysisResult or salesResult must be provided
    if (!analysisResult && !salesResult) {
      return NextResponse.json({ 
        error: 'Either analysis result or sales result must be provided' 
      }, { status: 400 });
    }

    const contactService = ContactAnalysisService.getInstance();
    const result = await contactService.saveEmailAnalysis(
      emailInfo,
      analysisResult,
      salesResult,
      session.user.id,
      (session.user as any).organizationId
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        contact: result.contact
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.message
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error saving analysis to contact:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
} 