#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Run in all environments, but with different behavior
{
  console.log('\x1b[36mℹ Running post-install script...\x1b[0m');
  
  // Check if .env file exists
  const envPath = path.join(__dirname, '../.env');
  const envExamplePath = path.join(__dirname, '../.env.example');
  
  if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
    console.log('\x1b[33m⚠ .env file not found. Copying from .env.example...\x1b[0m');
    fs.copyFileSync(envExamplePath, envPath);
    console.log('\x1b[32m✓ .env file created from .env.example\x1b[0m');
    console.log('\x1b[36m⚠ Please update the .env file with your configuration\x1b[0m');
  }
  
  console.log('\x1b[32m✓ Post-install script completed\x1b[0m');
}
