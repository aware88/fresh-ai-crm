import { NextAuthOptions } from 'next-auth';
import { SupabaseAdapter } from '@auth/supabase-adapter';
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
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
    maxAge: 30 * 24 * 60 * 60, // 30 days - reasonable persistence
    updateAge: 24 * 60 * 60, // 24 hours - reduce frequency of session updates
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
    async session({ session, token }) {
      if (token && session.user) {
        // Use token.id (set in jwt callback) if available, otherwise fall back to token.sub
        session.user.id = token.id || token.sub!;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.image = token.picture;
        
        // Add current organization ID for theme validation
        session.currentOrganizationId = token.currentOrganizationId;
        
        // Add OAuth tokens to session for API calls
        if (token.accessToken) {
          session.accessToken = token.accessToken as string;
        }
        if (token.refreshToken) {
          session.refreshToken = token.refreshToken as string;
        }
        if (token.provider) {
          session.provider = token.provider as string;
        }
      } else if (token && !session.user) {
        // Create user object if it doesn't exist but token does
        session.user = {
          id: token.id || token.sub!,
          name: token.name,
          email: token.email as string,
          image: token.picture as string | null
        };
        // Add current organization ID for theme validation
        session.currentOrganizationId = token.currentOrganizationId;
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
        
        // Fetch user preferences and organization branding for immediate theme application
        try {
          console.log('🎨 JWT: Fetching user preferences for theme preloading:', user.id);
          const { data: preferences, error } = await supabase
            .from('user_preferences')
            .select('current_organization_id, theme')
            .eq('user_id', user.id)
            .single();
          
          if (!error && preferences && preferences.current_organization_id) {
            // Store organization ID in token
            token.currentOrganizationId = preferences.current_organization_id;
            console.log('🎨 JWT: Found user organization:', preferences.current_organization_id);
            
            // Fetch organization branding for immediate theme application
            try {
              const { data: orgData } = await supabase
                .from('organizations')
                .select('name, slug')
                .eq('id', preferences.current_organization_id)
                .single();
              
              if (orgData) {
                // Try to load branding from file system first
                let brandingData = null;
                try {
                  const { promises: fs } = require('fs');
                  const path = require('path');
                  
                  const brandingDir = path.join(process.cwd(), 'data', 'branding');
                  const brandingFile = path.join(brandingDir, `${preferences.current_organization_id}.json`);
                  
                  const brandingFileData = await fs.readFile(brandingFile, 'utf8');
                  brandingData = JSON.parse(brandingFileData);
                  console.log('🎨 JWT: Loaded branding from file for', orgData.name);
                } catch (fileError) {
                  console.log('🎨 JWT: No branding file found, using org data only');
                }
                
                // Store comprehensive branding info in token
                token.organizationBranding = {
                  name: orgData.name,
                  slug: orgData.slug,
                  logo_url: brandingData?.logo_url && brandingData.logo_url.trim() !== '' ? brandingData.logo_url : null,
                  organization_name: brandingData?.organization_name || orgData.name,
                  primary_color: brandingData?.primary_color || null,
                  secondary_color: brandingData?.secondary_color || null
                };
                console.log('🎨 JWT: Loaded organization branding for', orgData.name, 'with logo:', !!brandingData?.logo_url);
              }
            } catch (brandingError) {
              console.warn('🎨 JWT: Failed to fetch organization branding:', brandingError);
            }
          } else {
            console.log('🎨 JWT: No user preferences found, user is independent');
            token.currentOrganizationId = null;
          }
        } catch (error) {
          console.warn('🎨 JWT: Failed to fetch user preferences:', error);
          token.currentOrganizationId = null;
        }
        
        // 🚨 EMERGENCY DISABLE: Skip organization setup to fix sign-in
        console.log('🚨 Skipping organization setup call to fix sign-in');
        token.organizationSetup = true; // Always mark as complete
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
    async session({ session, token }) {
      // Ensure session.user.id is set from token
      if (token?.id) {
        session.user.id = token.id;
      }
      
      // Pass branding data to session for immediate availability
      if (token?.organizationBranding) {
        session.organizationBranding = token.organizationBranding;
      }
      
      // Pass organization ID to session
      if (token?.currentOrganizationId) {
        session.currentOrganizationId = token.currentOrganizationId;
      }
      
      // Add organization info to session if available
      if (token?.currentOrganizationId) {
        session.currentOrganizationId = token.currentOrganizationId;
      }
      
      // Add organization branding to session for immediate theme application
      if (token?.organizationBranding) {
        session.organizationBranding = token.organizationBranding;
      }
      
      // Add organization setup status to session
      session.organizationSetup = token.organizationSetup || false;
      
      return session;
    },
  },
  pages: {
    signIn: '/signin',
    error: '/signin',
  },
  debug: process.env.NODE_ENV === 'development', // Enable debug in development
  logger: process.env.NODE_ENV === 'production' ? {
    error: console.error,
    warn: console.warn,
    debug: () => {}, // Only disable debug in production
  } : undefined,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST, authOptions };
