# Email Queue Test Instructions

## Setup

1. Copy the sample environment file to create your .env file:

```bash
cp email-queue-test.env.sample .env
```

2. Edit the .env file with the following values:

```
# Email Queue Test Configuration
API_URL=http://localhost:3000

# Authentication token for API access
# Get this from your user profile or generate a service token
AUTH_TOKEN=your_auth_token_here

# Contact ID for testing
# This must be a valid contact ID from your database
# You can find contact IDs in your database or use one from another test
CONTACT_ID=your_contact_id_here

# Optional: Specify an existing email ID
# If not provided, a random UUID will be generated
# EMAIL_ID=existing_email_id
```

3. Make the test script executable:

```bash
chmod +x run-email-queue-test.sh
```

4. Run the test:

```bash
./run-email-queue-test.sh
```

## Test Coverage

The test script will verify:

1. Adding emails to the queue
2. Getting queue statistics
3. Processing emails in the queue
4. Getting emails requiring review
5. Reviewing emails
6. Resetting failed queue items
7. Cleaning up old queue items

## Troubleshooting

If you encounter errors:

1. Ensure your Supabase instance is running
2. Verify your AUTH_TOKEN is valid
3. Confirm the CONTACT_ID exists in your database
4. Check that the API server is running at the URL specified in API_URL
