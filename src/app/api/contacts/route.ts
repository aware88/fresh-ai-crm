import { NextRequest, NextResponse } from 'next/server';
import { loadContacts, createContact, updateContact, deleteContact, isUsingSupabase } from '@/lib/contacts/data';
import { ContactCreateInput, ContactUpdateInput } from '@/lib/contacts/types';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { EnhancedSubscriptionService } from '@/lib/services/subscription-service-extension';
import { createLazyServerClient } from '@/lib/supabase/lazy-client';
import { createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

// Create service role client for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/contacts
 */
export async function GET(request: Request) {
  try {
    // Resolve authenticated user and organization
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      // Fallback to existing loader (non-auth contexts)
      const contacts = await loadContacts();
      return NextResponse.json({ contacts, usingSupabase: isUsingSupabase() });
    }

    const userId = (session.user as any).id;
    const supabaseRW = await createServerClient();

    // Determine active organization id
    let organizationId: string | null = (session.user as any)?.organizationId || null;
    try {
      if (!organizationId) {
        const { data: prefs } = await supabaseRW
          .from('user_preferences')
          .select('current_organization_id')
          .eq('user_id', userId)
          .maybeSingle();
        if (prefs?.current_organization_id) organizationId = prefs.current_organization_id;
        if (!organizationId) {
          const { data: member } = await supabaseRW
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', userId)
            .maybeSingle();
          if (member?.organization_id) organizationId = member.organization_id;
        }
      }
    } catch {}

    // Use service role client for robust filtering and to avoid RLS edge cases
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabaseAdmin
      .from('contacts')
      .select('*')
      .or(`organization_id.eq.${organizationId || '00000000-0000-0000-0000-000000000000'},user_id.eq.${userId})`);

    if (error) {
      console.error('Error loading contacts (scoped):', error);
      return NextResponse.json({ error: 'Failed to load contacts' }, { status: 500 });
    }

    const rows = Array.isArray(data) ? data : [];

    // Map DB row shape (snake/lowercase) to Contact camelCase the UI expects
    const contacts = rows.map((item: any) => ({
      id: item.id,
      firstName: item.firstname || item.first_name || '',
      lastName: item.lastname || item.last_name || '',
      email: item.email || '',
      phone: item.phone || '',
      company: item.company || '',
      position: item.position || '',
      notes: item.notes || '',
      personalityType: item.personalitytype || item.personality_type || '',
      personalityNotes: item.personalitynotes || item.personality_notes || '',
      status: item.status || 'active',
      createdAt: item.createdat || item.created_at || new Date().toISOString(),
      updatedAt: item.updatedat || item.updated_at || new Date().toISOString(),
      // Provide both naming variants to keep UI consistent
      lastContact: item.lastcontact || item.last_contact || item.lastinteraction || item.last_interaction || null,
      lastInteraction: item.lastinteraction || item.last_interaction || item.lastcontact || item.last_contact || null
    }));

    return NextResponse.json({ contacts, usingSupabase: true });
  } catch (error) {
    console.error('Error loading contacts:', error);
    return NextResponse.json({ error: 'Failed to load contacts' }, { status: 500 });
  }
}

/**
 * POST /api/contacts
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const organizationId = (session.user as any).organizationId;
    
    // Check subscription limits before creating contact
    if (organizationId) {
      const enhancedSubscriptionService = new EnhancedSubscriptionService();
      const supabase = await createLazyServerClient();
      
      // Get current contact count
      const { count, error: countError } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId);
      
      if (countError) {
        console.error('Error counting contacts:', countError);
        return NextResponse.json({ 
          error: 'Failed to check contact limits' 
        }, { status: 500 });
      }
      
      const currentContactCount = count || 0;
      
      // Check if organization can add more contacts
      const { canAdd, reason } = await enhancedSubscriptionService.canAddMoreContacts(
        organizationId,
        currentContactCount
      );
      
      if (!canAdd) {
        return NextResponse.json({ 
          error: reason || 'Contact limit reached',
          limitReached: true,
          currentCount: currentContactCount
        }, { status: 403 });
      }
    }
    
    const data = await request.json();
    const newContact = await createContact(data as ContactCreateInput);
    
    if (!newContact) {
      return NextResponse.json({ error: 'Contact already exists or invalid data' }, { status: 400 });
    }
    
    return NextResponse.json({ contact: newContact, usingSupabase: isUsingSupabase() });
  } catch (error) {
    console.error('Error creating contact:', error);
    return NextResponse.json({ error: 'Failed to create contact' }, { status: 500 });
  }
}

/**
 * PUT /api/contacts
 */
export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const updatedContact = await updateContact(data as ContactUpdateInput);
    
    if (!updatedContact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }
    
    return NextResponse.json({ contact: updatedContact, usingSupabase: isUsingSupabase() });
  } catch (error) {
    console.error('Error updating contact:', error);
    return NextResponse.json({ error: 'Failed to update contact' }, { status: 500 });
  }
}

/**
 * DELETE /api/contacts
 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Contact ID is required' }, { status: 400 });
    }
    
    console.log(`API: Deleting contact with ID ${id} using service role`);
    
    // List of tables that might reference the contact
    const dependentTables = [
      'contact_communication_metrics',
      'sentiment_evolution_events',
      'behavioral_milestone_events',
      'decision_context_factors'
    ];
    
    // Clean up dependencies first
    console.log(`API: Cleaning up dependencies for contact ${id}`);
    for (const table of dependentTables) {
      try {
        const { error } = await supabaseAdmin
          .from(table)
          .delete()
          .eq('contact_id', id);
        
        if (error) {
          if (error.code === '42P01') {
            // Table doesn't exist, skip
            console.log(`API: Table ${table} doesn't exist, skipping`);
          } else {
            console.error(`API: Error deleting from ${table}:`, error.message);
          }
        } else {
          console.log(`API: Deleted from ${table}`);
        }
      } catch (err) {
        console.log(`API: Skipping ${table}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }
    
    // Use service role client to bypass RLS
    const { error } = await supabaseAdmin
      .from('contacts')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error(`API: Failed to delete contact with ID ${id}:`, error);
      return NextResponse.json({ error: 'Failed to delete contact', details: error.message }, { status: 500 });
    }
    
    console.log(`API: Successfully deleted contact with ID ${id}`);
    return NextResponse.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    console.error('Error deleting contact:', error);
    return NextResponse.json({ error: 'Failed to delete contact' }, { status: 500 });
  }
}
