import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Check user in Supabase
          const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', credentials.email)
            .single();

          if (error || !user) {
            return null;
          }

          // Here you would verify the password
          // For now, we'll accept any password for existing users
          return {
            id: user.id,
            email: user.email,
            name: user.full_name || user.email.split('@')[0]
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        try {
          // Check if user exists in Supabase
          const { data: existingUser } = await supabase
            .from('users')
            .select('*')
            .eq('email', user.email)
            .single();

          if (!existingUser) {
            // Create new user
            const { error } = await supabase
              .from('users')
              .insert({
                email: user.email,
                full_name: user.name,
                google_id: account.providerAccountId,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });

            if (error) {
              console.error('Error creating user:', error);
              return false;
            }
          } else {
            // Update existing user
            const { error } = await supabase
              .from('users')
              .update({
                google_id: account.providerAccountId,
                full_name: user.name,
                last_login: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('email', user.email);

            if (error) {
              console.error('Error updating user:', error);
            }
          }
        } catch (error) {
          console.error('Sign in error:', error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
      }
      return session;
    }
  },
  pages: {
    signIn: '/sign-in',
  },
  session: {
    strategy: 'jwt',
  },
});

export { handler as GET, handler as POST };
