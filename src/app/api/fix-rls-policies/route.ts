import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceRoleClient();

    // Tables that need RLS policies to ensure multi-tenant data isolation
    const tables = [
      {
        name: 'email_accounts',
        policies: [
          {
            name: 'Users can only view their own email accounts',
            definition: `
              CREATE POLICY "Users can only view their own email accounts" 
              ON public.email_accounts 
              FOR SELECT 
              USING (auth.uid() = user_id);
            `
          },
          {
            name: 'Users can only insert their own email accounts',
            definition: `
              CREATE POLICY "Users can only insert their own email accounts" 
              ON public.email_accounts 
              FOR INSERT 
              WITH CHECK (auth.uid() = user_id);
            `
          },
          {
            name: 'Users can only update their own email accounts',
            definition: `
              CREATE POLICY "Users can only update their own email accounts" 
              ON public.email_accounts 
              FOR UPDATE 
              USING (auth.uid() = user_id);
            `
          },
          {
            name: 'Users can only delete their own email accounts',
            definition: `
              CREATE POLICY "Users can only delete their own email accounts" 
              ON public.email_accounts 
              FOR DELETE 
              USING (auth.uid() = user_id);
            `
          }
        ]
      },
      {
        name: 'emails',
        policies: [
          {
            name: 'Users can only view emails from their accounts',
            definition: `
              CREATE POLICY "Users can only view emails from their accounts" 
              ON public.emails 
              FOR SELECT 
              USING (
                email_account_id IN (
                  SELECT id FROM public.email_accounts 
                  WHERE user_id = auth.uid()
                )
              );
            `
          },
          {
            name: 'Users can only insert emails to their accounts',
            definition: `
              CREATE POLICY "Users can only insert emails to their accounts" 
              ON public.emails 
              FOR INSERT 
              WITH CHECK (
                email_account_id IN (
                  SELECT id FROM public.email_accounts 
                  WHERE user_id = auth.uid()
                )
              );
            `
          },
          {
            name: 'Users can only update emails from their accounts',
            definition: `
              CREATE POLICY "Users can only update emails from their accounts" 
              ON public.emails 
              FOR UPDATE 
              USING (
                email_account_id IN (
                  SELECT id FROM public.email_accounts 
                  WHERE user_id = auth.uid()
                )
              );
            `
          },
          {
            name: 'Users can only delete emails from their accounts',
            definition: `
              CREATE POLICY "Users can only delete emails from their accounts" 
              ON public.emails 
              FOR DELETE 
              USING (
                email_account_id IN (
                  SELECT id FROM public.email_accounts 
                  WHERE user_id = auth.uid()
                )
              );
            `
          }
        ]
      },
      {
        name: 'contacts',
        policies: [
          {
            name: 'Users can only view contacts from their organization',
            definition: `
              CREATE POLICY "Users can only view contacts from their organization" 
              ON public.contacts 
              FOR SELECT 
              USING (
                organization_id IN (
                  SELECT organization_id FROM public.organization_members 
                  WHERE user_id = auth.uid()
                )
              );
            `
          },
          {
            name: 'Users can only insert contacts to their organization',
            definition: `
              CREATE POLICY "Users can only insert contacts to their organization" 
              ON public.contacts 
              FOR INSERT 
              WITH CHECK (
                organization_id IN (
                  SELECT organization_id FROM public.organization_members 
                  WHERE user_id = auth.uid()
                )
              );
            `
          },
          {
            name: 'Users can only update contacts from their organization',
            definition: `
              CREATE POLICY "Users can only update contacts from their organization" 
              ON public.contacts 
              FOR UPDATE 
              USING (
                organization_id IN (
                  SELECT organization_id FROM public.organization_members 
                  WHERE user_id = auth.uid()
                )
              );
            `
          },
          {
            name: 'Users can only delete contacts from their organization',
            definition: `
              CREATE POLICY "Users can only delete contacts from their organization" 
              ON public.contacts 
              FOR DELETE 
              USING (
                organization_id IN (
                  SELECT organization_id FROM public.organization_members 
                  WHERE user_id = auth.uid()
                )
              );
            `
          }
        ]
      },
      {
        name: 'products',
        policies: [
          {
            name: 'Users can only view products from their organization',
            definition: `
              CREATE POLICY "Users can only view products from their organization" 
              ON public.products 
              FOR SELECT 
              USING (
                organization_id IN (
                  SELECT organization_id FROM public.organization_members 
                  WHERE user_id = auth.uid()
                )
              );
            `
          },
          {
            name: 'Users can only insert products to their organization',
            definition: `
              CREATE POLICY "Users can only insert products to their organization" 
              ON public.products 
              FOR INSERT 
              WITH CHECK (
                organization_id IN (
                  SELECT organization_id FROM public.organization_members 
                  WHERE user_id = auth.uid()
                )
              );
            `
          },
          {
            name: 'Users can only update products from their organization',
            definition: `
              CREATE POLICY "Users can only update products from their organization" 
              ON public.products 
              FOR UPDATE 
              USING (
                organization_id IN (
                  SELECT organization_id FROM public.organization_members 
                  WHERE user_id = auth.uid()
                )
              );
            `
          },
          {
            name: 'Users can only delete products from their organization',
            definition: `
              CREATE POLICY "Users can only delete products from their organization" 
              ON public.products 
              FOR DELETE 
              USING (
                organization_id IN (
                  SELECT organization_id FROM public.organization_members 
                  WHERE user_id = auth.uid()
                )
              );
            `
          }
        ]
      },
      {
        name: 'suppliers',
        policies: [
          {
            name: 'Users can only view suppliers from their organization',
            definition: `
              CREATE POLICY "Users can only view suppliers from their organization" 
              ON public.suppliers 
              FOR SELECT 
              USING (
                organization_id IN (
                  SELECT organization_id FROM public.organization_members 
                  WHERE user_id = auth.uid()
                )
              );
            `
          },
          {
            name: 'Users can only insert suppliers to their organization',
            definition: `
              CREATE POLICY "Users can only insert suppliers to their organization" 
              ON public.suppliers 
              FOR INSERT 
              WITH CHECK (
                organization_id IN (
                  SELECT organization_id FROM public.organization_members 
                  WHERE user_id = auth.uid()
                )
              );
            `
          },
          {
            name: 'Users can only update suppliers from their organization',
            definition: `
              CREATE POLICY "Users can only update suppliers from their organization" 
              ON public.suppliers 
              FOR UPDATE 
              USING (
                organization_id IN (
                  SELECT organization_id FROM public.organization_members 
                  WHERE user_id = auth.uid()
                )
              );
            `
          },
          {
            name: 'Users can only delete suppliers from their organization',
            definition: `
              CREATE POLICY "Users can only delete suppliers from their organization" 
              ON public.suppliers 
              FOR DELETE 
              USING (
                organization_id IN (
                  SELECT organization_id FROM public.organization_members 
                  WHERE user_id = auth.uid()
                )
              );
            `
          }
        ]
      }
    ];

    const results = {};

    for (const table of tables) {
      // Check if table exists
      const { data: tableExists, error: tableError } = await supabase
        .rpc('check_table_exists', { table_name: table.name });

      if (tableError) {
        console.error(`Error checking if table ${table.name} exists:`, tableError);
        results[table.name] = { error: tableError.message };
        continue;
      }

      if (!tableExists) {
        results[table.name] = { exists: false };
        continue;
      }

      // Enable RLS on the table
      try {
        await supabase.rpc('execute_sql', {
          sql: `ALTER TABLE public.${table.name} ENABLE ROW LEVEL SECURITY;`
        });
      } catch (error) {
        console.error(`Error enabling RLS on table ${table.name}:`, error);
        // Continue anyway, it might already be enabled
      }

      // Get existing policies
      const { data: existingPolicies, error: policiesError } = await supabase
        .rpc('get_policies_for_table', { table_name: table.name });

      if (policiesError) {
        console.error(`Error getting policies for table ${table.name}:`, policiesError);
        results[table.name] = { error: policiesError.message };
        continue;
      }

      // Drop all existing policies
      for (const policy of existingPolicies || []) {
        try {
          await supabase.rpc('execute_sql', {
            sql: `DROP POLICY IF EXISTS "${policy.policyname}" ON public.${table.name};`
          });
        } catch (error) {
          console.error(`Error dropping policy ${policy.policyname} on table ${table.name}:`, error);
          // Continue anyway
        }
      }

      // Create new policies
      const policyResults = [];
      for (const policy of table.policies) {
        try {
          await supabase.rpc('execute_sql', {
            sql: policy.definition
          });
          policyResults.push({
            name: policy.name,
            success: true
          });
        } catch (error) {
          console.error(`Error creating policy ${policy.name} on table ${table.name}:`, error);
          policyResults.push({
            name: policy.name,
            success: false,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }

      // Get updated policies
      const { data: updatedPolicies, error: updatedPoliciesError } = await supabase
        .rpc('get_policies_for_table', { table_name: table.name });

      results[table.name] = {
        exists: true,
        policyResults,
        updatedPolicies,
        updatedPoliciesError: updatedPoliciesError?.message
      };
    }

    return NextResponse.json({
      success: true,
      message: 'RLS policies updated',
      results
    });

  } catch (error) {
    console.error('Error in fix-rls-policies API:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
