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
    
    // Try to get organization ID from user preferences (for individual users) or organization_members (for org users)
    console.log('🔍 Dashboard Overview: Getting organization for user:', uid);
    
    let organizationId: string | null = null;
    
    try {
      // First try to get from user preferences (for individual users)
      const { data: preferences, error: prefsError } = await supabase
        .from('user_preferences')
        .select('current_organization_id')
        .eq('user_id', uid)
        .single();
      
      if (preferences?.current_organization_id) {
        organizationId = preferences.current_organization_id;
        console.log('   Found organization from user preferences:', organizationId);
      } else {
        // Fallback: try organization_members table
        const { data: member, error: memberError } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', uid)
          .single();
          
        if (member?.organization_id) {
          organizationId = member.organization_id;
          console.log('   Found organization from organization_members:', organizationId);
        } else {
          console.log('   No organization found for user');
        }
      }
    } catch (error) {
      console.error('   Error getting organization:', error);
    }
    
    let totalContacts = 0;
    let totalSuppliers = 0;
    let totalProducts = 0;
    let emailAccounts = 0;

    if (organizationId) {
      // User has an organization - fetch organization-scoped data + orphaned data
      console.log(`🔍 Fetching data for organization: ${organizationId}`);
      
      const [orgContacts, orphanedContacts, suppliers, products, emails] = await Promise.all([
        // Organization-scoped contacts
        supabase.from('contacts').select('id', { count: 'exact', head: true }).eq('organization_id', organizationId),
        // Orphaned contacts (no organization_id and no user_id) - these need to be assigned
        supabase.from('contacts').select('id', { count: 'exact', head: true }).is('organization_id', null).is('user_id', null),
        // Organization-scoped suppliers and products
        supabase.from('suppliers').select('id', { count: 'exact', head: true }).eq('organization_id', organizationId),
        supabase.from('products').select('id', { count: 'exact', head: true }).eq('organization_id', organizationId),
        // Email accounts (dummy – we will compute using admin client below to avoid RLS)
        supabase.from('email_accounts').select('id', { count: 'exact', head: true })
          .eq('user_id', uid)
      ]);

      console.log('📊 Query results:');
      console.log(`   Organization contacts: ${orgContacts.count || 0} (error: ${orgContacts.error?.message || 'none'})`);
      console.log(`   Orphaned contacts: ${orphanedContacts.count || 0} (error: ${orphanedContacts.error?.message || 'none'})`);
      console.log(`   Suppliers: ${suppliers.count || 0} (error: ${suppliers.error?.message || 'none'})`);
      console.log(`   Products: ${products.count || 0} (error: ${products.error?.message || 'none'})`);
      console.log(`   Email accounts: ${emails.count || 0} (error: ${emails.error?.message || 'none'})`);

      // For now, include orphaned contacts in the count (they should be assigned to the user's organization)
      totalContacts = (orgContacts.count || 0) + (orphanedContacts.count || 0);
      totalSuppliers = suppliers.count || 0;
      totalProducts = products.count || 0;
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
      
      // If organization-scoped queries returned 0, try admin fallback for suppliers/products/email, then user-scoped
      try {
        if (totalSuppliers === 0 || totalProducts === 0) {
          const direct = createDirectClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || '',
            process.env.SUPABASE_SERVICE_ROLE_KEY || ''
          );
          const [{ data: supplierRows }, { data: productRows }] = await Promise.all([
            direct.from('suppliers').select('id').eq('organization_id', organizationId),
            direct.from('products').select('id').eq('organization_id', organizationId)
          ]);
          if (totalSuppliers === 0) totalSuppliers = supplierRows?.length || 0;
          if (totalProducts === 0) totalProducts = productRows?.length || 0;
        }
      } catch (e) {
        console.warn('Admin fallback suppliers/products failed:', e);
      }

      // If still zero for some, try user-scoped fallback
      if (totalContacts === 0 || emailAccounts === 0 || totalSuppliers === 0 || totalProducts === 0) {
        console.log('🔄 Organization queries returned 0, trying user-scoped fallback...');
        
        const [userContacts, userSuppliers, userProducts, userEmails] = await Promise.all([
          supabase.from('contacts').select('id', { count: 'exact', head: true }).eq('created_by', uid),
          supabase.from('suppliers').select('id', { count: 'exact', head: true }).eq('created_by', uid),
          supabase.from('products').select('id', { count: 'exact', head: true }).eq('created_by', uid),
          supabase.from('email_accounts').select('id', { count: 'exact', head: true }).eq('user_id', uid)
        ]);
        
        console.log('📊 User-scoped fallback results:');
        console.log(`   User contacts: ${userContacts.count || 0} (error: ${userContacts.error?.message || 'none'})`);
        console.log(`   User suppliers: ${userSuppliers.count || 0} (error: ${userSuppliers.error?.message || 'none'})`);
        console.log(`   User products: ${userProducts.count || 0} (error: ${userProducts.error?.message || 'none'})`);
        console.log(`   User email accounts: ${userEmails.count || 0} (error: ${userEmails.error?.message || 'none'})`);
        
        // Use user-scoped data if organization-scoped returned 0
        if (totalContacts === 0 && (userContacts.count || 0) > 0) {
          totalContacts = userContacts.count || 0;
          console.log(`✅ Using user contacts: ${totalContacts}`);
        }
        if (totalSuppliers === 0 && (userSuppliers.count || 0) > 0) {
          totalSuppliers = userSuppliers.count || 0;
          console.log(`✅ Using user suppliers: ${totalSuppliers}`);
        }
        if (totalProducts === 0 && (userProducts.count || 0) > 0) {
          totalProducts = userProducts.count || 0;
          console.log(`✅ Using user products: ${totalProducts}`);
        }
        if (emailAccounts === 0 && (userEmails.count || 0) > 0) {
          emailAccounts = userEmails.count || 0;
          console.log(`✅ Using user email accounts: ${emailAccounts}`);
        }
      }
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



