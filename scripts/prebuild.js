#!/usr/bin/env node

/**
 * This script removes problematic optional dependencies from node_modules
 * that cause build failures on certain platforms.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// List of problematic packages to remove
const packagesToRemove = [
  '@rollup/rollup-android-arm-eabi',
  '@rollup/rollup-android-arm64',
  '@rollup/rollup-darwin-arm64',
  '@rollup/rollup-darwin-x64',
  '@rollup/rollup-linux-arm-gnueabihf',
  '@rollup/rollup-linux-arm64-gnu',
  '@rollup/rollup-linux-arm64-musl',
  '@rollup/rollup-linux-x64-gnu',
  '@rollup/rollup-linux-x64-musl',
  '@rollup/rollup-win32-arm64-msvc',
  '@rollup/rollup-win32-ia32-msvc',
  '@rollup/rollup-win32-x64-msvc'
];

console.log('🔧 Running prebuild script to remove problematic dependencies...');

// Check if node_modules directory exists
const nodeModulesPath = path.join(process.cwd(), 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  console.log('⚠️ node_modules directory not found, skipping cleanup');
  process.exit(0);
}

// Remove problematic packages
let removedCount = 0;
packagesToRemove.forEach(pkg => {
  const pkgPath = path.join(nodeModulesPath, pkg);
  if (fs.existsSync(pkgPath)) {
    try {
      console.log(`🗑️ Removing ${pkg}...`);
      fs.rmSync(pkgPath, { recursive: true, force: true });
      removedCount++;
    } catch (err) {
      console.error(`❌ Failed to remove ${pkg}: ${err.message}`);
    }
  }
});

console.log(`✅ Prebuild script completed. Removed ${removedCount} problematic packages.`);
