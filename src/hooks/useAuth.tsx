import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/lib/authRoles";
import { logActivity } from "@/lib/activity";

export type { AppRole };

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  role: AppRole | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function resolveRole(s: Session | null) {
      if (!s?.user) {
        setRole(null);
        return;
      }
      // Server-truth role lookup. Falls back to 'buyer' on any error so
      // we never grant admin without a verified user_roles row.
      const { data, error } = await supabase.rpc("current_user_role");
      if (error || !data) {
        setRole("buyer");
      } else {
        setRole(data === "admin" ? "admin" : "buyer");
      }
    }

    const { data: sub } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      // Defer role lookup so RLS sees the new auth context.
      setTimeout(() => {
        void resolveRole(newSession).finally(() => setLoading(false));
      }, 0);
      if (event === "SIGNED_IN" && newSession?.user) {
        // Defer so RLS sees the new auth context
        setTimeout(() => {
          void logActivity({ buyerId: newSession.user.id, event: "login" });
        }, 0);
      }
    });

    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      await resolveRole(data.session);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      role,
      loading,
      signOut: async () => {
        await supabase.auth.signOut();
      },
    }),
    [session, role, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}