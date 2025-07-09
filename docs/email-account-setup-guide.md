# Email Account Setup Guide for CRM Mind

This guide explains how to connect your email accounts to CRM Mind. You can connect both Microsoft Outlook accounts (using OAuth) and standard email accounts (using IMAP/SMTP).

## Table of Contents
- [Adding Microsoft Outlook Account](#adding-microsoft-outlook-account)
- [Adding IMAP Email Account](#adding-imap-email-account)
- [Managing Your Email Accounts](#managing-your-email-accounts)
- [Troubleshooting](#troubleshooting)

## Adding Microsoft Outlook Account

### Prerequisites
- You must have a Microsoft account (personal or work/school)
- You must be logged into CRM Mind

### Steps
1. Navigate to **Settings > Email Accounts** in the main menu
2. Click the **+ Add Email Account** button
3. Select **Microsoft Outlook** as the provider
4. Click **Connect with Microsoft**
5. You will be redirected to Microsoft's login page
6. Sign in with your Microsoft credentials and authorize CRM Mind
7. After successful authorization, you will be redirected back to CRM Mind
8. Your Outlook account is now connected and ready to use

## Adding IMAP Email Account

### Prerequisites
- You need your email address, password, and IMAP/SMTP server details
- You must be logged into CRM Mind

### Steps
1. Navigate to **Settings > Email Accounts** in the main menu
2. Click the **+ Add Email Account** button
3. Select **IMAP/SMTP** as the provider
4. Fill in the required information:
   - Email Address
   - Password
   - IMAP Server (e.g., imap.gmail.com)
   - IMAP Port (typically 993)
   - SMTP Server (e.g., smtp.gmail.com)
   - SMTP Port (typically 587)
   - Use SSL/TLS (recommended for security)
5. Alternatively, select a preset for common providers:
   - Gmail
   - Outlook.com
   - Yahoo Mail
6. Click **Connect**
7. The system will verify your credentials
8. Your IMAP email account is now connected and ready to use

### Provider-Specific Instructions

#### Gmail
- You'll need to create an "App Password" if you have 2-factor authentication enabled
- Go to your Google Account → Security → App passwords
- Create a new app password for "Mail" and use that instead of your regular password

#### Outlook.com / Office 365
- Standard IMAP/SMTP access should work with your regular password
- For Microsoft 365 accounts, you might need to enable "Basic Authentication" in the admin center

#### Yahoo Mail
- Similar to Gmail, you might need to generate an "App Password" for third-party apps

## Managing Your Email Accounts

### Viewing Connected Accounts
1. Navigate to **Settings > Email Accounts**
2. You'll see a list of all your connected email accounts

### Testing Connection
1. Go to **Settings > Email Accounts**
2. Find the account you want to test
3. Click the **Test Connection** button
4. The system will attempt to connect to your email server and display the results

### Editing Account Settings
1. Go to **Settings > Email Accounts**
2. Find the account you want to edit
3. Click the **Edit** button
4. Update the necessary information
5. Click **Save Changes**

### Removing an Account
1. Go to **Settings > Email Accounts**
2. Find the account you want to remove
3. Click the **Remove** button
4. Confirm the removal

## Troubleshooting

### Connection Issues
- Verify your email address and password are correct
- Check that the IMAP/SMTP server details are correct
- Ensure your email provider allows IMAP access
- For Gmail and other providers with enhanced security, make sure you're using an app password

### Authentication Errors
- For OAuth connections (Microsoft), try disconnecting and reconnecting your account
- For IMAP connections, verify your password is correct and hasn't expired
- Check if your email provider requires additional security steps

### Email Not Syncing
- Test the connection to ensure the credentials are still valid
- Check if you've reached any API limits or quotas
- Verify that your email account is active and not suspended

For additional assistance, please contact CRM Mind support at support@crmmind.com
