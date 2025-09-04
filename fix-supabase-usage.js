#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Find all TypeScript files in src/app/api
function findTSFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...findTSFiles(fullPath));
    } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Fix Supabase client usage
function fixSupabaseUsage(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  
  // Fix createClient() calls to await createClient()
  const clientRegex = /(\s+)(const\s+supabase\s*=\s*)createClient\(\)/g;
  const serverClientRegex = /(\s+)(const\s+supabase\s*=\s*)createServerClient\(\)/g;
  
  if (content.match(clientRegex) || content.match(serverClientRegex)) {
    content = content.replace(clientRegex, '$1$2await createClient()');
    content = content.replace(serverClientRegex, '$1$2await createServerClient()');
    changed = true;
  }
  
  // Fix params access for Next.js 15
  const paramsRegex = /(\s+)(const\s+\{\s*\w+\s*\}\s*=\s*)params;/g;
  if (content.match(paramsRegex)) {
    content = content.replace(paramsRegex, '$1$2await params;');
    changed = true;
  }
  
  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed: ${filePath}`);
    return true;
  }
  
  return false;
}

// Main execution
const srcDir = path.join(process.cwd(), 'src');
if (!fs.existsSync(srcDir)) {
  console.error('src directory not found');
  process.exit(1);
}

const tsFiles = findTSFiles(srcDir);
let fixedCount = 0;

for (const file of tsFiles) {
  if (fixSupabaseUsage(file)) {
    fixedCount++;
  }
}

console.log(`Fixed ${fixedCount} files with Supabase client issues`);