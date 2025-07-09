#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const crypto = require('crypto');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Path to .env.local file
const envFilePath = path.join(process.cwd(), '.env.local');

// Function to generate a random string for NEXTAUTH_SECRET
function generateRandomSecret(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

// Function to read existing .env.local file
function readEnvFile() {
  try {
    if (fs.existsSync(envFilePath)) {
      return fs.readFileSync(envFilePath, 'utf8');
    }
  } catch (error) {
    console.error('Error reading .env.local file:', error);
  }
  return '';
}

// Function to parse env file content into key-value pairs
function parseEnvFile(content) {
  const envVars = {};
  if (!content) return envVars;
  
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const match = trimmedLine.match(/^([^=]+)=(.*)$/);
      if (match) {
        const [, key, value] = match;
        envVars[key.trim()] = value.trim();
      }
    }
  }
  
  return envVars;
}

// Function to write env vars to .env.local file
function writeEnvFile(envVars) {
  const content = Object.entries(envVars)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  
  try {
    fs.writeFileSync(envFilePath, content, 'utf8');
    console.log(`\n✅ Environment variables saved to ${envFilePath}`);
  } catch (error) {
    console.error('Error writing .env.local file:', error);
  }
}

// Main function
async function setupOutlookEnv() {
  console.log('📧 Setting up Microsoft Outlook integration for CRM Mind');
  console.log('-------------------------------------------------------');
  
  // Read existing env file
  const existingContent = readEnvFile();
  const envVars = parseEnvFile(existingContent);
  
  // Prompt for Microsoft App credentials
  console.log('\n🔑 Microsoft App Credentials');
  console.log('These can be found in your Microsoft Azure App Registration');
  
  const askQuestion = (question, defaultValue) => {
    return new Promise((resolve) => {
      rl.question(`${question} ${defaultValue ? `(current: ${defaultValue})` : ''}: `, (answer) => {
        resolve(answer || defaultValue);
      });
    });
  };
  
  // Get Microsoft Client ID
  envVars.MICROSOFT_CLIENT_ID = await askQuestion(
    'Enter your Microsoft Client ID:',
    envVars.MICROSOFT_CLIENT_ID
  );
  
  // Get Microsoft Client Secret
  envVars.MICROSOFT_CLIENT_SECRET = await askQuestion(
    'Enter your Microsoft Client Secret:',
    envVars.MICROSOFT_CLIENT_SECRET
  );
  
  // Set NEXTAUTH_URL
  envVars.NEXTAUTH_URL = await askQuestion(
    'Enter your NextAuth URL (usually http://localhost:3000):',
    envVars.NEXTAUTH_URL || 'http://localhost:3000'
  );
  
  // Generate NEXTAUTH_SECRET if not exists
  if (!envVars.NEXTAUTH_SECRET) {
    const generateNew = await askQuestion(
      'Generate a new NEXTAUTH_SECRET? (y/n):',
      'y'
    );
    
    if (generateNew.toLowerCase() === 'y') {
      envVars.NEXTAUTH_SECRET = generateRandomSecret();
      console.log(`Generated new NEXTAUTH_SECRET: ${envVars.NEXTAUTH_SECRET}`);
    } else {
      envVars.NEXTAUTH_SECRET = await askQuestion(
        'Enter your NEXTAUTH_SECRET:',
        ''
      );
    }
  }
  
  // Write to .env.local file
  writeEnvFile(envVars);
  
  console.log('\n📋 Next Steps:');
  console.log('1. Make sure your Microsoft App Registration has the following redirect URI:');
  console.log(`   ${envVars.NEXTAUTH_URL}/api/auth/outlook/callback`);
  console.log('2. Ensure your app has the required API permissions (Mail.Read, Mail.Send, etc.)');
  console.log('3. Restart your development server with: npm run dev');
  console.log('4. Try connecting your Outlook account again');
  
  rl.close();
}

// Run the setup
setupOutlookEnv();
