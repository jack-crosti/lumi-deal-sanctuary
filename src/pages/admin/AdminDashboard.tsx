import { AppShell, PageHeader, PlaceholderPanel, type NavItem } from "@/components/AppShell";
import { useAuth } from "@/hooks/useAuth";

const nav: NavItem[] = [
  { to: "/admin", label: "Overview", end: true },
  { to: "/admin/businesses", label: "Businesses" },
  { to: "/admin/buyers", label: "Buyers" },
  { to: "/admin/activity", label: "Activity" },
  { to: "/admin/requests", label: "Requests" },
];

export default function AdminDashboard() {
  const { user } = useAuth();
  return (
    <AppShell area="Admin" nav={nav}>
      <PageHeader
        eyebrow="Broker console"
        title={`Welcome, ${user?.email?.split("@")[0] ?? "broker"}.`}
        description="Curate the deal room. Approve buyers, manage listings, and monitor every interaction across active mandates."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-hairline border hairline mb-12">
        {[
          { k: "Active mandates", v: "0" },
          { k: "Approved buyers", v: "0" },
          { k: "Pending requests", v: "0" },
        ].map((s) => (
          <div key={s.k} className="bg-card p-8">
            <div className="font-display text-4xl tabular-nums">{s.v}</div>
            <div className="mt-2 font-mono-brand text-[10px] tracking-eyebrow uppercase text-muted-foreground">
              {s.k}
            </div>
          </div>
        ))}
      </div>

      <PlaceholderPanel
        title="Business manager arrives next"
        body="Create your first listing, configure confidentiality (Blind, Suburb, Exact), and assign approved buyers — coming in the next stage."
      />
    </AppShell>
  );
}