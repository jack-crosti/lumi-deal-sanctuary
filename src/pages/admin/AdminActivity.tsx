import { PageHeader, PlaceholderPanel } from "@/components/AppShell";

export default function AdminActivity() {
  return (
    <>
      <PageHeader
        eyebrow="Audit trail"
        title="Activity"
        description="Every login, view, document open and download — across every buyer and every Information Memorandum."
      />
      <PlaceholderPanel
        title="Activity stream coming next"
        body="Filterable feed of buyer events, with intent scoring to highlight your most serious prospects."
      />
    </>
  );
}