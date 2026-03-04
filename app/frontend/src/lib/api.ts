import axios from "axios";
import { getSession } from "next-auth/react";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
});

api.interceptors.request.use(async (config) => {
  const session = await getSession();
  if (session?.id_token) {
    const nowSec = Math.floor(Date.now() / 1000);
    if (session.id_token_expires_at && nowSec >= session.id_token_expires_at) {
      const { signIn } = await import("next-auth/react");
      await signIn("google", { callbackUrl: window.location.href });
      return Promise.reject(new Error("id_token expired — re-authenticating"));
    }
    config.headers.Authorization = `Bearer ${session.id_token}`;
  }
  return config;
});

export default api;
