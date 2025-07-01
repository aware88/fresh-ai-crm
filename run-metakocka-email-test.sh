#!/bin/bash

# Script to run the Metakocka email integration test

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Metakocka Email Integration Test Runner ===${NC}"
echo ""

# Check if .env file exists
if [ -f .env ]; then
  echo -e "${YELLOW}Found .env file, loading environment variables...${NC}"
  export $(grep -v '^#' .env | xargs)
fi

# Check for required environment variables
if [ -z "$AUTH_TOKEN" ] || [ -z "$EMAIL_ID" ] || [ -z "$USER_ID" ]; then
  echo -e "${RED}Error: Missing required environment variables${NC}"
  echo "Please provide the following environment variables:"
  echo "- AUTH_TOKEN: Your authentication token"
  echo "- EMAIL_ID: ID of an email to test with"
  echo "- USER_ID: Your user ID"
  echo ""
  echo "You can provide these in a .env file or directly in this terminal."
  
  # Prompt for missing variables
  if [ -z "$AUTH_TOKEN" ]; then
    read -p "Enter AUTH_TOKEN: " AUTH_TOKEN
    export AUTH_TOKEN
  fi
  
  if [ -z "$EMAIL_ID" ]; then
    read -p "Enter EMAIL_ID: " EMAIL_ID
    export EMAIL_ID
  fi
  
  if [ -z "$USER_ID" ]; then
    read -p "Enter USER_ID: " USER_ID
    export USER_ID
  fi
  
  if [ -z "$SERVICE_TOKEN" ]; then
    read -p "Enter SERVICE_TOKEN (optional): " SERVICE_TOKEN
    export SERVICE_TOKEN
  fi
fi

echo -e "${GREEN}Running test with:${NC}"
echo "- AUTH_TOKEN: ${AUTH_TOKEN:0:5}..."
echo "- EMAIL_ID: $EMAIL_ID"
echo "- USER_ID: $USER_ID"
echo "- SERVICE_TOKEN: ${SERVICE_TOKEN:0:5}..."

# Run the test script
echo -e "${GREEN}Starting test...${NC}"
node test-email-metakocka-full-flow.js

# Check exit status
if [ $? -eq 0 ]; then
  echo -e "${GREEN}Test completed successfully!${NC}"
else
  echo -e "${RED}Test failed with errors.${NC}"
fi
