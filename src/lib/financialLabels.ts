export type FinancialSource =
  | "accountant"
  | "gst_returns"
  | "pos_reports"
  | "vendor_supplied"
  | "broker_estimate"
  | "other";

export type FinancialReviewStatus =
  | "draft"
  | "needs_verification"
  | "verified"
  | "not_available";

export const FINANCIAL_SOURCE_OPTIONS: { value: FinancialSource; label: string }[] = [
  { value: "accountant", label: "Accountant financials" },
  { value: "gst_returns", label: "GST returns" },
  { value: "pos_reports", label: "POS reports" },
  { value: "vendor_supplied", label: "Vendor supplied" },
  { value: "broker_estimate", label: "Broker estimate" },
  { value: "other", label: "Other" },
];

export const FINANCIAL_REVIEW_OPTIONS: {
  value: FinancialReviewStatus;
  label: string;
  tone: string;
}[] = [
  { value: "draft", label: "Draft", tone: "bg-muted text-muted-foreground border-border" },
  {
    value: "needs_verification",
    label: "Needs verification",
    tone: "bg-amber-500/15 text-amber-300 border-amber-500/40",
  },
  {
    value: "verified",
    label: "Verified",
    tone: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
  },
  {
    value: "not_available",
    label: "Not available",
    tone: "bg-rose-500/15 text-rose-300 border-rose-500/40",
  },
];

export const sourceLabel = (s: FinancialSource | null | undefined) =>
  FINANCIAL_SOURCE_OPTIONS.find((o) => o.value === s)?.label ?? null;

export const reviewLabel = (s: FinancialReviewStatus | null | undefined) =>
  FINANCIAL_REVIEW_OPTIONS.find((o) => o.value === s)?.label ?? "Draft";

export const reviewTone = (s: FinancialReviewStatus | null | undefined) =>
  FINANCIAL_REVIEW_OPTIONS.find((o) => o.value === s)?.tone ??
  "bg-muted text-muted-foreground border-border";
