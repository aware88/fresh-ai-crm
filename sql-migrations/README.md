# Supabase Database Migrations

## Table of Contents
1. [Contacts Table Migration](#contacts-table-migration)
2. [Interactions Table Migration](#interactions-table-migration)
3. [Verification Scripts](#verification-scripts)

## Contacts Table Migration

### Problem Summary
The application is experiencing schema mismatches with the Supabase `contacts` table. Both snake_case (`first_name`) and camelCase (`firstName`) column name attempts have failed, indicating the table structure doesn't match what our application expects.

### Solution: Non-Destructive Database Migration

Follow these steps **in order** to fix the contacts table schema:

#### Step 1: Run the Main Migration
1. Open your Supabase Dashboard
2. Go to the SQL Editor
3. Copy and paste the contents of `01-create-contacts-table.sql`
4. Click "Run" to execute the script

This will:
- **Preserve** the existing contacts table and its relationships
- **Add** any missing columns with camelCase names
- **Migrate data** from snake_case columns to camelCase columns if both exist
- **Add** proper indexes for performance
- **Create** automatic timestamp update triggers
- **Insert** sample data (only if the table is empty)

#### Step 2: Enable Security (Recommended)
1. In the SQL Editor, copy and paste the contents of `02-enable-rls-and-policies.sql`
2. Click "Run" to execute the script

This will:
- Enable Row Level Security (RLS)
- Create policies to allow operations

## Interactions Table Migration

### Overview
This migration ensures the `interactions` table exists with the correct structure and security settings for tracking all interactions with contacts.

### Migration Steps

#### Step 1: Create/Update Interactions Table
1. In the Supabase SQL Editor, open and run `04-ensure-interactions-table.sql`

This will:
- Create the `interactions` table if it doesn't exist
- Add any missing columns with proper data types
- Set up foreign key relationships with the `contacts` table
- Create necessary indexes for performance
- Add automatic timestamp updates

#### Step 2: Enable Security
1. Run `05-enable-interactions-rls.sql` in the Supabase SQL Editor

This will:
- Enable Row Level Security (RLS) on the interactions table
- Set up policies for CRUD operations
- Create a trigger to automatically set the `created_by` field

## Verification Scripts

### Verify Contacts Schema
Run `03-verify-schema.sql` to verify the contacts table structure and permissions.

### Verify Interactions Schema
Run `06-verify-interactions-schema.sql` to verify the interactions table structure and permissions. This script includes tests to ensure everything is working correctly.

## Best Practices

1. **Always backup your database** before running migrations in production
2. Test migrations in a staging environment first
3. Run verification scripts after migrations to ensure everything is set up correctly
4. Review the SQL files before executing them in production
5. Consider using Supabase's migration tooling for more complex deployments
- Grant necessary permissions

### Step 3: Verify the Migration
1. In the SQL Editor, copy and paste the contents of `03-verify-schema.sql`
2. Click "Run" to execute the script

This will:
- Show the table structure
- Display indexes and policies
- Test basic CRUD operations
- Verify everything is working correctly

## Expected Table Schema
After migration, your `contacts` table will have these columns:

```sql
- id (UUID, Primary Key, Auto-generated)
- firstName (VARCHAR(255), NOT NULL)
- lastName (VARCHAR(255), NOT NULL) 
- email (VARCHAR(255), UNIQUE, NOT NULL)
- phone (VARCHAR(50))
- company (VARCHAR(255))
- position (VARCHAR(255))
- notes (TEXT)
- personalityType (VARCHAR(100))
- personalityNotes (TEXT)
- status (VARCHAR(50), DEFAULT 'active')
- createdAt (TIMESTAMP WITH TIME ZONE, DEFAULT NOW())
- updatedAt (TIMESTAMP WITH TIME ZONE, DEFAULT NOW(), Auto-updated)
- lastContact (TIMESTAMP WITH TIME ZONE, DEFAULT NOW())
```

## After Migration
Once you've run these SQL scripts successfully:

1. The application should be able to create, read, update, and delete contacts
2. Test the contact form at `/dashboard/contacts/new`
3. Test editing contacts from the contacts list
4. Verify all CRUD operations work correctly

## Troubleshooting
If you encounter issues:

1. **Permission Errors**: Make sure you're running the scripts as a database owner/admin
2. **Table Already Exists**: The first script includes `DROP TABLE IF EXISTS` to handle this
3. **RLS Issues**: The second script sets up permissive policies for testing

## Next Steps After Migration
1. Test contact creation through the UI
2. Test contact editing and deletion
3. Verify data persistence
4. Move on to enhancing other modules (Interactions, Files)

Let me know once you've run these migrations and I'll help test the functionality!
