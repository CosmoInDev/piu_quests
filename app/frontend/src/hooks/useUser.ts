import { useCallback, useEffect, useState } from "react";
import { AxiosError } from "axios";
import api from "@/lib/api";

export interface BackendUser {
  id: number;
  google_id: string | null;
  kakao_id: string | null;
  name: string;
  created_at: string;
}

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

/**
 * Fetch current user from backend.
 * - 200: user found
 * - 404: user not registered → show registration modal
 * - other errors: transient (cold start, network) → retry up to MAX_RETRIES times
 *   to avoid falsely showing the registration modal on backend startup delay.
 */
export function useCurrentUser(enabled: boolean) {
  const [user, setUser] = useState<BackendUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);

  const refetch = useCallback(async () => {
    setLoading(true);
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const res = await api.get<BackendUser>("/users/me");
        setUser(res.data);
        setChecked(true);
        setLoading(false);
        return;
      } catch (err) {
        const httpStatus = (err as AxiosError)?.response?.status;
        if (httpStatus === 404) {
          // Definitively not registered
          setUser(null);
          setChecked(true);
          setLoading(false);
          return;
        }
        // Transient error (5xx, network timeout, cold start): wait and retry
        if (attempt < MAX_RETRIES) {
          await new Promise<void>((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
        }
      }
    }
    // All retries exhausted without a definitive answer: stay in loading state
    setLoading(false);
  }, []);

  useEffect(() => {
    if (enabled) {
      refetch();
    } else {
      setUser(null);
      setChecked(false);
    }
  }, [enabled, refetch]);

  return { user, loading, checked, refetch };
}

export async function registerUser(name: string): Promise<BackendUser> {
  const res = await api.post<BackendUser>("/users/register", { name });
  return res.data;
}

export async function updateUserName(name: string): Promise<BackendUser> {
  const res = await api.patch<BackendUser>("/users/me", { name });
  return res.data;
}

export async function deleteAccount(): Promise<void> {
  await api.delete("/users/me");
}
