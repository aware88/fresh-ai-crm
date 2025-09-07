# 🎯 Test Account Setup for AI Analysis Testing

This document explains how to set up and use the test account for testing AI analysis features, team collaboration, and token usage tracking.

## 📋 Overview

The test account provides:
- **Test User**: `test@example.com` / `test123`
- **Pro Subscription**: 500 AI messages, full psychological profiling
- **Mock Data**: 5 realistic emails for AI analysis testing
- **Team Collaboration**: Full organization setup with owner permissions

## 🚀 Quick Setup

### Option 1: Run SQL Script (Recommended)

1. Open your Supabase SQL Editor
2. Copy and paste the contents of `scripts/run-test-setup.sql`
3. Click "Run" to execute the script
4. You'll see success messages confirming the setup

### Option 2: Run Migration

1. The migration file `supabase/migrations/20250202000003_create_test_account_with_mock_data.sql` is already created
2. Run your normal migration process to apply it

## 📊 Mock Email Data

The test account includes 5 realistic emails designed for comprehensive AI analysis testing:

### 1. **Urgent Payment Issue** (High Priority)
- **From**: Sarah Johnson (billing@techcorp.com)
- **Subject**: "Urgent: Payment Issue with Invoice #INV-2024-001"
- **Content**: Billing dispute requiring immediate attention
- **AI Analysis**: Should detect urgency, billing context, negative sentiment

### 2. **Partnership Opportunity** (Medium Priority)
- **From**: Michael Chen (partnerships@innovateai.com)
- **Subject**: "Partnership Opportunity: AI-Powered CRM Integration"
- **Content**: Business development proposal with revenue sharing
- **AI Analysis**: Should detect business opportunity, positive sentiment, partnership intent

### 3. **Customer Complaint** (Urgent Priority)
- **From**: Jennifer Martinez (support@customerhelp.com)
- **Subject**: "Customer Complaint: Product Defect Issue"
- **Content**: Detailed complaint with refund request
- **AI Analysis**: Should detect complaint, negative sentiment, refund request, customer service context

### 4. **Follow-up Meeting** (High Priority)
- **From**: Alex Thompson (alex.thompson@enterpriseclient.com)
- **Subject**: "Follow-up: Quarterly Business Review Meeting"
- **Content**: Enterprise sales opportunity with demo request
- **AI Analysis**: Should detect sales opportunity, follow-up context, enterprise potential

### 5. **Success Testimonial** (Normal Priority)
- **From**: Robert Wilson (robert.wilson@successstory.com)
- **Subject**: "Thank You: Successful Implementation and Positive Results"
- **Content**: Positive feedback and case study request
- **AI Analysis**: Should detect positive sentiment, success story, testimonial potential

## 🧪 Testing Scenarios

### AI Analysis Features
- **Sentiment Analysis**: Test with positive, negative, and neutral emails
- **Priority Detection**: Verify urgent, high, medium, normal priority assignment
- **Agent Assignment**: Test customer, sales, dispute, billing agent routing
- **Upsell Detection**: Analyze partnership and enterprise emails for opportunities
- **Draft Caching**: Test AI-generated response caching and retrieval

### Team Collaboration
- **Organization Setup**: Verify user has owner permissions
- **Email Sharing**: Test email visibility across team members
- **Response Collaboration**: Test shared draft editing and approval workflows

### Token Usage Tracking
- **Pro Subscription**: Monitor AI message consumption (500 limit)
- **Usage Analytics**: Track which features consume the most tokens
- **Limit Enforcement**: Test behavior when approaching limits

## 🔧 Configuration Details

### User Account
```json
{
  "email": "test@example.com",
  "password": "test123",
  "first_name": "Test",
  "last_name": "User",
  "full_name": "Test User"
}
```

### Organization
```json
{
  "name": "Test Organization",
  "slug": "test-org",
  "subscription_tier": "pro",
  "subscription_status": "active",
  "beta_early_adopter": true
}
```

### Subscription Limits
```json
{
  "users": 5,
  "contacts": -1,  // unlimited
  "ai_messages": 500,
  "psychological_profiling": true
}
```

## 🎭 Expected AI Analysis Results

### Email 1 (Payment Issue)
- **Sentiment**: Negative/Concerned
- **Priority**: High/Urgent
- **Agent**: Billing
- **Action**: Immediate response required
- **Upsell**: None (dispute resolution)

### Email 2 (Partnership)
- **Sentiment**: Positive/Enthusiastic
- **Priority**: Medium
- **Agent**: Sales
- **Action**: Schedule meeting
- **Upsell**: High potential (partnership opportunity)

### Email 3 (Complaint)
- **Sentiment**: Negative/Frustrated
- **Priority**: Urgent
- **Agent**: Customer Support
- **Action**: Immediate resolution
- **Upsell**: None (retention focus)

### Email 4 (Follow-up)
- **Sentiment**: Positive/Professional
- **Priority**: High
- **Agent**: Sales
- **Action**: Prepare demo
- **Upsell**: High potential (enterprise sale)

### Email 5 (Testimonial)
- **Sentiment**: Very Positive/Grateful
- **Priority**: Normal
- **Agent**: Customer Success
- **Action**: Request case study
- **Upsell**: Medium potential (expansion)

## 🔍 Verification Steps

After setup, verify the following:

1. **Login Test**: Can log in with `test@example.com` / `test123`
2. **Organization Access**: User has owner role in "Test Organization"
3. **Email Visibility**: All 5 mock emails are visible in inbox
4. **Subscription Status**: Pro subscription is active with 500 AI messages
5. **AI Analysis**: Emails can be analyzed for sentiment, priority, and agent assignment

## 🧹 Cleanup

To remove the test account:

```sql
-- Delete test user (this will cascade to related data)
DELETE FROM auth.users WHERE email = 'test@example.com';

-- Delete test organization
DELETE FROM public.organizations WHERE name = 'Test Organization';
```

## 📝 Notes

- The test account is designed for development and testing only
- Mock emails contain realistic business scenarios for comprehensive testing
- Pro subscription allows full feature testing including psychological profiling
- All mock data is designed to trigger various AI analysis features
- The account setup is idempotent - running multiple times won't create duplicates

## 🆘 Troubleshooting

### Common Issues

1. **Login Fails**: Ensure the user was created successfully in auth.users
2. **No Emails Visible**: Check email_accounts and email_index tables
3. **Subscription Issues**: Verify organization has 'pro' tier and 'active' status
4. **AI Analysis Not Working**: Check if ai_messages limit is properly set

### Debug Queries

```sql
-- Check test user
SELECT * FROM auth.users WHERE email = 'test@example.com';

-- Check test organization
SELECT * FROM public.organizations WHERE name = 'Test Organization';

-- Check mock emails
SELECT subject, sender_email, importance FROM public.email_index 
WHERE organization_id = (SELECT id FROM public.organizations WHERE name = 'Test Organization');

-- Check subscription status
SELECT subscription_tier, subscription_status, subscription_metadata 
FROM public.organizations WHERE name = 'Test Organization';
```
