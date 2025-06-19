import { NextRequest, NextResponse } from 'next/server';
import { 
  loadInteractions, 
  loadInteractionsByContactId,
  createInteraction, 
  updateInteraction, 
  deleteInteraction,
  getInteractionById,
  isUsingSupabase
} from '@/lib/interactions/data';
import { Interaction, InteractionCreateInput, InteractionUpdateInput } from '@/lib/interactions/types';
import { getUserId } from '@/lib/supabaseClient';

/**
 * GET /api/interactions - Get all interactions
 * GET /api/interactions?contactId=123 - Get interactions for a specific contact
 */
export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user ID
    const userId = await getUserId();
    
    // In production, we should require authentication
    if (!userId && process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const contactId = searchParams.get('contactId');
    
    let interactions;
    if (contactId) {
      interactions = await loadInteractionsByContactId(contactId);
    } else {
      interactions = await loadInteractions();
    }
    
    return NextResponse.json({ 
      interactions, 
      usingSupabase: isUsingSupabase() 
    });
  } catch (error) {
    console.error('Error in GET /api/interactions:', error);
    return NextResponse.json(
      { error: 'Failed to load interactions' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/interactions - Create a new interaction
 */
export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user ID
    const userId = await getUserId();
    
    // In production, we should require authentication
    if (!userId && process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const data = await request.json();
    
    // Validate required fields
    if (!data.contact_id || !data.type || !data.title) {
      return NextResponse.json(
        { error: 'Missing required fields. Required: contact_id, type, title' },
        { status: 400 }
      );
    }
    
    const interactionData: InteractionCreateInput = {
      contact_id: data.contact_id,
      type: data.type,
      title: data.title,
      content: data.content || '',
      subject: data.subject,
      interaction_date: data.interaction_date || new Date().toISOString(),
      metadata: data.metadata || {},
      created_by: userId || data.created_by // Use authenticated user ID if available
    };
    
    // Validate interaction type
    const validTypes = ['email', 'call', 'meeting', 'note', 'other'];
    if (!validTypes.includes(interactionData.type)) {
      return NextResponse.json(
        { error: 'Invalid interaction type. Must be one of: email, call, meeting, note, other' },
        { status: 400 }
      );
    }
    
    const newInteraction = await createInteraction(interactionData);
    
    if (!newInteraction) {
      return NextResponse.json(
        { error: 'Failed to create interaction' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      interaction: newInteraction,
      usingSupabase: isUsingSupabase()
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/interactions:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create interaction' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/interactions - Update an existing interaction
 */
export async function PUT(request: NextRequest) {
  try {
    // Get the authenticated user ID
    const userId = await getUserId();
    
    // In production, we should require authentication
    if (!userId && process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const data = await request.json();
    
    // Validate required fields
    if (!data.id) {
      return NextResponse.json(
        { error: 'Missing interaction ID' },
        { status: 400 }
      );
    }
    
    // First, get the existing interaction to ensure it exists
    const existingInteraction = await getInteractionById(data.id);
    if (!existingInteraction) {
      return NextResponse.json(
        { error: 'Interaction not found' },
        { status: 404 }
      );
    }
    
    const interactionData: InteractionUpdateInput = {
      id: data.id,
      ...(data.contact_id && { contact_id: data.contact_id }),
      ...(data.type && { type: data.type }),
      ...(data.title && { title: data.title }),
      ...(data.content !== undefined && { content: data.content }),
      ...(data.sentiment !== undefined && { sentiment: data.sentiment }),
      ...(data.interaction_date && { interaction_date: data.interaction_date }),
      ...(data.metadata && { metadata: { ...existingInteraction.metadata, ...data.metadata } })
    };
    
    // Validate interaction type if provided
    if (data.type && !['email', 'call', 'meeting', 'note', 'other'].includes(data.type)) {
      return NextResponse.json(
        { error: 'Invalid interaction type. Must be one of: email, call, meeting, note, other' },
        { status: 400 }
      );
    }
    
    const updatedInteraction = await updateInteraction(interactionData);
    
    if (!updatedInteraction) {
      return NextResponse.json(
        { error: 'Failed to update interaction' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      interaction: updatedInteraction,
      usingSupabase: isUsingSupabase()
    });
  } catch (error) {
    console.error('Error in PUT /api/interactions:', error);
    return NextResponse.json(
      { error: 'Failed to update interaction' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/interactions?id=123 - Delete an interaction
 */
export async function DELETE(request: NextRequest) {
  try {
    // Get the authenticated user ID
    const userId = await getUserId();
    
    // In production, we should require authentication
    if (!userId && process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Missing interaction ID' },
        { status: 400 }
      );
    }
    
    // First, check if the interaction exists
    const existingInteraction = await getInteractionById(id);
    if (!existingInteraction) {
      return NextResponse.json(
        { error: 'Interaction not found' },
        { status: 404 }
      );
    }
    
    const success = await deleteInteraction(id);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete interaction' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      success: true,
      usingSupabase: isUsingSupabase()
    });
  } catch (error) {
    console.error('Error in DELETE /api/interactions:', error);
    return NextResponse.json(
      { error: 'Failed to delete interaction' },
      { status: 500 }
    );
  }
}
