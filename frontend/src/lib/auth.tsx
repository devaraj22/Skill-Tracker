import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useEffect } from "react";
import type { ReactNode } from "react";
import { ApiError, api, setUnauthorizedHandler } from "@/lib/api";
import type { User } from "@/types";

interface AuthValue {
  user: User | null; loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (body: Record<string, unknown>) => Promise<User>;
  logout: () => Promise<void>;
}
const Ctx = createContext<AuthValue | null>(null);

function resetAuthCache(qc: ReturnType<typeof useQueryClient>, user: User | null) {
  qc.setQueryData(["me"], user);
  qc.removeQueries({ predicate: (query) => query.queryKey[0] !== "me" });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["me"], staleTime: 60_000, retry: false,
    queryFn: async () => { try { return await api.get<User>("/auth/me"); } catch (e) { if (e instanceof ApiError && (e.status === 401 || e.status === 403)) return null; throw e; } },
  });
  // A 401 from any API call means the session ended: drop cached data so protected routes redirect to login.
  useEffect(() => { setUnauthorizedHandler(() => resetAuthCache(qc, null)); return () => setUnauthorizedHandler(null); }, [qc]);

  const login = useCallback(async (email: string, password: string) => {
    const u = await api.post<User>("/auth/login", { email, password });
    resetAuthCache(qc, u); return u;
  }, [qc]);
  const register = useCallback(async (body: Record<string, unknown>) => {
    const u = await api.post<User>("/auth/register", body);
    resetAuthCache(qc, u); return u;
  }, [qc]);
  const logout = useCallback(async () => { try { await api.post("/auth/logout"); } finally { resetAuthCache(qc, null); } }, [qc]);

  return <Ctx.Provider value={{ user: q.data ?? null, loading: q.isLoading, login, register, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside AuthProvider");
  return v;
}
