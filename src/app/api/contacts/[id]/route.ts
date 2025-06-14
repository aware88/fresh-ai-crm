import { NextRequest, NextResponse } from 'next/server';
import { getContactById, isUsingSupabase } from '@/lib/contacts/data';

/**
 * GET /api/contacts/[id] - Get a single contact by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params?.id;
    
    if (!id) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Contact ID is required' 
        },
        { status: 400 }
      );
    }
    
    const contact = await getContactById(id);
    
    if (!contact) {
      return NextResponse.json(
        { 
          success: false,
          error: `Contact with ID ${id} not found` 
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: {
        contact,
        usingSupabase: isUsingSupabase()
      }
    });
  } catch (error) {
    console.error('Error in GET /api/contacts/[id]:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load contact' 
      },
      { status: 500 }
    );
  }
}
