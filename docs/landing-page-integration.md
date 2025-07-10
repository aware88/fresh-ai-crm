# Connecting HelloAris.com Landing Page to Fresh AI CRM Backend

This guide provides specific instructions for connecting your existing landing page at https://helloaris.com to the Fresh AI CRM backend.

## Overview

The integration involves:
1. Setting up API endpoints on your backend
2. Configuring authentication flow
3. Connecting signup/signin forms from the landing page to the backend
4. Setting up subscription management

## Step 1: Deploy Backend to Render

Follow the main deployment guide in `docs/production-deployment.md` to deploy your Fresh AI CRM backend to Render.

## Step 2: Configure CORS for Landing Page Integration

Add CORS configuration to allow requests from your landing page domain:

```typescript
// src/app/api/middleware.ts or equivalent
export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Add CORS headers for the landing page domain
  response.headers.set('Access-Control-Allow-Origin', 'https://helloaris.com');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  return response;
}

export const config = {
  matcher: '/api/:path*',
};
```

## Step 3: Set Up Authentication Flow

### Backend Configuration

1. Ensure NextAuth is properly configured with Supabase adapter
2. Configure proper callback URLs in your authentication providers

### Landing Page Integration

Update your landing page signup/signin forms to use the backend authentication endpoints:

```javascript
// Example signup function for your landing page
async function signUp(email, password, name) {
  const response = await fetch('https://your-backend-url.com/api/auth/signup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password, name }),
  });
  
  const data = await response.json();
  
  if (response.ok) {
    // Redirect to dashboard or confirmation page
    window.location.href = '/dashboard';
  } else {
    // Handle error
    console.error('Signup failed:', data.error);
  }
}
```

## Step 4: Connect Subscription Management

If your landing page includes pricing plans and subscription options:

1. Set up Stripe integration in your backend (if not already done)
2. Create API endpoints for subscription management
3. Update your landing page to use these endpoints

```javascript
// Example subscription function for your landing page
async function subscribeToPlan(planId) {
  const response = await fetch('https://your-backend-url.com/api/subscriptions/create-checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`,
    },
    body: JSON.stringify({ planId }),
  });
  
  const data = await response.json();
  
  if (response.ok) {
    // Redirect to Stripe checkout
    window.location.href = data.checkoutUrl;
  } else {
    // Handle error
    console.error('Subscription creation failed:', data.error);
  }
}
```

## Step 5: Update API Endpoints in Landing Page

Update all API endpoint references in your landing page code to point to your production backend:

```javascript
// Before
const API_BASE_URL = 'http://localhost:3000/api';

// After
const API_BASE_URL = 'https://your-backend-url.com/api';
```

## Step 6: Test Integration

1. Deploy both your landing page and backend
2. Test the complete user journey:
   - Visit landing page
   - Sign up for an account
   - Select a subscription plan
   - Complete checkout
   - Access the dashboard

## Step 7: Set Up Domain and DNS

### Option 1: Same Domain for Landing Page and App

If you want to host both your landing page and app under the same domain:

1. Configure Render to serve your app from a specific path (e.g., /app)
2. Set up your landing page as the root of the domain
3. Update your Next.js configuration to handle the base path:

```javascript
// next.config.js
module.exports = {
  basePath: '/app',
  // other config...
}
```

### Option 2: Separate Domains

If you want to keep separate domains:

1. Set up proper redirects from your landing page to your app domain after signup/login
2. Ensure authentication tokens are properly passed between domains

## Troubleshooting

Common issues and solutions:

1. **CORS Errors**: Ensure CORS is properly configured to allow requests from your landing page domain
2. **Authentication Issues**: Check that authentication tokens are properly passed and stored
3. **API Endpoint Errors**: Verify all API endpoints are correctly updated in your landing page code
4. **Subscription Flow Problems**: Test the complete subscription flow in a sandbox environment first
