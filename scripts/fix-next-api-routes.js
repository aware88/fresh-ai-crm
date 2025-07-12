#!/usr/bin/env node

/**
 * Script to fix Next.js 15 API routes
 * 
 * This script automatically updates API route files to use the async pattern
 * for params and cookies in Next.js 15+.
 * 
 * Usage: node fix-next-api-routes.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const API_DIR = path.join(process.cwd(), 'src', 'app', 'api');
const DRY_RUN = false; // Set to true to just log changes without modifying files

// Helper functions
function findAllRouteFiles(dir) {
  const results = [];
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      results.push(...findAllRouteFiles(filePath));
    } else if (file === 'route.ts') {
      results.push(filePath);
    }
  }
  
  return results;
}

function fixParamsUsage(content) {
  // Pattern for direct params access in dynamic routes
  const paramsAccessPattern = /const\s+(\w+)\s*=\s*params\.(\w+);/g;
  
  // Replace with async pattern
  return content.replace(paramsAccessPattern, (match, varName, paramName) => {
    return `// Use async pattern for params in Next.js 15+
    const { ${paramName} } = await params;
    const ${varName} = ${paramName};`;
  });
}

function fixCookiesUsage(content) {
  // Pattern for direct cookies usage
  const cookiesPattern = /createRouteHandlerClient\(\s*{\s*cookies\s*}\s*\)/g;
  
  // Check if cookies is already imported
  const hasCookiesImport = content.includes('import { cookies }') || 
                           content.includes('import {cookies}');
  
  // Replace with async pattern
  let newContent = content.replace(cookiesPattern, 'createRouteHandlerClient({ cookies: cookieStore })');
  
  // Add cookieStore declaration if cookies is imported
  if (hasCookiesImport && !newContent.includes('const cookieStore = await cookies()')) {
    // Find the first function body after cookies import
    const functionBodyStart = newContent.indexOf('{', newContent.indexOf('export async function'));
    if (functionBodyStart !== -1) {
      // Insert cookieStore declaration after the first { in the function body
      const insertPos = newContent.indexOf('\n', functionBodyStart) + 1;
      newContent = newContent.slice(0, insertPos) + 
                  '  // Get cookies using async pattern for Next.js 15+\n' +
                  '  const cookieStore = await cookies();\n' + 
                  newContent.slice(insertPos);
    }
  }
  
  return newContent;
}

function processFile(filePath) {
  console.log(`Processing ${filePath}...`);
  
  // Read file content
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  
  // Check if this is a dynamic route with params
  const isDynamicRoute = filePath.includes('[') && filePath.includes(']');
  const usesParams = content.includes('params.');
  
  // Check if file uses cookies
  const usesCookies = content.includes('createRouteHandlerClient') && 
                     content.includes('cookies');
  
  // Apply fixes if needed
  if (isDynamicRoute && usesParams) {
    content = fixParamsUsage(content);
  }
  
  if (usesCookies) {
    content = fixCookiesUsage(content);
  }
  
  // Write changes if content was modified
  if (content !== originalContent) {
    if (!DRY_RUN) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Updated ${filePath}`);
    } else {
      console.log(`Would update ${filePath} (dry run)`);
    }
    return true;
  } else {
    console.log(`No changes needed for ${filePath}`);
    return false;
  }
}

// Main execution
try {
  console.log('Finding all API route files...');
  const routeFiles = findAllRouteFiles(API_DIR);
  console.log(`Found ${routeFiles.length} route files.`);
  
  let modifiedCount = 0;
  
  for (const file of routeFiles) {
    if (processFile(file)) {
      modifiedCount++;
    }
  }
  
  console.log('\nSummary:');
  console.log(`Total files processed: ${routeFiles.length}`);
  console.log(`Files modified: ${modifiedCount}`);
  
  if (DRY_RUN) {
    console.log('\nThis was a dry run. No files were actually modified.');
    console.log('Set DRY_RUN = false to apply the changes.');
  }
  
} catch (error) {
  console.error('Error:', error);
  process.exit(1);
}
