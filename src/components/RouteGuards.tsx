import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth, type AppRole } from "@/hooks/useAuth";

function FullScreenLoader() {
  return (
    <div className="min-h-dvh grid place-items-center bg-background">
      <div className="font-mono-brand text-[10px] tracking-eyebrow uppercase text-muted-foreground">
        Verifying access…
      </div>
    </div>
  );
}

export function RequireAuth({
  children,
  role,
}: {
  children: ReactNode;
  role?: AppRole;
}) {
  const { session, role: userRole, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullScreenLoader />;
  if (!session) return <Navigate to="/login" state={{ from: location }} replace />;
  // If a specific role is required, enforce it. If the user has no role at
  // all yet (failed lookup or unassigned), send them to /unauthorized.
  if (role && userRole !== role) {
    return <Navigate to="/unauthorized" replace />;
  }
  if (!role && userRole === null) {
    return <Navigate to="/unauthorized" replace />;
  }
  return <>{children}</>;
}

export function RedirectIfAuthed({ children }: { children: ReactNode }) {
  const { session, role, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (session) return <Navigate to={role === "admin" ? "/admin/dashboard" : "/buyer/dashboard"} replace />;
  return <>{children}</>;
}