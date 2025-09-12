import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/dashboard/overview
 * Optimized overview stats for the dashboard
 * - Simple, fast queries with minimal database round-trips
 * - Returns counts for contacts, suppliers, products, email accounts
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    const uid = session.user.id;
    
    // Get organization ID from user preferences (single query)
    let organizationId: string | null = null;
    try {
      const { data: preferences } = await supabase
        .from('user_preferences')
        .select('current_organization_id')
        .eq('user_id', uid)
        .single();
      
      organizationId = preferences?.current_organization_id || null;
    } catch (error) {
      // Continue without organization (user is independent)
      organizationId = null;
    }
    
    // Simple parallel queries - just count, no complex OR logic or admin clients
    const promises = [
      // Contacts
      organizationId 
        ? supabase.from('contacts').select('*', { count: 'exact', head: true }).eq('organization_id', organizationId)
        : supabase.from('contacts').select('*', { count: 'exact', head: true }).eq('user_id', uid),
      // Suppliers  
      organizationId
        ? supabase.from('suppliers').select('*', { count: 'exact', head: true }).eq('organization_id', organizationId)
        : supabase.from('suppliers').select('*', { count: 'exact', head: true }).eq('user_id', uid),
      // Products
      organizationId
        ? supabase.from('products').select('*', { count: 'exact', head: true }).eq('organization_id', organizationId)
        : supabase.from('products').select('*', { count: 'exact', head: true }).eq('created_by', uid),
      // Email accounts (always user-scoped)
      supabase.from('email_accounts').select('*', { count: 'exact', head: true }).eq('user_id', uid)
    ];

    const [contacts, suppliers, products, emails] = await Promise.all(promises);

    const totalContacts = contacts.count || 0;
    const totalSuppliers = suppliers.count || 0;
    const totalProducts = products.count || 0;
    const emailAccounts = emails.count || 0;

    const payload = {
      totalContacts,
      totalSuppliers,
      totalProducts,
      totalOrders: 0,
      emailAccounts,
      recentActivity: [
        {
          id: 'contacts',
          type: 'contact',
          title: 'Contact Management',
          message: `You have ${totalContacts} contacts in your database`,
          time: 'Current',
          icon: 'Users',
          color: 'blue'
        },
        {
          id: 'suppliers',
          type: 'supplier',
          title: 'Supplier Network',
          message: `Managing ${totalSuppliers} suppliers`,
          time: 'Current',
          icon: 'Building2',
          color: 'green'
        },
        {
          id: 'products',
          type: 'product',
          title: 'Product Catalog',
          message: `${totalProducts} products in catalog`,
          time: 'Current',
          icon: 'Package',
          color: 'purple'
        }
      ]
    };

    return NextResponse.json(payload);
  } catch (error) {
    console.error('Error in dashboard overview API:', error);
    
    // Return empty data for any error to prevent UI crashes
    return NextResponse.json({
      totalContacts: 0,
      totalSuppliers: 0,
      totalProducts: 0,
      totalOrders: 0,
      emailAccounts: 0,
      recentActivity: []
    });
  }
}



