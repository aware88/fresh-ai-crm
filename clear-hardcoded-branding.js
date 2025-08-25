#!/usr/bin/env node

/**
 * Clear hardcoded branding data from localStorage
 * This script helps clear any hardcoded "Withcar" or "Bulk Nutrition" references
 * Run this in the browser console to clear cached branding data
 */

console.log('🧹 Clearing hardcoded branding data...');

// Clear localStorage items that might contain hardcoded company names
const itemsToClear = [
  'companyName',
  'companyLogo',
  'aris-ai-email-settings',
  'organization-branding',
  'user-preferences'
];

itemsToClear.forEach(item => {
  if (localStorage.getItem(item)) {
    console.log(`🗑️ Clearing ${item}:`, localStorage.getItem(item));
    localStorage.removeItem(item);
  }
});

// Clear sessionStorage as well
sessionStorage.clear();

console.log('✅ Cleared hardcoded branding data');
console.log('🔄 Please refresh the page to see the changes');

// Instructions for manual execution
console.log(`
📋 To run this manually in browser console:
1. Open Developer Tools (F12)
2. Go to Console tab
3. Paste and run this code:

${itemsToClear.map(item => `localStorage.removeItem('${item}');`).join('\n')}
sessionStorage.clear();
location.reload();
`);
