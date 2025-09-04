import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { createLazyServerClient } from '@/lib/supabase/lazy-client';

/**
 * GET handler for retrieving follow-up templates
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const isPublic = searchParams.get('public') === 'true';
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    
    const supabase = await createLazyServerClient();
    
    let query = supabase
      .from('email_followup_templates')
      .select('*')
      .eq('is_active', true)
      .order('usage_count', { ascending: false });
    
    if (isPublic) {
      query = query.eq('is_public', true);
    } else {
      query = query.or(`user_id.eq.${session.user.id},is_public.eq.true`);
    }
    
    if (category) {
      query = query.eq('category', category);
    }
    
    if (limit) {
      query = query.limit(limit);
    }
    
    const { data: templates, error } = await query;
    
    if (error) {
      console.error('Error fetching templates:', error);
      return NextResponse.json(
        { error: 'Failed to fetch templates' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ templates });
    
  } catch (error) {
    console.error('Error in GET /api/email/followups/templates:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST handler for creating follow-up templates
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await req.json();
    
    // Validate required fields
    if (!body.name || !body.subject_template || !body.body_template) {
      return NextResponse.json(
        { error: 'Missing required fields: name, subject_template, body_template' },
        { status: 400 }
      );
    }
    
    const supabase = await createLazyServerClient();
    
    const templateData = {
      user_id: session.user.id,
      organization_id: body.organizationId,
      name: body.name,
      description: body.description,
      category: body.category || 'general',
      subject_template: body.subject_template,
      body_template: body.body_template,
      tone: body.tone || 'professional',
      approach: body.approach || 'gentle',
      variables: body.variables || [],
      use_case: body.use_case,
      language: body.language || 'en',
      is_public: body.is_public || false,
      tags: body.tags || []
    };
    
    const { data: template, error } = await supabase
      .from('email_followup_templates')
      .insert(templateData)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating template:', error);
      return NextResponse.json(
        { error: 'Failed to create template' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ template }, { status: 201 });
    
  } catch (error) {
    console.error('Error in POST /api/email/followups/templates:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
