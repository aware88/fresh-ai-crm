#!/bin/bash

# Colors for terminal output
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
NC="\033[0m" # No Color

echo -e "${BLUE}=== Metakocka Sales Document Sync Simple Test ===${NC}\n"

# Run the Node.js test script
node simple-test.js

# Check exit code
exit_code=$?
if [ $exit_code -eq 0 ]; then
  echo -e "\n${GREEN}✅ Tests completed successfully!${NC}"
else
  echo -e "\n${RED}❌ Some tests failed. Check the logs above for details.${NC}"
fi

exit $exit_code
