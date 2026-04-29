import { AppShell, type NavItem } from "@/components/AppShell";

const nav: NavItem[] = [
  { to: "/buyer/dashboard", label: "Opportunities" },
  { to: "/buyer/profile", label: "Profile" },
];

export default function BuyerLayout() {
  return <AppShell area="Buyer" nav={nav} roleAccent="buyer" />;
}