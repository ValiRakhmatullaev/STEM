import { createContext, useCallback, useEffect, useState } from "react";
import { apiFetch } from "../api";

export type User = {
  id: string;
  username: string;
  email: string;
  role?: string;
  display_name?: string;
  initials?: string;
  avatar?: string | null;
  profile_complete?: boolean;
  is_staff?: boolean;
  is_presence_checker?: boolean;
  is_verified?: boolean;
  is_company_user?: boolean;
};

export type AuthContextValue = {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    try {
      const res = await apiFetch("/api/auth/me/");
      if (res.ok) {
        const data = await res.json();
        setUserState(data.user ?? null);
      } else {
        setUserState(null);
      }
    } catch {
      setUserState(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const setUser = useCallback((u: User | null) => {
    setUserState(u);
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiFetch("/api/auth/logout/", { method: "POST" });
    } finally {
      setUserState(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
