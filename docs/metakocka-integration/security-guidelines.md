# Metakocka Integration Security Guidelines

This document outlines the security best practices and considerations for the Metakocka integration with CRM Mind.

## Multi-tenant Data Isolation

### Current Implementation

All database queries and API operations enforce multi-tenant isolation by filtering with `userId`:

```typescript
// Database queries
const { data, error } = await supabase
  .from('metakocka_contact_mappings')
  .select('metakocka_id')
  .eq('user_id', userId);

// API operations
const client = await MetakockaService.getClientForUser(userId, true);
```

### Best Practices

1. **Always Include User ID**: Every database query must include a filter on `user_id` or `organization_id`
2. **RLS Policies**: Rely on Supabase Row Level Security (RLS) policies as a second layer of protection
3. **API Client Isolation**: Each API client instance should be scoped to a specific user

## Credential Management

### Current Implementation

Metakocka credentials are stored securely in the database and never exposed in client-side code:

```typescript
// Secure credential retrieval
const { data: credentials } = await supabase
  .from('metakocka_credentials')
  .select('*')
  .eq('user_id', userId)
  .single();
```

### Best Practices

1. **No Hardcoded Credentials**: Never hardcode API keys or credentials in the codebase
2. **Encrypted Storage**: Store sensitive credentials in encrypted form
3. **Minimal Exposure**: Only retrieve credentials when needed and limit their exposure

## Error Handling and Logging

### Current Implementation

Errors are logged with structured metadata but without exposing sensitive information:

```typescript
ErrorLogger.logError(LogCategory.SYNC, 'Error syncing contacts from Metakocka', {
  userId,  // Include for context but not full user data
  details: { operation: 'single-contact-sync' },
  error    // Sanitized before logging
});
```

### Best Practices

1. **Sanitize Error Messages**: Ensure error messages don't contain sensitive data before logging
2. **Structured Logging**: Use structured logging with appropriate categories
3. **Minimal Information**: Log only what's necessary for debugging

## API Security

### Current Implementation

All API endpoints require authentication and validate permissions:

```typescript
// API route handler with authentication
export async function POST(request: Request) {
  const { userId } = await requireAuth();
  // Process request only after authentication
}
```

### Best Practices

1. **Authentication**: All API endpoints must require authentication
2. **Authorization**: Validate that the authenticated user has permission for the requested operation
3. **Input Validation**: Validate and sanitize all input parameters
4. **Rate Limiting**: Implement rate limiting to prevent abuse

## Data Transmission

### Current Implementation

All API communication uses HTTPS for encrypted data transmission.

### Best Practices

1. **HTTPS Only**: Enforce HTTPS for all API communication
2. **Minimal Data Transfer**: Only transmit necessary data fields
3. **Data Validation**: Validate data integrity before and after transmission

## Security Checklist

Before deploying to production, ensure:

- [ ] All database queries include user/organization filtering
- [ ] RLS policies are properly configured for all tables
- [ ] No sensitive credentials are exposed in client-side code
- [ ] All API endpoints require authentication
- [ ] Error handling doesn't expose sensitive information
- [ ] Input validation is implemented for all user inputs
- [ ] Rate limiting is configured for API endpoints

## Regular Security Reviews

Schedule regular security reviews to:

1. Audit database access patterns
2. Review API endpoint security
3. Check for potential data leakage
4. Validate multi-tenant isolation effectiveness
5. Test for common vulnerabilities (OWASP Top 10)
