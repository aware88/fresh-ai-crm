import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

/**
 * PATCH /api/email/learning/patterns/[id]
 * 
 * Update a specific learning pattern
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const patternId = params.id;
    const body = await request.json();

    // Get Supabase client
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Verify pattern ownership
    const { data: existingPattern, error: fetchError } = await supabase
      .from('email_patterns')
      .select('id')
      .eq('id', patternId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existingPattern) {
      return NextResponse.json(
        { error: 'Pattern not found or access denied' },
        { status: 404 }
      );
    }

    // Update pattern
    const { data: updatedPattern, error: updateError } = await supabase
      .from('email_patterns')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', patternId)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('[API] Error updating pattern:', updateError);
      return NextResponse.json(
        { error: 'Failed to update pattern' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      pattern: updatedPattern
    });

  } catch (error) {
    console.error('[API] Error updating pattern:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to update pattern',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/email/learning/patterns/[id]
 * 
 * Delete a specific learning pattern
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const patternId = params.id;

    // Get Supabase client
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Delete pattern (RLS will ensure user can only delete their own)
    const { error } = await supabase
      .from('email_patterns')
      .delete()
      .eq('id', patternId)
      .eq('user_id', userId);

    if (error) {
      console.error('[API] Error deleting pattern:', error);
      return NextResponse.json(
        { error: 'Failed to delete pattern' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Pattern deleted successfully'
    });

  } catch (error) {
    console.error('[API] Error deleting pattern:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to delete pattern',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}


