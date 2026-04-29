import { AppShell, PageHeader, PlaceholderPanel, type NavItem } from "@/components/AppShell";
import { useAuth } from "@/hooks/useAuth";

const nav: NavItem[] = [
  { to: "/portal", label: "Opportunities", end: true },
  { to: "/portal/profile", label: "Profile" },
];

export default function BuyerDashboard() {
  const { user } = useAuth();
  return (
    <AppShell area="Buyer" nav={nav}>
      <PageHeader
        eyebrow="Private channel"
        title="Your assigned opportunities."
        description={`Signed in as ${user?.email}. Listings appear here once your Lumi broker grants access.`}
      />

      <PlaceholderPanel
        title="No opportunities assigned yet"
        body="When a broker shares a business with you, its hero image, key highlights and supporting documents will appear here. We will notify you as soon as something is ready to review."
      />
    </AppShell>
  );
}