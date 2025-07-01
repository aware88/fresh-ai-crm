#!/bin/bash

# Run the product sync test script
# This script runs the test-product-sync.js script with Node.js

# Check if .env file exists, if not create a sample one
if [ ! -f .env ]; then
  echo "Creating sample .env file..."
  echo "AUTH_TOKEN=your_auth_token" > .env
  echo "PRODUCT_ID=your_product_id" >> .env
  echo "METAKOCKA_ID=your_metakocka_id" >> .env
  echo "Sample .env file created. Please update with your actual values."
  exit 1
fi

# Load environment variables
export $(grep -v '^#' .env | xargs)

# Run the test script
echo "Running product sync test script..."
node test-product-sync.js
