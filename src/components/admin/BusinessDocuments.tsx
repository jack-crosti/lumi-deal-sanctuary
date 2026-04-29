import { useEffect, useRef, useState } from "react";
import { Upload, Trash2, Download, Eye, Loader2, FileText, Pencil, X, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatRelative } from "@/lib/format";
import {
  DOCUMENT_TYPE_OPTIONS,
  DOCUMENT_AVAILABILITY_OPTIONS,
  documentTypeLabel,
  documentAvailabilityLabel,
  formatBytes,
  type DocumentType,
  type DocumentAvailability,
} from "@/lib/documentLabels";
import { ACCESS_LEVEL_OPTIONS, accessLevelLabel, type AccessLevel } from "@/lib/buyerLabels";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const BUCKET = "business-documents";

interface DocRow {
  id: string;
  business_id: string;
  title: string;
  doc_type: DocumentType;
  storage_path: string | null;
  mime_type: string | null;
  file_size: number | null;
  availability: DocumentAvailability;
  required_access_level: AccessLevel;
  download_allowed: boolean;
  notes: string | null;
  uploaded_by: string | null;
  created_at: string;
}

export default function BusinessDocuments({ businessId }: { businessId: string }) {
  const [rows, setRows] = useState<DocRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // upload form state
  const [form, setForm] = useState({
    title: "",
    doc_type: "im" as DocumentType,
    availability: "hidden" as DocumentAvailability,
    required_access_level: "im" as AccessLevel,
    download_allowed: false,
    notes: "",
  });

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("documents")
      .select(
        "id, business_id, title, doc_type, storage_path, mime_type, file_size, availability, required_access_level, download_allowed, notes, uploaded_by, created_at"
      )
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setRows((data ?? []) as DocRow[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);

  const onUpload = async (file: File) => {
    if (!form.title.trim()) {
      toast.error("Add a document title first");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.includes(".") ? file.name.split(".").pop() : "";
      const path = `${businessId}/${crypto.randomUUID()}${ext ? "." + ext : ""}`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;

      const { data: userRes } = await supabase.auth.getUser();

      const { error: insErr } = await supabase.from("documents").insert({
        business_id: businessId,
        title: form.title.trim(),
        doc_type: form.doc_type,
        storage_path: path,
        mime_type: file.type || null,
        file_size: file.size,
        availability: form.availability,
        required_access_level: form.required_access_level,
        download_allowed: form.download_allowed,
        notes: form.notes.trim() || null,
        uploaded_by: userRes.user?.id ?? null,
      });
      if (insErr) {
        await supabase.storage.from(BUCKET).remove([path]);
        throw insErr;
      }
      toast.success("Document uploaded");
      setForm({
        title: "",
        doc_type: "im",
        availability: "hidden",
        required_access_level: "im",
        download_allowed: false,
        notes: "",
      });
      if (fileRef.current) fileRef.current.value = "";
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const onDelete = async (doc: DocRow) => {
    if (doc.storage_path) {
      await supabase.storage.from(BUCKET).remove([doc.storage_path]);
    }
    const { error } = await supabase.from("documents").delete().eq("id", doc.id);
    if (error) return toast.error(error.message);
    toast.success("Document removed");
    load();
  };

  const previewDoc = async (doc: DocRow) => {
    if (!doc.storage_path) return;
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(doc.storage_path, 60 * 5);
    if (error || !data?.signedUrl) return toast.error(error?.message || "Could not generate link");
    window.open(data.signedUrl, "_blank", "noopener");
  };

  return (
    <div className="space-y-8">
      {/* Upload card */}
      <div className="lumi-card p-7 md:p-9">
        <div className="font-mono-brand text-[10px] tracking-eyebrow uppercase text-primary mb-5 flex items-center gap-3">
          <span className="h-px w-6 bg-primary" />
          Upload document
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Title">
            <input
              className="lumi-input"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Information Memorandum"
            />
          </Field>
          <Field label="Document type">
            <select
              className="lumi-input"
              value={form.doc_type}
              onChange={(e) => setForm((f) => ({ ...f, doc_type: e.target.value as DocumentType }))}
            >
              {DOCUMENT_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Visibility">
            <select
              className="lumi-input"
              value={form.availability}
              onChange={(e) =>
                setForm((f) => ({ ...f, availability: e.target.value as DocumentAvailability }))
              }
            >
              {DOCUMENT_AVAILABILITY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Required access level">
            <select
              className="lumi-input"
              value={form.required_access_level}
              onChange={(e) =>
                setForm((f) => ({ ...f, required_access_level: e.target.value as AccessLevel }))
              }
            >
              {ACCESS_LEVEL_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label} Access</option>
              ))}
            </select>
          </Field>
          <Field label="Download permission">
            <select
              className="lumi-input"
              value={form.download_allowed ? "allow" : "view"}
              onChange={(e) =>
                setForm((f) => ({ ...f, download_allowed: e.target.value === "allow" }))
              }
            >
              <option value="view">View Only</option>
              <option value="allow">Download Allowed</option>
            </select>
          </Field>
          <Field label="Notes (internal)">
            <input
              className="lumi-input"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Optional"
            />
          </Field>
          <div className="md:col-span-2 flex items-center gap-3">
            <input
              ref={fileRef}
              type="file"
              className="text-sm text-muted-foreground file:mr-3 file:rounded-sm file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:text-[10px] file:tracking-eyebrow file:uppercase file:font-mono-brand file:text-primary"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onUpload(f);
              }}
              disabled={uploading}
            />
            {uploading && (
              <span className="text-[11px] text-muted-foreground inline-flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading…
              </span>
            )}
            <span className="text-[11px] text-muted-foreground ml-auto inline-flex items-center gap-2">
              <Upload className="h-3.5 w-3.5" /> Stored privately. Buyers see only if permitted.
            </span>
          </div>
        </div>
      </div>

      {/* Document list */}
      <div className="lumi-card p-0 overflow-hidden">
        <div className="px-7 py-5 border-b hairline flex items-center justify-between">
          <div className="font-mono-brand text-[10px] tracking-eyebrow uppercase text-muted-foreground">
            {rows.length} {rows.length === 1 ? "document" : "documents"}
          </div>
        </div>
        {loading ? (
          <div className="p-12 text-center text-sm text-muted-foreground">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            No documents uploaded yet.
          </div>
        ) : (
          <ul className="divide-y hairline">
            {rows.map((d) => (
              <DocRowItem
                key={d.id}
                d={d}
                editing={editingId === d.id}
                onEdit={() => setEditingId(d.id)}
                onCancel={() => setEditingId(null)}
                onSaved={() => {
                  setEditingId(null);
                  load();
                }}
                onPreview={() => previewDoc(d)}
                onDelete={() => onDelete(d)}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function DocRowItem({
  d,
  editing,
  onEdit,
  onCancel,
  onSaved,
  onPreview,
  onDelete,
}: {
  d: DocRow;
  editing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSaved: () => void;
  onPreview: () => void;
  onDelete: () => void;
}) {
  const [draft, setDraft] = useState({
    title: d.title,
    doc_type: d.doc_type,
    availability: d.availability,
    required_access_level: d.required_access_level,
    download_allowed: d.download_allowed,
    notes: d.notes ?? "",
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("documents")
      .update({
        title: draft.title.trim(),
        doc_type: draft.doc_type,
        availability: draft.availability,
        required_access_level: draft.required_access_level,
        download_allowed: draft.download_allowed,
        notes: draft.notes.trim() || null,
      })
      .eq("id", d.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Document updated");
    onSaved();
  };

  if (editing) {
    return (
      <li className="px-7 py-5 bg-primary/[0.02]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            className="lumi-input md:col-span-2"
            value={draft.title}
            onChange={(e) => setDraft((s) => ({ ...s, title: e.target.value }))}
          />
          <select
            className="lumi-input"
            value={draft.doc_type}
            onChange={(e) => setDraft((s) => ({ ...s, doc_type: e.target.value as DocumentType }))}
          >
            {DOCUMENT_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <select
            className="lumi-input"
            value={draft.availability}
            onChange={(e) => setDraft((s) => ({ ...s, availability: e.target.value as DocumentAvailability }))}
          >
            {DOCUMENT_AVAILABILITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <select
            className="lumi-input"
            value={draft.required_access_level}
            onChange={(e) => setDraft((s) => ({ ...s, required_access_level: e.target.value as AccessLevel }))}
          >
            {ACCESS_LEVEL_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label} Access</option>
            ))}
          </select>
          <select
            className="lumi-input"
            value={draft.download_allowed ? "allow" : "view"}
            onChange={(e) => setDraft((s) => ({ ...s, download_allowed: e.target.value === "allow" }))}
          >
            <option value="view">View Only</option>
            <option value="allow">Download Allowed</option>
          </select>
          <input
            className="lumi-input md:col-span-2"
            placeholder="Notes"
            value={draft.notes}
            onChange={(e) => setDraft((s) => ({ ...s, notes: e.target.value }))}
          />
        </div>
        <div className="mt-3 flex items-center gap-2">
          <button onClick={save} disabled={saving} className="lumi-btn-primary">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            Save
          </button>
          <button onClick={onCancel} className="lumi-btn-ghost">
            <X className="h-3.5 w-3.5" />
            Cancel
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="px-7 py-5 flex items-start gap-4">
      <div className="mt-1 h-9 w-9 rounded-sm border hairline flex items-center justify-center text-muted-foreground">
        <FileText className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="font-medium text-sm truncate">{d.title}</div>
          <Pill>{documentTypeLabel(d.doc_type)}</Pill>
          <Pill tone={d.availability === "available" ? "good" : d.availability === "hidden" ? "muted" : "warn"}>
            {documentAvailabilityLabel(d.availability)}
          </Pill>
          <Pill>{accessLevelLabel(d.required_access_level)}+</Pill>
          <Pill tone={d.download_allowed ? "good" : "muted"}>
            {d.download_allowed ? "Download" : "View only"}
          </Pill>
        </div>
        <div className="mt-1 text-[11px] text-muted-foreground">
          {formatBytes(d.file_size)} · uploaded {formatRelative(d.created_at)}
          {d.notes ? <span className="ml-2 italic">— {d.notes}</span> : null}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button onClick={onPreview} className="lumi-btn-ghost" title="Preview">
          <Eye className="h-3.5 w-3.5" />
        </button>
        <button onClick={onPreview} className="lumi-btn-ghost" title="Open">
          <Download className="h-3.5 w-3.5" />
        </button>
        <button onClick={onEdit} className="lumi-btn-ghost" title="Edit">
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="lumi-btn-ghost text-destructive" title="Delete">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this document?</AlertDialogTitle>
              <AlertDialogDescription>
                The file will be removed from secure storage. Buyers will lose access immediately.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </li>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="font-mono-brand text-[9px] tracking-eyebrow uppercase text-muted-foreground mb-1.5">
        {label}
      </div>
      {children}
    </label>
  );
}

function Pill({
  children,
  tone = "muted",
}: {
  children: React.ReactNode;
  tone?: "muted" | "good" | "warn";
}) {
  const cls =
    tone === "good"
      ? "border-primary/40 text-primary bg-primary/5"
      : tone === "warn"
        ? "border-amber-500/40 text-amber-600 bg-amber-500/5"
        : "hairline text-muted-foreground";
  return (
    <span
      className={`inline-flex items-center rounded-sm border px-2 py-[2px] font-mono-brand text-[9px] tracking-eyebrow uppercase ${cls}`}
    >
      {children}
    </span>
  );
}