// find-issue.js
const fs = require('fs');

// Read the SQL file
const sqlFile = process.argv[2] || 'supabase-settings-tables.sql';
const sql = fs.readFileSync(sqlFile, 'utf8');

// Split into lines
const lines = sql.split('\n');

// Check for 'use client' anywhere in the file
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('use client')) {
    console.log(`Found 'use client' at line ${i + 1}: ${line}`);
  }
}

// Check for any non-SQL looking lines
for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  // Skip empty lines and comments
  if (line === '' || line.startsWith('--')) {
    continue;
  }
  
  // Check for typical React/Next.js syntax
  if (
    line.includes('import ') || 
    line.includes('export ') || 
    line.includes('function ') ||
    line.includes('const ') ||
    line.includes('let ') ||
    line.includes('var ') ||
    line.includes('=> {') ||
    line.includes('React.') ||
    line.includes('<div') ||
    line.includes('</div') ||
    line.includes('useState') ||
    line.includes('useEffect') ||
    line.includes('use client')
  ) {
    console.log(`Suspicious line ${i + 1}: ${line}`);
  }
}

// Check for UTF-8 BOM
const buffer = fs.readFileSync(sqlFile);
if (buffer.length >= 3 && buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
  console.log('File has UTF-8 BOM at the beginning');
}

console.log('Analysis complete'); 