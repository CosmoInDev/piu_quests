import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    backend_token: string;
    provider: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    provider?: string;
    provider_account_id?: string;
    backend_token?: string;
    backend_token_expires_at?: number;
  }
}
