#!/usr/bin/env node

/**
 * Startup Environment Check
 * This script runs before the Next.js server starts to verify environment variables
 */

console.log('='.repeat(80));
console.log('STARTUP ENVIRONMENT CHECK');
console.log('='.repeat(80));
console.log('Node Version:', process.version);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Current Directory:', process.cwd());
console.log('='.repeat(80));

// Check critical environment variables
const criticalVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'OPENAI_API_KEY',
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET'
];

const publicVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY'
];

console.log('ENVIRONMENT VARIABLES STATUS:');
console.log('-'.repeat(80));

let hasErrors = false;

criticalVars.forEach(varName => {
  const value = process.env[varName];
  const isPublic = publicVars.includes(varName);
  
  if (value) {
    // For security, only show first/last few characters of sensitive values
    let displayValue;
    if (isPublic || varName === 'NEXTAUTH_URL') {
      displayValue = value;
    } else {
      displayValue = value.length > 10 
        ? `${value.substring(0, 4)}...${value.substring(value.length - 4)}` 
        : '***';
    }
    console.log(`✅ ${varName}: ${displayValue}`);
  } else {
    console.log(`❌ ${varName}: NOT SET`);
    hasErrors = true;
  }
});

console.log('='.repeat(80));

// Check for any Supabase or OpenAI related env vars
const allEnvVars = Object.keys(process.env);
const relevantVars = allEnvVars.filter(key => 
  key.includes('SUPABASE') || 
  key.includes('OPENAI') || 
  key.includes('NEXTAUTH') ||
  key.includes('GOOGLE_CLIENT') ||
  key.includes('MICROSOFT_CLIENT')
);

if (relevantVars.length > 0) {
  console.log('OTHER RELEVANT ENVIRONMENT VARIABLES FOUND:');
  relevantVars.forEach(key => {
    if (!criticalVars.includes(key)) {
      console.log(`  - ${key}`);
    }
  });
  console.log('='.repeat(80));
}

if (hasErrors) {
  console.error('\n⚠️  WARNING: Some critical environment variables are missing!');
  console.error('The application may not function correctly.');
  console.error('\nMake sure these variables are set in your deployment platform.');
  
  if (process.env.NODE_ENV === 'production') {
    console.error('\n🚨 CRITICAL: Running in production with missing environment variables!');
  }
} else {
  console.log('\n✅ All critical environment variables are set!');
}

console.log('='.repeat(80));
console.log('Starting Next.js server...\n');
