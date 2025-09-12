import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cookieStore = await cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });
    const { searchParams } = new URL(request.url);
    const emailId = searchParams.get('emailId');
    const analysisType = searchParams.get('type');

    let query = supabase
      .from('email_analyses')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (emailId) {
      query = query.eq('email_id', emailId);
    }

    if (analysisType) {
      query = query.eq('analysis_type', analysisType);
    }

    const { data: analyses, error } = await query;

    if (error) {
      console.error('Error fetching analyses:', error);
      return NextResponse.json({ error: 'Failed to fetch analyses' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      analyses: analyses || []
    });
  } catch (error) {
    console.error('Error in email analyses API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { emailId, analysisResult, analysisType } = await request.json();

    if (!emailId || !analysisResult || !analysisType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });

    const { data: analysis, error } = await supabase
      .from('email_analyses')
      .insert({
        email_id: emailId,
        user_id: session.user.id,
        analysis_result: analysisResult,
        analysis_type: analysisType,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving analysis:', error);
      return NextResponse.json({ error: 'Failed to save analysis' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      analysis
    });
  } catch (error) {
    console.error('Error in email analyses POST API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 