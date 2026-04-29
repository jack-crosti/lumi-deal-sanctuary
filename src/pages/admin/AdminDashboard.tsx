import { Link } from "react-router-dom";
import { ArrowUpRight, Plus, Users, Activity, Building2, MessageSquare } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { useAuth } from "@/hooks/useAuth";
import HotBuyers from "@/components/admin/HotBuyers";
import ActivityFeed from "@/components/admin/ActivityFeed";

const stats = [
  { k: "Active Information Memorandums", v: "0", hint: "Published listings" },
  { k: "Approved buyers", v: "0", hint: "Verified accounts" },
  { k: "Pending requests", v: "0", hint: "Awaiting reply" },
  { k: "This week", v: "0", hint: "New activity events" },
];

const quickActions = [
  { to: "/admin/businesses/new", icon: Plus, label: "Create new Information Memorandum", body: "Add a business and configure its confidentiality level." },
  { to: "/admin/buyers", icon: Users, label: "Invite a buyer", body: "Vet and grant access to a new approved buyer." },
  { to: "/admin/requests", icon: MessageSquare, label: "Review inbox", body: "Triage buyer questions and discussion requests." },
  { to: "/admin/activity", icon: Activity, label: "Inspect activity", body: "See who's reading what, and how often." },
];

export default function AdminDashboard() {
  const { user } = useAuth();
  const name = user?.email?.split("@")[0] ?? "broker";
  return (
    <>
      <PageHeader
        eyebrow="Broker console"
        title={`Welcome back, ${name}.`}
        description="Curate the deal room. Approve buyers, manage listings, and monitor every interaction across active Information Memorandums."
        actions={
          <Link to="/admin/businesses/new" className="lumi-btn-primary group">
            <Plus className="h-3.5 w-3.5" />
            New Information Memorandum
          </Link>
        }
      />

      {/* Stat band */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-hairline border hairline rounded-lg overflow-hidden mb-16 animate-rise delay-100">
        {stats.map((s) => (
          <div key={s.k} className="bg-card-gradient p-8 md:p-10 group hover:bg-card-elevated transition-colors duration-500">
            <div className="lumi-stat text-5xl md:text-6xl text-foreground/95 group-hover:text-primary transition-colors duration-700">
              {s.v}
            </div>
            <div className="mt-5 flex items-center justify-between">
              <div className="font-mono-brand text-[9px] tracking-eyebrow uppercase text-foreground/80">
                {s.k}
              </div>
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">{s.hint}</div>
          </div>
        ))}
      </section>

      {/* Quick actions grid */}
      <section className="mb-16">
        <div className="flex items-baseline justify-between mb-8 animate-rise delay-200">
          <h2 className="font-display text-2xl md:text-3xl tracking-display">Quick actions</h2>
          <span className="font-mono-brand text-[9px] tracking-eyebrow uppercase text-muted-foreground">
            Most common
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quickActions.map((a, i) => (
            <Link
              key={a.to}
              to={a.to}
              className="group lumi-card p-8 md:p-10 transition-all duration-500 hover:border-primary/40 hover:translate-y-[-2px] animate-rise"
              style={{ animationDelay: `${300 + i * 80}ms` }}
            >
              <div className="flex items-start justify-between mb-8">
                <a.icon className="h-5 w-5 text-primary" strokeWidth={1.25} />
                <ArrowUpRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary group-hover:rotate-45 transition-all duration-500" />
              </div>
              <div className="font-display text-xl md:text-2xl tracking-display mb-2">
                {a.label}
              </div>
              <div className="text-sm text-muted-foreground leading-[1.7]">
                {a.body}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Empty Information Memorandums panel */}
      <section className="animate-rise delay-500">
        <div className="flex items-baseline justify-between mb-8">
          <h2 className="font-display text-2xl md:text-3xl tracking-display">Active Information Memorandums</h2>
          <Link to="/admin/businesses" className="font-mono-brand text-[9px] tracking-eyebrow uppercase text-muted-foreground hover:text-primary transition-colors lumi-link">
            View all
          </Link>
        </div>
        <div className="relative lumi-card-elevated p-16 text-center overflow-hidden">
          <div className="absolute inset-0 bg-radiance opacity-40 pointer-events-none" />
          <div className="relative">
            <Building2 className="h-6 w-6 text-primary mx-auto mb-6" strokeWidth={1.25} />
            <div className="font-mono-brand text-[10px] tracking-eyebrow uppercase text-primary mb-4">
              No Information Memorandums yet
            </div>
            <h3 className="font-display text-2xl md:text-3xl tracking-display mb-3">
              Begin with your first listing.
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto leading-[1.8] mb-8">
              Create a business, set its confidentiality mode, and assign approved buyers. Listings stay in draft until you publish.
            </p>
            <Link to="/admin/businesses/new" className="lumi-btn-primary">
              Create first Information Memorandum
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Hot buyers */}
      <section className="animate-rise mt-16">
        <div className="flex items-baseline justify-between mb-8">
          <h2 className="font-display text-2xl md:text-3xl tracking-display">Hot buyers</h2>
          <Link to="/admin/buyers" className="font-mono-brand text-[9px] tracking-eyebrow uppercase text-muted-foreground hover:text-primary transition-colors lumi-link">
            View all buyers
          </Link>
        </div>
        <HotBuyers />
      </section>

      {/* Recent activity */}
      <section className="animate-rise mt-16">
        <div className="flex items-baseline justify-between mb-8">
          <h2 className="font-display text-2xl md:text-3xl tracking-display">Recent activity</h2>
          <Link to="/admin/activity" className="font-mono-brand text-[9px] tracking-eyebrow uppercase text-muted-foreground hover:text-primary transition-colors lumi-link">
            View full feed
          </Link>
        </div>
        <ActivityFeed limit={12} />
      </section>
    </>
  );
}
