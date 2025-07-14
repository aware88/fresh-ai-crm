# Data Cleanup Guide

This guide explains how to completely clean your CRM system of all mock data, test users, and database content to prepare for real data testing.

## Overview

The CRM system contains various types of data that need to be cleaned:

1. **Database Records**: All tables in Supabase/PostgreSQL
2. **Auth Users**: User accounts in Supabase Auth
3. **Local Data Files**: JSON and CSV files in `src/data/`
4. **Uploaded Files**: Files in `src/data/uploads/`
5. **Supabase Storage**: Files in Supabase storage buckets

## Quick Start

### Automated Cleanup (Recommended)

The easiest way to clean everything is to use the automated cleanup script:

```bash
# Run the comprehensive cleanup script
npm run cleanup:all

# Or run directly
node scripts/cleanup-all-data.js
```

**⚠️ WARNING**: This will delete ALL data from your database and local files. Make sure you have backups if needed.

### What Gets Cleaned

The automated script will clean:

#### Database Tables (in dependency order):
- AI Memory System: `ai_memory_access`, `ai_memory_relationships`, `ai_memories`, `ai_memory_contexts`, `agent_memory_config`
- Email System: `email_queue`, `email_accounts`, `emails`, `email_templates`
- Interactions: `interactions`, `user_activity_logs`, `notifications`
- Documents: `files`, `sales_documents`, `sales_document_items`
- Metakocka Integration: All mapping and credential tables
- Inventory: `inventory_alerts`, `inventory_alert_history`, `inventory_alert_notifications`
- Core Data: `contacts`, `products`, `suppliers`
- Organizations: `organizations`, `organization_members`, `user_roles`
- Subscriptions: `subscription_invoices`, `organization_subscriptions`
- Auth Users: All user accounts

#### Local Files:
- `src/data/contacts.json`
- `src/data/suppliers.json`
- `src/data/supplier_emails.json`
- `src/data/supplier_documents.json`
- `src/data/supplier_queries.json`
- `src/data/user_identity.json`
- `src/data/excel_personality_data.xlsx`
- `src/data/personality_profiles.csv`
- All files in `src/data/uploads/`

#### Supabase Storage:
- All files in all storage buckets

## Manual Cleanup

If you prefer to clean specific parts manually:

### 1. Clean Database Tables

```bash
# Connect to your Supabase database
psql "your_supabase_connection_string"

# Clean specific tables (example)
DELETE FROM contacts;
DELETE FROM suppliers;
DELETE FROM products;
DELETE FROM organizations;
```

### 2. Clean Auth Users

```bash
# Use Supabase dashboard or CLI
supabase auth users list
supabase auth users delete <user-id>
```

### 3. Clean Local Files

```bash
# Reset JSON files to empty
echo '[]' > src/data/contacts.json
echo '[]' > src/data/suppliers.json
echo '{}' > src/data/user_identity.json

# Delete Excel/CSV files
rm src/data/excel_personality_data.xlsx
rm src/data/personality_profiles.csv

# Clean uploads directory
rm -rf src/data/uploads/*
```

### 4. Clean Supabase Storage

```bash
# Use Supabase dashboard or CLI
supabase storage ls
supabase storage rm <bucket-name> <file-path>
```

## Environment Setup

Make sure you have the required environment variables in `.env.local`:

```env
# Required for database cleanup
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional: For direct database access
DATABASE_URL=your_database_connection_string
```

## Safety Precautions

### Before Running Cleanup

1. **Create Backups**: Export any data you might need later
2. **Test Environment**: Run cleanup on a test environment first
3. **Environment Variables**: Ensure you're targeting the correct database
4. **Team Notification**: Inform team members before cleaning shared environments

### Backup Commands

```bash
# Backup specific tables
pg_dump -h your-host -U your-user -d your-db -t contacts > contacts_backup.sql
pg_dump -h your-host -U your-user -d your-db -t suppliers > suppliers_backup.sql

# Backup entire database
pg_dump -h your-host -U your-user -d your-db > full_backup.sql

# Backup local files
cp -r src/data src/data_backup
```

## Post-Cleanup Steps

After cleaning, you should:

1. **Verify Clean State**: Check that all tables are empty
2. **Test Application**: Ensure the app still works with empty data
3. **Create First User**: Create your first real user account
4. **Import Real Data**: Begin importing your actual data

### Verification Commands

```bash
# Check database table counts
psql "your_connection_string" -c "
SELECT 
  schemaname,
  tablename,
  n_tup_ins as inserts,
  n_tup_upd as updates,
  n_tup_del as deletes,
  n_live_tup as live_rows
FROM pg_stat_user_tables 
WHERE n_live_tup > 0
ORDER BY live_rows DESC;
"

# Check local files
ls -la src/data/
```

## Troubleshooting

### Common Issues

1. **Permission Errors**: Ensure you have service role key, not anon key
2. **Foreign Key Constraints**: The script handles dependencies automatically
3. **Table Not Found**: Some tables might not exist in your environment (this is normal)
4. **Storage Access**: Ensure storage is properly configured in Supabase

### Manual Recovery

If the cleanup script fails partway through:

1. Check the error message for specific table/operation
2. Run manual cleanup for remaining items
3. Verify environment variables are correct
4. Check Supabase project permissions

### Getting Help

If you encounter issues:

1. Check the logs for specific error messages
2. Verify your environment configuration
3. Test with a smaller subset of data first
4. Contact the development team for assistance

## Best Practices

1. **Regular Cleanup**: Clean development environments regularly
2. **Staging First**: Always test cleanup on staging before production
3. **Documentation**: Document any custom data that needs special handling
4. **Automation**: Use the automated script for consistency
5. **Monitoring**: Monitor cleanup completion and verify results

## Script Customization

You can modify `scripts/cleanup-all-data.js` to:

- Skip certain tables
- Add custom cleanup logic
- Include additional file types
- Modify the confirmation process
- Add custom logging

Example modifications:

```javascript
// Skip specific tables
const SKIP_TABLES = ['subscription_plans', 'roles', 'permissions'];

// Add custom file patterns
const CUSTOM_FILES = ['src/custom/*.json', 'uploads/*.pdf'];

// Custom confirmation message
const CUSTOM_WARNING = 'This will clean your development environment';
```

This comprehensive cleanup process ensures your CRM system is ready for real data testing with a clean slate. 