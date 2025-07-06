#!/bin/bash

# Check if environment variables are set
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "Error: Required environment variables not set."
  echo "Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
  exit 1
fi

# Check if psql is available
if ! command -v psql &> /dev/null; then
  echo "Error: psql command not found. Please install PostgreSQL client."
  exit 1
fi

# Get database URL from environment or prompt user
if [ -z "$SUPABASE_DB_URL" ]; then
  echo "SUPABASE_DB_URL environment variable not set."
  read -p "Enter your Supabase database URL: " SUPABASE_DB_URL
fi

# Apply the two-factor authentication migration
echo "Applying two-factor authentication migration..."
psql "$SUPABASE_DB_URL" -f migrations/65-create-two-factor-auth-tables.sql

if [ $? -eq 0 ]; then
  echo "✅ Two-factor authentication migration applied successfully!"
else
  echo "❌ Failed to apply two-factor authentication migration."
  exit 1
fi

echo "\nSecurity enhancements have been applied to the database."
echo "Make sure to update your .env.local file with the Redis configuration for rate limiting:"
echo "UPSTASH_REDIS_REST_URL=your-redis-url"
echo "UPSTASH_REDIS_REST_TOKEN=your-redis-token"
