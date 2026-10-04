import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Skeleton } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import type { Role } from "@/types";

/** Guards a route tree. The backend still enforces every permission; this only decides what to render. */
export function ProtectedRoute({ role }: { role: Role }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="p-8" aria-busy="true"><Skeleton className="h-8 w-48" /><span className="sr-only">Loading</span></div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (user.role !== role) return <Navigate to={user.role === "admin" ? "/admin" : "/"} replace />;
  return <Outlet />;
}
