#!/usr/bin/env node

/**
 * Script to fix duplicate async keyword syntax errors caused by the automated migration
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function fixAsyncSyntaxErrors(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;

  // Fix duplicate async keywords in various patterns
  const patterns = [
    /static async async /g,
    /async async function /g,
    /export async function async /g,
    /async async \(/g,
  ];

  patterns.forEach(pattern => {
    if (pattern.test(content)) {
      content = content.replace(pattern, (match) => {
        return match.replace('async async', 'async');
      });
      modified = true;
    }
  });

  if (modified) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Fixed async syntax errors in ${filePath}`);
    return true;
  }

  return false;
}

function main() {
  console.log('🔧 Fixing duplicate async keyword syntax errors...\n');

  // Get all files with async async pattern
  try {
    const output = execSync('grep -r "async async" src/ --include="*.ts" --include="*.tsx" -l', { encoding: 'utf8' });
    const files = output.trim().split('\n').filter(f => f.length > 0);
    
    let fixedCount = 0;
    
    files.forEach(file => {
      try {
        if (fixAsyncSyntaxErrors(file)) {
          fixedCount++;
        }
      } catch (error) {
        console.error(`❌ Error fixing ${file}:`, error.message);
      }
    });

    console.log(`\n📊 Fix Summary:`);
    console.log(`✅ Files fixed: ${fixedCount}`);
    console.log(`📁 Total files processed: ${files.length}`);

    if (fixedCount > 0) {
      console.log('\n🎉 All async syntax errors fixed!');
      console.log('🔨 Running build test...');
      
      try {
        execSync('npm run build', { stdio: 'inherit' });
        console.log('✅ Build test passed!');
      } catch (error) {
        console.error('❌ Build test failed. Manual review may be required.');
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error finding files with async syntax errors:', error.message);
    return false;
  }
}

if (require.main === module) {
  const success = main();
  process.exit(success ? 0 : 1);
}

module.exports = { fixAsyncSyntaxErrors };
