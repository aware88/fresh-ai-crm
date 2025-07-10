# Withcar Admin Onboarding Checklist

This document provides a comprehensive checklist to ensure ARIS (Agentic Relationship Intelligence System) is fully ready for onboarding the Withcar admin tomorrow, including adding email addresses, configuring Metakocka API access, and verifying all integrations are properly aligned.

## Pre-Onboarding Verification

### 1. Application Access & Authentication

- [ ] Confirm user account is created for Withcar admin
- [ ] Verify admin permissions are correctly assigned
- [ ] Test login functionality with temporary credentials
- [ ] Ensure password reset functionality works correctly

### 2. Metakocka API Integration

- [ ] Verify Metakocka settings page is accessible at `/settings/integrations/metakocka`
- [ ] Confirm all form fields are working (Company ID, Secret Key, API Endpoint)
- [ ] Test the "Test Connection" button functionality
- [ ] Verify credentials are securely stored when saved
- [ ] Confirm error handling for invalid credentials works correctly

### 3. Email Account Configuration

- [ ] Verify email accounts page is accessible at `/settings/email-accounts`
- [ ] Confirm "Add IMAP Account" functionality works
- [ ] Test IMAP/SMTP configuration form with sample data
- [ ] Verify email account test functionality works
- [ ] Ensure email credentials are securely stored

### 4. Data Synchronization Readiness

- [ ] Verify contact sync functionality is ready for testing
- [ ] Confirm product sync functionality is ready for testing
- [ ] Ensure sales document sync functionality is ready for testing
- [ ] Verify inventory checking functionality is operational
- [ ] Test error logging and retry mechanisms

## Onboarding Process

### 1. Initial Setup (Day 1)

- [ ] Welcome and introduction to ARIS
- [ ] Account setup and password configuration
- [ ] Navigation overview and basic functionality demonstration
- [ ] Settings access and personalization options

### 2. Metakocka Integration (Day 1)

- [ ] Navigate to Metakocka settings page
- [ ] Enter provided Metakocka API credentials
  - Company ID: [To be provided by Withcar]
  - Secret Key: [To be provided by Withcar]
  - API Endpoint: https://main.metakocka.si/rest/eshop/v1/json/ (verify)
- [ ] Test connection to confirm credentials work
- [ ] Save credentials securely
- [ ] Verify successful connection in logs

### 3. Email Configuration (Day 1)

- [ ] Navigate to Email Accounts settings
- [ ] Add new IMAP account with provided credentials
  - Email Address: [To be provided by Withcar]
  - IMAP Server: [To be provided by Withcar]
  - IMAP Port: [To be provided by Withcar]
  - IMAP Username: [To be provided by Withcar]
  - IMAP Password: [To be provided by Withcar]
  - SMTP Server: [To be provided by Withcar]
  - SMTP Port: [To be provided by Withcar]
- [ ] Test email connection
- [ ] Save email account configuration

### 4. Initial Synchronization Testing (Day 1)

- [ ] Perform initial contact synchronization test
  - Select a test contact
  - Sync to Metakocka
  - Verify successful sync
- [ ] Perform initial product synchronization test
  - Select a test product
  - Sync to Metakocka
  - Verify successful sync
- [ ] Perform initial sales document synchronization test
  - Select a test sales document
  - Sync to Metakocka
  - Verify successful sync

## Post-Onboarding Verification

### 1. Data Integrity Checks

- [ ] Verify contacts are correctly synchronized between systems
- [ ] Confirm products are accurately represented in both systems
- [ ] Ensure sales documents maintain integrity across systems
- [ ] Validate inventory data is accurate

### 2. Email Integration Verification

- [ ] Confirm emails are being properly fetched
- [ ] Verify email metadata enrichment with Metakocka data
- [ ] Test bidirectional references between emails and Metakocka entities
- [ ] Validate AI context building for emails using Metakocka data

### 3. Error Handling & Monitoring

- [ ] Review error logs for any synchronization issues
- [ ] Verify retry mechanisms are functioning correctly
- [ ] Confirm error notifications are properly configured
- [ ] Set up monitoring for ongoing integration health

## Technical Reference

### Test Scripts Available

1. **Contact Sync Testing**
   ```bash
   cd tests/metakocka
   ./run-contact-sync-test.sh
   ```

2. **Product Sync Testing**
   ```bash
   cd tests/metakocka
   ./run-product-sync-test.sh
   ```

3. **Sales Document Sync Testing**
   ```bash
   cd tests/metakocka
   ./run-sales-document-sync-test.sh
   ```

4. **Email Integration Testing**
   ```bash
   cd tests/metakocka
   ./run-metakocka-email-test.sh
   ```

### API Endpoints Reference

1. **Metakocka Credentials**
   - Save: `POST /api/integrations/metakocka/credentials`
   - Test: `POST /api/integrations/metakocka/credentials/test`
   - Delete: `DELETE /api/integrations/metakocka/credentials`

2. **Contact Synchronization**
   - Sync to Metakocka: `POST /api/integrations/metakocka/contacts/sync-to-metakocka`
   - Sync from Metakocka: `POST /api/integrations/metakocka/contacts/sync-from-metakocka`
   - Get mappings: `GET /api/integrations/metakocka/contacts/mappings`

3. **Product Synchronization**
   - Sync to Metakocka: `POST /api/integrations/metakocka/products/sync-to-metakocka`
   - Sync from Metakocka: `POST /api/integrations/metakocka/products/sync-from-metakocka`
   - Get mappings: `GET /api/integrations/metakocka/products/mappings`

4. **Sales Document Synchronization**
   - Sync to Metakocka: `POST /api/integrations/metakocka/sales-documents/sync-to-metakocka`
   - Sync from Metakocka: `POST /api/integrations/metakocka/sales-documents/sync-from-metakocka`
   - Get mappings: `GET /api/integrations/metakocka/sales-documents/mappings`

### Troubleshooting Common Issues

1. **API Connection Failures**
   - Verify network connectivity
   - Check API endpoint URL
   - Confirm credentials are correct
   - Review error logs for specific error codes

2. **Synchronization Errors**
   - Check required fields in both systems
   - Verify data format compatibility
   - Review mapping tables for consistency
   - Check for duplicate entries

3. **Email Integration Issues**
   - Verify IMAP/SMTP server details
   - Check for firewall or security restrictions
   - Confirm email account permissions
   - Test with a different email client for comparison
