import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.id_token = account.id_token;
        token.id_token_expires_at = account.expires_at ?? 0;
      }
      return token;
    },
    async session({ session, token }) {
      session.id_token = token.id_token as string;
      session.id_token_expires_at = token.id_token_expires_at as number;
      return session;
    },
  },
};
