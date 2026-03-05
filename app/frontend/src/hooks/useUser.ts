import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";

export interface BackendUser {
  id: number;
  google_id: string | null;
  kakao_id: string | null;
  name: string;
  created_at: string;
}

/**
 * Fetch current user from backend.
 * Returns null if user is not registered (404).
 */
export function useCurrentUser(enabled: boolean) {
  const [user, setUser] = useState<BackendUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<BackendUser>("/users/me");
      setUser(res.data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
      setChecked(true);
    }
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
