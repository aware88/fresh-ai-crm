# Zarfin Email Sync Analysis & Action Plan
*Date: January 11, 2025*

## Current Critical Issues

### 1. Database Constraint Error (BLOCKING ALL SYNCS)
**Error**: "there is no unique or exclusion constraint matching the ON CONFLICT specification"
- **Impact**: 0 success, 26 failed for EVERY sync attempt
- **Frequency**: Happening on ALL email insert attempts
- **Location**: email_index table ON CONFLICT clause

### 2. Database Connection Issues
- Supabase database connections timing out
- Cannot execute SQL queries via MCP
- Scripts timing out when trying to connect

### 3. Sync Status for zarfin.jakupovic@withcar.si
- Email sync is ATTEMPTING but FAILING
- Microsoft Graph API IS fetching emails (26 emails each time)
- Database inserts are ALL FAILING due to constraint issue
- Real-time sync keeps retrying but failing

## Root Cause Analysis

### Primary Issue: Database Schema Mismatch
The ON CONFLICT specification in the code doesn't match the actual database constraints:

1. **Code expects**: ON CONFLICT (message_id) 
2. **Database has**: Either missing constraint or different constraint name
3. **Result**: PostgreSQL rejects all INSERT attempts

### Secondary Issues:
1. **Database upgraded but schema not migrated**: You upgraded Supabase (storage now available) but database schema issues persist
2. **RPC functions not working**: Even the RPC bypass functions are failing
3. **Thread upsert errors**: Cascading failures from email_threads table

## Immediate Action Plan

### Step 1: Fix Database Constraints (URGENT)
```sql
-- Check existing constraints
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'email_index';

-- Add missing unique constraint
ALTER TABLE email_index 
ADD CONSTRAINT email_index_message_id_unique UNIQUE (message_id);

-- Or if it exists with wrong name, recreate it
ALTER TABLE email_index DROP CONSTRAINT IF EXISTS email_index_message_id_key;
ALTER TABLE email_index ADD CONSTRAINT email_index_message_id_key UNIQUE (message_id);
```

### Step 2: Fix email_threads Constraints
```sql
-- Fix thread_id constraint
ALTER TABLE email_threads 
ADD CONSTRAINT email_threads_thread_id_unique UNIQUE (thread_id);
```

### Step 3: Update Code to Match Database
Check these files for ON CONFLICT usage:
- `/src/app/api/emails/graph/sync/route.ts`
- `/src/app/api/emails/gmail/sync/route.ts`
- `/src/lib/email/email-sync-service.ts`

### Step 4: Verify RPC Functions
```sql
-- Check if RPC functions exist
SELECT proname FROM pg_proc 
WHERE proname IN ('insert_email_index_direct', 'insert_email_index_batch');
```

## Testing Plan

### 1. Direct Database Test
```javascript
// scripts/test-direct-constraint.js
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testConstraint() {
  // Test direct insert with ON CONFLICT
  const { data, error } = await supabase
    .from('email_index')
    .upsert({
      message_id: 'test-' + Date.now(),
      email_account_id: 'test-account',
      subject: 'Test Email',
      from_address: 'test@example.com',
      received_at: new Date().toISOString()
    }, {
      onConflict: 'message_id'
    });
    
  console.log('Result:', { data, error });
}
```

### 2. Manual Sync Test
```bash
# Force sync for zarfin only
node scripts/manual-sync-zarfin.js
```

## Long-term Solutions Needed

### 1. Database Schema Management
- Implement proper migrations system
- Version control database schema
- Add schema validation on startup

### 2. Error Recovery
- Implement retry logic with exponential backoff
- Add dead letter queue for failed emails
- Better error logging and monitoring

### 3. Storage Architecture (Already upgraded, needs implementation)
- Move email content to Supabase Storage
- Keep only metadata in database
- Implement content compression

## Verification Checklist

- [ ] Database constraints properly configured
- [ ] ON CONFLICT clauses match constraints
- [ ] RPC functions working
- [ ] Zarfin account can sync emails
- [ ] New emails appear in real-time
- [ ] AI learning can process emails
- [ ] No more "ON CONFLICT" errors in logs

## Emergency Fallback

If constraints can't be fixed immediately:
1. Remove ON CONFLICT from code temporarily
2. Handle duplicates manually
3. Use INSERT ... WHERE NOT EXISTS pattern

## Contact & Resources
- Supabase Dashboard: Check database logs
- API Logs: `/api/emails/graph/sync` endpoint
- Test Account: zarfin.jakupovic@withcar.si (Microsoft/Outlook)

## Status Updates
- **Jan 11, 17:45**: Analysis complete, database constraint issue identified
- **Next Step**: Execute constraint fixes in Supabase dashboard