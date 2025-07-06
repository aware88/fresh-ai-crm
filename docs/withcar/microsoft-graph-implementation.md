# Microsoft Graph API Implementation Details

## Authentication Flow

### 1. NextAuth.js Integration with Microsoft Graph

We'll extend the existing NextAuth.js configuration to include Microsoft as an OAuth provider:

```typescript
// src/app/api/auth/[...nextauth]/route.ts
import { NextAuthOptions } from 'next-auth';
import { SupabaseAdapter } from '@auth/supabase-adapter';
import NextAuth from 'next-auth';
import MicrosoftProvider from 'next-auth/providers/microsoft';

const authOptions: NextAuthOptions = {
  // Existing configuration...
  
  providers: [
    // Existing providers...
    
    MicrosoftProvider({
      clientId: process.env.MICROSOFT_CLIENT_ID!,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'openid profile email offline_access User.Read Mail.Read Mail.ReadWrite Mail.Send Calendars.Read Calendars.ReadWrite Contacts.Read Contacts.ReadWrite',
        },
      },
      tenant: 'common', // For multi-tenant applications
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      // Persist the access token to the token right after sign in
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
      }
      
      // If token has expired, try to refresh it
      if (token.expiresAt && Date.now() >= token.expiresAt * 1000) {
        // Implement token refresh logic
      }
      
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client
      session.accessToken = token.accessToken;
      return session;
    },
  },
};
```

### 2. Microsoft Graph Client Service

Create a service to handle Microsoft Graph API calls:

```typescript
// src/lib/services/microsoft-graph-service.ts
import { Client } from '@microsoft/microsoft-graph-client';
import { AuthProvider } from '@microsoft/microsoft-graph-client/authProviders/authProvider';

class MicrosoftGraphAuthProvider implements AuthProvider {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  getAccessToken(): Promise<string> {
    return Promise.resolve(this.accessToken);
  }
}

export class MicrosoftGraphService {
  private client: Client;

  constructor(accessToken: string) {
    const authProvider = new MicrosoftGraphAuthProvider(accessToken);
    this.client = Client.initWithMiddleware({
      authProvider,
    });
  }

  // Email methods
  async getEmails(options: { top?: number; skip?: number; filter?: string } = {}) {
    const { top = 10, skip = 0, filter = '' } = options;
    
    try {
      const result = await this.client
        .api('/me/messages')
        .top(top)
        .skip(skip)
        .filter(filter)
        .select('id,subject,bodyPreview,receivedDateTime,from,toRecipients,ccRecipients,hasAttachments,importance,isRead')
        .orderby('receivedDateTime DESC')
        .get();
        
      return result.value;
    } catch (error) {
      console.error('Error fetching emails:', error);
      throw error;
    }
  }

  async getEmail(messageId: string) {
    try {
      return await this.client
        .api(`/me/messages/${messageId}`)
        .select('id,subject,body,receivedDateTime,from,toRecipients,ccRecipients,bccRecipients,hasAttachments,attachments,importance,isRead')
        .expand('attachments')
        .get();
    } catch (error) {
      console.error(`Error fetching email ${messageId}:`, error);
      throw error;
    }
  }

  async sendEmail(message: any) {
    try {
      return await this.client
        .api('/me/sendMail')
        .post({ message });
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  // Calendar methods
  async getCalendarEvents(options: { startDateTime?: string; endDateTime?: string; top?: number } = {}) {
    const { startDateTime, endDateTime, top = 10 } = options;
    
    try {
      let request = this.client
        .api('/me/calendar/events')
        .top(top)
        .select('id,subject,bodyPreview,start,end,location,organizer,attendees,isAllDay')
        .orderby('start/dateTime ASC');
        
      if (startDateTime && endDateTime) {
        request = request.filter(`start/dateTime ge '${startDateTime}' and end/dateTime le '${endDateTime}'`);
      }
      
      const result = await request.get();
      return result.value;
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      throw error;
    }
  }

  // Contacts methods
  async getContacts(options: { top?: number; skip?: number; filter?: string } = {}) {
    const { top = 10, skip = 0, filter = '' } = options;
    
    try {
      const result = await this.client
        .api('/me/contacts')
        .top(top)
        .skip(skip)
        .filter(filter)
        .select('id,displayName,emailAddresses,businessPhones,mobilePhone,jobTitle,companyName')
        .orderby('displayName ASC')
        .get();
        
      return result.value;
    } catch (error) {
      console.error('Error fetching contacts:', error);
      throw error;
    }
  }
}
```

## Email Component Implementation

### 1. Email List Component

```typescript
// src/components/email/EmailList.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { MicrosoftGraphService } from '@/lib/services/microsoft-graph-service';
import { Spinner, Alert, Badge } from '@/components/ui';

export default function EmailList() {
  const { data: session } = useSession();
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEmails() {
      if (!session?.accessToken) return;
      
      try {
        setLoading(true);
        const graphService = new MicrosoftGraphService(session.accessToken);
        const emailData = await graphService.getEmails({ top: 20 });
        setEmails(emailData);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch emails:', err);
        setError('Failed to load emails. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchEmails();
  }, [session]);

  if (loading) return <Spinner />;
  if (error) return <Alert type="error">{error}</Alert>;

  return (
    <div className="email-list">
      <h2>Inbox</h2>
      {emails.length === 0 ? (
        <p>No emails found</p>
      ) : (
        <ul>
          {emails.map((email) => (
            <li key={email.id} className={email.isRead ? 'read' : 'unread'}>
              <div className="email-item">
                <div className="email-sender">{email.from.emailAddress.name}</div>
                <div className="email-subject">
                  {email.subject}
                  {email.hasAttachments && <span className="attachment-icon">📎</span>}
                  {email.importance === 'high' && <Badge color="red">Important</Badge>}
                </div>
                <div className="email-preview">{email.bodyPreview}</div>
                <div className="email-date">
                  {new Date(email.receivedDateTime).toLocaleDateString()}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

### 2. Email Detail Component

```typescript
// src/components/email/EmailDetail.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { MicrosoftGraphService } from '@/lib/services/microsoft-graph-service';
import { Spinner, Alert, Button } from '@/components/ui';

interface EmailDetailProps {
  messageId: string;
}

export default function EmailDetail({ messageId }: EmailDetailProps) {
  const { data: session } = useSession();
  const [email, setEmail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEmail() {
      if (!session?.accessToken || !messageId) return;
      
      try {
        setLoading(true);
        const graphService = new MicrosoftGraphService(session.accessToken);
        const emailData = await graphService.getEmail(messageId);
        setEmail(emailData);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch email:', err);
        setError('Failed to load email. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchEmail();
  }, [session, messageId]);

  if (loading) return <Spinner />;
  if (error) return <Alert type="error">{error}</Alert>;
  if (!email) return <Alert type="info">Email not found</Alert>;

  return (
    <div className="email-detail">
      <div className="email-header">
        <h2>{email.subject}</h2>
        <div className="email-meta">
          <div className="email-from">
            <strong>From:</strong> {email.from.emailAddress.name} ({email.from.emailAddress.address})
          </div>
          <div className="email-to">
            <strong>To:</strong> {email.toRecipients.map(r => r.emailAddress.name).join(', ')}
          </div>
          {email.ccRecipients?.length > 0 && (
            <div className="email-cc">
              <strong>CC:</strong> {email.ccRecipients.map(r => r.emailAddress.name).join(', ')}
            </div>
          )}
          <div className="email-date">
            <strong>Date:</strong> {new Date(email.receivedDateTime).toLocaleString()}
          </div>
        </div>
      </div>
      
      <div className="email-body" dangerouslySetInnerHTML={{ __html: email.body.content }} />
      
      {email.hasAttachments && (
        <div className="email-attachments">
          <h3>Attachments</h3>
          <ul>
            {email.attachments.map(attachment => (
              <li key={attachment.id}>
                <a href={`data:${attachment.contentType};base64,${attachment.contentBytes}`} download={attachment.name}>
                  {attachment.name} ({Math.round(attachment.size / 1024)} KB)
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="email-actions">
        <Button>Reply</Button>
        <Button>Reply All</Button>
        <Button>Forward</Button>
      </div>
    </div>
  );
}
```

## API Routes for Email Operations

### 1. Email API Route

```typescript
// src/app/api/emails/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { MicrosoftGraphService } from '@/lib/services/microsoft-graph-service';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const searchParams = req.nextUrl.searchParams;
    const top = parseInt(searchParams.get('top') || '10');
    const skip = parseInt(searchParams.get('skip') || '0');
    const filter = searchParams.get('filter') || '';
    
    const graphService = new MicrosoftGraphService(session.accessToken);
    const emails = await graphService.getEmails({ top, skip, filter });
    
    return NextResponse.json({ data: emails });
  } catch (error) {
    console.error('Error in emails API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch emails' },
      { status: 500 }
    );
  }
}
```

### 2. Single Email API Route

```typescript
// src/app/api/emails/[messageId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { MicrosoftGraphService } from '@/lib/services/microsoft-graph-service';

export async function GET(
  req: NextRequest,
  { params }: { params: { messageId: string } }
) {
  try {
    const session = await getServerSession();
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { messageId } = params;
    
    const graphService = new MicrosoftGraphService(session.accessToken);
    const email = await graphService.getEmail(messageId);
    
    return NextResponse.json({ data: email });
  } catch (error) {
    console.error('Error in email API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email' },
      { status: 500 }
    );
  }
}
```

## Integration with Metakocka

To integrate Microsoft Graph emails with Metakocka, we'll extend the existing email enrichment functionality:

```typescript
// src/lib/integrations/metakocka/email-enricher.ts

// Add a new function to enrich Microsoft Graph emails
export async function enrichMicrosoftGraphEmailWithMetakockaData(
  messageId: string,
  userId: string
): Promise<EmailEnrichmentResult> {
  try {
    // 1. Fetch the email content from Microsoft Graph API
    const session = await getServerSession();
    if (!session?.accessToken) {
      throw new Error('User not authenticated with Microsoft Graph');
    }
    
    const graphService = new MicrosoftGraphService(session.accessToken);
    const email = await graphService.getEmail(messageId);
    
    // 2. Convert Microsoft Graph email to our internal Email format
    const internalEmail: Email = {
      id: email.id,
      subject: email.subject,
      body: email.body.content,
      sender: email.from.emailAddress.address,
      recipients: email.toRecipients.map(r => r.emailAddress.address),
      cc: email.ccRecipients?.map(r => r.emailAddress.address) || [],
      date: new Date(email.receivedDateTime),
      hasAttachments: email.hasAttachments,
      // Add other fields as needed
    };
    
    // 3. Use the existing enrichment logic with our converted email
    return await enrichEmailWithMetakockaData(internalEmail.id, userId);
  } catch (error) {
    console.error('Error enriching Microsoft Graph email:', error);
    throw error;
  }
}
```

## Next Steps

1. Implement the Microsoft authentication provider in NextAuth.js
2. Create the Microsoft Graph client service
3. Develop the email list and detail components
4. Implement the API routes for email operations
5. Integrate with Metakocka email enrichment
6. Add calendar and contacts functionality
