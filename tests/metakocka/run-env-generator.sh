#!/bin/bash

# Colors for terminal output
GREEN="\033[0;32m"
BLUE="\033[0;34m"
NC="\033[0m" # No Color

echo -e "${BLUE}=== Metakocka Test Environment Generator ===${NC}\n"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
  echo "❌ Node.js is required but not installed."
  exit 1
fi

# Install required dependencies if needed
if [ ! -d "node_modules/@supabase/supabase-js" ]; then
  echo "Installing required dependencies..."
  npm install @supabase/supabase-js
fi

# Run the generator script
node generate-test-env.js

# Check exit code
exit_code=$?
if [ $exit_code -eq 0 ]; then
  echo -e "\n${GREEN}✅ Environment setup complete!${NC}"
else
  echo -e "\n❌ Environment setup failed."
fi

exit $exit_code
