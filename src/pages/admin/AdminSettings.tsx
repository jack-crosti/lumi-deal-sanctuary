import { PageHeader, PlaceholderPanel } from "@/components/AppShell";

export default function AdminSettings() {
  return (
    <>
      <PageHeader
        eyebrow="Configuration"
        title="Settings"
        description="Organisation, brokers, branding and notification preferences."
      />
      <PlaceholderPanel
        title="Settings coming next"
        body="Manage broker accounts, default disclaimers, NDA templates and email notifications."
      />
    </>
  );
}