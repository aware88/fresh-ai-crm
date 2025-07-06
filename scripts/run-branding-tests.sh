#!/bin/bash

# Organization Branding Test Runner
# This script runs the organization branding tests

# Set default values
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/.."
DOTENV_FILE="$BASE_DIR/.env.test"
TEST_FILE="$BASE_DIR/tests/organization-branding.test.js"

# Print header
echo "========================================="
echo "Organization Branding Test Runner"
echo "========================================="

# Check if .env.test exists, create it if not
if [ ! -f "$DOTENV_FILE" ]; then
  echo "Creating sample .env.test file..."
  cat > "$DOTENV_FILE" << EOL
# Test Configuration
TEST_BASE_URL=http://localhost:3000
TEST_ADMIN_EMAIL=admin@example.com
TEST_ADMIN_PASSWORD=your_secure_password
EOL
  echo "Created $DOTENV_FILE with sample values."
  echo "Please edit this file with your actual test credentials before running tests."
  exit 1
fi

# Source the .env.test file to get environment variables
set -a
source "$DOTENV_FILE"
set +a

# Check required environment variables
if [ -z "$TEST_ADMIN_EMAIL" ] || [ -z "$TEST_ADMIN_PASSWORD" ]; then
  echo "Error: TEST_ADMIN_EMAIL and TEST_ADMIN_PASSWORD must be set in $DOTENV_FILE"
  exit 1
fi

# Run the test
echo "Running organization branding tests..."
cd "$BASE_DIR"
npx playwright test "$TEST_FILE" --headed

# Check the exit code
if [ $? -eq 0 ]; then
  echo "✅ Organization branding tests completed successfully!"
else
  echo "❌ Organization branding tests failed."
  exit 1
fi
