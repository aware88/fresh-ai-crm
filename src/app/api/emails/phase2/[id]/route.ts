import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from('emails')
      .select('id, metadata, organization_id')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    const phase2 = (data.metadata as any)?.phase2 || null;
    if (!phase2) {
      return NextResponse.json({ success: true, phase2: null }, { status: 200 });
    }

    return NextResponse.json({ success: true, phase2 }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
