#!/bin/bash

# Script to check for build issues before deploying to Northflank
# This helps catch missing exports and other issues that might only appear in production

echo "🔍 Running pre-deployment checks for Fresh AI CRM..."

# Step 1: TypeScript type checking
echo "⌛ Running TypeScript type checking..."
npx tsc --noEmit
if [ $? -ne 0 ]; then
  echo "❌ TypeScript type checking failed. Fix the errors before deploying."
  exit 1
else
  echo "✅ TypeScript type checking passed."
fi

# Step 2: ESLint with strict settings
echo "⌛ Running ESLint checks..."
npx eslint --max-warnings=0 src/
if [ $? -ne 0 ]; then
  echo "⚠️ ESLint found issues. Consider fixing them before deploying."
else
  echo "✅ ESLint checks passed."
fi

# Step 3: Next.js build
echo "⌛ Building Next.js application..."
npm run build
if [ $? -ne 0 ]; then
  echo "❌ Next.js build failed. Fix the errors before deploying."
  exit 1
else
  echo "✅ Next.js build passed."
fi

# Step 4: Check for missing exports
echo "⌛ Checking for potential missing exports..."
echo "Looking for imports that might be missing exports..."

# Find all imports from @/lib
IMPORTS=$(grep -r "import {.*} from '@/lib/" --include="*.ts" --include="*.tsx" src/ | grep -o -E "import \{[^}]+\}" | sort | uniq)

# Extract individual imported symbols
echo "$IMPORTS" | sed -E 's/import \{([^}]+)\}/\1/g' | tr ',' '\n' | sed 's/^ *//' | sort | uniq > /tmp/imported_symbols.txt

echo "Found $(wc -l < /tmp/imported_symbols.txt) unique imported symbols from @/lib"
echo "Checking a sample of commonly problematic imports..."

# Check specific problematic imports
PROBLEM_IMPORTS=("authOptions" "createClient" "getMetakockaCredentials" "logMetakockaError")

for IMPORT in "${PROBLEM_IMPORTS[@]}"; do
  COUNT=$(grep -r "import.*$IMPORT.*from" --include="*.ts" --include="*.tsx" src/ | wc -l)
  EXPORT_COUNT=$(grep -r "export.*$IMPORT" --include="*.ts" --include="*.tsx" src/ | wc -l)
  
  echo "Symbol '$IMPORT': imported $COUNT times, exported $EXPORT_COUNT times"
  
  if [ $COUNT -gt 0 ] && [ $EXPORT_COUNT -eq 0 ]; then
    echo "⚠️ WARNING: '$IMPORT' is imported but might not be exported anywhere!"
  fi
done

# Step 5: Docker build test (optional - uncomment if you have Docker installed)
# echo "⌛ Testing Docker build..."
# docker build -t fresh-ai-crm-test .
# if [ $? -ne 0 ]; then
#   echo "❌ Docker build failed. This might indicate issues in production."
#   exit 1
# else
#   echo "✅ Docker build passed."
# fi

echo "✅ All pre-deployment checks completed!"
echo "Note: This doesn't guarantee there won't be any issues in production, but it catches many common problems."
echo "If you want to be extra safe, consider running a Docker build test as well."
