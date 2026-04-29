import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { PageHeader, PlaceholderPanel } from "@/components/AppShell";

export default function AdminBusinesses() {
  return (
    <>
      <PageHeader
        eyebrow="Mandates"
        title="Businesses"
        description="Every active, draft and archived listing under your custody."
        actions={
          <Link
            to="/admin/businesses/new"
            className="inline-flex items-center gap-2 rounded-sm bg-primary px-5 py-3 text-[11px] tracking-eyebrow uppercase text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            New listing
          </Link>
        }
      />
      <PlaceholderPanel
        title="No businesses yet"
        body="When you create your first listing it will appear here with status, assigned buyers and recent activity."
      />
    </>
  );
}