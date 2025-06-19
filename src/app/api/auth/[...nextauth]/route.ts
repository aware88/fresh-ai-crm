import { NextAuthOptions } from 'next-auth';
import { SupabaseAdapter } from '@auth/supabase-adapter';
import NextAuth from 'next-auth';

const authOptions: NextAuthOptions = {
  adapter: SupabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  }),
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.NODE_ENV === 'production' ? process.env.NEXTAUTH_URL?.replace(/https?:\/\//, '') : undefined,
      },
    },
  },
  providers: [
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
        session.user.id = token.sub!;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.image = token.picture;
      }
      return session;
    },
    async jwt({ token, user, account }) {
      console.log('NextAuth JWT callback - token:', token ? 'present' : 'missing');
      console.log('NextAuth JWT callback - user:', user ? 'present' : 'missing');
      console.log('NextAuth JWT callback - account:', account ? 'present' : 'missing');
      
      if (account && user) {
        token.id = user.id;
      }
      return token;
    },
  },
  pages: {
    signIn: '/signin',
    error: '/signin',
  },
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST, authOptions };
