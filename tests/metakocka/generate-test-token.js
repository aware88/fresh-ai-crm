/**
 * Simple script to generate a test authentication token
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Generate a random token
const generateToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Main function
const main = () => {
  const token = generateToken();
  console.log('Generated test token:', token);
  
  // Create .env file with the token
  const envContent = `# Environment file for Metakocka order management integration test

# Authentication token for API requests
AUTH_TOKEN=${token}

# Base URL for API requests
API_BASE_URL=http://localhost:3000/api

# Enable debug logging
DEBUG=true
`;
  
  const envPath = path.join(__dirname, '.env');
  fs.writeFileSync(envPath, envContent);
  
  console.log(`Created .env file at ${envPath}`);
  console.log('You can now run the test script with this token.');
};

// Run the script
main();
