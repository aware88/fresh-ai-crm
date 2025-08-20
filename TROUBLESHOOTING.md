# Troubleshooting Guide

This document provides solutions for common issues you might encounter while running the application.

## IMAP Authentication Errors

If you see errors like this in your terminal:

```
Error in IMAP folders API: [Error: Command failed] {
  response: '2 NO [AUTHENTICATIONFAILED] Authentication failed.',
  responseStatus: 'NO',
  executedCommand: '2 AUTHENTICATE PLAIN',
  responseText: 'Authentication failed.',
  serverResponseCode: 'AUTHENTICATIONFAILED',
  authenticationFailed: true
}
```

This means the stored credentials for your email account are incorrect or expired. To fix this:

### Using the Fix Script

1. Run the email credentials fix script with your email and the correct password:

```bash
node src/scripts/fix-email-credentials.js your-email@example.com "your-password"
```

2. Restart your development server:

```bash
npm run dev
```

### Manual Fix

If you prefer to fix it manually:

1. Go to Settings → Email Accounts
2. Edit the problematic email account
3. Re-enter your password and save

## Node.js Version Warning

If you see this warning:

```
⚠️ Node.js 18 and below are deprecated and will no longer be supported in future versions of @supabase/supabase-js. Please upgrade to Node.js 20 or later.
```

This means you need to upgrade your Node.js version. We've added an `.nvmrc` file to help with this.

### Using NVM (Node Version Manager)

1. If you have NVM installed:

```bash
nvm install 20
nvm use 20
```

2. Reinstall dependencies:

```bash
npm ci
```

3. Restart your development server:

```bash
npm run dev
```

### Without NVM

1. Download and install Node.js 20 from [nodejs.org](https://nodejs.org/)
2. Verify installation with `node -v`
3. Reinstall dependencies with `npm ci`
4. Restart your development server with `npm run dev`

For more detailed instructions, run:

```bash
node src/scripts/upgrade-node.js
```

## Other Common Issues

### Database Connection Issues

If you encounter database connection errors:

1. Check that your `.env` file has the correct Supabase credentials
2. Ensure your IP address is allowed in Supabase's access controls
3. Verify that the database is running and accessible

### API Errors

For API-related errors:

1. Check the request URL and parameters
2. Verify that you have the necessary permissions
3. Look for specific error messages in the console or network tab

If problems persist, please open an issue with detailed information about the error.

