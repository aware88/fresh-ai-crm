#!/bin/bash

# Run the Metakocka Order Dashboard test script

# Check if .env file exists, create from sample if not
if [ ! -f ".env" ]; then
  if [ -f "order-dashboard-test.env.sample" ]; then
    echo "Creating .env file from sample..."
    cp order-dashboard-test.env.sample .env
    echo "Please update the AUTH_TOKEN in the .env file before running the test."
    exit 1
  else
    echo "Creating empty .env file..."
    touch .env
    echo "AUTH_TOKEN=your_auth_token_here" >> .env
    echo "BASE_URL=http://localhost:3000" >> .env
    echo "Please update the AUTH_TOKEN in the .env file before running the test."
    exit 1
  fi
fi

# Run the test script
node test-order-dashboard.js
