#!/bin/bash
# Fresh AI CRM Setup Script
# Usage: bash setup.sh
set -e

# Optionally use nvm and .nvmrc if present
if [ -f ".nvmrc" ]; then
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
  nvm install
fi

# Install dependencies using lockfile for deterministic builds
if [ -f "yarn.lock" ]; then
  yarn install --frozen-lockfile
else
  npm ci
fi

# Build the project
npm run build

echo "\nSetup complete! Copy .env.example to .env and fill in secrets before running: npm run dev"
