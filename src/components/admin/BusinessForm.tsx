import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { BUSINESS_STATUS_OPTIONS, type BusinessStatus } from "./BusinessStatusPill";

type LocationMode = "blind" | "suburb" | "exact";

const numericString = z
  .string()
  .optional()
  .refine((v) => !v || !Number.isNaN(Number(v)), { message: "Must be a number" });

const schema = z.object({
  name: z.string().min(1, "Required").max(160),
  public_title: z.string().max(160).optional().or(z.literal("")),
  confidential_title: z.string().max(160).optional().or(z.literal("")),
  business_type: z.string().max(80).optional().or(z.literal("")),
  industry: z.string().max(80).optional().or(z.literal("")),
  location_mode: z.enum(["blind", "suburb", "exact"]),
  suburb: z.string().max(120).optional().or(z.literal("")),
  city: z.string().max(120).optional().or(z.literal("")),
  region: z.string().max(120).optional().or(z.literal("")),
  address: z.string().max(240).optional().or(z.literal("")),
  asking_price: numericString,
  stock_value: numericString,
  revenue: numericString,
  weekly_sales_min: numericString,
  weekly_sales_max: numericString,
  normalised_profit: numericString,
  ebitda: numericString,
  rent_per_year: numericString,
  lease_expiry: z.string().optional().or(z.literal("")),
  renewal_rights: z.string().max(240).optional().or(z.literal("")),
  staff_summary: z.string().max(600).optional().or(z.literal("")),
  owner_involvement: z.string().max(600).optional().or(z.literal("")),
  opening_hours: z.string().max(240).optional().or(z.literal("")),
  broker_notes: z.string().max(2000).optional().or(z.literal("")),
  status: z.enum(["draft", "internal_review", "ready_to_publish", "published", "archived"]),
});

export type BusinessFormValues = z.infer<typeof schema>;

export interface BusinessFormInitial extends Partial<BusinessFormValues> {
  id?: string;
}

export function BusinessForm({ initial }: { initial?: BusinessFormInitial }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<BusinessFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initial?.name ?? "",
      public_title: initial?.public_title ?? "",
      confidential_title: initial?.confidential_title ?? "",
      business_type: initial?.business_type ?? "",
      industry: initial?.industry ?? "",
      location_mode: (initial?.location_mode as LocationMode) ?? "blind",
      suburb: initial?.suburb ?? "",
      city: initial?.city ?? "",
      region: initial?.region ?? "",
      address: initial?.address ?? "",
      asking_price: initial?.asking_price?.toString() ?? "",
      stock_value: initial?.stock_value?.toString() ?? "",
      revenue: initial?.revenue?.toString() ?? "",
      weekly_sales_min: initial?.weekly_sales_min?.toString() ?? "",
      weekly_sales_max: initial?.weekly_sales_max?.toString() ?? "",
      normalised_profit: initial?.normalised_profit?.toString() ?? "",
      ebitda: initial?.ebitda?.toString() ?? "",
      rent_per_year: initial?.rent_per_year?.toString() ?? "",
      lease_expiry: initial?.lease_expiry ?? "",
      renewal_rights: initial?.renewal_rights ?? "",
      staff_summary: initial?.staff_summary ?? "",
      owner_involvement: initial?.owner_involvement ?? "",
      opening_hours: initial?.opening_hours ?? "",
      broker_notes: initial?.broker_notes ?? "",
      status: (initial?.status as BusinessStatus) ?? "draft",
    },
  });

  const locationMode = form.watch("location_mode");

  const onSubmit = form.handleSubmit(async (values) => {
    if (!user) {
      toast.error("You must be signed in.");
      return;
    }
    setSubmitting(true);
    const toNum = (v?: string) => (v && v.trim() !== "" ? Number(v) : null);
    const payload = {
      name: values.name.trim(),
      public_title: values.public_title?.trim() || null,
      confidential_title: values.confidential_title?.trim() || null,
      business_type: values.business_type?.trim() || null,
      industry: values.industry?.trim() || null,
      location_mode: values.location_mode,
      suburb: values.suburb?.trim() || null,
      city: values.city?.trim() || null,
      region: values.region?.trim() || null,
      address: values.address?.trim() || null,
      asking_price: toNum(values.asking_price),
      stock_value: toNum(values.stock_value),
      revenue: toNum(values.revenue),
      weekly_sales_min: toNum(values.weekly_sales_min),
      weekly_sales_max: toNum(values.weekly_sales_max),
      normalised_profit: toNum(values.normalised_profit),
      ebitda: toNum(values.ebitda),
      rent_per_year: toNum(values.rent_per_year),
      lease_expiry: values.lease_expiry?.trim() || null,
      renewal_rights: values.renewal_rights?.trim() || null,
      staff_summary: values.staff_summary?.trim() || null,
      owner_involvement: values.owner_involvement?.trim() || null,
      opening_hours: values.opening_hours?.trim() || null,
      broker_notes: values.broker_notes?.trim() || null,
      status: values.status,
    };

    try {
      if (initial?.id) {
        const { error } = await supabase
          .from("businesses")
          .update(payload)
          .eq("id", initial.id);
        if (error) throw error;
        toast.success("Business updated");
        navigate(`/admin/businesses/${initial.id}`);
      } else {
        const { data, error } = await supabase
          .from("businesses")
          .insert({ ...payload, created_by: user.id })
          .select("id")
          .single();
        if (error) throw error;
        toast.success("Business created");
        navigate(`/admin/businesses/${data.id}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Save failed";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-12 animate-rise">
      <Section
        eyebrow="01"
        title="Identity"
        description="How this listing is referenced across your console and presented to buyers."
      >
        <Grid cols={2}>
          <Field label="Business name" required error={form.formState.errors.name?.message}>
            <input className="lumi-input" {...form.register("name")} />
          </Field>
          <Field label="Public display title" hint="Shown openly. Use a generic identifier.">
            <input className="lumi-input" {...form.register("public_title")} />
          </Field>
          <Field label="Confidential display title" hint="Shown to approved buyers only.">
            <input className="lumi-input" {...form.register("confidential_title")} />
          </Field>
          <Field label="Business type">
            <input className="lumi-input" placeholder="e.g. Café, Restaurant, Retail" {...form.register("business_type")} />
          </Field>
          <Field label="Industry">
            <input className="lumi-input" placeholder="e.g. Hospitality" {...form.register("industry")} />
          </Field>
        </Grid>
      </Section>

      <Section
        eyebrow="02"
        title="Location & confidentiality"
        description="Choose how much of the location is exposed before NDA."
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
          {(["blind", "suburb", "exact"] as LocationMode[]).map((mode) => {
            const active = locationMode === mode;
            const titles = {
              blind: "Blind",
              suburb: "Approximate suburb",
              exact: "Exact location",
            } as const;
            const desc = {
              blind: "Region-level only. No suburb, no pin, no landmarks.",
              suburb: "Suburb shown. No address, no exact pin.",
              exact: "Full address and approved landmarks.",
            } as const;
            return (
              <label
                key={mode}
                className={`relative cursor-pointer rounded-md border p-5 transition-all ${
                  active
                    ? "border-primary/60 bg-primary/5 shadow-cinema"
                    : "hairline hover:border-primary/30"
                }`}
              >
                <input
                  type="radio"
                  value={mode}
                  className="sr-only"
                  {...form.register("location_mode")}
                />
                <div className="font-mono-brand text-[9px] tracking-eyebrow uppercase text-primary mb-2">
                  Mode
                </div>
                <div className="font-display text-xl tracking-display mb-2">{titles[mode]}</div>
                <div className="text-xs text-muted-foreground leading-relaxed">{desc[mode]}</div>
              </label>
            );
          })}
        </div>
        <Grid cols={2}>
          <Field label="Suburb">
            <input className="lumi-input" {...form.register("suburb")} />
          </Field>
          <Field label="City">
            <input className="lumi-input" {...form.register("city")} />
          </Field>
          <Field label="Region">
            <input className="lumi-input" {...form.register("region")} />
          </Field>
          <Field label="Exact address" hint="Visible to buyers only when mode is Exact location.">
            <input className="lumi-input" {...form.register("address")} />
          </Field>
        </Grid>
      </Section>

      <Section eyebrow="03" title="Financials" description="All figures in NZD.">
        <Grid cols={2}>
          <Field label="Asking price">
            <NumberInput name="asking_price" form={form} />
          </Field>
          <Field label="Stock value">
            <NumberInput name="stock_value" form={form} />
          </Field>
          <Field label="Annual revenue">
            <NumberInput name="revenue" form={form} />
          </Field>
          <Field label="Normalised profit">
            <NumberInput name="normalised_profit" form={form} />
          </Field>
          <Field label="Weekly sales (min)">
            <NumberInput name="weekly_sales_min" form={form} />
          </Field>
          <Field label="Weekly sales (max)">
            <NumberInput name="weekly_sales_max" form={form} />
          </Field>
          <Field label="EBITDA / owner profit">
            <NumberInput name="ebitda" form={form} />
          </Field>
        </Grid>
      </Section>

      <Section eyebrow="04" title="Lease & operations">
        <Grid cols={2}>
          <Field label="Rent per year">
            <NumberInput name="rent_per_year" form={form} />
          </Field>
          <Field label="Lease expiry">
            <input type="date" className="lumi-input" {...form.register("lease_expiry")} />
          </Field>
          <Field label="Renewal rights" hint="e.g. 2 x 3 years">
            <input className="lumi-input" {...form.register("renewal_rights")} />
          </Field>
          <Field label="Opening hours">
            <input className="lumi-input" placeholder="e.g. Mon–Sun 7am – 9pm" {...form.register("opening_hours")} />
          </Field>
          <Field label="Staff summary" full>
            <textarea rows={3} className="lumi-input resize-none" {...form.register("staff_summary")} />
          </Field>
          <Field label="Owner involvement" full>
            <textarea rows={3} className="lumi-input resize-none" {...form.register("owner_involvement")} />
          </Field>
        </Grid>
      </Section>

      <Section
        eyebrow="05"
        title="Internal"
        description="Broker-only notes and lifecycle status. Never shown to buyers."
      >
        <Grid cols={2}>
          <Field label="Status">
            <select className="lumi-input" {...form.register("status")}>
              {BUSINESS_STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Broker notes" full>
            <textarea rows={5} className="lumi-input resize-none" {...form.register("broker_notes")} />
          </Field>
        </Grid>
      </Section>

      <div className="sticky bottom-0 -mx-6 md:-mx-12 px-6 md:px-12 py-5 border-t hairline bg-background/85 backdrop-blur-xl flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => navigate(initial?.id ? `/admin/businesses/${initial.id}` : "/admin/businesses")}
          className="lumi-btn-ghost"
          disabled={submitting}
        >
          Cancel
        </button>
        <button type="submit" className="lumi-btn-primary" disabled={submitting}>
          {submitting ? "Saving…" : initial?.id ? "Save changes" : "Create listing"}
        </button>
      </div>
    </form>
  );
}

function Section({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-10 pt-10 border-t hairline first:border-t-0 first:pt-0">
      <div>
        <div className="font-mono-brand text-[10px] tracking-eyebrow uppercase text-primary mb-3 flex items-center gap-3">
          <span className="h-px w-6 bg-primary" />
          {eyebrow}
        </div>
        <h2 className="font-display text-2xl tracking-display leading-tight">{title}</h2>
        {description && (
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{description}</p>
        )}
      </div>
      <div>{children}</div>
    </section>
  );
}

function Grid({ cols = 2, children }: { cols?: 1 | 2; children: React.ReactNode }) {
  return (
    <div
      className={`grid grid-cols-1 ${cols === 2 ? "md:grid-cols-2" : ""} gap-x-6 gap-y-6`}
    >
      {children}
    </div>
  );
}

function Field({
  label,
  hint,
  required,
  error,
  full,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  error?: string;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={full ? "md:col-span-2" : undefined}>
      <label className="block font-mono-brand text-[9px] tracking-eyebrow uppercase text-muted-foreground mb-2">
        {label}
        {required && <span className="text-primary ml-1">*</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-2 text-[11px] text-muted-foreground/70">{hint}</p>}
      {error && <p className="mt-2 text-[11px] text-destructive">{error}</p>}
    </div>
  );
}

function NumberInput({
  name,
  form,
}: {
  name: keyof BusinessFormValues;
  form: ReturnType<typeof useForm<BusinessFormValues>>;
}) {
  return (
    <div className="relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono-brand text-[10px] tracking-eyebrow uppercase text-muted-foreground/60 pointer-events-none">
        NZ$
      </span>
      <input
        type="number"
        step="any"
        inputMode="decimal"
        className="lumi-input pl-12"
        {...form.register(name)}
      />
    </div>
  );
}