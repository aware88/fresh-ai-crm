import { NextAuthOptions } from 'next-auth';
import { SupabaseAdapter } from '@auth/supabase-adapter';
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { supabase } from '@/lib/supabaseClient';

const authOptions: NextAuthOptions = {
  adapter: SupabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  }),
  session: {
    strategy: 'jwt',
    maxAge: 60 * 24 * 60 * 60, // 60 days for longer persistence
    updateAge: 12 * 60 * 60, // 12 hours for more frequent refreshes
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        // In development, don't set domain to allow cookies to work with both localhost and 127.0.0.1
        domain: process.env.NODE_ENV === 'production' ? process.env.NEXTAUTH_URL?.replace(/https?:\/\//, '') : undefined,
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
            throw new Error(error.message);
          }
          
          if (!data?.user) {
            throw new Error('No user found');
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
          throw new Error('Authentication failed');
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
      console.log('NextAuth session callback - token:', token ? 'present' : 'missing');
      console.log('NextAuth session callback - session:', session ? 'present' : 'missing');
      
      if (token && session.user) {
        // Use token.id (set in jwt callback) if available, otherwise fall back to token.sub
        session.user.id = token.id || token.sub!;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.image = token.picture;
        
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
        
        // Add additional debug logging
        console.log('Session user ID set to:', session.user.id);
      } else if (token && !session.user) {
        // Create user object if it doesn't exist but token does
        session.user = {
          id: token.id || token.sub!,
          name: token.name,
          email: token.email as string,
          image: token.picture as string | null
        };
        console.log('Created missing session user with ID:', session.user.id);
      }
      return session;
    },
    async jwt({ token, user, account }) {
      console.log('NextAuth JWT callback - token:', token ? 'present' : 'missing');
      console.log('NextAuth JWT callback - user:', user ? 'present' : 'missing');
      console.log('NextAuth JWT callback - account:', account ? 'present' : 'missing');
      
      // If we have a user, set the ID in the token
      if (user) {
        token.id = user.id;
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
    }
  },
  pages: {
    signIn: '/signin',
    error: '/signin',
  },
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST, authOptions };
