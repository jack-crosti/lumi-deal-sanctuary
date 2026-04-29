export const REQUEST_TYPE_OPTIONS = [
  { value: "information", label: "General Question" },
  { value: "financial", label: "Request Financial Information" },
  { value: "lease", label: "Request Lease Documents" },
  { value: "pos", label: "Request POS Reports" },
  { value: "chattels", label: "Request Chattel List" },
  { value: "call", label: "Request a Call" },
  { value: "vendor_meeting", label: "Request Vendor Meeting" },
  { value: "dd_question", label: "Due Diligence Question" },
  { value: "document_access", label: "Request Document Access" },
  { value: "other", label: "Other" },
] as const;

export type RequestType = typeof REQUEST_TYPE_OPTIONS[number]["value"];

export const REQUEST_STATUS_OPTIONS = [
  { value: "open", label: "New" },
  { value: "in_progress", label: "In Progress" },
  { value: "waiting_vendor", label: "Waiting on Vendor" },
  { value: "replied", label: "Replied" },
  { value: "closed", label: "Closed" },
] as const;

export type RequestStatus = typeof REQUEST_STATUS_OPTIONS[number]["value"];

export const CONTACT_METHOD_OPTIONS = [
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone call" },
  { value: "either", label: "Either" },
] as const;

export type ContactMethod = typeof CONTACT_METHOD_OPTIONS[number]["value"];

export const PRIORITY_OPTIONS = [
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
] as const;

export type RequestPriority = typeof PRIORITY_OPTIONS[number]["value"];

export function requestTypeLabel(value: string | null | undefined) {
  return REQUEST_TYPE_OPTIONS.find((o) => o.value === value)?.label ?? "Request";
}

export function requestStatusLabel(value: string | null | undefined) {
  return REQUEST_STATUS_OPTIONS.find((o) => o.value === value)?.label ?? "—";
}

export function contactMethodLabel(value: string | null | undefined) {
  if (!value) return "—";
  return CONTACT_METHOD_OPTIONS.find((o) => o.value === value)?.label ?? "—";
}

export function statusTone(value: string | null | undefined): "primary" | "warn" | "muted" | "ok" {
  switch (value) {
    case "open":
      return "primary";
    case "in_progress":
    case "waiting_vendor":
      return "warn";
    case "replied":
      return "ok";
    case "closed":
    default:
      return "muted";
  }
}