#!/bin/bash

# Email Queue Test Runner
# This script runs the email queue test with the necessary environment variables

# Change to the script directory
cd "$(dirname "$0")"

# Check if .env file exists, if not create a sample one
if [ ! -f ".env" ]; then
  echo "Creating sample .env file..."
  cat > .env << EOL
# Email Queue Test Configuration
API_URL=http://localhost:3000
AUTH_TOKEN=your_auth_token_here
CONTACT_ID=your_contact_id_here
# Optional: Specify an existing email ID or one will be generated
# EMAIL_ID=existing_email_id
EOL
  echo "Please edit the .env file with your actual values before running the test."
  exit 1
fi

# Load environment variables
set -a
source .env
set +a

# Run the test script
echo "Running Email Queue Test..."
node test-email-queue.js
