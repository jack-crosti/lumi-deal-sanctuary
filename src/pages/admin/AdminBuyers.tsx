import { PageHeader, PlaceholderPanel } from "@/components/AppShell";

export default function AdminBuyers() {
  return (
    <>
      <PageHeader
        eyebrow="Approved channel"
        title="Buyers"
        description="Vetted buyers, their access levels per business and their engagement history."
      />
      <PlaceholderPanel
        title="Buyer manager coming next"
        body="Invite buyers, set per-business access levels (Teaser → Full DD), revoke access and view their intent score."
      />
    </>
  );
}