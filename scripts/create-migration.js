#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get the migration name from command line arguments
const args = process.argv.slice(2);
const name = args[0] || 'unnamed_migration';

if (!name) {
  console.error('Please provide a name for the migration');
  process.exit(1);
}

// Create migrations directory if it doesn't exist
const migrationsDir = path.join(process.cwd(), 'sql-migrations');
if (!fs.existsSync(migrationsDir)) {
  fs.mkdirSync(migrationsDir, { recursive: true });
}

// Generate a timestamp for the migration file
const now = new Date();
const timestamp = [
  now.getUTCFullYear(),
  String(now.getUTCMonth() + 1).padStart(2, '0'),
  String(now.getUTCDate()).padStart(2, '0'),
  String(now.getUTCHours()).padStart(2, '0'),
  String(now.getUTCMinutes()).padStart(2, '0'),
  String(now.getUTCSeconds()).padStart(2, '0')
].join('');

// Create a sanitized filename
const sanitizedName = name
  .toLowerCase()
  .replace(/[^a-z0-9_]/g, '_')
  .replace(/_{2,}/g, '_')
  .replace(/^_+|_+$/g, '');

const filename = `${timestamp}_${sanitizedName}.sql`;
const filepath = path.join(migrationsDir, filename);

// Create the migration file with a template
const template = `-- Migration: ${name}
-- Created at: ${now.toISOString()}

-- Add your SQL here

-- Example:
-- CREATE TABLE IF NOT EXISTS public.example_table (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--   updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- Don't forget to add appropriate permissions and indexes
`;

fs.writeFileSync(filepath, template);

console.log(`Created migration: ${filename}`);

// Try to open the file in the default editor if possible
try {
  const editor = process.env.EDITOR || 'code';
  execSync(`${editor} ${filepath}`, { stdio: 'inherit' });
} catch (error) {
  // Ignore errors if we can't open the editor
}
