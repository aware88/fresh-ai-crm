import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createClient } from '@/lib/supabase/server';
import { createClient as createDirectClient } from '@supabase/supabase-js';
import { getUID } from '@/lib/auth/utils';
import { featureFlagService } from '@/lib/services/feature-flag-service';

/**
 * GET /api/dashboard/overview
 * Production-ready overview stats for the dashboard
 * - Resolves organization from the authenticated user
 * - Returns counts for contacts, suppliers, products, email accounts
 * - Returns a small recentActivity list for the UI
 */
export async function GET(request: NextRequest) {
  try {
    // Prefer NextAuth session user ID but fall back to Supabase auth
    const session = await getServerSession(authOptions);
    const sessionUserId = (session?.user as any)?.id || (session?.user as any)?.userId;
    const uid = sessionUserId || await getUID();
    if (!uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    
    // Check if tables exist - this helps with new installations
    try {
      await Promise.all([
        supabase.from('contacts').select('id', { count: 'exact', head: true, limit: 1 }),
        supabase.from('email_accounts').select('id', { count: 'exact', head: true, limit: 1 })
      ]);
    } catch (tableError) {
      console.log('⚠️ Table check error - this may be a new installation:', tableError);
      // Return empty data rather than error for new installations
      if (tableError instanceof Error && 
          tableError.message.includes('relation') && 
          tableError.message.includes('does not exist')) {
        return NextResponse.json({
          totalContacts: 0,
          totalSuppliers: 0,
          totalProducts: 0,
          totalOrders: 0,
          emailAccounts: 0,
          recentActivity: [],
          newInstallation: true
        });
      }
    }
    
    // Get organization ID using unified context service for better performance
    console.log('🔍 Dashboard Overview: Getting organization for user:', uid);
    
    let organizationId: string | null = null;
    
    try {
      // Use unified context service for optimized organization lookup
      const { getUserOrganization } = await import('@/lib/context/unified-user-context-service');
      organizationId = await getUserOrganization(uid);
      
      if (organizationId) {
        console.log('✅ Found organization via unified context:', organizationId);
      } else {
        console.log('❌ No organization found for user');
      }
    } catch (error) {
      console.warn('Unified context failed, using fallback:', error);
      
      // Fallback to legacy implementation
      try {
        const { data: preferences, error: prefsError } = await supabase
          .from('user_preferences')
          .select('current_organization_id')
          .eq('user_id', uid)
          .single();
        
        if (preferences?.current_organization_id) {
          organizationId = preferences.current_organization_id;
          console.log('   Found organization from user preferences (fallback):', organizationId);
        } else {
          const { data: member, error: memberError } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', uid)
            .single();
            
          if (member?.organization_id) {
            organizationId = member.organization_id;
            console.log('   Found organization from organization_members (fallback):', organizationId);
          } else {
            console.log('   No organization found for user (fallback)');
          }
        }
      } catch (fallbackError) {
        console.error('   Error in fallback organization lookup:', fallbackError);
      }
    }
    
    let totalContacts = 0;
    let totalSuppliers = 0;
    let totalProducts = 0;
    let emailAccounts = 0;

    if (organizationId) {
      // User has an organization - fetch organization plus user-owned data
      console.log(`🔍 Fetching data for organization: ${organizationId}`);

      const [contactsCombined, suppliersCombined, productsCombined, emails] = await Promise.all([
        // Contacts visible to the user (match RLS): org OR created_by user
        supabase
          .from('contacts')
          .select('id', { count: 'exact', head: true })
          .or(`organization_id.eq.${organizationId},user_id.eq.${uid}`),
        // Suppliers visible to the user: org OR user-owned
        supabase
          .from('suppliers')
          .select('id', { count: 'exact', head: true })
          .or(`organization_id.eq.${organizationId},user_id.eq.${uid}`),
        // Products visible to the user: org OR user-created
        supabase
          .from('products')
          .select('id', { count: 'exact', head: true })
          .or(`organization_id.eq.${organizationId},created_by.eq.${uid}`),
        // Email accounts (we refine below with admin client)
        supabase
          .from('email_accounts')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', uid)
      ]);

      console.log('📊 Query results (combined filters):');
      console.log(`   Contacts: ${contactsCombined.count || 0} (error: ${contactsCombined.error?.message || 'none'})`);
      console.log(`   Suppliers: ${suppliersCombined.count || 0} (error: ${suppliersCombined.error?.message || 'none'})`);
      console.log(`   Products: ${productsCombined.count || 0} (error: ${productsCombined.error?.message || 'none'})`);
      console.log(`   Email accounts: ${emails.count || 0} (error: ${emails.error?.message || 'none'})`);

      totalContacts = contactsCombined.count || 0;
      totalSuppliers = suppliersCombined.count || 0;
      // Some PostgREST count/OR edge cases can return 0; keep the value but we will correct via admin below
      totalProducts = productsCombined.count || 0;
      // Compute email account count using admin client (bypass RLS and OR filter reliably)
      try {
        const direct = createDirectClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL || '',
          process.env.SUPABASE_SERVICE_ROLE_KEY || ''
        );
        const { data: emailRows, error: emailErr } = await direct
          .from('email_accounts')
          .select('id')
          .or(`organization_id.eq.${organizationId},user_id.eq.${uid}`);
        if (emailErr) {
          console.warn('Email accounts admin count error:', emailErr.message);
          emailAccounts = emails.count || 0;
        } else {
          emailAccounts = emailRows?.length || 0;
        }
      } catch (e) {
        console.warn('Email accounts admin count exception:', e);
        emailAccounts = emails.count || 0;
      }
      
      // Use admin counts as source of truth to avoid RLS/count edge cases
      try {
        const direct = createDirectClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL || '',
          process.env.SUPABASE_SERVICE_ROLE_KEY || ''
        );
        const [contactsOrg, contactsUser, suppliersOrg, suppliersUser, productsOrg, productsUser] = await Promise.all([
          direct.from('contacts').select('id').eq('organization_id', organizationId),
          direct.from('contacts').select('id').eq('user_id', uid),
          direct.from('suppliers').select('id').eq('organization_id', organizationId),
          direct.from('suppliers').select('id').eq('user_id', uid),
          direct.from('products').select('id').eq('organization_id', organizationId),
          direct.from('products').select('id').eq('user_id', uid)
        ]);
        
        // Debug contacts queries
        console.log('📊 Contacts admin queries:');
        console.log(`   Organization contacts: ${contactsOrg.data?.length || 0} (error: ${contactsOrg.error?.message || 'none'})`);
        console.log(`   User contacts: ${contactsUser.data?.length || 0} (error: ${contactsUser.error?.message || 'none'})`);
        
        const conMap: Record<string, true> = {};
        (contactsOrg.data || []).forEach((r: any) => r?.id && (conMap[r.id] = true));
        (contactsUser.data || []).forEach((r: any) => r?.id && (conMap[r.id] = true));
        const supMap: Record<string, true> = {};
        (suppliersOrg.data || []).forEach((r: any) => r?.id && (supMap[r.id] = true));
        (suppliersUser.data || []).forEach((r: any) => r?.id && (supMap[r.id] = true));
        const prodMap: Record<string, true> = {};
        (productsOrg.data || []).forEach((r: any) => r?.id && (prodMap[r.id] = true));
        (productsUser.data || []).forEach((r: any) => r?.id && (prodMap[r.id] = true));
        totalContacts = Object.keys(conMap).length;
        totalSuppliers = Object.keys(supMap).length;
        totalProducts = Object.keys(prodMap).length;
        console.log('📊 Real database counts from admin query:', { totalContacts, totalSuppliers, totalProducts });
      } catch (e) {
        console.warn('Admin contacts/suppliers/products count failed:', e);
      }
      // We no longer add orphaned data or separate user fallbacks; the combined filters align with list pages.
    } else {
      // User doesn't have organization - fetch user-scoped data
      console.log(`Fetching data for independent user: ${uid}`);
      
      const [contacts, suppliers, products, emails] = await Promise.all([
        supabase.from('contacts').select('id', { count: 'exact', head: true }).eq('created_by', uid),
        supabase.from('suppliers').select('id', { count: 'exact', head: true }).eq('created_by', uid),
        supabase.from('products').select('id', { count: 'exact', head: true }).eq('created_by', uid),
        supabase.from('email_accounts').select('id', { count: 'exact', head: true }).eq('user_id', uid)
      ]);

      totalContacts = contacts.count || 0;
      totalSuppliers = suppliers.count || 0;
      totalProducts = products.count || 0;
      // Prefer admin count for robustness
      try {
        const direct = createDirectClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL || '',
          process.env.SUPABASE_SERVICE_ROLE_KEY || ''
        );
        const { data: emailRows, error: emailErr } = await direct
          .from('email_accounts')
          .select('id')
          .eq('user_id', uid);
        emailAccounts = emailErr ? (emails.count || 0) : (emailRows?.length || 0);
      } catch (_) {
        emailAccounts = emails.count || 0;
      }
    }

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
    
    // For missing tables, return empty data rather than error
    if (error instanceof Error && 
        error.message.includes('relation') && 
        error.message.includes('does not exist')) {
      console.log('⚠️ Table error in dashboard API - returning empty data for graceful UI handling');
      return NextResponse.json({
        totalContacts: 0,
        totalSuppliers: 0,
        totalProducts: 0,
        totalOrders: 0,
        emailAccounts: 0,
        recentActivity: [],
        tablesError: true
      });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}



