import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    console.log('Dashboard stats demo: Getting real data without auth requirement');
    
    const supabase = await createServerClient();
    
    // Use Withcar organization ID directly
    const organizationId = '577485fb-50b4-4bb2-a4c6-54b97e1545ad';
    
    // Get real data from database
    const [contactsResult, suppliersResult, productsResult, emailsResult] = await Promise.all([
      supabase.from('contacts').select('id').eq('organization_id', organizationId),
      supabase.from('suppliers').select('id').eq('organization_id', organizationId),
      supabase.from('products').select('id').eq('organization_id', organizationId),
      supabase.from('email_accounts').select('id').eq('organization_id', organizationId)
    ]);
    
    const stats = {
      totalContacts: contactsResult.data?.length || 0,
      totalSuppliers: suppliersResult.data?.length || 0,
      totalProducts: productsResult.data?.length || 0,
      totalOrders: 0, // We don't have orders table yet
      emailAccounts: emailsResult.data?.length || 0,
      unreadEmails: 0,
      upcomingTasks: 0,
      newMessages: 0,
      completedOrders: 0,
      recentActivity: [
        {
          id: 'contacts',
          type: 'contact',
          title: 'Contact Management',
          message: `You have ${contactsResult.data?.length || 0} contacts in your database`,
          time: 'Current',
          icon: 'Users',
          color: 'blue'
        },
        {
          id: 'suppliers',
          type: 'supplier',
          title: 'Supplier Network',
          message: `Managing ${suppliersResult.data?.length || 0} suppliers`,
          time: 'Current',
          icon: 'Building2',
          color: 'green'
        },
        {
          id: 'products',
          type: 'product',
          title: 'Product Catalog',
          message: `${productsResult.data?.length || 0} products in catalog`,
          time: 'Current',
          icon: 'Package',
          color: 'purple'
        }
      ]
    };
    
    console.log('Dashboard stats demo: Returning real data:', stats);
    
    return NextResponse.json({
      success: true,
      ...stats,
      organization: {
        id: organizationId,
        name: 'Withcar',
        subscription_tier: 'premium',
        subscription_status: 'active'
      }
    });
    
  } catch (error) {
    console.error('Dashboard stats demo error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch dashboard statistics',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}




