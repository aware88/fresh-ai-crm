#!/bin/bash

# Run Memory Integration Tests
# This script starts the mock server and runs the memory integration tests

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting mock server...${NC}"
# Start the mock server in the background
node mock-server.js &
MOCK_PID=$!

# Wait for the server to start
sleep 2
echo -e "${GREEN}Mock server started on http://localhost:3001${NC}"

echo -e "${YELLOW}Running memory integration tests...${NC}"
# Run the tests with the mock server
node test-agent-memory-integration.js --mock

# Capture the exit code
TEST_EXIT_CODE=$?

# Kill the mock server
echo -e "${YELLOW}Stopping mock server...${NC}"
kill $MOCK_PID

# Exit with the test exit code
exit $TEST_EXIT_CODE
