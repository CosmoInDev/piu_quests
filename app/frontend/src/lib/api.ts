import axios from "axios";
import { getSession } from "next-auth/react";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
});

api.interceptors.request.use(async (config) => {
  const session = await getSession();
  if (session?.backend_token) {
    config.headers.Authorization = `Bearer ${session.backend_token}`;
  }
  return config;
});

export default api;
