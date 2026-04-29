import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Wordmark } from "@/components/brand/Wordmark";
import { toast } from "sonner";

type Mode = "signin" | "signup";

export default function Auth() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back.");
        // RedirectIfAuthed on / and /login will route to the correct console.
        navigate("/", { replace: true });
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        toast.success("Account created. You may now sign in.");
        setMode("signin");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-dvh bg-background text-foreground relative overflow-hidden">
      <div className="absolute inset-0 bg-radiance pointer-events-none" />
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse at 50% 0%, black, transparent 70%)",
        }}
      />

      <header className="relative z-10 mx-auto max-w-7xl px-6 md:px-12 h-16 flex items-center justify-between">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-[11px] tracking-eyebrow uppercase">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </Link>
        <Wordmark className="text-base" />
        <div className="w-12" />
      </header>

      <main className="relative z-10 mx-auto max-w-md px-6 pt-12 pb-24">
        <div className="text-center mb-10">
          <div className="font-mono-brand text-[10px] tracking-eyebrow uppercase text-primary mb-4">
            Restricted Access
          </div>
          <h1 className="font-display text-4xl md:text-5xl tracking-tight">
            {mode === "signin" ? "Enter the deal room." : "Create your access."}
          </h1>
          <p className="mt-4 text-sm text-muted-foreground">
            {mode === "signin"
              ? "Use the credentials issued by your Lumi broker."
              : "New buyers are reviewed by a broker before listings appear."}
          </p>
        </div>

        <div className="relative border hairline bg-card/70 backdrop-blur-md p-8 md:p-10 shadow-vault">
          <span className="absolute top-0 left-0 size-3 border-t border-l border-primary/50" />
          <span className="absolute top-0 right-0 size-3 border-t border-r border-primary/50" />
          <span className="absolute bottom-0 left-0 size-3 border-b border-l border-primary/50" />
          <span className="absolute bottom-0 right-0 size-3 border-b border-r border-primary/50" />

          <form onSubmit={onSubmit} className="space-y-6">
            {mode === "signup" && (
              <Field label="Full name">
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="lumi-input"
                  placeholder="Your full name"
                />
              </Field>
            )}
            <Field label="Email">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="lumi-input"
                placeholder="you@company.co.nz"
                autoComplete="email"
              />
            </Field>
            <Field label="Access key">
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="lumi-input"
                placeholder="••••••••••"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
              />
            </Field>

            <button
              type="submit"
              disabled={busy}
              className="w-full inline-flex items-center justify-center gap-3 rounded-sm bg-primary px-6 py-4 text-[11px] tracking-eyebrow uppercase text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {mode === "signin" ? "Initialise session" : "Request access"}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t hairline flex items-center justify-between font-mono-brand text-[10px] tracking-eyebrow uppercase text-muted-foreground">
            <button
              type="button"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="hover:text-primary transition-colors"
            >
              {mode === "signin" ? "New here? Apply" : "Have access? Sign in"}
            </button>
            <span>AES-256 · Audited</span>
          </div>
        </div>

        <p className="mt-6 text-center text-[11px] text-muted-foreground leading-relaxed">
          Unauthorised access attempts are logged and reported to the broker.
        </p>
      </main>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="font-mono-brand text-[10px] tracking-eyebrow uppercase text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}