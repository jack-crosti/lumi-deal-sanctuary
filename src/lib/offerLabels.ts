export type OfferStatus =
  | "draft"
  | "submitted"
  | "broker_reviewing"
  | "call_booked"
  | "spa_preparing"
  | "not_proceeding"
  | "closed"
  | "withdrawn";

export const OFFER_STATUS_OPTIONS: { value: OfferStatus; label: string }[] = [
  { value: "submitted", label: "New" },
  { value: "broker_reviewing", label: "Broker reviewing" },
  { value: "call_booked", label: "Call booked" },
  { value: "spa_preparing", label: "SPA being prepared" },
  { value: "not_proceeding", label: "Not proceeding" },
  { value: "closed", label: "Closed" },
];

export const offerStatusLabel = (s: string): string =>
  OFFER_STATUS_OPTIONS.find((o) => o.value === s)?.label ??
  (s === "draft" ? "Draft" : s === "withdrawn" ? "Withdrawn" : s);

export const offerStatusTone = (s: string): string => {
  switch (s) {
    case "submitted":
      return "bg-primary/10 text-primary border-primary/30";
    case "broker_reviewing":
    case "call_booked":
      return "bg-amber-500/10 text-amber-300 border-amber-500/30";
    case "spa_preparing":
      return "bg-emerald-500/10 text-emerald-300 border-emerald-500/30";
    case "not_proceeding":
    case "withdrawn":
      return "bg-destructive/10 text-destructive border-destructive/30";
    case "closed":
      return "bg-muted text-muted-foreground border-border";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
};

export interface OfferCondition {
  value: string;
  label: string;
}

export const OFFER_CONDITIONS: OfferCondition[] = [
  { value: "finance", label: "Subject to finance" },
  { value: "due_diligence", label: "Subject to due diligence" },
  { value: "solicitor", label: "Subject to solicitor approval" },
  { value: "landlord", label: "Subject to landlord approval" },
  { value: "lease", label: "Subject to lease assignment or new lease" },
  { value: "training", label: "Subject to training and handover" },
  { value: "vendor_assistance", label: "Subject to vendor assistance" },
  { value: "other", label: "Other condition" },
];

export const conditionLabel = (v: string): string =>
  OFFER_CONDITIONS.find((c) => c.value === v)?.label ?? v;

export const STOCK_TREATMENT_OPTIONS = [
  { value: "included", label: "Stock included in price" },
  { value: "additional", label: "Stock additional to price" },
  { value: "tbd", label: "To be determined" },
];

export const stockTreatmentLabel = (v: string | null): string =>
  STOCK_TREATMENT_OPTIONS.find((o) => o.value === v)?.label ?? "—";