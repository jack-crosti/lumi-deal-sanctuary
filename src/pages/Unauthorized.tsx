import { Link, useNavigate } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { Wordmark } from "@/components/brand/Wordmark";
import { useAuth } from "@/hooks/useAuth";
import { getDashboardPathForRole } from "@/lib/authRoles";

export default function Unauthorized() {
  const { role, session, user, signOut } = useAuth();
  const navigate = useNavigate();
  const homePath = getDashboardPathForRole(role);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-dvh bg-background text-foreground relative overflow-hidden grid place-items-center">
      <div className="absolute inset-0 bg-radiance pointer-events-none" />
      <div className="relative z-10 w-full max-w-lg px-6">
        <div className="text-center mb-10">
          <Wordmark className="text-base justify-center inline-flex" />
        </div>
        <div className="border hairline bg-card/70 backdrop-blur-md p-10 shadow-vault text-center">
          <ShieldAlert className="h-6 w-6 text-primary mx-auto mb-6" strokeWidth={1.5} />
          <div className="font-mono-brand text-[10px] tracking-eyebrow uppercase text-primary mb-3">
            Restricted
          </div>
          <h1 className="font-display text-3xl tracking-tight mb-4">
            This account belongs in another area.
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed mb-8">
            You are signed in as {user?.email ?? "this account"}. Admin access is reserved for
            jack@lumi.nz; other accounts open the Buyer private channel.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to={homePath}
              className="inline-flex items-center gap-3 rounded-sm bg-primary px-6 py-3 text-[11px] tracking-eyebrow uppercase text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Back to your deal room
            </Link>
            {session && (
              <button
                onClick={handleSignOut}
                className="inline-flex items-center gap-3 rounded-sm border hairline px-6 py-3 text-[11px] tracking-eyebrow uppercase text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign out & try another account
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}