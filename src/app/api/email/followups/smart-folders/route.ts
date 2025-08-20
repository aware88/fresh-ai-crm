import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { createLazyServerClient } from '@/lib/supabase/lazy-client';

/**
 * GET handler for retrieving smart folders
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(req.url);
    const includeCount = searchParams.get('include_count') === 'true';
    
    const supabase = await createLazyServerClient();
    
    const { data: folders, error } = await supabase
      .from('email_followup_smart_folders')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('is_active', true)
      .order('display_order', { ascending: true });
    
    if (error) {
      console.error('Error fetching smart folders:', error);
      return NextResponse.json(
        { error: 'Failed to fetch smart folders' },
        { status: 500 }
      );
    }
    
    // Get counts for each folder if requested
    if (includeCount && folders) {
      const foldersWithCounts = await Promise.all(
        folders.map(async (folder) => {
          try {
            // Get a fresh Supabase client for each request to avoid connection issues
            const folderSupabase = await createLazyServerClient();
            const { data: count } = await folderSupabase
              .rpc('get_smart_folder_followups', {
                folder_id: folder.id,
                user_uuid: session.user.id,
                limit_count: 1000 // High limit to get count
              });
            
            return {
              ...folder,
              count: count?.length || 0
            };
          } catch (error) {
            console.error(`Error getting count for folder ${folder.id}:`, error);
            return {
              ...folder,
              count: 0
            };
          }
        })
      );
      
      return NextResponse.json({ folders: foldersWithCounts });
    }
    
    return NextResponse.json({ folders });
    
  } catch (error) {
    console.error('Error in GET /api/email/followups/smart-folders:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST handler for creating smart folders
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await req.json();
    
    // Validate required fields
    if (!body.name || !body.filter_rules) {
      return NextResponse.json(
        { error: 'Missing required fields: name, filter_rules' },
        { status: 400 }
      );
    }
    
    const supabase = await createLazyServerClient();
    
    // Get next display order
    const { data: maxOrder } = await supabase
      .from('email_followup_smart_folders')
      .select('display_order')
      .eq('user_id', session.user.id)
      .order('display_order', { ascending: false })
      .limit(1)
      .single();
    
    const folderData = {
      user_id: session.user.id,
      organization_id: body.organizationId,
      name: body.name,
      description: body.description,
      color: body.color || '#3B82F6',
      icon: body.icon || 'folder',
      filter_rules: body.filter_rules,
      sort_order: body.sort_order || 'due_date_asc',
      auto_refresh: body.auto_refresh !== false,
      show_count: body.show_count !== false,
      display_order: (maxOrder?.display_order || 0) + 1
    };
    
    const { data: folder, error } = await supabase
      .from('email_followup_smart_folders')
      .insert(folderData)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating smart folder:', error);
      return NextResponse.json(
        { error: 'Failed to create smart folder' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ folder }, { status: 201 });
    
  } catch (error) {
    console.error('Error in POST /api/email/followups/smart-folders:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
