# Real-Time Sync Architecture Documentation - September 12, 2025

## System Architecture Overview

### Core Components Structure

```
Real-Time Email Sync System
├── RealTimeSyncManager (Master Orchestrator)
│   ├── WebhookService (Microsoft/Gmail webhooks)
│   ├── BackgroundAIProcessor (Auto AI processing)
│   └── OptimizedEmailService (Database operations)
├── Provider-Specific Sync Routes
│   ├── /api/emails/graph/sync (Microsoft/Outlook)
│   ├── /api/emails/gmail/sync (Gmail) 
│   └── /api/email/sync-to-database (IMAP)
└── Webhook Endpoints
    ├── /api/webhooks/microsoft-graph
    ├── /api/webhooks/gmail-pubsub
    └── /api/cron/sync-imap-polling
```

## How Real-Time Sync Works

### Phase 1: Historical Sync (One-Time)
```javascript
// 1. User triggers historical sync (manual)
POST /api/emails/graph/sync?userId=X&limit=10000
POST /api/emails/gmail/sync?userId=X&maxResults=10000  
POST /api/email/sync-to-database?userId=X&maxEmails=10000

// 2. System syncs ALL historical emails
// 3. Updates last_sync_at timestamp
// 4. Sets up sync state tracking
```

### Phase 2: Real-Time Activation (Automatic)
```javascript
// 1. Call RealTimeSyncManager
await realTimeSyncManager.startRealTimeSync({
  provider: 'microsoft',     // or 'google', 'imap'
  accountId: 'account_uuid',
  userId: 'user_uuid', 
  email: 'user@domain.com',
  enableWebhooks: true,      // false for IMAP
  pollingInterval: 0.5,      // 30 seconds
  enableAI: true,            // Auto-process new emails
  enableDraftPreparation: true
});

// 2. System registers webhooks (Microsoft/Gmail)
// 3. Starts polling backup (all providers) 
// 4. Updates database flags:
UPDATE email_accounts SET 
  real_time_sync_active = true,
  webhook_active = true,
  polling_interval = 30;
```

### Phase 3: Real-Time Processing (Continuous)
```
New Email Arrives
│
├── Webhook Route (Microsoft/Gmail)
│   ├── Validates webhook signature
│   ├── Extracts email metadata 
│   ├── Checks for duplicates (message_id)
│   ├── Inserts only NEW emails
│   └── Triggers AI processing
│
└── Polling Route (IMAP/Backup)
    ├── Queries for new UIDs since last sync
    ├── Fetches only incremental changes
    ├── Deduplicates via message_id
    ├── Inserts only NEW emails
    └── Triggers AI processing
```

## Provider-Specific Implementation

### Microsoft Graph/Outlook
**Capabilities:**
- ✅ Native webhooks via Microsoft Graph subscriptions
- ✅ Delta sync using deltaToken for incremental changes
- ✅ Real-time notifications within seconds
- ✅ Automatic token refresh
- ✅ Batch operations support

**Sync Flow:**
```javascript
// Historical: Gets all emails with pagination
GET /me/messages?$top=1000&$skip=0

// Real-time: Delta sync for changes only  
GET /me/messages/delta?$deltatoken=xyz123

// Webhook: Instant notifications
POST /api/webhooks/microsoft-graph
{
  "changeType": "created",
  "resource": "me/messages/AAMkAD...",
  "subscriptionId": "uuid"
}
```

### Gmail API
**Capabilities:**
- ✅ Pub/Sub push notifications
- ✅ History API for incremental sync using historyId
- ✅ Real-time notifications within seconds
- ✅ Label-based filtering
- ✅ Batch operations support

**Sync Flow:**
```javascript
// Historical: Gets all emails with pagination
GET /gmail/v1/users/me/messages?maxResults=500&pageToken=xyz

// Real-time: History API for changes only
GET /gmail/v1/users/me/history?startHistoryId=12345

// Webhook: Pub/Sub push notifications  
POST /api/webhooks/gmail-pubsub
{
  "message": {
    "data": "base64-encoded-payload",
    "messageId": "123456"
  }
}
```

### IMAP
**Capabilities:**
- ⚠️ No native webhooks (polling only)
- ✅ UID-based incremental sync
- ✅ IDLE command support (where available)
- ✅ Folder-based sync (INBOX, SENT)
- ✅ Reliable but higher latency (30s-1min)

**Sync Flow:**
```javascript
// Historical: Full folder sync
IMAP: SELECT INBOX; FETCH 1:* (UID FLAGS)

// Real-time: UID range sync
IMAP: FETCH lastUID+1:* (UID FLAGS BODY)

// Polling: Scheduled checks every 30 seconds
setInterval(() => syncNewIMAPEmails(), 30000);
```

## Deduplication & Data Integrity

### Unique Constraints
```sql
-- Primary deduplication
ALTER TABLE email_index ADD CONSTRAINT unique_message_id UNIQUE (message_id);

-- User isolation
ALTER TABLE email_index ADD CONSTRAINT fk_user_id 
  FOREIGN KEY (user_id) REFERENCES auth.users(id);

-- Account association  
ALTER TABLE email_index ADD CONSTRAINT fk_email_account_id
  FOREIGN KEY (email_account_id) REFERENCES email_accounts(id);
```

### Sync State Tracking
```sql
-- Tracks last sync point for each provider
CREATE TABLE email_sync_state (
  id UUID PRIMARY KEY,
  account_id UUID REFERENCES email_accounts(id),
  provider TEXT NOT NULL,
  state JSONB, -- deltaToken, historyId, lastUID, etc.
  last_updated TIMESTAMPTZ
);
```

## Background Processing Architecture

### AI Processing Pipeline
```javascript
// 1. New email detected by sync
// 2. Background processor triggered
await backgroundProcessor.processEmail({
  emailId: 'uuid',
  userId: 'uuid', 
  priority: 'high',
  enableDrafting: true,
  enableAnalysis: true
});

// 3. Parallel processing:
// - Sentiment analysis
// - Category classification  
// - Draft generation (if applicable)
// - Contact extraction
// - Lead scoring
```

### Performance Optimizations
- **Batch processing**: Groups multiple new emails
- **Priority queuing**: Important emails processed first  
- **Caching**: Drafts cached for 7 days
- **Rate limiting**: Respects API limits per provider
- **Retry logic**: Handles temporary failures gracefully

## Configuration & Control

### Database Flags
```sql
-- Per-account real-time control
email_accounts:
- real_time_sync_active: boolean    -- Master on/off switch
- webhook_active: boolean           -- Webhook registration status  
- polling_interval: integer         -- Seconds between polls
- is_active: boolean                -- Account enabled status
- last_sync_at: timestamptz         -- Last successful sync
- webhook_id: text                  -- Provider webhook identifier
```

### Runtime Management
```javascript
// Start real-time sync for all active accounts
await realTimeSyncManager.startAllSyncs();

// Stop real-time sync for specific account  
await realTimeSyncManager.stopRealTimeSync('account_id');

// Get sync status
const status = await realTimeSyncManager.getSyncStatus('account_id');
```

## Error Handling & Monitoring

### Failure Recovery
- **Webhook failures**: Falls back to polling automatically
- **Token expiry**: Auto-refresh for OAuth providers
- **Rate limiting**: Exponential backoff and queuing
- **Network issues**: Retry with circuit breaker pattern

### Monitoring Points
- **Sync success rates** per provider
- **Webhook delivery status** 
- **Processing latency** metrics
- **Error categorization** and alerting
- **Database constraint violations**

## Security & Compliance

### Data Protection
- **Encryption**: All tokens encrypted at rest
- **Access control**: RLS policies enforce user isolation  
- **Audit logging**: All sync operations logged
- **Token rotation**: Automatic refresh for OAuth

### Webhook Security
- **Signature validation**: Microsoft Graph & Gmail signatures verified
- **HTTPS enforcement**: All webhook URLs require SSL
- **Rate limiting**: Prevents webhook flooding
- **IP whitelisting**: Provider IP ranges validated

## Performance Characteristics

### Latency Expectations
- **Microsoft/Gmail Webhooks**: 1-5 seconds
- **IMAP Polling**: 30 seconds - 1 minute
- **Historical Sync**: 10K emails in ~30-60 seconds
- **AI Processing**: 1-3 seconds per email (parallel)

### Scalability Limits
- **Concurrent accounts**: 100+ supported
- **Emails per day**: 100K+ per account
- **Webhook throughput**: 1000+ per minute
- **Database capacity**: Millions of emails

## Deployment & Operations

### Environment Requirements
- **Webhooks**: Production HTTPS URLs required
- **Database**: PostgreSQL with proper indexing
- **Background jobs**: Node.js with persistent timers
- **Monitoring**: Real-time sync status dashboard

### Maintenance Operations
```bash
# Check sync health
curl /api/admin/sync-status

# Restart failed syncs  
curl -X POST /api/admin/restart-sync

# Clear sync state (reset)
curl -X DELETE /api/admin/sync-state/account_id
```

This architecture provides enterprise-grade real-time email synchronization with automatic failover, comprehensive monitoring, and seamless user experience across all major email providers.