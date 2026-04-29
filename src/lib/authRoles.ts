export type AppRole = "admin" | "buyer";

export const ADMIN_EMAIL = "jack@lumi.nz";

export function normalizeEmail(email?: string | null) {
  return (email ?? "").trim().toLowerCase();
}

export function getRoleForEmail(email?: string | null): AppRole | null {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;
  return normalized === ADMIN_EMAIL ? "admin" : "buyer";
}

export function getDashboardPathForRole(role: AppRole | null) {
  return role === "admin" ? "/admin/dashboard" : "/buyer/dashboard";
}

export function getDashboardPathForEmail(email?: string | null) {
  return getDashboardPathForRole(getRoleForEmail(email));
}