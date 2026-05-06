import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { FileText, Loader2, Sparkles, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Create-a-business-from-PDF entry point.
 *
 * Creates a minimal `businesses` row, uploads the IM PDF to `im-imports`,
 * inserts an `im_imports` row, kicks off the AI extraction edge function
 * and then navigates the admin to the new business's Presentation Studio
 * tab so they can review the generated draft.
 */
export default function CreateFromIMDialog({ open, onOpenChange }: Props) {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName("");
      setAdminNotes("");
      setFile(null);
      setBusy(false);
      setStage(null);
    }
  }, [open]);

  const submit = async () => {
    if (!name.trim()) {
      toast.error("Give the listing a working name first");
      return;
    }
    if (!file) {
      toast.error("Choose an IM PDF to import");
      return;
    }
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

      setStage("Creating listing…");
      const { data: biz, error: bizErr } = await supabase
        .from("businesses")
        .insert({ name: name.trim(), status: "draft", created_by: adminId })
        .select("id")
        .single();
      if (bizErr || !biz) throw new Error(bizErr?.message ?? "Could not create listing");

      setStage("Uploading PDF…");
      const path = `${biz.id}/${Date.now()}-${file.name.replace(/[^\w.\-]/g, "_")}`;
      const { error: upErr } = await supabase.storage
        .from("im-imports")
        .upload(path, file, { contentType: "application/pdf", upsert: false });
      if (upErr) throw new Error(`Upload failed: ${upErr.message}`);

      const { data: imp, error: insErr } = await supabase
        .from("im_imports")
        .insert({
          business_id: biz.id,
          admin_id: adminId,
          storage_path: path,
          file_name: file.name,
          file_size: file.size,
          admin_notes: adminNotes.trim() || null,
          status: "extracting",
        })
        .select("id")
        .single();
      if (insErr || !imp) throw new Error(insErr?.message ?? "Could not start import");

      setStage("Sending to AI for extraction…");
      // Fire-and-forget the AI call, then jump to the Presentation Studio with
      // the import id so it can hydrate the import dialog and poll for the
      // result. This keeps the admin in the studio (where the result lives)
      // while still surfacing errors via the import dialog itself.
      void supabase.functions.invoke("generate-presentation-from-im", {
        body: { import_id: imp.id },
      });

      toast.success("Listing created — opening Presentation Studio");
      onOpenChange(false);
      navigate(
        `/admin/businesses/${biz.id}?tab=presentation&openImport=${imp.id}`,
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      console.error("[CreateFromIM]", e);
      toast.error(msg);
    } finally {
      setBusy(false);
      setStage(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (busy ? null : onOpenChange(v))}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" strokeWidth={1.5} />
            Create listing from IM PDF
          </DialogTitle>
          <DialogDescription>
            Upload an Information Memorandum and we'll create a draft listing and
            generate an editable presentation grounded in the document. Nothing is
            published until you approve it.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          <label className="block">
            <span className="font-mono-brand text-[10px] tracking-eyebrow uppercase text-muted-foreground mb-2 block">
              Working name
            </span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ponsonby Cafe"
              className="lumi-input"
              disabled={busy}
            />
            <span className="block text-[11px] text-muted-foreground mt-1.5">
              Internal only — you can refine the public title after import.
            </span>
          </label>

          <label className="block">
            <span className="font-mono-brand text-[10px] tracking-eyebrow uppercase text-muted-foreground mb-2 block">
              IM PDF
            </span>
            <div
              className={`border border-dashed rounded-sm p-6 text-center cursor-pointer hover:border-primary/40 transition-colors ${
                file ? "border-primary/40 bg-primary/[0.03]" : "hairline"
              } ${busy ? "pointer-events-none opacity-60" : ""}`}
              onClick={() => document.getElementById("create-im-file")?.click()}
            >
              <input
                id="create-im-file"
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
              className="lumi-input min-h-[72px]"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Anything the AI should know — tone, audience, what to omit"
              disabled={busy}
            />
          </label>

          {stage && (
            <div className="text-[12px] text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              {stage}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t hairline">
            <button
              onClick={() => onOpenChange(false)}
              disabled={busy}
              className="lumi-btn-ghost"
            >
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={busy || !file || !name.trim()}
              className="lumi-btn-primary disabled:opacity-50"
            >
              {busy ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              Create & generate
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}