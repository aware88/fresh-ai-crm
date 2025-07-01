#!/bin/bash

# Run Stripe subscription flow test script

# Check if .env file exists, if not create from sample
if [ ! -f ".env" ]; then
  if [ -f "test-subscription-flow.env.sample" ]; then
    echo "⚠️ No .env file found. Creating from sample..."
    cp test-subscription-flow.env.sample .env
    echo "⚠️ Please edit .env file with your actual values before running the test."
    exit 1
  else
    echo "❌ Error: No .env file or sample found."
    exit 1
  fi
fi

# Load environment variables
set -a
source .env
set +a

# Run the test script
echo "🚀 Running Stripe subscription flow test..."
node test-subscription-flow.js
