# Email Integration Guide for CRM Mind

This guide explains how to connect your email accounts to CRM Mind to enable seamless email integration within the platform.

## Outlook Integration

### Prerequisites

- A Microsoft account with Outlook email
- CRM Mind account with appropriate permissions

### Connecting Your Outlook Account

1. **Navigate to Email Settings**
   - Log in to CRM Mind
   - Go to Settings → Email Integration

2. **Connect Your Account**
   - Click the "Connect Outlook Account" button
   - You will be redirected to Microsoft's authentication page
   - Sign in with your Microsoft account credentials
   - Grant the requested permissions to CRM Mind

3. **Verify Connection**
   - After successful authentication, you will be redirected back to CRM Mind
   - You should see a confirmation message that your account is connected
   - Your email address will be displayed on the settings page

### Permissions Requested

When connecting your Outlook account, CRM Mind requests the following permissions:

- **Mail.Read**: Read your email messages and folders
- **Mail.Send**: Send email on your behalf
- **Contacts.Read**: Read your contacts
- **Calendars.Read**: Read your calendar events

These permissions allow CRM Mind to:
- Display your emails within the CRM interface
- Send emails from your account through the CRM
- Associate emails with contacts in the CRM
- View and manage calendar events related to your contacts

### Disconnecting Your Account

If you need to disconnect your Outlook account:

1. Go to Settings → Email Integration
2. Click the "Disconnect Outlook" button
3. Your account will be immediately disconnected
4. All access tokens will be revoked

### Troubleshooting

**Connection Failed**
- Ensure you're using the correct Microsoft account
- Check that you've granted all requested permissions
- Try clearing your browser cache and cookies
- Contact support if issues persist

**Email Not Syncing**
- Check your connection status in Settings → Email Integration
- Ensure your Microsoft account hasn't revoked access
- Verify that your account hasn't reached API rate limits

## Security Information

- CRM Mind stores access tokens securely in an encrypted database
- Tokens are associated only with your user account
- We use OAuth 2.0 for authentication (no passwords are stored)
- Access can be revoked at any time from either CRM Mind or your Microsoft account

## Coming Soon

- Gmail integration
- Email templates
- Advanced email analytics
- Bulk email campaigns

For additional support, please contact our support team at support@freshai-crm.com
