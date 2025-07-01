#!/bin/bash

# Feature Flag Management Test Runner

# Check if .env file exists, if not create a sample one
if [ ! -f ".env" ]; then
  echo "Creating sample .env file..."
  cat > .env << EOL
# Feature Flag Test Configuration
API_BASE_URL=http://localhost:3000/api
AUTH_TOKEN=your_auth_token_here
ORGANIZATION_ID=your_organization_id_here
FEATURE_NAME=metakocka_integration
EOL
  echo "Please update the .env file with your actual values before running the test."
  exit 1
fi

# Run the test script
node test-feature-flags.js
