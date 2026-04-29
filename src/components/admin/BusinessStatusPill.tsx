import { cn } from "@/lib/utils";

export type BusinessStatus =
  | "draft"
  | "internal_review"
  | "ready_to_publish"
  | "published"
  | "archived";

const LABELS: Record<BusinessStatus, string> = {
  draft: "Draft",
  internal_review: "Internal Review",
  ready_to_publish: "Ready to Publish",
  published: "Published",
  archived: "Archived",
};

const STYLES: Record<BusinessStatus, string> = {
  draft: "border-hairline-strong text-muted-foreground bg-muted/30",
  internal_review: "border-amber-500/30 text-amber-200/90 bg-amber-500/5",
  ready_to_publish: "border-primary/40 text-primary bg-primary/5",
  published: "border-emerald-500/30 text-emerald-200/90 bg-emerald-500/5",
  archived: "border-hairline text-muted-foreground/60 bg-background/40",
};

export const BUSINESS_STATUS_OPTIONS: { value: BusinessStatus; label: string }[] = [
  { value: "draft", label: LABELS.draft },
  { value: "internal_review", label: LABELS.internal_review },
  { value: "ready_to_publish", label: LABELS.ready_to_publish },
  { value: "published", label: LABELS.published },
  { value: "archived", label: LABELS.archived },
];

export function BusinessStatusPill({
  status,
  className,
}: {
  status: BusinessStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-sm border px-2.5 py-1 font-mono-brand text-[9px] tracking-eyebrow uppercase",
        STYLES[status],
        className,
      )}
    >
      <span
        className={cn(
          "size-1 rounded-full",
          status === "published" && "bg-emerald-400",
          status === "ready_to_publish" && "bg-primary animate-shimmer",
          status === "internal_review" && "bg-amber-300",
          status === "draft" && "bg-muted-foreground/60",
          status === "archived" && "bg-muted-foreground/40",
        )}
      />
      {LABELS[status]}
    </span>
  );
}