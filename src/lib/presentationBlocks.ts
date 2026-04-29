import type { Database } from "@/integrations/supabase/types";

export type SectionType = Database["public"]["Enums"]["section_type"];
export type AccessLevel = Database["public"]["Enums"]["access_level"];
export type DocVisibility = Database["public"]["Enums"]["document_visibility"];
export type PresentationStatus = Database["public"]["Enums"]["presentation_status"];

// Local enum (types may not yet include it after migration)
export type BlockReviewStatus = "draft" | "needs_review" | "approved";

export interface BlockTypeMeta {
  value: SectionType;
  label: string;
  hint: string;
  /** Buyers can interact with this block — body text is optional. */
  interactive?: boolean;
  /** Hidden from buyers entirely (admin-only block). */
  internal?: boolean;
}

export const BLOCK_TYPES: BlockTypeMeta[] = [
  { value: "hero", label: "Hero", hint: "Headline, location summary and headline figures." },
  { value: "location_advantage", label: "Location Advantage", hint: "Why this site wins commercially." },
  { value: "business_overview", label: "Business Overview", hint: "What the business is and how it operates." },
  { value: "key_highlights", label: "Key Highlights", hint: "The 4–6 strongest selling points." },
  { value: "financial_snapshot", label: "Financial Snapshot", hint: "Revenue, profit, rent, asking price." },
  { value: "lease_summary", label: "Lease Summary", hint: "Rent, expiry, renewal rights, tenure." },
  { value: "operations_staff", label: "Operations & Staff", hint: "Hours, staff, owner involvement." },
  { value: "growth_opportunities", label: "Growth Opportunities", hint: "Where the next operator can grow it." },
  { value: "buyer_fit", label: "Buyer Fit", hint: "Who this business suits." },
  { value: "risks_due_diligence", label: "Risks & Due Diligence Notes", hint: "Honest risks and DD pointers." },
  { value: "photo_gallery", label: "Photo Gallery", hint: "Approved imagery only." },
  { value: "supporting_documents", label: "Supporting Documents", hint: "Lease, financials, POS reports." },
  { value: "ask_question", label: "Ask A Question", hint: "Buyer question form.", interactive: true },
  { value: "request_information", label: "Request Information", hint: "Buyer request form.", interactive: true },
  { value: "start_offer_discussion", label: "Start Offer Discussion", hint: "Non-binding offer dialog.", interactive: true },
  { value: "voiceover_script", label: "Voiceover Script Placeholder", hint: "Internal-only narration script.", internal: true },
];

export const BLOCK_TYPE_MAP = new Map(BLOCK_TYPES.map((b) => [b.value, b]));

export const blockLabel = (t: SectionType): string =>
  BLOCK_TYPE_MAP.get(t)?.label ?? t;

/** Default order when seeding a new presentation. */
export const DEFAULT_BLOCK_ORDER: SectionType[] = [
  "hero",
  "key_highlights",
  "business_overview",
  "location_advantage",
  "financial_snapshot",
  "lease_summary",
  "operations_staff",
  "growth_opportunities",
  "buyer_fit",
  "risks_due_diligence",
  "photo_gallery",
  "supporting_documents",
  "ask_question",
  "request_information",
  "start_offer_discussion",
];

export const ACCESS_LEVELS: { value: AccessLevel; label: string }[] = [
  { value: "teaser", label: "Teaser" },
  { value: "im", label: "IM" },
  { value: "financial", label: "Financial" },
  { value: "serious", label: "Serious buyer" },
  { value: "full_dd", label: "Full DD" },
];

export const VISIBILITIES: { value: DocVisibility; label: string }[] = [
  { value: "hidden", label: "Hidden" },
  { value: "teaser", label: "Teaser" },
  { value: "im", label: "IM" },
  { value: "financial", label: "Financial" },
  { value: "serious", label: "Serious buyer" },
  { value: "full_dd", label: "Full DD" },
];

export const REVIEW_STATUSES: { value: BlockReviewStatus; label: string; tone: string }[] = [
  { value: "draft", label: "Draft", tone: "bg-muted text-muted-foreground border-border" },
  { value: "needs_review", label: "Needs review", tone: "bg-amber-500/15 text-amber-300 border-amber-500/40" },
  { value: "approved", label: "Approved", tone: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40" },
];

export const PRESENTATION_STATUSES: {
  value: PresentationStatus;
  label: string;
  tone: string;
  hint: string;
}[] = [
  { value: "draft", label: "Draft", tone: "bg-muted text-muted-foreground border-border", hint: "Editing in progress." },
  { value: "internal_review", label: "Internal review", tone: "bg-primary/10 text-primary border-primary/30", hint: "Awaiting broker approval." },
  { value: "ready_to_publish", label: "Ready to publish", tone: "bg-amber-500/15 text-amber-300 border-amber-500/40", hint: "Approved — ready for buyers." },
  { value: "published", label: "Published", tone: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40", hint: "Live to assigned buyers." },
  { value: "archived", label: "Archived", tone: "bg-rose-500/15 text-rose-300 border-rose-500/40", hint: "Hidden from everyone." },
];

export const presentationStatusMeta = (s: PresentationStatus) =>
  PRESENTATION_STATUSES.find((x) => x.value === s) ?? PRESENTATION_STATUSES[0];

export const reviewStatusMeta = (s: BlockReviewStatus) =>
  REVIEW_STATUSES.find((x) => x.value === s) ?? REVIEW_STATUSES[0];