#!/bin/bash

# Shell script to run the Metakocka order management integration test

# Set script to exit on error
set -e

# Change to the script directory
cd "$(dirname "$0")"

# Check if .env file exists, if not create from sample
if [ ! -f ".env" ]; then
  if [ -f "order-management-test.env.sample" ]; then
    echo "Creating .env from sample file..."
    cp order-management-test.env.sample .env
    echo "Please update the .env file with your credentials and try again."
    exit 1
  else
    echo "No .env file or sample found. Creating a basic .env file..."
    echo "AUTH_TOKEN=your_auth_token_here" > .env
    echo "# ORDER_ID=optional_existing_order_id" >> .env
    echo "# METAKOCKA_ID=optional_existing_metakocka_order_id" >> .env
    echo "# API_BASE_URL=http://localhost:3000/api" >> .env
    echo "# DEBUG=true" >> .env
    echo "Please update the .env file with your credentials and try again."
    exit 1
  fi
fi

# Load environment variables from .env file
export $(grep -v '^#' .env | xargs)

# Check if AUTH_TOKEN is set
if [ -z "$AUTH_TOKEN" ]; then
  echo "ERROR: AUTH_TOKEN is required in .env file"
  exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install node-fetch@2 dotenv
fi

# Run the test script
echo "Running Metakocka order management integration test..."
node -r dotenv/config test-order-management.js
