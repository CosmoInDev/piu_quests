import { createHmac } from "crypto";
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import KakaoProvider from "next-auth/providers/kakao";

function base64url(input: Buffer | string): string {
  const b64 = Buffer.isBuffer(input)
    ? input.toString("base64")
    : Buffer.from(input).toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function createBackendToken(provider: string, sub: string): string {
  const secret = process.env.NEXTAUTH_SECRET!;
  const nowSec = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64url(
    JSON.stringify({ provider, sub, iat: nowSec, exp: nowSec + 3600 })
  );
  const sig = base64url(
    createHmac("sha256", secret).update(`${header}.${payload}`).digest()
  );
  return `${header}.${payload}.${sig}`;
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    KakaoProvider({
      clientId: process.env.KAKAO_CLIENT_ID!,
      clientSecret: process.env.KAKAO_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        // New login — create backend token
        token.provider = account.provider;
        token.provider_account_id = account.providerAccountId;
        token.backend_token = createBackendToken(account.provider, account.providerAccountId);
        token.backend_token_expires_at = Math.floor(Date.now() / 1000) + 3600;
      }

      // Refresh backend token if it's expiring within 5 minutes
      const nowSec = Math.floor(Date.now() / 1000);
      if (
        token.provider &&
        token.provider_account_id &&
        token.backend_token_expires_at &&
        nowSec >= (token.backend_token_expires_at as number) - 300
      ) {
        token.backend_token = createBackendToken(
          token.provider as string,
          token.provider_account_id as string
        );
        token.backend_token_expires_at = nowSec + 3600;
      }

      return token;
    },
    async session({ session, token }) {
      session.backend_token = token.backend_token as string;
      session.provider = token.provider as string;
      return session;
    },
  },
};
