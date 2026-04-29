import { Link, useNavigate } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { Wordmark } from "@/components/brand/Wordmark";
import { useAuth } from "@/hooks/useAuth";

export default function Unauthorized() {
  const { role, session, signOut } = useAuth();
  const navigate = useNavigate();
  const homePath = role === "admin" ? "/admin/dashboard" : role === "buyer" ? "/buyer/dashboard" : "/";

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
            You don't have access to this area.
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed mb-8">
            This mandate has not been shared with your account. If you believe this is a mistake,
            contact your Lumi broker — every access attempt is logged.
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