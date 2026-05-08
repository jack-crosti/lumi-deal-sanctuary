import { useState } from "react";
import { Loader2, ArrowLeft, ArrowRight, HandCoins, Check, ShieldAlert } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  OFFER_CONDITIONS,
  STOCK_TREATMENT_OPTIONS,
} from "@/lib/offerLabels";
import { formatCurrency } from "@/lib/format";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId: string;
  businessName: string;
}

const TOTAL_STEPS = 5;

const parseAmount = (s: string): number | null => {
  if (!s) return null;
  const n = Number(s.replace(/[^\d.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
};

export default function OfferDiscussionDialog({
  open,
  onOpenChange,
  businessId,
  businessName,
}: Props) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Step 1
  const [proposedPrice, setProposedPrice] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [stockTreatment, setStockTreatment] = useState<string>("tbd");
  const [priceNotes, setPriceNotes] = useState("");

  // Step 2
  const [conditions, setConditions] = useState<string[]>([]);
  const [otherCondition, setOtherCondition] = useState("");

  // Step 3
  const [ddPeriod, setDdPeriod] = useState("");
  const [settlement, setSettlement] = useState("");
  const [takeover, setTakeover] = useState("");
  const [financeTimeframe, setFinanceTimeframe] = useState("");

  // Step 4
  const [buyerEntity, setBuyerEntity] = useState("");
  const [solicitorName, setSolicitorName] = useState("");
  const [solicitorEmail, setSolicitorEmail] = useState("");
  const [accountantName, setAccountantName] = useState("");
  const [accountantEmail, setAccountantEmail] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");

  // Step 5
  const [accepted, setAccepted] = useState(false);

  const reset = () => {
    setStep(1);
    setSubmitted(false);
    setProposedPrice("");
    setDepositAmount("");
    setStockTreatment("tbd");
    setPriceNotes("");
    setConditions([]);
    setOtherCondition("");
    setDdPeriod("");
    setSettlement("");
    setTakeover("");
    setFinanceTimeframe("");
    setBuyerEntity("");
    setSolicitorName("");
    setSolicitorEmail("");
    setAccountantName("");
    setAccountantEmail("");
    setAdditionalNotes("");
    setAccepted(false);
  };

  const handleClose = (next: boolean) => {
    if (!next && submitted) reset();
    if (!next && !submitting) onOpenChange(next);
    if (next) onOpenChange(true);
  };

  const toggleCondition = (v: string) => {
    setConditions((prev) =>
      prev.includes(v) ? prev.filter((c) => c !== v) : [...prev, v],
    );
  };

  const canAdvance = (): boolean => {
    if (step === 1) return parseAmount(proposedPrice) !== null;
    if (step === 5) return accepted;
    return true;
  };

  const submit = async () => {
    if (!user || !accepted) return;
    const price = parseAmount(proposedPrice);
    if (!price) {
      toast.error("Please enter a proposed purchase price.");
      setStep(1);
      return;
    }
    setSubmitting(true);
    const { data: inserted, error: insertError } = await supabase
      .from("offer_interest")
      .insert({
        buyer_id: user.id,
        business_id: businessId,
        indicative_amount: price,
        proposed_price: price,
        deposit_amount: parseAmount(depositAmount),
        stock_treatment: stockTreatment || null,
        price_notes: priceNotes.trim() || null,
        conditions,
        other_condition_text:
          conditions.includes("other") && otherCondition.trim()
            ? otherCondition.trim()
            : null,
        due_diligence_period: ddPeriod.trim() || null,
        settlement_timeframe: settlement.trim() || null,
        takeover_date: takeover.trim() || null,
        finance_approval_timeframe: financeTimeframe.trim() || null,
        buyer_entity: buyerEntity.trim() || null,
        solicitor_name: solicitorName.trim() || null,
        solicitor_email: solicitorEmail.trim() || null,
        accountant_name: accountantName.trim() || null,
        accountant_email: accountantEmail.trim() || null,
        additional_notes: additionalNotes.trim() || null,
        disclaimer_accepted: true,
        status: "draft",
      })
      .select("id")
      .single();
    if (insertError || !inserted?.id) {
      setSubmitting(false);
      toast.error(insertError?.message ?? "Could not create offer discussion.");
      return;
    }

    const { error } = await supabase
      .from("offer_interest")
      .update({ status: "submitted", submitted_at: new Date().toISOString() })
      .eq("id", inserted.id);
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    void supabase.from("buyer_activity").insert({
      buyer_id: user.id,
      business_id: businessId,
      event_type: "offer_submitted",
      metadata: {
        offer_interest_id: inserted?.id,
        proposed_price: price,
        conditions_count: conditions.length,
        intent: "high",
      },
    });
    setSubmitted(true);
    toast.success("Offer discussion sent to the broker.");
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        {submitted ? (
          <div className="p-10">
            <div className="size-12 rounded-full bg-primary/15 flex items-center justify-center mb-6">
              <Check className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-display text-3xl tracking-display mb-3">
              Discussion opened.
            </h3>
            <p className="text-muted-foreground leading-[1.7] mb-6 max-w-xl">
              Your offer details for{" "}
              <span className="text-foreground">{businessName}</span> have been sent to
              the broker. They will be in touch shortly to discuss next steps and prepare
              the appropriate documentation.
            </p>
            <button
              onClick={() => handleClose(false)}
              className="lumi-btn-primary"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <DialogHeader className="px-8 pt-8 pb-6 border-b hairline">
              <div className="font-mono-brand text-[9px] tracking-eyebrow uppercase text-primary mb-3 flex items-center gap-2">
                <HandCoins className="h-3 w-3" />
                Step {step} of {TOTAL_STEPS}
              </div>
              <DialogTitle className="font-display text-2xl md:text-3xl tracking-display text-left">
                {step === 1 && "Offer amount"}
                {step === 2 && "Conditions"}
                {step === 3 && "Timing"}
                {step === 4 && "Buyer details"}
                {step === 5 && "Review & send"}
              </DialogTitle>
              <div className="mt-4 flex gap-1.5">
                {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-0.5 flex-1 rounded-full transition-colors ${
                      i < step ? "bg-primary" : "bg-border"
                    }`}
                  />
                ))}
              </div>
            </DialogHeader>

            <div className="px-8 py-8 space-y-6">
              {step === 1 && (
                <Step1
                  proposedPrice={proposedPrice}
                  setProposedPrice={setProposedPrice}
                  depositAmount={depositAmount}
                  setDepositAmount={setDepositAmount}
                  stockTreatment={stockTreatment}
                  setStockTreatment={setStockTreatment}
                  priceNotes={priceNotes}
                  setPriceNotes={setPriceNotes}
                />
              )}
              {step === 2 && (
                <Step2
                  conditions={conditions}
                  toggle={toggleCondition}
                  otherCondition={otherCondition}
                  setOtherCondition={setOtherCondition}
                />
              )}
              {step === 3 && (
                <Step3
                  ddPeriod={ddPeriod}
                  setDdPeriod={setDdPeriod}
                  settlement={settlement}
                  setSettlement={setSettlement}
                  takeover={takeover}
                  setTakeover={setTakeover}
                  financeTimeframe={financeTimeframe}
                  setFinanceTimeframe={setFinanceTimeframe}
                />
              )}
              {step === 4 && (
                <Step4
                  buyerEntity={buyerEntity}
                  setBuyerEntity={setBuyerEntity}
                  solicitorName={solicitorName}
                  setSolicitorName={setSolicitorName}
                  solicitorEmail={solicitorEmail}
                  setSolicitorEmail={setSolicitorEmail}
                  accountantName={accountantName}
                  setAccountantName={setAccountantName}
                  accountantEmail={accountantEmail}
                  setAccountantEmail={setAccountantEmail}
                  additionalNotes={additionalNotes}
                  setAdditionalNotes={setAdditionalNotes}
                />
              )}
              {step === 5 && (
                <Review
                  businessName={businessName}
                  proposedPrice={proposedPrice}
                  depositAmount={depositAmount}
                  stockTreatment={stockTreatment}
                  priceNotes={priceNotes}
                  conditions={conditions}
                  otherCondition={otherCondition}
                  ddPeriod={ddPeriod}
                  settlement={settlement}
                  takeover={takeover}
                  financeTimeframe={financeTimeframe}
                  buyerEntity={buyerEntity}
                  solicitorName={solicitorName}
                  solicitorEmail={solicitorEmail}
                  accountantName={accountantName}
                  accountantEmail={accountantEmail}
                  additionalNotes={additionalNotes}
                  accepted={accepted}
                  setAccepted={setAccepted}
                />
              )}
            </div>

            <div className="px-8 py-5 border-t hairline flex items-center justify-between gap-3 bg-card">
              <button
                onClick={() => setStep((s) => Math.max(1, s - 1))}
                disabled={step === 1 || submitting}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-mono-brand tracking-eyebrow uppercase text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back
              </button>
              {step < TOTAL_STEPS ? (
                <button
                  onClick={() => setStep((s) => Math.min(TOTAL_STEPS, s + 1))}
                  disabled={!canAdvance()}
                  className="lumi-btn-primary disabled:opacity-50"
                >
                  Continue
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              ) : (
                <button
                  onClick={submit}
                  disabled={!accepted || submitting}
                  className="lumi-btn-primary disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <HandCoins className="h-3.5 w-3.5" />
                  )}
                  Submit offer discussion
                </button>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <label className="font-mono-brand text-[9px] tracking-eyebrow uppercase text-muted-foreground mb-2 block">
        {label}
      </label>
      {children}
      {hint && (
        <p className="mt-1.5 text-[11px] text-muted-foreground/80">{hint}</p>
      )}
    </div>
  );
}

function Step1(props: {
  proposedPrice: string;
  setProposedPrice: (v: string) => void;
  depositAmount: string;
  setDepositAmount: (v: string) => void;
  stockTreatment: string;
  setStockTreatment: (v: string) => void;
  priceNotes: string;
  setPriceNotes: (v: string) => void;
}) {
  return (
    <>
      <div className="grid md:grid-cols-2 gap-5">
        <Field label="Proposed purchase price (NZD)" hint="Required">
          <input
            value={props.proposedPrice}
            onChange={(e) => props.setProposedPrice(e.target.value)}
            placeholder="e.g. 850,000"
            className="lumi-input"
          />
        </Field>
        <Field label="Deposit amount (NZD)">
          <input
            value={props.depositAmount}
            onChange={(e) => props.setDepositAmount(e.target.value)}
            placeholder="e.g. 85,000"
            className="lumi-input"
          />
        </Field>
      </div>
      <Field label="Is stock included or additional?">
        <div className="flex flex-wrap gap-2">
          {STOCK_TREATMENT_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => props.setStockTreatment(o.value)}
              className={`px-4 py-2 text-xs rounded-full border transition-colors ${
                props.stockTreatment === o.value
                  ? "bg-primary/10 border-primary/40 text-primary"
                  : "bg-card border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </Field>
      <Field label="Notes on price">
        <textarea
          value={props.priceNotes}
          onChange={(e) => props.setPriceNotes(e.target.value)}
          rows={3}
          placeholder="Any context behind your proposed amount…"
          className="lumi-input resize-none"
        />
      </Field>
    </>
  );
}

function Step2(props: {
  conditions: string[];
  toggle: (v: string) => void;
  otherCondition: string;
  setOtherCondition: (v: string) => void;
}) {
  return (
    <>
      <p className="text-sm text-muted-foreground leading-[1.7]">
        Select any conditions you would like the broker to discuss with the vendor.
        These are indicative — final wording will be drafted by your solicitor.
      </p>
      <div className="space-y-2">
        {OFFER_CONDITIONS.map((c) => {
          const active = props.conditions.includes(c.value);
          return (
            <button
              key={c.value}
              type="button"
              onClick={() => props.toggle(c.value)}
              className={`w-full text-left px-4 py-3 rounded-lg border transition-colors flex items-center gap-3 ${
                active
                  ? "bg-primary/10 border-primary/40"
                  : "bg-card border-border hover:border-border/80"
              }`}
            >
              <div
                className={`size-4 rounded border flex items-center justify-center transition-colors ${
                  active ? "bg-primary border-primary" : "border-border"
                }`}
              >
                {active && <Check className="h-3 w-3 text-primary-foreground" />}
              </div>
              <span className={`text-sm ${active ? "text-foreground" : "text-muted-foreground"}`}>
                {c.label}
              </span>
            </button>
          );
        })}
      </div>
      {props.conditions.includes("other") && (
        <Field label="Other condition">
          <input
            value={props.otherCondition}
            onChange={(e) => props.setOtherCondition(e.target.value)}
            placeholder="Describe your additional condition…"
            className="lumi-input"
          />
        </Field>
      )}
    </>
  );
}

function Step3(props: {
  ddPeriod: string;
  setDdPeriod: (v: string) => void;
  settlement: string;
  setSettlement: (v: string) => void;
  takeover: string;
  setTakeover: (v: string) => void;
  financeTimeframe: string;
  setFinanceTimeframe: (v: string) => void;
}) {
  return (
    <div className="grid md:grid-cols-2 gap-5">
      <Field label="Preferred due diligence period">
        <input
          value={props.ddPeriod}
          onChange={(e) => props.setDdPeriod(e.target.value)}
          placeholder="e.g. 21 working days"
          className="lumi-input"
        />
      </Field>
      <Field label="Preferred settlement timeframe">
        <input
          value={props.settlement}
          onChange={(e) => props.setSettlement(e.target.value)}
          placeholder="e.g. 60 days from unconditional"
          className="lumi-input"
        />
      </Field>
      <Field label="Preferred takeover date">
        <input
          value={props.takeover}
          onChange={(e) => props.setTakeover(e.target.value)}
          placeholder="e.g. early March"
          className="lumi-input"
        />
      </Field>
      <Field label="Finance approval timeframe">
        <input
          value={props.financeTimeframe}
          onChange={(e) => props.setFinanceTimeframe(e.target.value)}
          placeholder="e.g. 14 working days"
          className="lumi-input"
        />
      </Field>
    </div>
  );
}

function Step4(props: {
  buyerEntity: string;
  setBuyerEntity: (v: string) => void;
  solicitorName: string;
  setSolicitorName: (v: string) => void;
  solicitorEmail: string;
  setSolicitorEmail: (v: string) => void;
  accountantName: string;
  setAccountantName: (v: string) => void;
  accountantEmail: string;
  setAccountantEmail: (v: string) => void;
  additionalNotes: string;
  setAdditionalNotes: (v: string) => void;
}) {
  return (
    <>
      <Field label="Buyer entity name" hint="The legal name of the purchasing entity, if known">
        <input
          value={props.buyerEntity}
          onChange={(e) => props.setBuyerEntity(e.target.value)}
          placeholder="e.g. Smith Hospitality Holdings Ltd"
          className="lumi-input"
        />
      </Field>
      <div className="grid md:grid-cols-2 gap-5">
        <Field label="Solicitor name">
          <input
            value={props.solicitorName}
            onChange={(e) => props.setSolicitorName(e.target.value)}
            className="lumi-input"
          />
        </Field>
        <Field label="Solicitor email">
          <input
            type="email"
            value={props.solicitorEmail}
            onChange={(e) => props.setSolicitorEmail(e.target.value)}
            className="lumi-input"
          />
        </Field>
        <Field label="Accountant name">
          <input
            value={props.accountantName}
            onChange={(e) => props.setAccountantName(e.target.value)}
            className="lumi-input"
          />
        </Field>
        <Field label="Accountant email">
          <input
            type="email"
            value={props.accountantEmail}
            onChange={(e) => props.setAccountantEmail(e.target.value)}
            className="lumi-input"
          />
        </Field>
      </div>
      <Field label="Additional notes">
        <textarea
          value={props.additionalNotes}
          onChange={(e) => props.setAdditionalNotes(e.target.value)}
          rows={4}
          placeholder="Anything else the broker should know…"
          className="lumi-input resize-none"
        />
      </Field>
    </>
  );
}

function Review(props: {
  businessName: string;
  proposedPrice: string;
  depositAmount: string;
  stockTreatment: string;
  priceNotes: string;
  conditions: string[];
  otherCondition: string;
  ddPeriod: string;
  settlement: string;
  takeover: string;
  financeTimeframe: string;
  buyerEntity: string;
  solicitorName: string;
  solicitorEmail: string;
  accountantName: string;
  accountantEmail: string;
  additionalNotes: string;
  accepted: boolean;
  setAccepted: (v: boolean) => void;
}) {
  const price = parseAmount(props.proposedPrice);
  const deposit = parseAmount(props.depositAmount);
  const stockLabel =
    STOCK_TREATMENT_OPTIONS.find((o) => o.value === props.stockTreatment)?.label ?? "—";
  const conditionLabels = props.conditions
    .map((v) => OFFER_CONDITIONS.find((c) => c.value === v)?.label ?? v)
    .filter(Boolean);

  return (
    <>
      <div className="rounded-xl border hairline bg-card/40 p-5 flex items-start gap-3">
        <ShieldAlert className="h-4 w-4 text-primary mt-0.5 shrink-0" />
        <p className="text-xs md:text-sm text-muted-foreground leading-[1.7]">
          This is not a binding agreement. Your offer details will be sent to the broker,
          who will contact you to discuss the next step and prepare the correct documentation
          if appropriate.
        </p>
      </div>

      <div className="space-y-5">
        <ReviewBlock title="Business">
          <ReviewLine label="Listing" value={props.businessName} />
        </ReviewBlock>

        <ReviewBlock title="Offer amount">
          <ReviewLine
            label="Proposed price"
            value={price ? formatCurrency(price) : "—"}
          />
          <ReviewLine
            label="Deposit"
            value={deposit ? formatCurrency(deposit) : "—"}
          />
          <ReviewLine label="Stock" value={stockLabel} />
          {props.priceNotes && <ReviewLine label="Notes" value={props.priceNotes} />}
        </ReviewBlock>

        <ReviewBlock title="Conditions">
          {conditionLabels.length === 0 ? (
            <p className="text-sm text-muted-foreground">No conditions selected.</p>
          ) : (
            <ul className="space-y-1.5">
              {conditionLabels.map((l) => (
                <li key={l} className="text-sm flex items-center gap-2">
                  <Check className="h-3 w-3 text-primary" />
                  {l}
                </li>
              ))}
              {props.conditions.includes("other") && props.otherCondition && (
                <li className="text-sm pl-5 text-muted-foreground">
                  → {props.otherCondition}
                </li>
              )}
            </ul>
          )}
        </ReviewBlock>

        <ReviewBlock title="Timing">
          <ReviewLine label="Due diligence" value={props.ddPeriod || "—"} />
          <ReviewLine label="Settlement" value={props.settlement || "—"} />
          <ReviewLine label="Takeover" value={props.takeover || "—"} />
          <ReviewLine label="Finance approval" value={props.financeTimeframe || "—"} />
        </ReviewBlock>

        <ReviewBlock title="Buyer details">
          <ReviewLine label="Entity" value={props.buyerEntity || "—"} />
          <ReviewLine
            label="Solicitor"
            value={
              [props.solicitorName, props.solicitorEmail].filter(Boolean).join(" · ") || "—"
            }
          />
          <ReviewLine
            label="Accountant"
            value={
              [props.accountantName, props.accountantEmail].filter(Boolean).join(" · ") || "—"
            }
          />
          {props.additionalNotes && (
            <ReviewLine label="Notes" value={props.additionalNotes} />
          )}
        </ReviewBlock>
      </div>

      <label className="flex items-start gap-3 cursor-pointer pt-2">
        <input
          type="checkbox"
          checked={props.accepted}
          onChange={(e) => props.setAccepted(e.target.checked)}
          className="mt-1 size-4 accent-primary"
        />
        <span className="text-xs md:text-sm text-muted-foreground leading-[1.7]">
          I understand this is not a binding agreement and that my offer details will be
          sent to the broker for discussion.
        </span>
      </label>
    </>
  );
}

function ReviewBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h4 className="font-mono-brand text-[9px] tracking-eyebrow uppercase text-primary mb-3">
        {title}
      </h4>
      <div className="space-y-1.5 pl-3 border-l hairline">{children}</div>
    </div>
  );
}

function ReviewLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col md:flex-row md:items-baseline gap-1 md:gap-4 text-sm">
      <span className="text-[11px] tracking-eyebrow uppercase font-mono-brand text-muted-foreground md:w-32 shrink-0">
        {label}
      </span>
      <span className="text-foreground/90 whitespace-pre-wrap">{value}</span>
    </div>
  );
}