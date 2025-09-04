#!/usr/bin/env node
/**
 * Simple RLS diagnostic: prints RLS enabled + policy count for key tables.
 * Uses SUPABASE_DB_URL from env. Safe read-only.
 */

const { Client } = require('pg');

const url = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
if (!url) {
  console.error('Missing SUPABASE_DB_URL (or DATABASE_URL) environment variable.');
  process.exit(1);
}

const TABLES = [
  'email_index',
  'email_content_cache',
  'email_accounts',
  'emails',
  'contacts',
  'organizations',
  'organization_members',
  'user_preferences'
];

const QUERY = `
select
  t.tablename,
  t.rowsecurity as rls_enabled,
  (
    select count(*) from pg_policies p
    where p.tablename = t.tablename and p.schemaname = 'public'
  ) as policy_count
from pg_tables t
where t.schemaname = 'public'
  and t.tablename = any($1)
order by t.tablename;
`;

(async () => {
  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    const res = await client.query(QUERY, [TABLES]);
    if (res.rows.length === 0) {
      console.log('No matching tables found.');
    } else {
      console.log('RLS diagnostics:');
      for (const row of res.rows) {
        console.log(
          `${row.tablename.padEnd(24)} | RLS: ${row.rls_enabled ? 'ON ' : 'OFF'} | policies: ${row.policy_count}`
        );
      }
    }
  } catch (err) {
    console.error('Failed to run RLS diagnostics:', err.message);
    process.exitCode = 2;
  } finally {
    await client.end();
  }
})();

