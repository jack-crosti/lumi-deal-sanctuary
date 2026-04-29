import { PageHeader, PlaceholderPanel } from "@/components/AppShell";
import { useAuth } from "@/hooks/useAuth";

export default function BuyerProfile() {
  const { user } = useAuth();
  return (
    <>
      <PageHeader
        eyebrow="Your details"
        title="Profile"
        description={`Signed in as ${user?.email}.`}
      />
      <PlaceholderPanel
        title="Profile editor coming next"
        body="Update your full name, company, phone and notification preferences. Your broker uses this to verify your identity."
      />
    </>
  );
}