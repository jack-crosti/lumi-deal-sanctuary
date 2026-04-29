import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, HandCoins, ArrowUpRight, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/format";
import {
  OFFER_STATUS_OPTIONS,
  conditionLabel,
  offerStatusLabel,
  offerStatusTone,
  stockTreatmentLabel,
  type OfferStatus,
} from "@/lib/offerLabels";

interface OfferRow {
  id: string;
  created_at: string;
  submitted_at: string | null;
  status: string;
  proposed_price: number | null;
  indicative_amount: number | null;
  deposit_amount: number | null;
  stock_treatment: string | null;
  price_notes: string | null;
  conditions: string[] | null;
  other_condition_text: string | null;
  due_diligence_period: string | null;
  settlement_timeframe: string | null;
  takeover_date: string | null;
  finance_approval_timeframe: string | null;
  buyer_entity: string | null;
  solicitor_name: string | null;
  solicitor_email: string | null;
  accountant_name: string | null;
  accountant_email: string | null;
  additional_notes: string | null;
  buyer_id: string;
  business_id: string;
  buyer?: {
    id: string;
    full_name: string | null;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  } | null;
  business?: { id: string; name: string; public_title: string | null } | null;
}

const buyerName = (b: OfferRow["buyer"]) => {
  if (!b) return "Unknown buyer";
  return (
    b.full_name ||
    [b.first_name, b.last_name].filter(Boolean).join(" ") ||
    b.email ||
    "Unknown buyer"
  );
};

const businessName = (b: OfferRow["business"]) =>
  b?.public_title || b?.name || "—";

export default function BusinessOfferInterest({
  businessId,
}: {
  businessId?: string;
}) {
  const [rows, setRows] = useState<OfferRow[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    let query = supabase
      .from("offer_interest")
      .select(
        "id, created_at, submitted_at, status, proposed_price, indicative_amount, deposit_amount, stock_treatment, price_notes, conditions, other_condition_text, due_diligence_period, settlement_timeframe, takeover_date, finance_approval_timeframe, buyer_entity, solicitor_name, solicitor_email, accountant_name, accountant_email, additional_notes, buyer_id, business_id"
      )
      .neq("status", "draft")
      .order("created_at", { ascending: false })
      .limit(500);
    if (businessId) query = query.eq("business_id", businessId);

    const { data, error } = await query;
    if (error) {
      toast.error(error.message);
      setRows([]);
      return;
    }
    const offers = (data ?? []) as unknown as OfferRow[];
    if (offers.length === 0) {
      setRows([]);
      return;
    }
    const buyerIds = Array.from(new Set(offers.map((o) => o.buyer_id)));
    const businessIds = Array.from(new Set(offers.map((o) => o.business_id)));
    const [{ data: buyers }, { data: businesses }] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, first_name, last_name, email")
        .in("id", buyerIds),
      supabase
        .from("businesses")
        .select("id, name, public_title")
        .in("id", businessIds),
    ]);
    const bMap = new Map((buyers ?? []).map((b) => [b.id, b]));
    const busMap = new Map((businesses ?? []).map((b) => [b.id, b]));
    setRows(
      offers.map((o) => ({
        ...o,
        buyer: bMap.get(o.buyer_id) ?? null,
        business: busMap.get(o.business_id) ?? null,
      }))
    );
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);

  const updateStatus = async (id: string, status: OfferStatus) => {
    setBusy(id);
    const { error } = await supabase
      .from("offer_interest")
      .update({ status })
      .eq("id", id);
    setBusy(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Marked as ${offerStatusLabel(status)}`);
    void load();
  };

  if (rows === null) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading offer interest…
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="lumi-card p-10 text-center">
        <HandCoins className="h-6 w-6 text-muted-foreground mx-auto mb-3" />
        <h3 className="font-display text-xl tracking-display mb-1">
          No offer interest yet
        </h3>
        <p className="text-sm text-muted-foreground">
          When a buyer starts an offer discussion it will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {rows.map((o) => (
        <OfferCard
          key={o.id}
          offer={o}
          showBusiness={!businessId}
          busy={busy === o.id}
          onStatusChange={(s) => updateStatus(o.id, s)}
        />
      ))}
    </div>
  );
}

function OfferCard({
  offer,
  showBusiness,
  busy,
  onStatusChange,
}: {
  offer: OfferRow;
  showBusiness: boolean;
  busy: boolean;
  onStatusChange: (s: OfferStatus) => void;
}) {
  const price = offer.proposed_price ?? offer.indicative_amount ?? null;

  return (
    <div className="lumi-card p-6 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span
              className={`text-[10px] tracking-eyebrow uppercase font-mono-brand px-2 py-0.5 rounded-full border ${offerStatusTone(offer.status)}`}
            >
              {offerStatusLabel(offer.status)}
            </span>
            <span className="text-[10px] tracking-eyebrow uppercase font-mono-brand text-muted-foreground inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(offer.submitted_at || offer.created_at).toLocaleString()}
            </span>
          </div>
          <h3 className="font-display text-2xl tracking-display">
            {price ? formatCurrency(price) : "Price to be discussed"}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {buyerName(offer.buyer)}
            {offer.buyer?.email && (
              <span className="text-muted-foreground/70"> · {offer.buyer.email}</span>
            )}
            {showBusiness && (
              <>
                <span className="text-muted-foreground/70"> · </span>
                {businessName(offer.business)}
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            to={`/admin/businesses/${offer.business_id}`}
            className="lumi-btn-ghost text-xs"
          >
            View business
            <ArrowUpRight className="h-3 w-3" />
          </Link>
          <select
            value={offer.status}
            onChange={(e) => onStatusChange(e.target.value as OfferStatus)}
            disabled={busy}
            className="lumi-input text-xs h-9 py-0 px-3 w-auto"
          >
            {OFFER_STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4 pt-2">
        <Detail label="Deposit" value={offer.deposit_amount ? formatCurrency(offer.deposit_amount) : "—"} />
        <Detail label="Stock" value={stockTreatmentLabel(offer.stock_treatment)} />
        <Detail label="Buyer entity" value={offer.buyer_entity || "—"} />
        <Detail label="Due diligence" value={offer.due_diligence_period || "—"} />
        <Detail label="Settlement" value={offer.settlement_timeframe || "—"} />
        <Detail label="Takeover" value={offer.takeover_date || "—"} />
        <Detail label="Finance approval" value={offer.finance_approval_timeframe || "—"} />
        <Detail
          label="Solicitor"
          value={
            [offer.solicitor_name, offer.solicitor_email].filter(Boolean).join(" · ") || "—"
          }
        />
        <Detail
          label="Accountant"
          value={
            [offer.accountant_name, offer.accountant_email].filter(Boolean).join(" · ") || "—"
          }
        />
      </div>

      {(offer.conditions?.length ?? 0) > 0 && (
        <div>
          <p className="text-[10px] tracking-eyebrow uppercase font-mono-brand text-muted-foreground mb-2">
            Conditions
          </p>
          <div className="flex flex-wrap gap-1.5">
            {(offer.conditions ?? []).map((c) => (
              <span
                key={c}
                className="text-[11px] px-2 py-1 rounded-full border hairline bg-card/50"
              >
                {conditionLabel(c)}
                {c === "other" && offer.other_condition_text
                  ? ` — ${offer.other_condition_text}`
                  : ""}
              </span>
            ))}
          </div>
        </div>
      )}

      {(offer.price_notes || offer.additional_notes) && (
        <div className="space-y-3 pt-2 border-t hairline">
          {offer.price_notes && (
            <div>
              <p className="text-[10px] tracking-eyebrow uppercase font-mono-brand text-muted-foreground mb-1">
                Notes on price
              </p>
              <p className="text-sm whitespace-pre-wrap">{offer.price_notes}</p>
            </div>
          )}
          {offer.additional_notes && (
            <div>
              <p className="text-[10px] tracking-eyebrow uppercase font-mono-brand text-muted-foreground mb-1">
                Additional notes
              </p>
              <p className="text-sm whitespace-pre-wrap">{offer.additional_notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] tracking-eyebrow uppercase font-mono-brand text-muted-foreground mb-1">
        {label}
      </p>
      <p className="text-sm">{value}</p>
    </div>
  );
}