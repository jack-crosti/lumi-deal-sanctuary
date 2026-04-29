import { PageHeader, PlaceholderPanel } from "@/components/AppShell";

export default function AdminRequests() {
  return (
    <>
      <PageHeader
        eyebrow="Inbox"
        title="Requests & questions"
        description="Buyer questions, document access requests, call requests and offer discussion submissions."
      />
      <PlaceholderPanel
        title="Inbox coming next"
        body="Triage incoming buyer activity and respond directly inside the deal room."
      />
    </>
  );
}