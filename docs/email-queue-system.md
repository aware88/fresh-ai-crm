# Email Queue System Documentation

## Overview

The Email Queue System is a robust solution for managing, processing, and reviewing incoming emails in the CRM Mind platform. It provides a structured approach to handling emails with AI-powered analysis, prioritization, and response generation.

## Key Features

- **Email Queuing**: Add incoming emails to a processing queue with priority levels
- **AI Analysis**: Analyze email content for language, intent, sentiment, and priority
- **Automated Processing**: Background worker for processing queued emails
- **Manual Review**: Review system for emails that require human attention
- **Queue Management**: Tools for monitoring, resetting failed items, and cleanup
- **Multi-tenant Support**: Organization-level isolation for multi-tenant deployments

## Architecture

The Email Queue System consists of the following components:

### 1. Database Schema

The system uses the `email_queue` table with the following structure:

```sql
CREATE TABLE email_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email_id UUID REFERENCES emails(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  priority VARCHAR(20) NOT NULL DEFAULT 'medium',
  processing_attempts INT NOT NULL DEFAULT 0,
  last_processed_at TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  requires_manual_review BOOLEAN NOT NULL DEFAULT FALSE,
  assigned_to UUID REFERENCES auth.users(id),
  due_at TIMESTAMPTZ
);
```

### 2. Core Services

- **EmailQueueService**: Manages adding emails to the queue, processing them, and updating their status
- **EmailQueueWorker**: Background worker for processing emails in the queue
- **EmailAnalyzerService**: Analyzes email content to extract metadata and determine priority
- **EmailContextBuilder**: Builds comprehensive context for AI email processing

### 3. API Routes

- `POST /api/email-queue`: Add an email to the queue
- `GET /api/email-queue`: Get queue items with optional filters
- `POST /api/email-queue/process`: Process a batch of emails in the queue
- `GET /api/email-queue/stats`: Get queue statistics
- `GET /api/email-queue/review`: Get emails requiring manual review
- `POST /api/email-queue/review/[id]`: Approve or reject an email response
- `POST /api/email-queue/reset-failed`: Reset failed queue items to pending status
- `POST /api/email-queue/cleanup`: Clean up old completed queue items

## Email Processing Flow

1. **Email Ingestion**: Incoming emails are added to the queue with a priority level
2. **Queue Processing**: The queue worker processes emails in priority order
3. **AI Analysis**: Each email is analyzed for language, intent, sentiment, and priority
4. **Context Building**: Comprehensive context is built including contact history and Metakocka data
5. **Response Generation**: AI generates a response based on the email context
6. **Review Process**: Emails that require manual review are flagged for human attention
7. **Approval/Rejection**: Human reviewers can approve or reject AI-generated responses
8. **Completion**: Approved responses are sent, and the queue item is marked as completed

## Queue Status Lifecycle

- `PENDING`: Email is waiting to be processed
- `PROCESSING`: Email is currently being processed
- `COMPLETED`: Email has been successfully processed
- `FAILED`: Email processing has failed
- `REQUIRES_REVIEW`: Email requires manual review
- `APPROVED`: Email response has been approved
- `REJECTED`: Email response has been rejected

## Priority Levels

- `LOW`: Non-urgent emails
- `MEDIUM`: Standard priority (default)
- `HIGH`: Important emails that should be processed soon
- `URGENT`: Critical emails that should be processed immediately

## Integration with Metakocka

The Email Queue System integrates with Metakocka to provide comprehensive context for email processing:

- **Product Data**: Information about products mentioned in the email
- **Inventory Levels**: Current inventory levels for products
- **Contact History**: Previous interactions with the contact in Metakocka
- **Order Information**: Details about orders related to the email

## Testing

A comprehensive test script is available in `tests/email-queue/test-email-queue.js` that tests all aspects of the Email Queue System:

1. Adding emails to the queue
2. Getting queue statistics
3. Processing emails in the queue
4. Getting emails requiring review
5. Reviewing emails
6. Resetting failed queue items
7. Cleaning up old queue items

To run the tests:

```bash
cd tests/email-queue
cp email-queue-test.env.sample .env
# Edit .env with your test configuration
./run-email-queue-test.sh
```

## Security

The Email Queue System implements several security measures:

- **Row-Level Security**: RLS policies ensure that users can only access their own data
- **Authentication**: All API routes require authentication
- **Authorization**: Users can only access queue items they have permission to see
- **Multi-tenant Isolation**: Organization-level isolation for multi-tenant deployments

## Best Practices

1. **Regular Processing**: Set up a scheduled task to process the queue regularly
2. **Queue Monitoring**: Monitor queue statistics to ensure emails are being processed
3. **Error Handling**: Implement proper error handling for failed queue items
4. **Review Process**: Establish a review process for emails that require manual attention
5. **Cleanup**: Regularly clean up old queue items to prevent database bloat

## Troubleshooting

### Common Issues

1. **Queue Processing Stalled**: Check for failed queue items and reset them
2. **High Failure Rate**: Check the error messages for common patterns
3. **Slow Processing**: Monitor queue statistics and adjust batch size
4. **Missing Context**: Ensure all required data sources are available

### Debugging

1. Check the queue statistics to see the current state of the queue
2. Look at the error messages for failed queue items
3. Monitor the processing attempts for each queue item
4. Check the metadata for additional information about processing

## Future Enhancements

1. **Advanced Prioritization**: More sophisticated prioritization based on email content
2. **Automated Learning**: Learn from human reviews to improve AI responses
3. **SLA Tracking**: Track and enforce service level agreements for email responses
4. **Team Assignment**: Assign emails to specific team members for review
5. **Analytics Dashboard**: Comprehensive dashboard for monitoring queue performance
