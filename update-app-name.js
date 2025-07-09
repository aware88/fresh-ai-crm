#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Patterns to replace
const patterns = [
  { from: 'CRM Mind', to: 'CRM Mind' },
  { from: 'crm-mind', to: 'crm-mind' },
  { from: 'CRM Mind', to: 'CRM Mind' },
  { from: 'crm-mind', to: 'crm-mind' },
  { from: 'CRM Mind', to: 'CRM Mind' },
  { from: 'crm-mind', to: 'crm-mind' }
];

// File extensions to process
const extensions = ['.js', '.jsx', '.ts', '.tsx', '.md', '.json', '.html', '.css', '.scss', '.yml', '.yaml'];

// Directories to exclude
const excludeDirs = ['node_modules', '.git', '.next', 'dist', 'build'];

// Function to check if a file should be processed
function shouldProcessFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return extensions.includes(ext);
}

// Function to process a file
function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    patterns.forEach(({ from, to }) => {
      // Case-sensitive replacement
      if (content.includes(from)) {
        content = content.split(from).join(to);
        modified = true;
      }
      
      // Case-insensitive replacement for lowercase versions
      const fromLower = from.toLowerCase();
      const toLower = to.toLowerCase();
      if (content.toLowerCase().includes(fromLower)) {
        // Use regex with 'i' flag for case-insensitive matching
        const regex = new RegExp(fromLower.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'gi');
        content = content.replace(regex, toLower);
        modified = true;
      }
    });

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated: ${filePath}`);
      return 1;
    }
    return 0;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return 0;
  }
}

// Function to walk through directories
function walkDir(dir, callback) {
  let count = 0;
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!excludeDirs.includes(file)) {
        count += walkDir(filePath, callback);
      }
    } else if (shouldProcessFile(filePath)) {
      count += callback(filePath);
    }
  });
  
  return count;
}

// Main execution
console.log('Starting to update app name from "CRM Mind" to "CRM Mind"...');
const rootDir = process.cwd();
const updatedFiles = walkDir(rootDir, processFile);
console.log(`\nCompleted! Updated ${updatedFiles} files.`);
console.log('\nNext steps:');
console.log('1. Review the changes to ensure they are correct');
console.log('2. Update any remaining references manually if needed');
console.log('3. Consider updating the project directory name if desired');
