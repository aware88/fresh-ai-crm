#!/bin/bash

# Shell script to run product recommendations test

# Check if .env file exists, and if not, create a sample one
if [ ! -f ".env" ]; then
  echo "Creating sample .env file..."
  cat > .env << EOL
# Product Recommendations Test Configuration
API_URL=http://localhost:3000
AUTH_TOKEN=your_auth_token_here
CONTACT_ID=your_contact_id_here
PRODUCT_ID=your_product_id_here
EMAIL_ID=your_email_id_here
# Set to 'true' to run in validation mode without making actual API calls
VALIDATION_MODE=false
EOL
  echo "Sample .env file created. Please update it with your actual values."
  exit 1
fi

# Load environment variables from .env file
export $(grep -v '^#' .env | xargs)

# Check if node is installed
if ! command -v node &> /dev/null; then
  echo "Error: Node.js is not installed. Please install Node.js to run this test."
  exit 1
fi

# Check if required environment variables are set
if [ "$AUTH_TOKEN" = "your_auth_token_here" ] || [ -z "$AUTH_TOKEN" ]; then
  echo "Error: Please update AUTH_TOKEN in the .env file."
  exit 1
fi

if [ "$CONTACT_ID" = "your_contact_id_here" ] || [ -z "$CONTACT_ID" ]; then
  echo "Error: Please update CONTACT_ID in the .env file."
  exit 1
fi

if [ "$PRODUCT_ID" = "your_product_id_here" ] || [ -z "$PRODUCT_ID" ]; then
  echo "Error: Please update PRODUCT_ID in the .env file."
  exit 1
fi

if [ "$EMAIL_ID" = "your_email_id_here" ] || [ -z "$EMAIL_ID" ]; then
  echo "Error: Please update EMAIL_ID in the .env file."
  exit 1
fi

# Run the test script
echo "Running product recommendations test..."
node test-product-recommendations.js $@
