import type { Database } from "@/integrations/supabase/types";

export type BuyerStatus = Database["public"]["Enums"]["buyer_status"];
export type CaStatus = Database["public"]["Enums"]["ca_status"];
export type BuyerType = Database["public"]["Enums"]["buyer_type"];
export type FinanceStatus = Database["public"]["Enums"]["finance_status"];
export type OwnerIntent = Database["public"]["Enums"]["owner_intent"];
export type AccessLevel = Database["public"]["Enums"]["access_level"];

export const BUYER_STATUS_OPTIONS: { value: BuyerStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "active", label: "Active" },
  { value: "warm", label: "Warm" },
  { value: "hot", label: "Hot" },
  { value: "not_suitable", label: "Not Suitable" },
  { value: "archived", label: "Archived" },
];

export const CA_STATUS_OPTIONS: { value: CaStatus; label: string }[] = [
  { value: "not_sent", label: "Not Sent" },
  { value: "sent", label: "Sent" },
  { value: "signed", label: "Signed" },
  { value: "approved", label: "Approved" },
];

export const BUYER_TYPE_OPTIONS: { value: BuyerType; label: string }[] = [
  { value: "individual", label: "Individual" },
  { value: "company", label: "Company" },
  { value: "investor", label: "Investor" },
  { value: "family_office", label: "Family Office" },
  { value: "other", label: "Other" },
];

export const FINANCE_STATUS_OPTIONS: { value: FinanceStatus; label: string }[] = [
  { value: "unknown", label: "Unknown" },
  { value: "self_funded", label: "Self funded" },
  { value: "pre_approved", label: "Pre-approved" },
  { value: "needs_finance", label: "Needs finance" },
  { value: "not_disclosed", label: "Not disclosed" },
];

export const OWNER_INTENT_OPTIONS: { value: OwnerIntent; label: string }[] = [
  { value: "working_owner", label: "Working owner" },
  { value: "investor", label: "Investor" },
  { value: "either", label: "Either" },
];

export const ACCESS_LEVEL_OPTIONS: { value: AccessLevel; label: string; rank: number }[] = [
  { value: "teaser", label: "Teaser", rank: 1 },
  { value: "im", label: "IM", rank: 2 },
  { value: "financial", label: "Financial", rank: 3 },
  { value: "serious", label: "Serious Buyer", rank: 4 },
  { value: "full_dd", label: "Full DD", rank: 5 },
];

export function buyerStatusLabel(s: BuyerStatus | null | undefined) {
  return BUYER_STATUS_OPTIONS.find((o) => o.value === s)?.label ?? "—";
}
export function caStatusLabel(s: CaStatus | null | undefined) {
  return CA_STATUS_OPTIONS.find((o) => o.value === s)?.label ?? "—";
}
export function accessLevelLabel(s: AccessLevel | null | undefined) {
  return ACCESS_LEVEL_OPTIONS.find((o) => o.value === s)?.label ?? "—";
}

export function buyerDisplayName(p: {
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  email?: string | null;
}) {
  const composed = [p.first_name, p.last_name].filter(Boolean).join(" ").trim();
  if (composed) return composed;
  if (p.full_name && p.full_name.trim()) return p.full_name;
  return p.email ?? "Unnamed buyer";
}