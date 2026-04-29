import { useEffect, useMemo, useState } from "react";
import { Loader2, Save, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/format";
import {
  FINANCIAL_REVIEW_OPTIONS,
  FINANCIAL_SOURCE_OPTIONS,
  reviewTone,
  type FinancialReviewStatus,
  type FinancialSource,
} from "@/lib/financialLabels";

interface FinancialFields {
  revenue: number | null;
  weekly_sales_min: number | null;
  weekly_sales_max: number | null;
  gross_profit: number | null;
  gross_profit_pct: number | null;
  wage_cost: number | null;
  wage_pct: number | null;
  rent_per_year: number | null;
  rent_pct_sales: number | null;
  normalised_profit: number | null;
  ebitda: number | null;
  owner_profit: number | null;
  add_backs: number | null;
  stock_value: number | null;
  asking_price: number | null;
  asking_price_multiple: number | null;
  financial_notes: string | null;
  financial_source: FinancialSource | null;
  financial_review_status: FinancialReviewStatus;
}

const NUMERIC_FIELDS: (keyof FinancialFields)[] = [
  "revenue",
  "weekly_sales_min",
  "weekly_sales_max",
  "gross_profit",
  "gross_profit_pct",
  "wage_cost",
  "wage_pct",
  "rent_per_year",
  "rent_pct_sales",
  "normalised_profit",
  "ebitda",
  "owner_profit",
  "add_backs",
  "stock_value",
  "asking_price",
  "asking_price_multiple",
];

export default function BusinessFinancials({ businessId }: { businessId: string }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FinancialFields | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("businesses")
        .select(
          "revenue,weekly_sales_min,weekly_sales_max,gross_profit,gross_profit_pct,wage_cost,wage_pct,rent_per_year,rent_pct_sales,normalised_profit,ebitda,owner_profit,add_backs,stock_value,asking_price,asking_price_multiple,financial_notes,financial_source,financial_review_status"
        )
        .eq("id", businessId)
        .maybeSingle<FinancialFields>();
      if (!active) return;
      if (error) {
        toast.error(error.message);
      } else if (data) {
        setForm(data);
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [businessId]);

  const update = <K extends keyof FinancialFields>(key: K, value: FinancialFields[K]) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const onSave = async () => {
    if (!form) return;
    setSaving(true);
    const { error } = await supabase
      .from("businesses")
      .update(form as never)
      .eq("id", businessId);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Financials saved");
  };

  const derived = useMemo(() => {
    if (!form) return null;
    const profit = form.ebitda ?? form.normalised_profit ?? form.owner_profit;
    const multiple =
      form.asking_price_multiple ??
      (form.asking_price && profit && profit > 0
        ? Number((form.asking_price / profit).toFixed(2))
        : null);
    return { profit, multiple };
  }, [form]);

  if (loading || !form) {
    return (
      <div className="flex items-center gap-3 text-sm text-muted-foreground py-12">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading financials…
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header strip: status + source + save */}
      <div className="lumi-card p-6 flex flex-wrap items-center gap-4 justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <SelectField
            label="Review status"
            value={form.financial_review_status}
            onChange={(v) => update("financial_review_status", v as FinancialReviewStatus)}
            options={FINANCIAL_REVIEW_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          />
          <SelectField
            label="Source"
            value={form.financial_source ?? ""}
            onChange={(v) =>
              update("financial_source", (v || null) as FinancialSource | null)
            }
            options={[
              { value: "", label: "—" },
              ...FINANCIAL_SOURCE_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
            ]}
          />
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full border font-mono-brand text-[10px] tracking-eyebrow uppercase ${reviewTone(
              form.financial_review_status
            )}`}
          >
            {FINANCIAL_REVIEW_OPTIONS.find((o) => o.value === form.financial_review_status)?.label}
          </span>
        </div>
        <button
          onClick={onSave}
          disabled={saving}
          className="lumi-btn-primary inline-flex items-center gap-2 disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          Save financials
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trading */}
        <Block title="Trading">
          <NumberInput label="Annual revenue" value={form.revenue} onChange={(v) => update("revenue", v)} prefix="$" />
          <div className="grid grid-cols-2 gap-3">
            <NumberInput
              label="Weekly sales (min)"
              value={form.weekly_sales_min}
              onChange={(v) => update("weekly_sales_min", v)}
              prefix="$"
            />
            <NumberInput
              label="Weekly sales (max)"
              value={form.weekly_sales_max}
              onChange={(v) => update("weekly_sales_max", v)}
              prefix="$"
            />
          </div>
          <NumberInput
            label="Gross profit"
            value={form.gross_profit}
            onChange={(v) => update("gross_profit", v)}
            prefix="$"
          />
          <NumberInput
            label="Gross profit %"
            value={form.gross_profit_pct}
            onChange={(v) => update("gross_profit_pct", v)}
            suffix="%"
            step="0.1"
          />
        </Block>

        {/* Costs */}
        <Block title="Costs">
          <NumberInput label="Wage cost" value={form.wage_cost} onChange={(v) => update("wage_cost", v)} prefix="$" />
          <NumberInput
            label="Wage % of sales"
            value={form.wage_pct}
            onChange={(v) => update("wage_pct", v)}
            suffix="%"
            step="0.1"
          />
          <NumberInput
            label="Rent per year"
            value={form.rent_per_year}
            onChange={(v) => update("rent_per_year", v)}
            prefix="$"
          />
          <NumberInput
            label="Rent % of sales"
            value={form.rent_pct_sales}
            onChange={(v) => update("rent_pct_sales", v)}
            suffix="%"
            step="0.1"
          />
        </Block>

        {/* Profit */}
        <Block title="Profit">
          <NumberInput
            label="Normalised profit"
            value={form.normalised_profit}
            onChange={(v) => update("normalised_profit", v)}
            prefix="$"
          />
          <NumberInput label="EBITDA" value={form.ebitda} onChange={(v) => update("ebitda", v)} prefix="$" />
          <NumberInput
            label="Owner profit"
            value={form.owner_profit}
            onChange={(v) => update("owner_profit", v)}
            prefix="$"
          />
          <NumberInput
            label="Add backs"
            value={form.add_backs}
            onChange={(v) => update("add_backs", v)}
            prefix="$"
          />
        </Block>

        {/* Asking */}
        <Block title="Asking price">
          <NumberInput
            label="Asking price"
            value={form.asking_price}
            onChange={(v) => update("asking_price", v)}
            prefix="$"
          />
          <NumberInput
            label="Stock value"
            value={form.stock_value}
            onChange={(v) => update("stock_value", v)}
            prefix="$"
          />
          <NumberInput
            label="Asking price multiple"
            value={form.asking_price_multiple}
            onChange={(v) => update("asking_price_multiple", v)}
            suffix="×"
            step="0.1"
          />
          {derived?.multiple && form.asking_price_multiple == null && (
            <p className="text-[11px] text-muted-foreground">
              Suggested from price ÷ profit: <span className="text-foreground tabular-nums">{derived.multiple}×</span>
            </p>
          )}
        </Block>

        {/* Notes */}
        <div className="lg:col-span-2">
          <Block title="Broker notes">
            <textarea
              value={form.financial_notes ?? ""}
              onChange={(e) => update("financial_notes", e.target.value || null)}
              rows={6}
              placeholder="Context buyers should know about these numbers — normalisation logic, one-offs, seasonality, source caveats…"
              className="w-full rounded-sm border hairline bg-card/40 p-3 text-sm leading-relaxed focus:outline-none focus:border-primary/50"
            />
            <p className="mt-2 text-[11px] text-muted-foreground flex items-start gap-2">
              <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
              Visible to buyers in the Financial Snapshot section. Do not include identifying details if confidentiality mode is blind.
            </p>
          </Block>
        </div>
      </div>

      {/* Live summary */}
      <div className="lumi-card p-7">
        <div className="font-mono-brand text-[10px] tracking-eyebrow uppercase text-muted-foreground mb-5">
          Buyer summary preview
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <Mini label="Revenue" value={formatCurrency(form.revenue, { compact: true })} />
          <Mini
            label="Profit"
            value={formatCurrency(derived?.profit ?? null, { compact: true })}
          />
          <Mini
            label="Asking price"
            value={formatCurrency(form.asking_price, { compact: true })}
          />
          <Mini
            label="Multiple"
            value={derived?.multiple ? `${derived.multiple}×` : "—"}
          />
        </div>
      </div>
    </div>
  );
}

/* ================ helpers ================ */

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="lumi-card p-6 space-y-4">
      <div className="font-mono-brand text-[10px] tracking-eyebrow uppercase text-muted-foreground">
        {title}
      </div>
      {children}
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-mono-brand text-[9px] tracking-eyebrow uppercase text-muted-foreground mb-2">
        {label}
      </div>
      <div className="lumi-stat text-2xl">{value}</div>
    </div>
  );
}

function NumberInput({
  label,
  value,
  onChange,
  prefix,
  suffix,
  step = "1",
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  prefix?: string;
  suffix?: string;
  step?: string;
}) {
  return (
    <label className="block">
      <span className="font-mono-brand text-[9px] tracking-eyebrow uppercase text-muted-foreground">
        {label}
      </span>
      <div className="mt-1.5 flex items-center rounded-sm border hairline bg-card/40 focus-within:border-primary/50">
        {prefix && (
          <span className="pl-2.5 text-xs text-muted-foreground tabular-nums">{prefix}</span>
        )}
        <input
          type="number"
          inputMode="decimal"
          step={step}
          value={value ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            onChange(v === "" ? null : Number(v));
          }}
          className="w-full bg-transparent px-2.5 py-2 text-sm tabular-nums focus:outline-none"
        />
        {suffix && (
          <span className="pr-2.5 text-xs text-muted-foreground">{suffix}</span>
        )}
      </div>
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex items-center gap-2">
      <span className="font-mono-brand text-[9px] tracking-eyebrow uppercase text-muted-foreground">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-sm border hairline bg-card/40 px-2.5 py-1.5 text-xs focus:outline-none focus:border-primary/50"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
