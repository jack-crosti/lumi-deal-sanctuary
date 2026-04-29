import { AppShell, type NavItem } from "@/components/AppShell";

const nav: NavItem[] = [
  { to: "/admin/dashboard", label: "Overview" },
  { to: "/admin/businesses", label: "Businesses" },
  { to: "/admin/buyers", label: "Buyers" },
  { to: "/admin/activity", label: "Activity" },
  { to: "/admin/requests", label: "Requests" },
  { to: "/admin/settings", label: "Settings" },
];

export default function AdminLayout() {
  return <AppShell area="Admin" nav={nav} />;
}