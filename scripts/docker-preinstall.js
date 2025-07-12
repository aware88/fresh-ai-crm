#!/usr/bin/env node

/**
 * This script is designed to run before npm install in Docker
 * to force using the WASM version of Rollup and avoid platform-specific binaries.
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up Docker-specific npm configuration...');

// Create a .npmrc file specifically for Docker
const npmrcContent = `
legacy-peer-deps=true
optional=false
omit=optional
ignore-scripts=true
platform=linux
arch=x64
node-linker=hoisted

# Prevent platform-specific optional dependencies
prefer-dedupe=true
prefer-offline=true
fund=false

# Force use of WASM rollup
rollup:platform=neutral
rollup:arch=neutral
`;

fs.writeFileSync(path.join(process.cwd(), '.npmrc'), npmrcContent);
console.log('✅ Created Docker-specific .npmrc file');

// Modify package.json to use WASM version of Rollup
try {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const packageJson = require(packageJsonPath);
  
  // Add overrides
  packageJson.overrides = packageJson.overrides || {};
  packageJson.overrides.rollup = 'npm:@rollup/wasm-node';
  
  // Add resolutions (for yarn)
  packageJson.resolutions = packageJson.resolutions || {};
  packageJson.resolutions.rollup = 'npm:@rollup/wasm-node';
  
  // Make all @rollup/* platform packages optional
  packageJson.optionalDependencies = packageJson.optionalDependencies || {};
  
  // Write the modified package.json
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('✅ Updated package.json with Rollup WASM overrides');
} catch (err) {
  console.error('❌ Failed to update package.json:', err.message);
}

console.log('🚀 Docker preinstall script completed successfully');
