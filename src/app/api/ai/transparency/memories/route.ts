/**
 * API endpoints for managing AI memories
 * 
 * GET: List memories with filtering options
 * DELETE: Delete a specific memory
 * PUT: Update a memory's content or metadata
 */

import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { MemoryService } from '@/lib/ai/memory/memory.service';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    
    // Get query parameters
    const contactId = searchParams.get('contactId');
    const memoryType = searchParams.get('memoryType');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const query = searchParams.get('query') || '';
    
    // Initialize Supabase client with correct async cookie pattern
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get user session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Initialize memory service
    const memoryService = new MemoryService(supabase);
    
    let memories;
    
    if (query) {
      // Perform semantic search if query is provided
      memories = await memoryService.searchMemories({
        organization_id: session.user.user_metadata.organization_id,
        query,
        memory_type: memoryType || undefined,
        limit
      });
    } else {
      // Otherwise, get memories by filters
      const { data, error } = await supabase
        .from('ai_memories')
        .select('*')
        .eq('organization_id', session.user.user_metadata.organization_id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
        
      if (error) {
        console.error('Error fetching memories:', error);
        return NextResponse.json({ error: 'Failed to fetch memories' }, { status: 500 });
      }
      
      memories = data;
    }
    
    return NextResponse.json({ memories });
  } catch (error) {
    console.error('Error in memories API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const memoryId = searchParams.get('id');
    
    if (!memoryId) {
      return NextResponse.json({ error: 'Memory ID is required' }, { status: 400 });
    }
    
    // Initialize Supabase client with correct async cookie pattern
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get user session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Initialize memory service
    const memoryService = new MemoryService(supabase);
    
    // Delete memory
    try {
      await memoryService.deleteMemory(memoryId, session.user.user_metadata.organization_id);
      return NextResponse.json({ success: true });
    } catch (error) {
      return NextResponse.json({ error: 'Failed to delete memory' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in delete memory API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, content, title, metadata } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'Memory ID is required' }, { status: 400 });
    }
    
    // Initialize Supabase client with correct async cookie pattern
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get user session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Initialize memory service
    const memoryService = new MemoryService(supabase);
    
    // Update memory
    const updatedMemory = await memoryService.updateMemory(id, {
      content,
      title,
      metadata
    });
    
    if (!updatedMemory) {
      return NextResponse.json({ error: 'Failed to update memory' }, { status: 500 });
    }
    
    return NextResponse.json({ memory: updatedMemory });
  } catch (error) {
    console.error('Error in update memory API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}