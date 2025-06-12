#!/bin/bash

# This script seeds the Supabase database with sample data
# Make sure you have the Supabase CLI installed and are logged in

# Exit on error
set -e

# Colors for output
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting database seeding...${NC}"

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "Error: Supabase CLI is not installed. Please install it first."
    echo "Run: npm install -g supabase"
    exit 1
fi

# Check if user is logged in
if ! supabase status &> /dev/null; then
    echo "Error: You need to be logged in to Supabase. Running 'supabase login'..."
    supabase login
fi

# Get the database URL from environment or prompt for it
if [ -z "$SUPABASE_DB_URL" ]; then
    read -p "Enter your Supabase database URL (postgresql://...): " SUPABASE_DB_URL
fi

# Run the seed scripts in the correct order
echo -e "${GREEN}Seeding contacts table...${NC}"
psql "$SUPABASE_DB_URL" -f scripts/seed-contacts.sql

echo -e "${GREEN}Seeding interactions table...${NC}"
psql "$SUPABASE_DB_URL" -f scripts/seed-interactions.sql

echo -e "${GREEN}Seeding files table...${NC}"
psql "$SUPABASE_DB_URL" -f scripts/seed-files.sql

echo -e "${GREEN}${GREEN}✅ Database seeding completed successfully!${NC}"
