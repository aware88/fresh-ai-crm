#!/bin/bash

# Colors for terminal output
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
NC="\033[0m" # No Color

echo -e "${BLUE}=== Metakocka Sales Document Sync Quick Test ===${NC}\n"

# Set default test values
export TEST_MODE="true"
export API_BASE_URL="http://localhost:3001/api"
# These would normally come from environment variables
# For testing, we'll use the test mode which bypasses authentication
export TEST_BYPASS="true"

# Run the test script with test mode enabled
echo -e "${BLUE}Running test script with test mode enabled...${NC}"
echo -e "${YELLOW}Note: This will use mock services and won't affect real data${NC}"

# Run the Node.js test script
node test-sales-document-sync.js --test-mode

# Check exit code
exit_code=$?
if [ $exit_code -eq 0 ]; then
  echo -e "\n${GREEN}✅ Tests passed successfully!${NC}"
else
  echo -e "\n${RED}❌ Some tests failed. Check the logs above for details.${NC}"
fi

exit $exit_code
