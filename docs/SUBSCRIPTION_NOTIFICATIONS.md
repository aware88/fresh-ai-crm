# Subscription Notifications System Documentation

## Overview

The CRM Mind subscription notification system provides timely alerts to users about their subscription status, including trial expirations, payment failures, plan upgrades, and renewal reminders. This document outlines the system architecture, components, and testing procedures.

## System Architecture

### Database Schema

```sql
-- Notifications table with metadata support
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX notifications_user_id_idx ON notifications(user_id);
CREATE INDEX notifications_organization_id_idx ON notifications(organization_id);
CREATE INDEX notifications_read_idx ON notifications(read);
CREATE INDEX notifications_type_idx ON notifications(type);
CREATE INDEX notifications_created_at_idx ON notifications(created_at DESC);

-- Row-level security policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only view their own notifications
CREATE POLICY notifications_select_policy ON notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only update their own notifications
CREATE POLICY notifications_update_policy ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Trigger for updated_at timestamp
CREATE TRIGGER set_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();
```

### Core Services

#### NotificationService

Handles the creation, retrieval, and management of notifications:

- `createNotification`: Creates a notification for a specific user
- `createOrganizationNotification`: Creates notifications for all users in an organization
- `getUserNotifications`: Retrieves notifications for a user
- `markNotificationAsRead`: Marks a notification as read
- `markAllNotificationsAsRead`: Marks all notifications as read for a user

#### SubscriptionNotificationService

Manages subscription-specific notifications:

- `sendTrialExpirationNotifications`: Sends notifications for subscriptions with trials ending soon
- `sendFailedPaymentNotification`: Sends notification when a payment fails
- `sendSubscriptionUpgradeNotification`: Sends notification when a subscription is upgraded
- `sendRenewalReminders`: Sends reminders for subscriptions renewing soon

### API Endpoints

#### Notification Endpoints

- `GET /api/notifications`: Fetch user notifications
- `POST /api/notifications/[id]/read`: Mark a notification as read
- `POST /api/notifications/read-all`: Mark all notifications as read

#### Admin Endpoints

- `POST /api/admin/subscriptions/notifications`: Trigger subscription notification jobs
  - Supports `trial_expiration` and `renewal_reminder` notification types
  - Requires admin role

#### Webhook Endpoint

- `POST /api/webhooks/subscription`: Process subscription events from payment providers
  - Handles events: `payment_succeeded`, `payment_failed`, `subscription_created`, `subscription_updated`, `subscription_canceled`, `trial_will_end`

### Frontend Components

#### NotificationCenter

A React component that displays notifications with appropriate styling based on type:

- `subscription_trial_ending`: Warning about trial expiration
- `subscription_payment_failed`: Alert about payment failure
- `subscription_upgraded`: Success message for plan upgrades
- `subscription_renewal`: Information about upcoming renewals

## Notification Types

| Type | Description | Metadata |
|------|-------------|----------|
| `subscription_trial_ending` | Trial period is ending soon | `subscription_id`, `action_url` |
| `subscription_payment_failed` | Payment for subscription failed | `subscription_id`, `action_url` |
| `subscription_upgraded` | Subscription plan was upgraded | `old_plan`, `new_plan`, `action_url` |
| `subscription_renewal` | Subscription will renew soon | `subscription_id`, `renewal_amount`, `action_url` |

## Testing

### Unit Tests

Comprehensive Jest test suites cover:

- NotificationService
- SubscriptionNotificationService
- Notification API endpoints
- Admin notification endpoints
- Subscription webhook handler

### Manual Testing

To manually test the subscription notification system:

1. **Trial Expiration Notifications**:
   ```bash
   curl -X POST http://localhost:3000/api/admin/subscriptions/notifications \
     -H "Content-Type: application/json" \
     -d '{"type": "trial_expiration"}'
   ```

2. **Renewal Reminder Notifications**:
   ```bash
   curl -X POST http://localhost:3000/api/admin/subscriptions/notifications \
     -H "Content-Type: application/json" \
     -d '{"type": "renewal_reminder"}'
   ```

3. **Webhook Events**:
   ```bash
   curl -X POST http://localhost:3000/api/webhooks/subscription \
     -H "Content-Type: application/json" \
     -d '{"type": "payment_failed", "data": {"organization_id": "org-123"}}'
   ```

## Security Considerations

- API endpoints enforce authentication via NextAuth sessions
- Admin endpoints verify user roles before allowing access
- Row-Level Security policies ensure users can only access their own notifications
- Webhook signature verification is recommended for production (TODO)

## Future Enhancements

1. **Webhook Signature Verification**: Implement signature verification for webhook payloads
2. **Scheduled Jobs**: Set up cron jobs to automatically trigger notification tasks
3. **User Preferences**: Allow users to configure notification preferences
4. **Email Integration**: Send important notifications via email in addition to in-app notifications
5. **Mobile Push Notifications**: Add support for mobile push notifications

## Troubleshooting

### Common Issues

1. **Notifications not appearing**: Check user authentication and RLS policies
2. **Admin endpoints returning 403**: Verify user has admin role in session
3. **Webhook events not processing**: Check payload format and error logs

### Debugging

To debug notification issues:

1. Check Supabase logs for database errors
2. Verify NextAuth session contains expected user data
3. Inspect webhook payloads for correct format
4. Review API response codes and error messages
