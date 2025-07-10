#!/bin/bash

# Colors for terminal output
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
NC="\033[0m" # No Color

echo -e "${BLUE}=== Metakocka Sales Document Sync Test Suite ===${NC}\n"

# Track test results
total_tests=0
passed_tests=0
failed_tests=0
skipped_tests=0

# Function to run a test and capture its result
run_test() {
  test_name="$1"
  test_script="$2"
  env_file="$3"
  
  echo -e "\n${BLUE}=== Running $test_name ===${NC}"
  
  # Check if env file exists and copy sample if not
  if [ ! -f ".env" ] && [ -f "$env_file" ]; then
    echo "Creating .env from $env_file"
    cp "$env_file" .env
    echo "Please update .env with your credentials before running this test"
    echo -e "${YELLOW}Skipping $test_name (needs configuration)${NC}"
    ((skipped_tests++))
    return
  fi
  
  # Run the test script
  if [ -x "$test_script" ]; then
    ./$test_script
    exit_code=$?
    ((total_tests++))
    
    if [ $exit_code -eq 0 ]; then
      echo -e "${GREEN}✅ $test_name passed${NC}"
      ((passed_tests++))
    else
      echo -e "${RED}❌ $test_name failed${NC}"
      ((failed_tests++))
    fi
  else
    echo -e "${YELLOW}⏭️ $test_name skipped (script not executable)${NC}"
    chmod +x "$test_script"
    echo "Made $test_script executable for next run"
    ((skipped_tests++))
  fi
}

# Run the sales document sync tests
run_test "Sales Document Sync Test" "run-sales-document-sync-test.sh" "sales-document-sync-test.env.sample"
run_test "Bidirectional Sync Verification" "run-bidirectional-sync-test.sh" "bidirectional-sync-test.env.sample"

# Print summary
echo -e "\n${BLUE}=== Test Summary ===${NC}"
echo -e "${GREEN}✅ Passed: $passed_tests${NC}"
echo -e "${RED}❌ Failed: $failed_tests${NC}"
echo -e "${YELLOW}⏭️ Skipped: $skipped_tests${NC}"
echo -e "Total: $total_tests"

# Exit with appropriate code
if [ $failed_tests -gt 0 ]; then
  echo -e "\n${RED}Some tests failed. Please check the logs above for details.${NC}"
  exit 1
else
  if [ $passed_tests -eq 0 ]; then
    echo -e "\n${YELLOW}No tests were run successfully. Please configure the environment files.${NC}"
    exit 0
  else
    echo -e "\n${GREEN}All executed tests passed successfully!${NC}"
    exit 0
  fi
fi
