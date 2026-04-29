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
  if (!session) return <Navigate to="/auth" state={{ from: location }} replace />;
  if (role && userRole !== role) {
    // Send to their own area instead of bouncing to /auth
    return <Navigate to={userRole === "admin" ? "/admin" : "/portal"} replace />;
  }
  return <>{children}</>;
}

export function RedirectIfAuthed({ children }: { children: ReactNode }) {
  const { session, role, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (session) return <Navigate to={role === "admin" ? "/admin" : "/portal"} replace />;
  return <>{children}</>;
}