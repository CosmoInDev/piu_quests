import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    id_token: string;
    id_token_expires_at: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id_token?: string;
    id_token_expires_at?: number;
  }
}
