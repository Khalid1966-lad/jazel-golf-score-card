import { db } from '@/lib/db';
import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      handicap?: number | null;
    };
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (user.email) {
        // Create or update user in database
        const existingUser = await db.user.findUnique({
          where: { email: user.email },
        });
        
        if (!existingUser) {
          await db.user.create({
            data: {
              email: user.email,
              name: user.name || null,
              avatar: user.image || null,
            },
          });
        }
      }
      return true;
    },
    async session({ session }) {
      if (session.user?.email) {
        const dbUser = await db.user.findUnique({
          where: { email: session.user.email },
        });
        
        if (dbUser) {
          session.user.id = dbUser.id;
          session.user.handicap = dbUser.handicap;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: '/',
    error: '/',
  },
  secret: process.env.NEXTAUTH_SECRET || 'jazel-golf-secret-key-2024',
};
