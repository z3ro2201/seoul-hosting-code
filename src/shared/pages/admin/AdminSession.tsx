import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router";

export type AdminIdentity = { user_id: string; email: string | null; role: "super_admin" | "school_admin"; school_id: string | null };
type AdminContextValue = { admin: AdminIdentity | null; loading: boolean; reload: () => Promise<void>; logout: () => Promise<void> };
const AdminContext = createContext<AdminContextValue | undefined>(undefined);
export function AdminProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminIdentity | null>(null);
  const [loading, setLoading] = useState(true);
  const reload = useCallback(async () => {
    try {
      const result = await fetch("/api/admin/me", { credentials: "same-origin", cache: "no-store" });
      if (!result.ok) { setAdmin(null); return; }
      const body = await result.json();
      setAdmin(body.admin as AdminIdentity);
    } catch { setAdmin(null); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void reload(); }, [reload]);
  const logout = useCallback(async () => {
    try { await fetch("/api/admin/logout", { method: "POST", credentials: "same-origin" }); }
    finally { setAdmin(null); }
  }, []);
  return <AdminContext.Provider value={{ admin, loading, reload, logout }}>{children}</AdminContext.Provider>;
}
export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) throw new Error("AdminProvider is missing");
  return context;
}
export function RequireAdmin({ children, superOnly = false }: { children: ReactNode; superOnly?: boolean }) {
  const { admin, loading } = useAdmin();
  const location = useLocation();
  if (loading) return <p role="status">관리자 인증 확인 중…</p>;
  if (!admin) return <Navigate to="/school/admin/login" state={{ from: location.pathname }} replace />;
  if (superOnly && admin.role !== "super_admin") return <p role="alert">최고관리자만 접근할 수 있습니다.</p>;
  return <>{children}</>;
}
