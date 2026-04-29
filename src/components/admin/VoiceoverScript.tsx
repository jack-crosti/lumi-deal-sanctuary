import { useEffect, useState } from "react";
import { Mic, Loader2, Save, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type VoiceoverStyle =
  | "professional"
  | "calm"
  | "premium"
  | "direct"
  | "warm"
  | "investor";

type VoiceoverApproval = "draft" | "needs_review" | "approved";

const STYLE_OPTIONS: { value: VoiceoverStyle; label: string; hint: string }[] = [
  { value: "professional", label: "Professional", hint: "Confident, broker-led" },
  { value: "calm", label: "Calm", hint: "Measured, considered pace" },
  { value: "premium", label: "Premium", hint: "Cinematic, brand-led" },
  { value: "direct", label: "Direct", hint: "Plain, no fluff" },
  { value: "warm", label: "Warm", hint: "Personal, owner story" },
  { value: "investor", label: "Investor-style", hint: "Numbers and thesis" },
];

const APPROVAL_OPTIONS: {
  value: VoiceoverApproval;
  label: string;
  tone: string;
}[] = [
  { value: "draft", label: "Draft", tone: "bg-muted text-muted-foreground border-border" },
  {
    value: "needs_review",
    label: "Needs review",
    tone: "bg-amber-500/15 text-amber-300 border-amber-500/40",
  },
  {
    value: "approved",
    label: "Approved",
    tone: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
  },
];

const SECTION_FIELDS: {
  key:
    | "opening"
    | "location"
    | "business_overview"
    | "financials"
    | "growth"
    | "next_steps";
  label: string;
  hint: string;
}[] = [
  { key: "opening", label: "Opening", hint: "Set the scene in 2–3 sentences." },
  {
    key: "location",
    label: "Location",
    hint: "Why this location matters — respect the confidentiality mode.",
  },
  {
    key: "business_overview",
    label: "Business overview",
    hint: "What it is, who it serves, what makes it work.",
  },
  {
    key: "financials",
    label: "Financials",
    hint: "Speak only to figures that exist in the snapshot.",
  },
  {
    key: "growth",
    label: "Growth opportunity",
    hint: "Realistic levers — no invented forecasts.",
  },
  {
    key: "next_steps",
    label: "Next steps",
    hint: "How a serious buyer should engage from here.",
  },
];

interface ScriptRow {
  id?: string;
  business_id: string;
  style: VoiceoverStyle;
  approval_status: VoiceoverApproval;
  preview_text: string | null;
  opening: string | null;
  location: string | null;
  business_overview: string | null;
  financials: string | null;
  growth: string | null;
  next_steps: string | null;
}

const emptyScript = (businessId: string): ScriptRow => ({
  business_id: businessId,
  style: "professional",
  approval_status: "draft",
  preview_text: null,
  opening: null,
  location: null,
  business_overview: null,
  financials: null,
  growth: null,
  next_steps: null,
});

export default function VoiceoverScript({ businessId }: { businessId: string }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [script, setScript] = useState<ScriptRow | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("voiceover_scripts")
        .select("*")
        .eq("business_id", businessId)
        .maybeSingle<ScriptRow>();
      if (!active) return;
      if (error) {
        toast.error(error.message);
      }
      setScript(data ?? emptyScript(businessId));
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [businessId]);

  const update = <K extends keyof ScriptRow>(key: K, value: ScriptRow[K]) =>
    setScript((s) => (s ? { ...s, [key]: value } : s));

  const onSave = async () => {
    if (!script) return;
    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    const payload = {
      business_id: businessId,
      style: script.style,
      approval_status: script.approval_status,
      preview_text: script.preview_text,
      opening: script.opening,
      location: script.location,
      business_overview: script.business_overview,
      financials: script.financials,
      growth: script.growth,
      next_steps: script.next_steps,
      updated_by: userData.user?.id ?? null,
    };
    const { data, error } = await supabase
      .from("voiceover_scripts")
      .upsert(payload, { onConflict: "business_id" })
      .select()
      .maybeSingle<ScriptRow>();
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data) setScript(data);
    toast.success("Voiceover script saved");
  };

  if (loading || !script) {
    return (
      <div className="flex items-center gap-3 text-sm text-muted-foreground py-10">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading voiceover script…
      </div>
    );
  }

  const approvalMeta =
    APPROVAL_OPTIONS.find((o) => o.value === script.approval_status) ??
    APPROVAL_OPTIONS[0];

  return (
    <section className="space-y-6 pt-2">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Mic className="h-4 w-4 text-primary" strokeWidth={1.5} />
          <h3 className="font-display text-xl tracking-display">Voiceover script</h3>
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full border font-mono-brand text-[10px] tracking-eyebrow uppercase ${approvalMeta.tone}`}
          >
            {approvalMeta.label}
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground max-w-md text-right">
          Drafts the broker walkthrough audio. Text-to-speech is not connected yet — once it is,
          only approved scripts will produce buyer-facing audio.
        </p>
      </div>

      {/* Controls strip */}
      <div className="lumi-card p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
        <label className="block">
          <span className="font-mono-brand text-[9px] tracking-eyebrow uppercase text-muted-foreground">
            Voiceover style
          </span>
          <div className="mt-2 flex flex-wrap gap-2">
            {STYLE_OPTIONS.map((opt) => {
              const active = script.style === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => update("style", opt.value)}
                  className={`px-3 py-1.5 rounded-sm border font-mono-brand text-[10px] tracking-eyebrow uppercase transition-colors ${
                    active
                      ? "border-primary/60 bg-primary/10 text-primary"
                      : "hairline text-muted-foreground hover:text-foreground hover:border-primary/30"
                  }`}
                  title={opt.hint}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </label>

        <label className="block">
          <span className="font-mono-brand text-[9px] tracking-eyebrow uppercase text-muted-foreground">
            Approval status
          </span>
          <div className="mt-2 flex flex-wrap gap-2">
            {APPROVAL_OPTIONS.map((opt) => {
              const active = script.approval_status === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => update("approval_status", opt.value)}
                  className={`px-3 py-1.5 rounded-sm border font-mono-brand text-[10px] tracking-eyebrow uppercase transition-colors ${
                    active
                      ? "border-primary/60 bg-primary/10 text-primary"
                      : "hairline text-muted-foreground hover:text-foreground hover:border-primary/30"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </label>
      </div>

      {/* Section editors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {SECTION_FIELDS.map((s) => {
          const value = (script[s.key] as string | null) ?? "";
          const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
          const seconds = Math.round((wordCount / 150) * 60);
          return (
            <div key={s.key} className="lumi-card p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono-brand text-[10px] tracking-eyebrow uppercase text-foreground">
                  {s.label}
                </span>
                <span className="font-mono-brand text-[9px] tracking-eyebrow uppercase text-muted-foreground tabular-nums">
                  {wordCount} words · ~{seconds}s
                </span>
              </div>
              <textarea
                rows={6}
                value={value}
                onChange={(e) => update(s.key, e.target.value || null)}
                placeholder={s.hint}
                className="w-full rounded-sm border hairline bg-card/40 p-3 text-sm leading-relaxed focus:outline-none focus:border-primary/50"
              />
              <p className="mt-2 text-[11px] text-muted-foreground">{s.hint}</p>
            </div>
          );
        })}
      </div>

      {/* Preview text */}
      <div className="lumi-card p-5">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span className="font-mono-brand text-[10px] tracking-eyebrow uppercase">
            Preview text
          </span>
          <span className="text-[11px] text-muted-foreground">
            Short teaser shown next to the audio player on the buyer page.
          </span>
        </div>
        <textarea
          rows={3}
          value={script.preview_text ?? ""}
          onChange={(e) => update("preview_text", e.target.value || null)}
          placeholder="One or two sentences that introduce the walkthrough."
          className="w-full rounded-sm border hairline bg-card/40 p-3 text-sm leading-relaxed focus:outline-none focus:border-primary/50"
        />
      </div>

      <div className="flex items-center justify-end gap-2">
        <button
          onClick={onSave}
          disabled={saving}
          className="lumi-btn-primary inline-flex items-center gap-2 disabled:opacity-60"
        >
          {saving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          Save script
        </button>
      </div>
    </section>
  );
}
