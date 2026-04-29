import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  Loader2,
  RefreshCw,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { blockLabel } from "@/lib/presentationBlocks";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId: string;
  hasPublished: boolean;
  onApplied: () => void;
}

type ImportStatus =
  | "uploading"
  | "extracting"
  | "generating"
  | "ready_for_review"
  | "applied"
  | "rejected"
  | "failed";

interface ExtractedFacts {
  business_name?: string | null;
  confidential_title?: string | null;
  business_type?: string | null;
  industry?: string | null;
  location?: string | null;
  asking_price?: string | null;
  revenue?: string | null;
  weekly_sales?: string | null;
  profit?: string | null;
  rent?: string | null;
  lease_terms?: string | null;
  staff_structure?: string | null;
  owner_involvement?: string | null;
  opening_hours?: string | null;
  key_strengths?: string[];
  growth_opportunities?: string[];
  buyer_fit?: string[];
  risks?: string[];
  due_diligence_notes?: string[];
}

interface GeneratedBlock {
  section_type: string;
  title?: string | null;
  subtitle?: string | null;
  body?: string | null;
  key_points?: string[];
}

interface ImportRow {
  id: string;
  business_id: string;
  status: ImportStatus;
  file_name: string | null;
  admin_notes: string | null;
  extracted_facts: ExtractedFacts | null;
  generated_blocks: GeneratedBlock[] | null;
  warnings: string[];
  error_message: string | null;
}

export default function IMImportDialog({
  open,
  onOpenChange,
  businessId,
  hasPublished,
  onApplied,
}: Props) {
  const [step, setStep] = useState<"upload" | "processing" | "review" | "error">(
    "upload",
  );
  const [file, setFile] = useState<File | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [importRow, setImportRow] = useState<ImportRow | null>(null);
  const [confirmApply, setConfirmApply] = useState(false);

  useEffect(() => {
    if (open) {
      setStep("upload");
      setFile(null);
      setAdminNotes("");
      setImportRow(null);
      setConfirmApply(false);
    }
  }, [open]);

  const startImport = async () => {
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Please upload a PDF file");
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      toast.error("PDF must be under 25 MB");
      return;
    }
    setBusy(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const adminId = auth.user?.id;
      if (!adminId) throw new Error("Not authenticated");

      const path = `${businessId}/${Date.now()}-${file.name.replace(/[^\w.\-]/g, "_")}`;
      const { error: upErr } = await supabase.storage
        .from("im-imports")
        .upload(path, file, { contentType: "application/pdf", upsert: false });
      if (upErr) {
        console.error("[IMImport] upload failed", upErr);
        throw new Error(`Upload failed: ${upErr.message}`);
      }

      const { data: row, error: insErr } = await supabase
        .from("im_imports")
        .insert({
          business_id: businessId,
          admin_id: adminId,
          storage_path: path,
          file_name: file.name,
          file_size: file.size,
          admin_notes: adminNotes.trim() || null,
          status: "extracting",
        })
        .select("*")
        .single();
      if (insErr || !row) {
        console.error("[IMImport] insert failed", insErr);
        throw new Error(insErr?.message ?? "Could not create import row");
      }

      setImportRow(row as unknown as ImportRow);
      setStep("processing");

      // Trigger generation
      const { data: gen, error: genErr } = await supabase.functions.invoke(
        "generate-presentation-from-im",
        { body: { import_id: row.id } },
      );
      const genErrorMsg = genErr
        ? ((gen as { error?: string } | null)?.error ?? genErr.message ?? "Generation failed")
        : null;
      if (genErrorMsg) {
        console.error("[IMImport] invoke error", genErr, gen);
        toast.error(genErrorMsg);
      }
      // Reload final row
      const { data: refreshed } = await supabase
        .from("im_imports")
        .select("*")
        .eq("id", row.id)
        .single();
      if (refreshed) {
        const r = refreshed as unknown as ImportRow;
        setImportRow(r);
        if (r.status === "ready_for_review") setStep("review");
        else if (r.status === "failed") setStep("error");
        else {
          // Stuck mid-pipeline (network drop, function timeout) — surface as error
          // so the user can retry instead of seeing an indefinite spinner.
          setImportRow({
            ...r,
            error_message:
              r.error_message ??
              genErrorMsg ??
              "Generation did not complete. The AI request may have timed out — try again.",
            status: "failed",
          });
          setStep("error");
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Upload failed";
      console.error("[IMImport] startImport failed", e);
      toast.error(msg);
      setStep("upload");
    } finally {
      setBusy(false);
    }
  };

  const regenerate = async () => {
    if (!importRow) return;
    setBusy(true);
    setStep("processing");
    await supabase
      .from("im_imports")
      .update({ status: "generating", error_message: null })
      .eq("id", importRow.id);
    const { error } = await supabase.functions.invoke(
      "generate-presentation-from-im",
      { body: { import_id: importRow.id } },
    );
    if (error) toast.error(error.message);
    const { data: refreshed } = await supabase
      .from("im_imports")
      .select("*")
      .eq("id", importRow.id)
      .single();
    if (refreshed) {
      const r = refreshed as unknown as ImportRow;
      setImportRow(r);
      setStep(r.status === "ready_for_review" ? "review" : "error");
    }
    setBusy(false);
  };

  const applyDraft = async () => {
    if (!importRow) return;
    if (hasPublished && !confirmApply) {
      setConfirmApply(true);
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("apply-im-import", {
      body: { import_id: importRow.id },
    });
    setBusy(false);
    if (error) {
      const msg = (data as { error?: string } | null)?.error ?? error.message;
      toast.error(msg);
      return;
    }
    toast.success(
      `Draft v${(data as { version_number?: number })?.version_number ?? ""} created`,
    );
    onApplied();
    onOpenChange(false);
  };

  const reject = async () => {
    if (!importRow) return;
    await supabase
      .from("im_imports")
      .update({ status: "rejected" })
      .eq("id", importRow.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" strokeWidth={1.5} />
            Generate Presentation From IM PDF
          </DialogTitle>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-5 pt-2">
            <p className="text-sm text-muted-foreground leading-[1.7]">
              Upload an Information Memorandum. The AI will extract key facts and draft a
              presentation grounded only in the document. Nothing is published — every
              block is marked Needs Review for your approval.
            </p>

            <label className="block">
              <span className="font-mono-brand text-[10px] tracking-eyebrow uppercase text-muted-foreground mb-2 block">
                IM PDF
              </span>
              <div
                className={`border border-dashed rounded-sm p-6 text-center cursor-pointer hover:border-primary/40 transition-colors ${
                  file ? "border-primary/40 bg-primary/[0.03]" : "hairline"
                }`}
                onClick={() => document.getElementById("im-file-input")?.click()}
              >
                <input
                  id="im-file-input"
                  type="file"
                  accept="application/pdf,.pdf"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
                {file ? (
                  <>
                    <FileText className="h-5 w-5 mx-auto text-primary mb-2" strokeWidth={1.5} />
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {(file.size / 1024 / 1024).toFixed(2)} MB · click to replace
                    </p>
                  </>
                ) : (
                  <>
                    <Upload className="h-5 w-5 mx-auto text-muted-foreground mb-2" strokeWidth={1.5} />
                    <p className="text-sm">Click to choose a PDF</p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Up to 25 MB · text-based PDFs work best
                    </p>
                  </>
                )}
              </div>
            </label>

            <label className="block">
              <span className="font-mono-brand text-[10px] tracking-eyebrow uppercase text-muted-foreground mb-2 block">
                Admin notes <span className="normal-case tracking-normal text-muted-foreground/60">(optional)</span>
              </span>
              <textarea
                className="lumi-input min-h-[88px]"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Anything the AI should know — e.g. tone, audience, what to omit"
              />
            </label>

            {hasPublished && (
              <div className="flex items-start gap-2 px-3 py-2 rounded-sm border border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-400">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                <p className="text-[12px] leading-[1.5]">
                  This business has a published presentation. Generation creates a new
                  draft version — your published one stays live until you publish the new
                  draft.
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button onClick={() => onOpenChange(false)} className="lumi-btn-ghost">
                Cancel
              </button>
              <button
                onClick={startImport}
                disabled={!file || busy}
                className="lumi-btn-primary disabled:opacity-50"
              >
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                Generate draft
              </button>
            </div>
          </div>
        )}

        {step === "processing" && (
          <div className="py-12 text-center space-y-3">
            <Loader2 className="h-6 w-6 mx-auto animate-spin text-primary" />
            <p className="text-sm">
              {importRow?.status === "extracting"
                ? "Reading the PDF…"
                : "Drafting your presentation…"}
            </p>
            <p className="text-[11px] text-muted-foreground">
              This usually takes 20–60 seconds.
            </p>
          </div>
        )}

        {step === "error" && importRow && (
          <div className="space-y-4 pt-2">
            <div className="px-3.5 py-3 rounded-sm border border-destructive/40 bg-destructive/5 text-destructive">
              <p className="font-mono-brand text-[10px] tracking-eyebrow uppercase mb-1">
                Generation failed
              </p>
              <p className="text-[12.5px] leading-[1.55]">
                {importRow.error_message ?? "Unknown error"}
              </p>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button onClick={() => onOpenChange(false)} className="lumi-btn-ghost">
                Close
              </button>
              <button onClick={regenerate} disabled={busy} className="lumi-btn-primary">
                <RefreshCw className="h-3.5 w-3.5" /> Try again
              </button>
            </div>
          </div>
        )}

        {step === "review" && importRow && (
          <div className="space-y-6 pt-2">
            <p className="text-[12.5px] text-muted-foreground leading-[1.7]">
              Review the extracted facts and generated blocks. Anything missing or
              uncertain is flagged below. When you apply, a new draft version is created
              with every block marked Needs Review.
            </p>

            {importRow.warnings?.length > 0 && (
              <section className="px-4 py-3 rounded-sm border border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-400">
                <div className="flex items-center gap-1.5 mb-2">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span className="font-mono-brand text-[10px] tracking-eyebrow uppercase">
                    Verify before applying
                  </span>
                </div>
                <ul className="text-[12px] leading-[1.55] space-y-1 list-disc list-inside">
                  {importRow.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </section>
            )}

            {importRow.extracted_facts && (
              <FactsPanel facts={importRow.extracted_facts} />
            )}

            {importRow.generated_blocks && (
              <BlocksPreview blocks={importRow.generated_blocks} />
            )}

            {hasPublished && confirmApply && (
              <div className="px-4 py-3 rounded-sm border border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400">
                <p className="text-[12.5px] leading-[1.55]">
                  This business already has a published presentation. Applying creates a
                  new draft version — the published one stays live. Press Apply again to
                  confirm.
                </p>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t hairline">
              <button onClick={reject} className="lumi-btn-ghost">
                <X className="h-3.5 w-3.5" /> Reject
              </button>
              <button onClick={regenerate} disabled={busy} className="lumi-btn-ghost">
                <RefreshCw className="h-3.5 w-3.5" /> Regenerate
              </button>
              <button
                onClick={applyDraft}
                disabled={busy}
                className="lumi-btn-primary disabled:opacity-50"
              >
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                {hasPublished && !confirmApply ? "Apply as draft" : "Confirm apply"}
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Facts panel ---------- */

function FactsPanel({ facts }: { facts: ExtractedFacts }) {
  const single: Array<[string, string | null | undefined]> = [
    ["Business name", facts.business_name],
    ["Confidential title", facts.confidential_title],
    ["Business type", facts.business_type],
    ["Industry", facts.industry],
    ["Location", facts.location],
    ["Asking price", facts.asking_price],
    ["Revenue", facts.revenue],
    ["Weekly sales", facts.weekly_sales],
    ["Profit", facts.profit],
    ["Rent", facts.rent],
    ["Lease terms", facts.lease_terms],
    ["Staff", facts.staff_structure],
    ["Owner involvement", facts.owner_involvement],
    ["Opening hours", facts.opening_hours],
  ];
  const lists: Array<[string, string[] | undefined]> = [
    ["Key strengths", facts.key_strengths],
    ["Growth opportunities", facts.growth_opportunities],
    ["Buyer fit", facts.buyer_fit],
    ["Risks", facts.risks],
    ["Due diligence notes", facts.due_diligence_notes],
  ];

  return (
    <section className="space-y-3">
      <h4 className="font-mono-brand text-[10px] tracking-eyebrow uppercase text-muted-foreground">
        Extracted key facts
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2.5">
        {single.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-3 py-1 border-b hairline">
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
              {label}
            </span>
            <span
              className={`text-[12.5px] text-right ${
                value ? "text-foreground" : "text-muted-foreground italic"
              }`}
            >
              {value ?? "Not stated"}
            </span>
          </div>
        ))}
      </div>

      {lists.map(([label, value]) =>
        value && value.length > 0 ? (
          <div key={label} className="pt-2">
            <p className="font-mono-brand text-[10px] tracking-eyebrow uppercase text-muted-foreground mb-1.5">
              {label}
            </p>
            <ul className="text-[12.5px] leading-[1.55] space-y-0.5 list-disc list-inside">
              {value.map((v, i) => (
                <li key={i}>{v}</li>
              ))}
            </ul>
          </div>
        ) : null,
      )}
    </section>
  );
}

/* ---------- Blocks preview ---------- */

function BlocksPreview({ blocks }: { blocks: GeneratedBlock[] }) {
  return (
    <section className="space-y-3">
      <h4 className="font-mono-brand text-[10px] tracking-eyebrow uppercase text-muted-foreground">
        Generated blocks ({blocks.length})
      </h4>
      <div className="space-y-2.5">
        {blocks.map((b, i) => (
          <div key={i} className="lumi-card p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-mono-brand text-[10px] tracking-eyebrow uppercase text-primary">
                {blockLabel(b.section_type as never) || b.section_type}
              </span>
              <span className="font-mono-brand text-[9px] tracking-eyebrow uppercase text-amber-600 dark:text-amber-400">
                Needs Review
              </span>
            </div>
            {b.title && (
              <p className="font-display text-base tracking-display">{b.title}</p>
            )}
            {b.subtitle && (
              <p className="text-xs text-muted-foreground">{b.subtitle}</p>
            )}
            {b.body && (
              <p className="text-[12.5px] text-foreground/80 mt-2 leading-[1.6] whitespace-pre-wrap">
                {b.body}
              </p>
            )}
            {Array.isArray(b.key_points) && b.key_points.length > 0 && (
              <ul className="text-[12px] mt-2 space-y-0.5 list-disc list-inside text-foreground/80">
                {b.key_points.map((k, idx) => (
                  <li key={idx}>{k}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}