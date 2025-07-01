#!/bin/bash

# Run the billing history test script

# Check if .env file exists and source it
if [ -f ".env" ]; then
  echo "Loading environment variables from .env file..."
  export $(grep -v '^#' .env | xargs)
fi

# Run the test script
node test-billing-history.js
