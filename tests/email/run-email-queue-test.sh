#!/bin/bash

# Check if .env file exists, if not create a sample one
if [ ! -f ".env.test" ]; then
  echo "Creating sample .env.test file..."
  cp .env.test.sample .env.test
  echo "Please update .env.test with your credentials before running the test."
  exit 1
fi

# Run the test script
echo "Running Email Queue System tests..."
node test-email-queue.js
