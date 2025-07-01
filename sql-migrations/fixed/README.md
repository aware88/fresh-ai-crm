# SQL Migration Files for Multi-Tenant Architecture

## Overview
This directory contains fixed and properly sequenced SQL migration files to implement multi-tenant architecture with organization isolation in the CRM-Metakocka integration project.

## Migration Sequence

The migrations should be run in the following order:

1. `01-create-metakocka-integration-logs-table.sql` - Creates a table for storing Metakocka integration logs
2. `02-add-tags-to-metakocka-logs.sql` - Adds tags column to integration logs for better categorization
3. `03-create-organizations-table.sql` - Creates organizations table and organization_members junction table
4. `04-create-metakocka-product-mappings-table.sql` - Creates product mappings table
5. `05-create-email-metakocka-relationships.sql` - Creates email-Metakocka relationships table
6. `06-add-organization-id-to-tables.sql` - Adds organization_id column to all relevant tables
7. `07-add-rls-policies-for-organization-isolation.sql` - Updates RLS policies for organization-based isolation
8. `08-create-metakocka-credentials-table.sql` - Creates Metakocka credentials table with organization support
9. `09-create-metakocka-contact-mappings-table.sql` - Creates contact mappings table
10. `10-create-sales-documents-table.sql` - Creates sales documents and line items tables
11. `11-create-metakocka-sales-document-mappings-table.sql` - Creates sales document mappings table

## Running the Migrations

To apply these migrations, run them in sequence using the Supabase CLI or your database management tool of choice:

```bash
# Using the Supabase CLI
supabase db reset

# Or manually with psql
psql -h localhost -p 5432 -U postgres -d postgres -f sql-migrations/fixed/01-create-metakocka-integration-logs-table.sql
psql -h localhost -p 5432 -U postgres -d postgres -f sql-migrations/fixed/02-add-tags-to-metakocka-logs.sql
# ... and so on for each file
```

## Key Features

- **Organization-based isolation** - All data is isolated by organization
- **Row-level security** - RLS policies ensure data is only accessible to authorized users
- **Backward compatibility** - Supports existing user-based data with organization_id IS NULL
- **Multi-tenant ready** - All tables include organization_id for multi-tenant support

## Notes

- These migrations fix previous issues with foreign key constraints and table dependencies
- The sequence ensures that tables are created before they are referenced
- All tables include appropriate indexes for performance optimization
- RLS policies are configured to support both individual users and organization-based access
