#!/bin/bash

# Organization Setup API Test Runner
# This script runs the organization setup API test

# Make sure we're in the right directory
cd "$(dirname "$0")"

# Check if node-fetch is installed
if ! npm list node-fetch > /dev/null 2>&1; then
  echo "Installing node-fetch..."
  npm install --no-save node-fetch
fi

# Run the test
echo "Running organization setup API test..."
node organization-setup-api-test.js

# Exit with the same code as the test
exit $?
