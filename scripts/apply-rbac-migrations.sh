#!/bin/bash

# Script to apply RBAC migrations to the database

echo "Starting RBAC migration process..."

# Load environment variables from .env.local
if [ -f .env.local ]; then
  export $(grep -v '^#' .env.local | xargs)
fi

# Check if required environment variables are set
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "Error: Required environment variables are not set."
  echo "Please ensure the following environment variables are set in .env.local:"
  echo "- NEXT_PUBLIC_SUPABASE_URL"
  echo "- SUPABASE_SERVICE_ROLE_KEY"
  exit 1
fi

echo "Skipping audit logs check - assuming audit_logs table exists from previous migration"

# Create a temporary directory for our RBAC migrations
TEMP_DIR=$(mktemp -d)
cp migrations/66-create-rbac-tables.sql "$TEMP_DIR/66-create-rbac-tables.sql"
cp migrations/66-create-rbac-policies.sql "$TEMP_DIR/67-create-rbac-policies.sql"
cp migrations/66-create-rbac-defaults.sql "$TEMP_DIR/68-create-rbac-defaults.sql"

# Run the migrations using the TypeScript migration script
echo "Applying RBAC migrations..."

# First, apply the tables
npx tsx scripts/run-migrations.ts --file "$TEMP_DIR/66-create-rbac-tables.sql"
if [ $? -ne 0 ]; then
  echo "Error: Failed to apply RBAC tables migration."
  rm -rf "$TEMP_DIR"
  exit 1
fi

# Then, apply the policies
npx tsx scripts/run-migrations.ts --file "$TEMP_DIR/67-create-rbac-policies.sql"
if [ $? -ne 0 ]; then
  echo "Error: Failed to apply RBAC policies migration."
  rm -rf "$TEMP_DIR"
  exit 1
fi

# Finally, apply the defaults
npx tsx scripts/run-migrations.ts --file "$TEMP_DIR/68-create-rbac-defaults.sql"
if [ $? -ne 0 ]; then
  echo "Error: Failed to apply RBAC defaults migration."
  rm -rf "$TEMP_DIR"
  exit 1
fi

# Clean up
rm -rf "$TEMP_DIR"

echo "RBAC migrations completed successfully!"
echo "You can now use the enhanced role-based access control system."
