import { Link, NavLink, useNavigate, Outlet } from "react-router-dom";
import type { ReactNode } from "react";
import { LogOut } from "lucide-react";
import { Wordmark } from "@/components/brand/Wordmark";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface NavItem {
  to: string;
  label: string;
  end?: boolean;
}

interface AppShellProps {
  area: "Admin" | "Buyer";
  nav: NavItem[];
  children?: ReactNode;
}

export function AppShell({ area, nav, children }: AppShellProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out");
    navigate("/", { replace: true });
  };

  return (
    <div className="relative min-h-dvh bg-background text-foreground">
      {/* ambient washes */}
      <div className="fixed inset-0 bg-radiance pointer-events-none opacity-60" />
      <div className="fixed inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent pointer-events-none" />

      <header className="sticky top-0 z-30 border-b hairline bg-background/75 backdrop-blur-xl">
        <div className="mx-auto max-w-[1400px] px-6 md:px-12 h-20 flex items-center justify-between gap-8">
          <div className="flex items-center gap-8">
            <Link to="/" className="transition-opacity hover:opacity-80">
              <Wordmark className="text-base" />
            </Link>
            <span className="hidden md:inline-block h-5 w-px bg-hairline" />
            <span className="hidden md:inline-flex items-center gap-2 font-mono-brand text-[9px] tracking-eyebrow uppercase text-muted-foreground">
              <span className="size-1 rounded-full bg-primary animate-shimmer" />
              {area} Console
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `relative px-4 py-2.5 rounded-md text-[10px] tracking-eyebrow uppercase transition-all duration-300 ${
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {item.label}
                    {isActive && (
                      <span className="absolute inset-x-3 -bottom-px h-px bg-primary" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <span className="hidden sm:inline font-mono-brand text-[9px] tracking-eyebrow uppercase text-muted-foreground truncate max-w-[200px]">
              {user?.email}
            </span>
            <button
              onClick={handleSignOut}
              className="group inline-flex items-center gap-2 rounded-md border hairline px-3.5 py-2 text-[10px] tracking-eyebrow uppercase text-muted-foreground hover:text-primary hover:border-primary/40 transition-all duration-300"
            >
              <LogOut className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        <nav className="md:hidden flex items-center gap-1 px-4 pb-3 overflow-x-auto">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-md text-[9px] tracking-eyebrow uppercase whitespace-nowrap transition-colors ${
                  isActive
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="relative mx-auto max-w-[1400px] px-6 md:px-12 py-14 md:py-20 animate-fade-cinema">
        {children ?? <Outlet />}
      </main>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-16 flex flex-col md:flex-row md:items-end md:justify-between gap-8 pb-10 border-b hairline animate-rise">
      <div className="max-w-2xl">
        {eyebrow && (
          <div className="font-mono-brand text-[10px] tracking-eyebrow uppercase text-primary mb-5 flex items-center gap-3">
            <span className="h-px w-8 bg-primary" />
            {eyebrow}
          </div>
        )}
        <h1 className="font-display text-4xl md:text-5xl lg:text-6xl tracking-display leading-[1.0] text-balance">
          {title}
        </h1>
        {description && (
          <p className="mt-6 text-base text-muted-foreground max-w-xl leading-[1.8]">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
    </div>
  );
}

export function PlaceholderPanel({ title, body }: { title: string; body: string }) {
  return (
    <div className="relative lumi-card-elevated p-12 md:p-20 text-center overflow-hidden animate-rise delay-200">
      <div className="absolute inset-0 bg-radiance opacity-50 pointer-events-none" />
      {/* corner ticks */}
      <span className="absolute top-4 left-4 size-3 border-t border-l border-primary/40" />
      <span className="absolute top-4 right-4 size-3 border-t border-r border-primary/40" />
      <span className="absolute bottom-4 left-4 size-3 border-b border-l border-primary/40" />
      <span className="absolute bottom-4 right-4 size-3 border-b border-r border-primary/40" />

      <div className="relative">
        <div className="font-mono-brand text-[10px] tracking-eyebrow uppercase text-primary mb-5 inline-flex items-center gap-3">
          <span className="size-1 rounded-full bg-primary animate-shimmer" />
          Coming next
        </div>
        <h3 className="font-display text-3xl md:text-4xl tracking-display mb-4 text-balance">
          {title}
        </h3>
        <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto leading-[1.8]">
          {body}
        </p>
      </div>
    </div>
  );
}
