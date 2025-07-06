#!/bin/bash

# Script to replace "Fresh AI CRM" with "CRM Mind" across the entire codebase
# Usage: ./scripts/replace-product-name.sh

# Define the root directory of the project
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Define the old and new product names
OLD_NAME="Fresh AI CRM"
NEW_NAME="CRM Mind"

# Find all files containing the old product name
echo "🔍 Finding files containing '$OLD_NAME'..."
FILES_TO_UPDATE=$(grep -r -l "$OLD_NAME" --include="*.md" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --include="*.svelte" --include="*.json" --include="*.txt" --include="*.html" "$ROOT_DIR" 2>/dev/null)

if [ -z "$FILES_TO_UPDATE" ]; then
  echo "✅ No files found containing '$OLD_NAME'"
  exit 0
fi

# Replace the old name with the new name in each file
echo "🔄 Updating files..."
for file in $FILES_TO_UPDATE; do
  # Create a backup of the original file
  cp "$file" "${file}.bak"
  
  # Replace the text in the file
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS requires a backup extension with -i
    sed -i '' "s|${OLD_NAME}|${NEW_NAME}|g" "$file"
  else
    # Linux version
    sed -i "s|${OLD_NAME}|${NEW_NAME}|g" "$file"
  fi
  
  echo "  ✔ Updated: ${file#$ROOT_DIR/}"
done

# Clean up backup files
find "$ROOT_DIR" -name "*.bak" -type f -delete

echo "✅ Successfully replaced all instances of '$OLD_NAME' with '$NEW_NAME'"
echo "📝 Note: Please manually verify the changes, especially in configuration files and documentation."
