# Notification System Documentation

## Overview

The Fresh AI CRM notification system provides a comprehensive solution for delivering timely and relevant notifications to users through multiple channels. The system supports both in-app notifications and email notifications, with user-configurable preferences for each notification type.

## System Components

### Database Schema

1. **notifications** - Stores individual notifications
   - `id`: Unique identifier
   - `user_id`: User the notification is for
   - `organization_id`: Organization context
   - `type`: Notification type (e.g., subscription_renewal, system_update)
   - `title`: Notification title
   - `message`: Notification content
   - `read`: Boolean indicating if notification has been read
   - `action_url`: Optional URL for notification action
   - `metadata`: JSONB field for additional data
   - `created_at`: Timestamp

2. **notification_templates** - Defines templates for different notification types
   - `id`: Unique identifier
   - `type`: Notification type
   - `title_template`: Template for notification title
   - `message_template`: Template for notification message
   - `action_url_template`: Template for action URL
   - `default_metadata`: Default metadata for this notification type

3. **notification_preferences** - Stores user preferences for notifications
   - `id`: Unique identifier
   - `user_id`: User these preferences belong to
   - `notification_type`: Type of notification
   - `email_enabled`: Whether email notifications are enabled
   - `in_app_enabled`: Whether in-app notifications are enabled

4. **email_queue** - Queue for email notifications
   - `id`: Unique identifier
   - `status`: Status of the email (pending, processing, sent, failed)
   - `recipient_email`: Email address
   - `subject`: Email subject
   - `body`: Email content
   - `priority`: Priority level (high, medium, low)
   - `metadata`: Additional data including notification references
   - Various tracking fields (processing_attempts, error_message, etc.)

### Services

1. **NotificationService**
   - Core service for creating and managing in-app notifications
   - Methods for creating individual and organization-wide notifications
   - Methods for fetching and marking notifications as read

2. **EnhancedNotificationService**
   - Extends NotificationService with email integration
   - Checks user preferences before creating notifications
   - Handles both in-app and email notification channels

3. **NotificationPreferencesService**
   - Manages user notification preferences
   - Methods for fetching and updating preferences
   - Retrieves available notification templates and types

4. **EmailService**
   - Handles email queue management
   - Methods for queueing notification emails
   - Support for organization and user-specific emails

### API Endpoints

1. **Notification Endpoints**
   - `GET /api/notifications` - Fetch user notifications
   - `POST /api/notifications/:id/read` - Mark notification as read
   - `POST /api/notifications/read-all` - Mark all notifications as read
   - `POST /api/notifications/process-email-queue` - Process pending emails (admin only)

2. **Notification Preferences Endpoints**
   - `GET /api/user/notification-preferences` - Get user preferences
   - `PUT /api/user/notification-preferences` - Update user preferences

### Frontend Components

1. **NotificationCenter**
   - Dropdown component for viewing notifications
   - Displays unread count badge
   - Supports filtering by notification type
   - Provides quick access to notification settings

2. **NotificationPreferences**
   - Settings page component for managing notification preferences
   - Grouped by notification categories
   - Toggle controls for email and in-app channels

## Notification Categories

Notifications are organized into the following categories:

1. **Subscription**
   - `subscription_renewal`: Upcoming subscription renewals
   - `subscription_payment_failed`: Failed payment attempts
   - `subscription_upgraded`: Successful plan upgrades
   - `subscription_trial_ending`: Trial period ending soon

2. **System**
   - `system_maintenance`: Scheduled maintenance notifications
   - `system_update`: Platform updates and new features
   - `system_error`: Critical system errors

3. **User**
   - `user_welcome`: New user onboarding
   - `user_password_reset`: Password reset notifications
   - `user_role_change`: User role or permission changes

4. **Metakocka**
   - `metakocka_sync`: Integration sync status
   - `metakocka_error`: Integration errors

5. **White-label**
   - `white_label_setup`: White-label setup notifications
   - `white_label_domain`: Domain configuration updates

## Notification Flow

1. **Notification Creation**
   - System event triggers notification creation
   - EnhancedNotificationService checks user preferences
   - Creates in-app notification if enabled
   - Queues email notification if enabled

2. **Email Processing**
   - Scheduled job processes email queue
   - Updates email status based on delivery results
   - Handles retry logic for failed emails

3. **Notification Delivery**
   - In-app notifications appear in NotificationCenter
   - Email notifications delivered to user's inbox
   - Both link back to relevant application pages

## Security Considerations

1. **Row-Level Security**
   - RLS policies ensure users can only access their own notifications
   - Organization-scoped notifications restricted to organization members

2. **API Authentication**
   - All notification endpoints require authenticated sessions
   - Admin-only endpoints check for admin role

3. **Email Security**
   - Email templates avoid including sensitive information
   - Links in emails use secure tokens for authentication

## Future Enhancements

1. **Mobile Push Notifications**
   - Integration with mobile push notification services
   - Support for iOS and Android devices

2. **Advanced Notification Scheduling**
   - Time-based delivery preferences
   - Notification batching to prevent overwhelming users

3. **Notification Analytics**
   - Track notification open and interaction rates
   - Optimize notification content and timing

4. **SMS Notifications**
   - Add SMS as an additional notification channel
   - Support for critical notifications

5. **Rich Notification Content**
   - Support for images and formatted content in notifications
   - Interactive notification elements

## Implementation Status

The notification system has been implemented with the following components:

- ✅ Database schema and RLS policies
- ✅ Core notification services
- ✅ Email queue integration
- ✅ Notification preferences UI and API
- ✅ Enhanced NotificationCenter UI
- ✅ Email processing endpoint

Upcoming work:

- ⏳ Mobile push notification integration
- ⏳ Scheduled notification jobs
- ⏳ Notification analytics
- ⏳ Rich notification content
