#!/bin/bash

# Check if .env file exists
if [ ! -f ".env" ]; then
  echo "⚠️ No .env file found. Creating sample .env file..."
  cat > .env << EOL
# Organization Branding Test Configuration
API_BASE_URL=http://localhost:3000/api
AUTH_TOKEN=your_admin_auth_token_here
ORGANIZATION_ID=your_organization_id_here
EOL
  echo "📝 Sample .env file created. Please update with your actual values."
  exit 1
fi

# Run the test script
echo "🚀 Running Organization Branding API Tests..."
node test-organization-branding.js
