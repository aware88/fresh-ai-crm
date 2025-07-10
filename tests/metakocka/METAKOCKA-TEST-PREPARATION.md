# Metakocka Integration Test Preparation Guide

This guide will help you prepare for immediate testing of the Metakocka integration once you receive API credentials and IMAP email access.

## Prerequisites

Before testing can begin, you will need:

- Metakocka API credentials (company ID and secret key)
- IMAP email server credentials (hostname, port, username, password)
- A running instance of the Fresh AI CRM application

## Step 1: Configure Metakocka API Credentials

1. **Admin UI Method:**
   - Navigate to `/settings/integrations/metakocka` in the CRM application
   - Enter your Company ID and Secret Key
   - Verify the API Endpoint is correct (default: `https://main.metakocka.si/rest/eshop/v1/json/`)
   - Click "Test Connection" to verify credentials work
   - Click "Save" to store credentials securely

2. **API Method (for programmatic setup):**
   ```bash
   curl -X POST http://localhost:3000/api/integrations/metakocka/credentials \
     -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "companyId": "YOUR_COMPANY_ID",
       "secretKey": "YOUR_SECRET_KEY",
       "apiEndpoint": "https://main.metakocka.si/rest/eshop/v1/json/"
     }'
   ```

## Step 2: Configure IMAP Email Account

1. **Admin UI Method:**
   - Navigate to `/settings/email-accounts` in the CRM application
   - Click "Add IMAP Account"
   - Enter the email address, IMAP server details, and credentials
   - Complete the setup wizard
   - Test the connection to verify credentials work

2. **API Method (if needed):**
   ```bash
   curl -X POST http://localhost:3000/api/email-accounts \
     -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "email": "metakocka-integration@example.com",
       "providerType": "imap",
       "imapHost": "imap.example.com",
       "imapPort": 993,
       "imapUsername": "YOUR_USERNAME",
       "imapPassword": "YOUR_PASSWORD",
       "smtpHost": "smtp.example.com",
       "smtpPort": 587,
       "smtpUsername": "YOUR_USERNAME",
       "smtpPassword": "YOUR_PASSWORD",
       "isActive": true
     }'
   ```

## Step 3: Prepare Test Environment Files

### 3.1 Contact Sync Testing

1. Copy the sample environment file:
   ```bash
   cd tests/metakocka
   cp contact-sync-test.env.sample .env
   ```

2. Update the `.env` file with your credentials:
   ```
   AUTH_TOKEN=YOUR_AUTH_TOKEN
   CONTACT_ID=YOUR_CONTACT_ID
   METAKOCKA_ID=YOUR_METAKOCKA_ID
   BASE_URL=http://localhost:3000
   ```

### 3.2 Product Sync Testing

1. Copy the sample environment file:
   ```bash
   cd tests/metakocka
   cp product-sync-test.env.sample .env
   ```

2. Update the `.env` file with your credentials:
   ```
   AUTH_TOKEN=YOUR_AUTH_TOKEN
   PRODUCT_ID=YOUR_PRODUCT_ID
   METAKOCKA_ID=YOUR_METAKOCKA_ID
   BASE_URL=http://localhost:3000
   ```

### 3.3 Sales Document Sync Testing

1. Copy the sample environment file:
   ```bash
   cd tests/metakocka
   cp sales-document-sync-test.env.sample .env
   ```

2. Update the `.env` file with your credentials:
   ```
   AUTH_TOKEN=YOUR_AUTH_TOKEN
   DOCUMENT_ID=YOUR_DOCUMENT_ID
   METAKOCKA_ID=YOUR_METAKOCKA_ID
   BASE_URL=http://localhost:3000
   ```

### 3.4 Email Integration Testing

1. Copy the sample environment file:
   ```bash
   cd tests/metakocka
   cp email-metakocka-test.env.sample .env
   ```

2. Update the `.env` file with your credentials:
   ```
   AUTH_TOKEN=YOUR_AUTH_TOKEN
   EMAIL_ID=YOUR_EMAIL_ID
   CONTACT_ID=YOUR_CONTACT_ID
   API_BASE_URL=http://localhost:3000
   ```

## Step 4: Running Tests

### 4.1 Contact Sync Tests

```bash
cd tests/metakocka
./run-contact-sync-test.sh
```

Tests performed:
- Single contact sync (CRM → Metakocka)
- Bulk contact sync (CRM → Metakocka)
- Contact mapping status retrieval
- Single contact sync (Metakocka → CRM)
- Bulk contact sync (Metakocka → CRM)

### 4.2 Product Sync Tests

```bash
cd tests/metakocka
./run-product-sync-test.sh
```

Tests performed:
- Single product sync (CRM → Metakocka)
- Bulk product sync (CRM → Metakocka)
- Product mapping status retrieval
- Single product sync (Metakocka → CRM)
- Bulk product sync (Metakocka → CRM)

### 4.3 Sales Document Sync Tests

```bash
cd tests/metakocka
./run-sales-document-sync-test.sh
```

Tests performed:
- Single sales document sync (CRM → Metakocka)
- Bulk sales document sync (CRM → Metakocka)
- Sales document mapping status retrieval
- Single sales document sync (Metakocka → CRM)
- Error handling and status tracking

### 4.4 Email Integration Tests

```bash
cd tests/metakocka
./run-metakocka-email-test.sh
```

Tests performed:
- Email metadata enrichment with Metakocka data
- Bidirectional references between emails and Metakocka entities
- AI context building for emails using Metakocka data
- Email templates with Metakocka placeholders
- AI-powered email response generation

## Step 5: Validation Checklist

Use this checklist to validate your integration once credentials are in place:

- [ ] Metakocka API credentials successfully saved and tested
- [ ] IMAP email account successfully configured and tested
- [ ] Contact sync test completed successfully (both directions)
- [ ] Product sync test completed successfully (both directions)
- [ ] Sales document sync test completed successfully (both directions)
- [ ] Email integration test completed successfully
- [ ] Error logging properly captures any issues
- [ ] End-to-end workflow confirmed (e.g., email triggers appropriate Metakocka actions)

## Troubleshooting

### Common Issues

1. **Connection Errors:**
   - Verify credentials are correct
   - Check network connectivity
   - Ensure API endpoint URL is correct

2. **Authentication Errors:**
   - Verify your AUTH_TOKEN is valid
   - Check that your Metakocka company ID and secret key are correct

3. **Sync Failures:**
   - Check error logs at `/api/integrations/metakocka/error-logs`
   - Verify mapping IDs exist in both systems
   - Ensure required fields are properly formatted

4. **IMAP Connection Issues:**
   - Verify server details and port numbers
   - Check if SSL/TLS settings are correct
   - Ensure username includes domain if required

### Getting Help

- Check the error logs in the database for detailed error messages
- Review the Metakocka API documentation at https://github.com/metakocka/metakocka_api_base
- Run tests with validation mode to check endpoint structure: 
  ```
  VALIDATION_MODE=true ./run-contact-sync-test.sh
  ```

## Next Steps After Successful Testing

1. Set up automated synchronization schedules
2. Configure error notification preferences
3. Train team members on the integration features
4. Document any customizations made during setup
