#!/bin/bash

# AI Memory System Test Runner
# This script runs all unit tests for the AI Memory System components

# Set colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}   AI Memory System Test Runner   ${NC}"
echo -e "${BLUE}=========================================${NC}"

# Check if environment variables are set
if [ -z "$OPENAI_API_KEY" ]; then
  echo -e "${YELLOW}Warning: OPENAI_API_KEY is not set. Some tests may fail.${NC}"
fi

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ]; then
  echo -e "${YELLOW}Warning: Supabase environment variables may not be set. Tests will use mocks.${NC}"
fi

# Function to run a specific test file
run_test() {
  local test_file=$1
  local test_name=$(basename "$test_file" .test.ts)
  
  echo -e "\n${BLUE}Running tests for:${NC} ${test_name}"
  npx jest "$test_file" --verbose
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Tests passed for:${NC} ${test_name}"
    return 0
  else
    echo -e "${RED}✗ Tests failed for:${NC} ${test_name}"
    return 1
  fi
}

# Set the base directory for memory tests
TEST_DIR="tests/unit/ai/memory"

# Track overall test status
FAILED_TESTS=0

# Run Context Window Manager tests
echo -e "\n${YELLOW}=== Running Context Window Manager Tests ===${NC}"
run_test "$TEST_DIR/context-window-manager.test.ts"
if [ $? -ne 0 ]; then
  FAILED_TESTS=$((FAILED_TESTS+1))
fi

# Run Hybrid Memory Search tests
echo -e "\n${YELLOW}=== Running Hybrid Memory Search Tests ===${NC}"
run_test "$TEST_DIR/hybrid-memory-search.test.ts"
if [ $? -ne 0 ]; then
  FAILED_TESTS=$((FAILED_TESTS+1))
fi

# Run Memory Chain Service tests
echo -e "\n${YELLOW}=== Running Memory Chain Service Tests ===${NC}"
run_test "$TEST_DIR/memory-chain-service.test.ts"
if [ $? -ne 0 ]; then
  FAILED_TESTS=$((FAILED_TESTS+1))
fi

# Run Memory Summarization Service tests
echo -e "\n${YELLOW}=== Running Memory Summarization Service Tests ===${NC}"
run_test "$TEST_DIR/memory-summarization-service.test.ts"
if [ $? -ne 0 ]; then
  FAILED_TESTS=$((FAILED_TESTS+1))
fi

# Run Memory Context Manager tests if they exist
if [ -f "$TEST_DIR/memory-context-manager.test.ts" ]; then
  echo -e "\n${YELLOW}=== Running Memory Context Manager Tests ===${NC}"
  run_test "$TEST_DIR/memory-context-manager.test.ts"
  if [ $? -ne 0 ]; then
    FAILED_TESTS=$((FAILED_TESTS+1))
  fi
fi

# Run Memory Context Provider tests if they exist
if [ -f "$TEST_DIR/memory-context-provider.test.ts" ]; then
  echo -e "\n${YELLOW}=== Running Memory Context Provider Tests ===${NC}"
  run_test "$TEST_DIR/memory-context-provider.test.ts"
  if [ $? -ne 0 ]; then
    FAILED_TESTS=$((FAILED_TESTS+1))
  fi
fi

# Print summary
echo -e "\n${BLUE}=========================================${NC}"
echo -e "${BLUE}   Test Summary   ${NC}"
echo -e "${BLUE}=========================================${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
  echo -e "${GREEN}All tests passed successfully!${NC}"
else
  echo -e "${RED}$FAILED_TESTS test suites failed.${NC}"
fi

# Exit with appropriate status code
exit $FAILED_TESTS
