#!/bin/bash

# Organization Setup Test Runner
# This script runs the organization setup test

# Make sure we're in the right directory
cd "$(dirname "$0")"

# Check if node-fetch is installed
if ! npm list node-fetch > /dev/null 2>&1; then
  echo "Installing node-fetch..."
  npm install --no-save node-fetch
fi

# Check if dotenv is installed
if ! npm list dotenv > /dev/null 2>&1; then
  echo "Installing dotenv..."
  npm install --no-save dotenv
fi

# Run the test
echo "Running organization setup test..."
node organization-setup-test.mjs

# Exit with the same code as the test
exit $?
