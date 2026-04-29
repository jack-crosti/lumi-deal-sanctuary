export type AppRole = "admin" | "buyer";

export function normalizeEmail(email?: string | null) {
  return (email ?? "").trim().toLowerCase();
}

export function getDashboardPathForRole(role: AppRole | null) {
  return role === "admin" ? "/admin/dashboard" : "/buyer/dashboard";
}