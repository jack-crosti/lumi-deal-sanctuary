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
    <div className="min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b hairline bg-background/85 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-6 md:px-10 h-16 flex items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <Link to="/"><Wordmark className="text-base" /></Link>
            <span className="hidden md:inline-block h-4 w-px bg-hairline" />
            <span className="hidden md:inline-flex font-mono-brand text-[10px] tracking-eyebrow uppercase text-muted-foreground">
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
                  `px-4 py-2 rounded-sm text-[11px] tracking-eyebrow uppercase transition-colors ${
                    isActive
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <span className="hidden sm:inline font-mono-brand text-[10px] tracking-eyebrow uppercase text-muted-foreground truncate max-w-[180px]">
              {user?.email}
            </span>
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-2 rounded-sm border hairline px-3 py-2 text-[11px] tracking-eyebrow uppercase text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
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
                `px-3 py-1.5 rounded-sm text-[10px] tracking-eyebrow uppercase whitespace-nowrap ${
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

      <main className="mx-auto max-w-7xl px-6 md:px-10 py-10 md:py-14">
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
    <div className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6 pb-8 border-b hairline">
      <div>
        {eyebrow && (
          <div className="font-mono-brand text-[10px] tracking-eyebrow uppercase text-primary mb-3">
            {eyebrow}
          </div>
        )}
        <h1 className="font-display text-3xl md:text-4xl tracking-tight">{title}</h1>
        {description && (
          <p className="mt-3 text-sm text-muted-foreground max-w-xl leading-relaxed">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}

export function PlaceholderPanel({ title, body }: { title: string; body: string }) {
  return (
    <div className="border hairline rounded-sm bg-card p-10 text-center">
      <div className="font-mono-brand text-[10px] tracking-eyebrow uppercase text-muted-foreground mb-3">
        Coming next
      </div>
      <h3 className="font-display text-xl mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">{body}</p>
    </div>
  );
}