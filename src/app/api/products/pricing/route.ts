import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '../../../../lib/supabase/server';
import { getUID, getSession } from '../../../../lib/auth/utils';

// Helper function to get organization ID from session
async function getOrganizationId(): Promise<string | null> {
  try {
    const session = await getSession();
    return (session?.user as any)?.organizationId || session?.user?.id || null;
  } catch (error) {
    console.error('Error getting organization ID:', error);
    return null;
  }
}

// GET /api/products/pricing - Get organization pricing data with optional filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const productId = searchParams.get('productId');
    const supplierId = searchParams.get('supplierId');
    const useView = searchParams.get('view') !== 'false'; // Default to using the view
    
    // Get organization ID from session
    const organizationId = await getOrganizationId();
    if (!organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create Supabase client
    const supabase = createServerClient();
    
    // Determine which table/view to query
    const table = useView ? 'supplier_product_pricing' : 'supplier_pricing';
    
    // Build query for organization data (shared)
    let dbQuery = supabase
      .from(table)
      .select('*')
      .eq('organization_id', organizationId);
    
    // Apply filters if provided
    if (productId) {
      dbQuery = dbQuery.eq('product_id', productId);
    }
    
    if (supplierId) {
      dbQuery = dbQuery.eq('supplier_id', supplierId);
    }
    
    // Execute query
    const { data: pricingData, error } = await dbQuery.order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching pricing data:', error);
      return NextResponse.json({ error: 'Failed to fetch pricing data' }, { status: 500 });
    }
    
    return NextResponse.json(pricingData);
  } catch (err) {
    console.error('Error in pricing API:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/products/pricing - Create a new pricing entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const { product_id, supplier_id, price } = body;
    if (!product_id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }
    if (!supplier_id) {
      return NextResponse.json({ error: 'Supplier ID is required' }, { status: 400 });
    }
    if (price === undefined || price === null) {
      return NextResponse.json({ error: 'Price is required' }, { status: 400 });
    }
    
    // Get organization and user ID from session
    const organizationId = await getOrganizationId();
    const uid = await getUID();
    if (!organizationId || !uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Create Supabase client
    const supabase = createServerClient();
    
    // Add organization_id and user_id to the pricing data
    const pricingData = {
      ...body,
      organization_id: organizationId,
      user_id: uid, // Keep for audit trail
    };
    
    // Insert into database
    const { data, error } = await supabase
      .from('supplier_pricing')
      .insert(pricingData)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating pricing entry:', error);
      return NextResponse.json({ error: 'Failed to create pricing entry' }, { status: 500 });
    }
    
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error('Error in pricing API:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/products/pricing - Update an existing pricing entry
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const { id, price } = body;
    if (!id) {
      return NextResponse.json({ error: 'Pricing ID is required' }, { status: 400 });
    }
    if (price === undefined || price === null) {
      return NextResponse.json({ error: 'Price is required' }, { status: 400 });
    }
    
    // Get organization ID from session
    const organizationId = await getOrganizationId();
    if (!organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Create Supabase client
    const supabase = createServerClient();
    
    // Update in database (organization members can update shared pricing)
    const { data, error } = await supabase
      .from('supplier_pricing')
      .update(body)
      .eq('id', id)
      .eq('organization_id', organizationId)  // Ensure user can only update organization pricing
      .select()
      .single();
    
    if (error) {
      console.error('Error updating pricing entry:', error);
      return NextResponse.json({ error: 'Failed to update pricing entry' }, { status: 500 });
    }
    
    if (!data) {
      return NextResponse.json({ error: 'Pricing entry not found or not accessible by your organization' }, { status: 404 });
    }
    
    return NextResponse.json(data);
  } catch (err) {
    console.error('Error in pricing API:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/products/pricing - Delete a pricing entry
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Pricing ID is required' }, { status: 400 });
    }
    
    // Get organization ID from session
    const organizationId = await getOrganizationId();
    if (!organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Create Supabase client
    const supabase = createServerClient();
    
    // Delete from database (organization members can delete shared pricing)
    const { error } = await supabase
      .from('supplier_pricing')
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId);  // Ensure user can only delete organization pricing
    
    if (error) {
      console.error('Error deleting pricing entry:', error);
      return NextResponse.json({ error: 'Failed to delete pricing entry' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error in pricing API:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
