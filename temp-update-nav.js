const fs = require('fs');
const path = '/Users/aware/fresh-ai-crm/src/app/page.tsx';

// Read the file
let content = fs.readFileSync(path, 'utf8');

// Update the navigation items
content = content.replace(
  /\{\s*name: 'Features',\s*id: 'features'\s*\},\s*\{\s*name: 'Pricing',\s*id: 'pricing'\s*\},\s*\{\s*name: 'Testimonials',\s*id: 'testimonials'\s*\}/s,
  "{ name: 'Features', id: 'features' },\n                   { name: 'Psychology', id: 'psychology' },\n                   { name: 'Why It Works', id: 'why-it-works' }"
);

// Write the updated content back to the file
fs.writeFileSync(path, content, 'utf8');
