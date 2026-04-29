import { BUYER_STATUS_OPTIONS, CA_STATUS_OPTIONS, type BuyerStatus, type CaStatus } from "@/lib/buyerLabels";

const TONE: Record<BuyerStatus, string> = {
  new: "border-foreground/20 bg-foreground/[0.04] text-foreground/70",
  active: "border-primary/40 bg-primary/10 text-primary",
  warm: "border-amber-400/40 bg-amber-400/10 text-amber-300",
  hot: "border-red-500/50 bg-red-500/15 text-red-300",
  not_suitable: "border-foreground/15 bg-foreground/[0.03] text-muted-foreground",
  archived: "border-foreground/10 bg-foreground/[0.02] text-muted-foreground/70",
};

export function BuyerStatusPill({ status }: { status: BuyerStatus }) {
  const label = BUYER_STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono-brand text-[9px] tracking-eyebrow uppercase border ${TONE[status]}`}
    >
      <span className="size-1.5 rounded-full bg-current opacity-70" />
      {label}
    </span>
  );
}

const CA_TONE: Record<CaStatus, string> = {
  not_sent: "border-foreground/15 bg-foreground/[0.03] text-muted-foreground",
  sent: "border-foreground/30 bg-foreground/[0.06] text-foreground/80",
  signed: "border-primary/40 bg-primary/10 text-primary",
  approved: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
};

export function CaStatusPill({ status }: { status: CaStatus }) {
  const label = CA_STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono-brand text-[9px] tracking-eyebrow uppercase border ${CA_TONE[status]}`}
    >
      {label}
    </span>
  );
}