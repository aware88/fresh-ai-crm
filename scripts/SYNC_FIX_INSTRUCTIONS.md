# Email Sync Fix Instructions

## ⚠️ IMPORTANT: Run these steps IN ORDER

### Step 1: Apply Database Constraints ✅
```bash
# This prevents NULL user_ids in the future
psql "your-database-url" < scripts/fix-database-constraints.sql
```

### Step 2: Test Sync (50+50 emails) 🧪
```bash
# Sync 50 received + 50 sent emails for testing
node scripts/sync-zarfin-test-50.js
```

**Check for:**
- All emails have user_id (not NULL)
- Correct folder distribution (INBOX/Sent)
- No errors in console

### Step 3: If Test Passes → Production Sync (5000+5000) 🚀
```bash
# Clear existing and sync 10,000 emails
node scripts/sync-zarfin-production-10k.js --clear

# Or keep existing and add more
node scripts/sync-zarfin-production-10k.js
```

### Step 4: Update Code for Production
Edit `/src/app/api/email/sync-to-database/route.ts`:
```javascript
// Change line 67 from:
const { accountId, maxEmails = 100 } = await request.json();

// To:
const { accountId, maxEmails = 10000 } = await request.json();
```

## 🔍 Verification Queries

```sql
-- Check email counts
SELECT 
    user_id,
    COUNT(*) as total,
    COUNT(CASE WHEN folder_name = 'INBOX' THEN 1 END) as inbox,
    COUNT(CASE WHEN folder_name = 'Sent' THEN 1 END) as sent
FROM email_index
GROUP BY user_id;

-- Check for NULL user_ids (should be 0)
SELECT COUNT(*) as null_user_ids
FROM email_index
WHERE user_id IS NULL;

-- Check date ranges
SELECT 
    MIN(sent_at) as oldest,
    MAX(sent_at) as newest,
    COUNT(*) as total
FROM email_index;
```

## ❌ If Something Goes Wrong

1. **Clear all emails:**
```sql
TRUNCATE TABLE email_index CASCADE;
TRUNCATE TABLE email_content_cache CASCADE;
```

2. **Check logs:**
```bash
npx supabase db logs --tail
```

3. **Revert constraints if needed:**
```sql
ALTER TABLE email_index 
ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE email_index
DROP CONSTRAINT IF EXISTS email_index_user_id_fkey;
```

## ✅ Expected Results

After successful sync:
- **Test (50+50):** ~100 emails total
- **Production (5000+5000):** Up to 10,000 emails
- **All emails:** Valid user_id (no NULLs)
- **Folders:** Balanced INBOX/Sent distribution
- **No errors** in console or database logs