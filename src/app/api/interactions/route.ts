import { NextRequest, NextResponse } from 'next/server';
import { 
  loadInteractions, 
  loadInteractionsByContactId,
  createInteraction, 
  updateInteraction, 
  deleteInteraction,
  isUsingSupabase
} from '@/lib/interactions/data';
import { InteractionCreateInput, InteractionUpdateInput } from '@/lib/interactions/types';

/**
 * GET /api/interactions - Get all interactions
 * GET /api/interactions?contactId=123 - Get interactions for a specific contact
 */
export async function GET(request: NextRequest) {
  try {
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
    const data = await request.json();
    
    // Validate required fields
    if (!data.contact_id || !data.type || !data.subject || !data.content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const interactionData: InteractionCreateInput = {
      contact_id: data.contact_id,
      type: data.type,
      subject: data.subject,
      content: data.content,
      sentiment: data.sentiment,
      personalityInsights: data.personalityInsights,
      date: data.date
    };
    
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
      { error: 'Failed to create interaction' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/interactions - Update an existing interaction
 */
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.id) {
      return NextResponse.json(
        { error: 'Missing interaction ID' },
        { status: 400 }
      );
    }
    
    const interactionData: InteractionUpdateInput = {
      id: data.id,
      contact_id: data.contact_id,
      type: data.type,
      subject: data.subject,
      content: data.content,
      sentiment: data.sentiment,
      personalityInsights: data.personalityInsights,
      date: data.date
    };
    
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
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Missing interaction ID' },
        { status: 400 }
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
