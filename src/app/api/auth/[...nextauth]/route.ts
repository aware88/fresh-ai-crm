import { NextAuthOptions } from 'next-auth';
import { SupabaseAdapter } from '@auth/supabase-adapter';
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import AzureADProvider from 'next-auth/providers/azure-ad';
import { supabase } from '../../../../lib/supabaseClient';

// Extend NextAuth types for this file
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
    accessToken?: string;
    refreshToken?: string;
    provider?: string;
    currentOrganizationId?: string | null;
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  }
}

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
    };
    currentOrganizationId?: string | null;
    organizationSetup?: boolean;
    organizationBranding?: {
      name: string;
      slug: string;
      logo_url?: string | null;
      organization_name?: string | null;
      primary_color?: string | null;
      secondary_color?: string | null;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    accessToken?: string;
    refreshToken?: string;
    provider?: string;
    organizationSetup?: boolean;
    expiresAt?: number;
    currentOrganizationId?: string | null;
    organizationBranding?: {
      name: string;
      slug: string;
      logo_url?: string | null;
      organization_name?: string | null;
      primary_color?: string | null;
      secondary_color?: string | null;
    };
  }
}

const authOptions: NextAuthOptions = {
  adapter: SupabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  }),
  session: {
    strategy: 'jwt',
    maxAge: 2 * 60 * 60, // 2 hours - prevent long-lived sessions
    updateAge: 15 * 60, // 15 minutes - more frequent updates for security
  },
  useSecureCookies: process.env.NODE_ENV === 'production', // Use secure cookies in production
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        // Use secure cookies in production, insecure in development
        secure: process.env.NODE_ENV === 'production',
        // Don't set domain - let it default to the current domain
        domain: undefined,
      },
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        httpOnly: false,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: undefined,
      },
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: undefined,
      },
    },
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password required');
        }
        
        try {
          // Authenticate with Supabase
          const { data, error } = await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          });
          
          if (error) {
            console.error('Supabase auth error:', error.message);
            
            // Provide better error message for invalid credentials
            if (error.message.includes('Invalid login credentials')) {
              throw new Error('Invalid email or password. If you recently signed up, please check your email for a confirmation link first.');
            }
            
            throw new Error(error.message);
          }
          
          if (!data?.user) {
            throw new Error('No user found');
          }
          
          // Check if user is confirmed
          if (!data.user.email_confirmed_at) {
            throw new Error('Email not confirmed. Please check your email for a confirmation link or contact support.');
          }
          
          // Return user data in the format NextAuth expects
          return {
            id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0],
            image: data.user.user_metadata?.avatar_url,
          };
        } catch (error) {
          console.error('Auth error:', error);
          throw error; // Re-throw to preserve the specific error message
        }
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'openid email profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.modify',
        },
      },
    }),
    AzureADProvider({
      clientId: process.env.MICROSOFT_CLIENT_ID!,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
      tenantId: process.env.MICROSOFT_TENANT_ID || 'common',
      authorization: {
        params: {
          scope: 'openid email profile offline_access Mail.Read Mail.ReadWrite Mail.Send Calendars.Read Contacts.Read',
        },
      },
    }),
    {
      id: 'supabase',
      name: 'Supabase',
      type: 'oauth',
      authorization: {
        url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/authorize`,
        params: { grant_type: 'authorization_code' },
      },
      token: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/token`,
      userinfo: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/user`,
      profile(profile) {
        return {
          id: profile.id,
          name: profile.user_metadata?.full_name || profile.email?.split('@')[0],
          email: profile.email,
          image: profile.user_metadata?.avatar_url,
        };
      },
    },
  ],
  callbacks: {
    // Merge of previously duplicated session callbacks to avoid silent override.
    // Preserves existing behavior by combining both sets of assignments.
    async session({ session, token }) {
      if (token) {
        // Ensure user object exists
        if (!session.user) {
          session.user = {
            id: (token as any).id || (token as any).sub!,
            name: (token as any).name,
            email: (token as any).email as string,
            image: ((token as any).picture as string) ?? null,
          };
        }

        // Apply core user fields
        session.user.id = (token as any).id || (token as any).sub!;
        if ((token as any).name !== undefined) session.user.name = (token as any).name as any;
        if ((token as any).email !== undefined) session.user.email = (token as any).email as any;
        if ((token as any).picture !== undefined) session.user.image = (token as any).picture as any;

        // Bring over OAuth/token context if present
        if ((token as any).accessToken) session.accessToken = (token as any).accessToken as string;
        if ((token as any).refreshToken) session.refreshToken = (token as any).refreshToken as string;
        if ((token as any).provider) session.provider = (token as any).provider as string;

        // Organization context will be loaded lazily by components that need it
        // Remove automatic organization loading from session
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Handle redirect after successful sign-in
      // Only log when redirecting to dashboard after sign-in
      if (url.includes('/signin') || url === baseUrl || url === `${baseUrl}/`) {
        // For sign-in success, always go to dashboard
        return `${baseUrl}/dashboard`;
      }
      
      // If url is relative, make it absolute with baseUrl
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      
      // If url is on the same origin, allow it
      if (new URL(url).origin === baseUrl) {
        return url;
      }
      
      // Default fallback
      return `${baseUrl}/dashboard`;
    },
    async jwt({ token, user, account, trigger }) {
      // If we have a user, set the ID in the token
      if (user) {
        token.id = user.id;
        // Remove all database queries - organization data will be loaded lazily
        console.log('✅ JWT: User authenticated:', user.id);
      }
      
      // Store OAuth tokens for Google and other providers
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
        token.provider = account.provider;
      }
      
      // Ensure token.sub exists as a fallback user ID
      if (!token.id && token.sub) {
        token.id = token.sub;
      }
      
      return token;
    },
  },
  pages: {
    signIn: '/signin',
    error: '/signin',
  },
  debug: false, // Disable debug for better performance
  logger: {
    error: console.error,
    warn: () => {}, // Disable warnings for performance
    debug: () => {}, // Disable debug for performance
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST, authOptions };
