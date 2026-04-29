import { Link } from "react-router-dom";
import { ShieldCheck, ChevronRight } from "lucide-react";
import { PageHeader, PlaceholderPanel } from "@/components/AppShell";

export default function AdminSettings() {
  return (
    <>
      <PageHeader
        eyebrow="Configuration"
        title="Settings"
        description="Organisation, brokers, branding and notification preferences."
      />
      <Link
        to="/admin/settings/security"
        className="lumi-card p-5 mb-6 flex items-center gap-4 hover:bg-foreground/[0.02] transition-colors"
      >
        <div className="h-10 w-10 rounded-full grid place-items-center bg-emerald-500/10 text-emerald-500">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="font-mono-brand text-[10px] tracking-eyebrow uppercase text-muted-foreground">
            Security
          </p>
          <p className="text-[14px] text-foreground mt-0.5">Security checklist</p>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            Audit auth, RLS, storage privacy, document policies, buyer access and edge-function keys.
          </p>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      </Link>
      <PlaceholderPanel
        title="Settings coming next"
        body="Manage broker accounts, default disclaimers, NDA templates and email notifications."
      />
    </>
  );
}