import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  BUYER_STATUS_OPTIONS,
  BUYER_TYPE_OPTIONS,
  CA_STATUS_OPTIONS,
  FINANCE_STATUS_OPTIONS,
  OWNER_INTENT_OPTIONS,
} from "@/lib/buyerLabels";

const numericString = z
  .string()
  .optional()
  .refine((v) => !v || !Number.isNaN(Number(v)), { message: "Must be a number" });

const schema = z.object({
  first_name: z.string().max(80).optional().or(z.literal("")),
  last_name: z.string().max(80).optional().or(z.literal("")),
  email: z.string().email("Valid email required"),
  phone: z.string().max(40).optional().or(z.literal("")),
  company: z.string().max(160).optional().or(z.literal("")),
  buyer_type: z.enum(["individual", "company", "investor", "family_office", "other"]).optional().or(z.literal("")),
  budget_min: numericString,
  budget_max: numericString,
  finance_status: z.enum(["unknown", "self_funded", "pre_approved", "needs_finance", "not_disclosed"]),
  hospitality_experience: z.string().max(800).optional().or(z.literal("")),
  preferred_business_type: z.string().max(160).optional().or(z.literal("")),
  preferred_location: z.string().max(160).optional().or(z.literal("")),
  owner_intent: z.enum(["working_owner", "investor", "either"]).optional().or(z.literal("")),
  ca_status: z.enum(["not_sent", "sent", "signed", "approved"]),
  buyer_status: z.enum(["new", "active", "warm", "hot", "not_suitable", "archived"]),
  admin_notes: z.string().max(4000).optional().or(z.literal("")),
});

export type BuyerFormValues = z.infer<typeof schema>;

export interface BuyerFormInitial extends Partial<BuyerFormValues> {
  id?: string;
  is_pending?: boolean;
}

export function BuyerForm({ initial }: { initial?: BuyerFormInitial }) {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<BuyerFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      first_name: initial?.first_name ?? "",
      last_name: initial?.last_name ?? "",
      email: initial?.email ?? "",
      phone: initial?.phone ?? "",
      company: initial?.company ?? "",
      buyer_type: (initial?.buyer_type as BuyerFormValues["buyer_type"]) ?? "",
      budget_min: initial?.budget_min?.toString() ?? "",
      budget_max: initial?.budget_max?.toString() ?? "",
      finance_status: (initial?.finance_status as BuyerFormValues["finance_status"]) ?? "unknown",
      hospitality_experience: initial?.hospitality_experience ?? "",
      preferred_business_type: initial?.preferred_business_type ?? "",
      preferred_location: initial?.preferred_location ?? "",
      owner_intent: (initial?.owner_intent as BuyerFormValues["owner_intent"]) ?? "",
      ca_status: (initial?.ca_status as BuyerFormValues["ca_status"]) ?? "not_sent",
      buyer_status: (initial?.buyer_status as BuyerFormValues["buyer_status"]) ?? "new",
      admin_notes: initial?.admin_notes ?? "",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitting(true);
    const toNum = (v?: string) => (v && v.trim() !== "" ? Number(v) : null);
    const payload = {
      first_name: values.first_name?.trim() || null,
      last_name: values.last_name?.trim() || null,
      email: values.email.trim().toLowerCase(),
      phone: values.phone?.trim() || null,
      company: values.company?.trim() || null,
      buyer_type: (values.buyer_type ? values.buyer_type : null) as
        | "individual" | "company" | "investor" | "family_office" | "other" | null,
      budget_min: toNum(values.budget_min),
      budget_max: toNum(values.budget_max),
      finance_status: values.finance_status,
      hospitality_experience: values.hospitality_experience?.trim() || null,
      preferred_business_type: values.preferred_business_type?.trim() || null,
      preferred_location: values.preferred_location?.trim() || null,
      owner_intent: (values.owner_intent ? values.owner_intent : null) as
        | "working_owner" | "investor" | "either" | null,
      ca_status: values.ca_status,
      buyer_status: values.buyer_status,
      admin_notes: values.admin_notes?.trim() || null,
      full_name: [values.first_name, values.last_name].filter(Boolean).join(" ").trim() || null,
    };

    try {
      if (initial?.id) {
        const { error } = await supabase
          .from("profiles")
          .update(payload)
          .eq("id", initial.id);
        if (error) throw error;
        toast.success("Buyer updated");
        navigate(`/admin/buyers/${initial.id}`);
      } else {
        // Pre-create a placeholder profile row. They become a real buyer when they sign up.
        const placeholderId = crypto.randomUUID();
        const { error } = await supabase
          .from("profiles")
          .insert([{ ...payload, id: placeholderId, is_pending: true }]);
        if (error) {
          if (error.code === "23505" || /duplicate/i.test(error.message)) {
            toast.error("A buyer with this email already exists.");
          } else {
            throw error;
          }
          return;
        }
        toast.success("Buyer created");
        navigate(`/admin/buyers/${placeholderId}`);
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
      <Section eyebrow="01" title="Identity" description="Who is this buyer.">
        <Grid>
          <Field label="First name"><input className="lumi-input" {...form.register("first_name")} /></Field>
          <Field label="Last name"><input className="lumi-input" {...form.register("last_name")} /></Field>
          <Field label="Email" required error={form.formState.errors.email?.message}>
            <input className="lumi-input" type="email" disabled={!!initial?.id && !initial?.is_pending} {...form.register("email")} />
          </Field>
          <Field label="Phone"><input className="lumi-input" {...form.register("phone")} /></Field>
          <Field label="Company name" full><input className="lumi-input" {...form.register("company")} /></Field>
        </Grid>
      </Section>

      <Section eyebrow="02" title="Profile" description="How they buy and what they're looking for.">
        <Grid>
          <Field label="Buyer type">
            <select className="lumi-input" {...form.register("buyer_type")}>
              <option value="">—</option>
              {BUYER_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
          <Field label="Working owner or investor">
            <select className="lumi-input" {...form.register("owner_intent")}>
              <option value="">—</option>
              {OWNER_INTENT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
          <Field label="Budget — min"><NumberInput name="budget_min" form={form} /></Field>
          <Field label="Budget — max"><NumberInput name="budget_max" form={form} /></Field>
          <Field label="Finance status">
            <select className="lumi-input" {...form.register("finance_status")}>
              {FINANCE_STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
          <Field label="Preferred business type">
            <input className="lumi-input" placeholder="e.g. Café, Retail" {...form.register("preferred_business_type")} />
          </Field>
          <Field label="Preferred location" full>
            <input className="lumi-input" placeholder="e.g. Auckland CBD" {...form.register("preferred_location")} />
          </Field>
          <Field label="Hospitality experience" full>
            <textarea rows={3} className="lumi-input resize-none" {...form.register("hospitality_experience")} />
          </Field>
        </Grid>
      </Section>

      <Section eyebrow="03" title="Status & internal" description="Broker-only.">
        <Grid>
          <Field label="Buyer status">
            <select className="lumi-input" {...form.register("buyer_status")}>
              {BUYER_STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
          <Field label="Confidentiality agreement">
            <select className="lumi-input" {...form.register("ca_status")}>
              {CA_STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
          <Field label="Admin notes" full>
            <textarea rows={5} className="lumi-input resize-none" {...form.register("admin_notes")} />
          </Field>
        </Grid>
      </Section>

      <div className="sticky bottom-0 -mx-6 md:-mx-12 px-6 md:px-12 py-5 border-t hairline bg-background/85 backdrop-blur-xl flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => navigate(initial?.id ? `/admin/buyers/${initial.id}` : "/admin/buyers")}
          className="lumi-btn-ghost"
          disabled={submitting}
        >
          Cancel
        </button>
        <button type="submit" className="lumi-btn-primary" disabled={submitting}>
          {submitting ? "Saving…" : initial?.id ? "Save changes" : "Create buyer"}
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
        {description && <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{description}</p>}
      </div>
      <div>{children}</div>
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">{children}</div>;
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
  name: keyof BuyerFormValues;
  form: ReturnType<typeof useForm<BuyerFormValues>>;
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