#!/bin/bash

# Shell script to run the manual Metakocka order management test

# Set script to exit on error
set -e

# Change to the script directory
cd "$(dirname "$0")"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install node-fetch@2
fi

# Run the test script
echo "Running manual Metakocka order management test..."
node manual-order-test.js
