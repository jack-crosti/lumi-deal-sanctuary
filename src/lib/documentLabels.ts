import type { Database } from "@/integrations/supabase/types";

export type DocumentType = Database["public"]["Enums"]["document_type"];
export type DocumentAvailability = Database["public"]["Enums"]["document_availability"];
export type AccessLevel = Database["public"]["Enums"]["access_level"];

export const DOCUMENT_TYPE_OPTIONS: { value: DocumentType; label: string }[] = [
  { value: "im", label: "Information Memorandum" },
  { value: "financials", label: "Financial Statements" },
  { value: "gst", label: "GST Returns" },
  { value: "pos", label: "POS Reports" },
  { value: "lease", label: "Lease" },
  { value: "chattels", label: "Chattel List" },
  { value: "staff", label: "Staff Information" },
  { value: "vendor_notes", label: "Vendor Notes" },
  { value: "photo", label: "Photos" },
  { value: "video", label: "Video" },
  { value: "other", label: "Other" },
];

export const DOCUMENT_AVAILABILITY_OPTIONS: { value: DocumentAvailability; label: string }[] = [
  { value: "hidden", label: "Hidden" },
  { value: "available", label: "Available" },
  { value: "requires_approval", label: "Requires Approval" },
];

export function documentTypeLabel(t: DocumentType | null | undefined) {
  return DOCUMENT_TYPE_OPTIONS.find((o) => o.value === t)?.label ?? "—";
}
export function documentAvailabilityLabel(a: DocumentAvailability | null | undefined) {
  return DOCUMENT_AVAILABILITY_OPTIONS.find((o) => o.value === a)?.label ?? "—";
}

export function formatBytes(n: number | null | undefined) {
  if (n == null) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
}