#!/bin/bash

# Set environment variables
export NODE_ENV=test
export NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
export NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Install test dependencies if not already installed
if [ ! -d "node_modules/jest" ]; then
  npm install --save-dev jest @types/jest ts-jest @testing-library/react @testing-library/jest-dom @testing-library/user-event
fi

# Create a test database or use a test schema
# This is a placeholder - replace with your actual test database setup
# For example, you might want to create a test schema and run migrations

echo "Setting up test database..."
# Add your test database setup commands here

# Run the tests
echo "Running RBAC tests..."
npx jest tests/rbac.test.ts --detectOpenHandles --forceExit

# Clean up test data
echo "Cleaning up test data..."
# Add your test data cleanup commands here

echo "RBAC tests completed."
