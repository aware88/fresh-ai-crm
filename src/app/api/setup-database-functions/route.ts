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

    // Create helper functions for RLS policy management
    const functions = [
      {
        name: 'check_table_exists',
        sql: `
          CREATE OR REPLACE FUNCTION check_table_exists(table_name text)
          RETURNS boolean
          LANGUAGE plpgsql
          SECURITY DEFINER
          AS $$
          DECLARE
            exists_check boolean;
          BEGIN
            SELECT EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_schema = 'public'
              AND table_name = $1
            ) INTO exists_check;
            
            RETURN exists_check;
          END;
          $$;
        `
      },
      {
        name: 'check_rls_enabled',
        sql: `
          CREATE OR REPLACE FUNCTION check_rls_enabled(table_name text)
          RETURNS boolean
          LANGUAGE plpgsql
          SECURITY DEFINER
          AS $$
          DECLARE
            rls_enabled boolean;
          BEGIN
            SELECT relrowsecurity FROM pg_class
            WHERE oid = ('public.' || $1)::regclass
            INTO rls_enabled;
            
            RETURN rls_enabled;
          END;
          $$;
        `
      },
      {
        name: 'get_policies_for_table',
        sql: `
          CREATE OR REPLACE FUNCTION get_policies_for_table(table_name text)
          RETURNS TABLE(
            policyname text,
            tablename text,
            schemaname text,
            roles text[],
            cmd text,
            qual text,
            with_check text
          )
          LANGUAGE plpgsql
          SECURITY DEFINER
          AS $$
          BEGIN
            RETURN QUERY
            SELECT 
              p.policyname,
              p.tablename,
              p.schemaname,
              p.roles,
              p.cmd,
              p.qual::text,
              p.with_check::text
            FROM pg_policies p
            WHERE p.tablename = $1
            AND p.schemaname = 'public';
          END;
          $$;
        `
      },
      {
        name: 'execute_sql',
        sql: `
          CREATE OR REPLACE FUNCTION execute_sql(sql text)
          RETURNS void
          LANGUAGE plpgsql
          SECURITY DEFINER
          AS $$
          BEGIN
            EXECUTE sql;
          END;
          $$;
        `
      }
    ];

    const results = [];

    for (const func of functions) {
      try {
        await supabase.rpc('execute_sql', { sql: func.sql });
        results.push({
          name: func.name,
          success: true
        });
      } catch (error) {
        console.error(`Error creating function ${func.name}:`, error);
        
        // Try to create the execute_sql function first if it doesn't exist
        if (func.name !== 'execute_sql') {
          try {
            await supabase.sql(`
              CREATE OR REPLACE FUNCTION execute_sql(sql text)
              RETURNS void
              LANGUAGE plpgsql
              SECURITY DEFINER
              AS $$
              BEGIN
                EXECUTE sql;
              END;
              $$;
            `);
            
            // Try again with the function
            await supabase.rpc('execute_sql', { sql: func.sql });
            results.push({
              name: func.name,
              success: true,
              note: 'Created after creating execute_sql function'
            });
          } catch (retryError) {
            results.push({
              name: func.name,
              success: false,
              error: error instanceof Error ? error.message : String(error)
            });
          }
        } else {
          results.push({
            name: func.name,
            success: false,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }
    }

    return NextResponse.json({
      success: results.every(r => r.success),
      message: 'Database functions setup complete',
      results
    });

  } catch (error) {
    console.error('Error in setup-database-functions API:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
