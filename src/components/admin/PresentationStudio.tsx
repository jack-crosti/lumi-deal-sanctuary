import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  Plus,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Trash2,
  Loader2,
  GripVertical,
  Save,
  CheckCircle2,
  Layers,
  Pencil,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  ACCESS_LEVELS,
  BLOCK_TYPES,
  BLOCK_TYPE_MAP,
  DEFAULT_BLOCK_ORDER,
  PRESENTATION_STATUSES,
  REVIEW_STATUSES,
  VISIBILITIES,
  blockLabel,
  presentationStatusMeta,
  reviewStatusMeta,
  type AccessLevel,
  type BlockReviewStatus,
  type DocVisibility,
  type PresentationStatus,
  type SectionType,
} from "@/lib/presentationBlocks";
import PresentationPreview from "./PresentationPreview";
import PresentationHistory from "./PresentationHistory";
import PresentationAIWorkspace from "./PresentationAIWorkspace";
import IMImportDialog from "./IMImportDialog";
import VoiceoverScript from "./VoiceoverScript";
import { History as HistoryIcon, Sparkles, FileUp } from "lucide-react";

interface VersionRow {
  id: string;
  business_id: string;
  version_number: number;
  status: PresentationStatus;
  notes: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BlockRow {
  id: string;
  version_id: string;
  section_type: SectionType;
  position: number;
  title: string | null;
  subtitle: string | null;
  body: string | null;
  key_points: string[];
  image_refs: string[];
  visibility: DocVisibility;
  required_access_level: AccessLevel;
  is_hidden: boolean;
  review_status: BlockReviewStatus;
  content: Record<string, unknown> | null;
}

interface Props {
  businessId: string;
}

const SECTIONS_TABLE = "presentation_sections";
const VERSIONS_TABLE = "presentation_versions";

/* ---------------- Studio ---------------- */

export default function PresentationStudio({ businessId }: Props) {
  const [version, setVersion] = useState<VersionRow | null>(null);
  const [blocks, setBlocks] = useState<BlockRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<BlockRow | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [adding, setAdding] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [showSaveDraft, setShowSaveDraft] = useState(false);
  const [draftSummary, setDraftSummary] = useState("");
  const [historyKey, setHistoryKey] = useState(0);
  const [showAIWorkspace, setShowAIWorkspace] = useState(false);
  const [showIMImport, setShowIMImport] = useState(false);
  const [hasPublished, setHasPublished] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [pendingImportId, setPendingImportId] = useState<string | null>(null);

  // If we arrived here from the Create-from-PDF flow with ?openImport=<id>,
  // open the import dialog hydrated from that row so the admin can watch the
  // AI extraction finish (or recover from a failure).
  useEffect(() => {
    const id = searchParams.get("openImport");
    if (id) {
      setPendingImportId(id);
      setShowIMImport(true);
    }
  }, [searchParams]);

  const load = async () => {
    setLoading(true);
    // Get the latest non-archived working version (draft / review / ready / published)
    const { data: existing } = await supabase
      .from(VERSIONS_TABLE)
      .select("*")
      .eq("business_id", businessId)
      .order("version_number", { ascending: false })
      .limit(1);

    let v = (existing?.[0] as VersionRow | undefined) ?? null;

    if (!v) {
      // Seed a v1 draft with the default block order
      const { data: created, error } = await supabase
        .from(VERSIONS_TABLE)
        .insert({
          business_id: businessId,
          version_number: 1,
          status: "draft" as PresentationStatus,
        })
        .select("*")
        .single();
      if (error || !created) {
        toast.error(error?.message ?? "Could not create presentation");
        setLoading(false);
        return;
      }
      v = created as VersionRow;

      const seedRows = DEFAULT_BLOCK_ORDER.map((t, i) => defaultBlockSeed(v!.id, t, i));
      const { error: seedErr } = await supabase.from(SECTIONS_TABLE).insert(seedRows as never);
      if (seedErr) toast.error(seedErr.message);
    }

    setVersion(v);
    const { data: rows, error: rowsErr } = await supabase
      .from(SECTIONS_TABLE)
      .select("*")
      .eq("version_id", v.id)
      .order("position", { ascending: true });
    if (rowsErr) toast.error(rowsErr.message);
    setBlocks((rows ?? []).map(rowToBlock));
    setLoading(false);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);

  // Track whether business has any published version (for IM-import warning)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from(VERSIONS_TABLE)
        .select("id")
        .eq("business_id", businessId)
        .eq("status", "published")
        .limit(1);
      if (!cancelled) setHasPublished((data?.length ?? 0) > 0);
    })();
    return () => {
      cancelled = true;
    };
  }, [businessId, version?.status]);

  const updateStatus = async (status: PresentationStatus) => {
    if (!version) return;
    const patch: Partial<VersionRow> = { status };
    if (status === "published") {
      (patch as Record<string, unknown>).published_at = new Date().toISOString();
    }
    const { error } = await supabase
      .from(VERSIONS_TABLE)
      .update(patch as never)
      .eq("id", version.id);
    if (error) return toast.error(error.message);
    toast.success(`Presentation ${presentationStatusMeta(status).label.toLowerCase()}`);
    setVersion({ ...version, ...patch } as VersionRow);
  };

  const saveBlock = async (b: BlockRow) => {
    setSaving(true);
    const { error } = await supabase
      .from(SECTIONS_TABLE)
      .update({
        title: b.title,
        subtitle: b.subtitle,
        body: b.body,
        key_points: b.key_points,
        image_refs: b.image_refs,
        visibility: b.visibility,
        required_access_level: b.required_access_level,
        is_hidden: b.is_hidden,
        review_status: b.review_status,
      } as never)
      .eq("id", b.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    setBlocks((prev) => (prev ? prev.map((x) => (x.id === b.id ? b : x)) : prev));
    toast.success("Block saved");
    setEditing(null);
  };

  const toggleHidden = async (b: BlockRow) => {
    const next = !b.is_hidden;
    const { error } = await supabase
      .from(SECTIONS_TABLE)
      .update({ is_hidden: next } as never)
      .eq("id", b.id);
    if (error) return toast.error(error.message);
    setBlocks((prev) =>
      prev ? prev.map((x) => (x.id === b.id ? { ...x, is_hidden: next } : x)) : prev,
    );
  };

  const move = async (b: BlockRow, dir: -1 | 1) => {
    if (!blocks) return;
    const idx = blocks.findIndex((x) => x.id === b.id);
    const swapIdx = idx + dir;
    if (idx < 0 || swapIdx < 0 || swapIdx >= blocks.length) return;
    const a = blocks[idx];
    const c = blocks[swapIdx];
    const next = [...blocks];
    next[idx] = { ...c, position: a.position };
    next[swapIdx] = { ...a, position: c.position };
    setBlocks(next.sort((x, y) => x.position - y.position));

    const { error: e1 } = await supabase
      .from(SECTIONS_TABLE)
      .update({ position: c.position } as never)
      .eq("id", a.id);
    const { error: e2 } = await supabase
      .from(SECTIONS_TABLE)
      .update({ position: a.position } as never)
      .eq("id", c.id);
    if (e1 || e2) toast.error(e1?.message || e2?.message || "Reorder failed");
  };

  const deleteBlock = async (b: BlockRow) => {
    const { error } = await supabase.from(SECTIONS_TABLE).delete().eq("id", b.id);
    if (error) return toast.error(error.message);
    setBlocks((prev) => (prev ? prev.filter((x) => x.id !== b.id) : prev));
    toast.success("Block removed");
  };

  const addBlock = async (type: SectionType) => {
    if (!version || !blocks) return;
    const nextPos = blocks.length > 0 ? Math.max(...blocks.map((b) => b.position)) + 10 : 0;
    const seed = defaultBlockSeed(version.id, type, nextPos);
    const { data, error } = await supabase
      .from(SECTIONS_TABLE)
      .insert(seed as never)
      .select("*")
      .single();
    if (error || !data) return toast.error(error?.message ?? "Could not add block");
    setBlocks((prev) => [...(prev ?? []), rowToBlock(data)]);
    setAdding(false);
    toast.success(`${blockLabel(type)} block added`);
  };

  const saveDraftSnapshot = async () => {
    if (!version) return;
    setSavingDraft(true);
    const { error } = await supabase.rpc(
      "save_presentation_snapshot" as never,
      {
        _version_id: version.id,
        _change_summary: draftSummary.trim() || null,
      } as never,
    );
    setSavingDraft(false);
    if (error) return toast.error(error.message);
    toast.success("Draft saved to history");
    setShowSaveDraft(false);
    setDraftSummary("");
    setHistoryKey((k) => k + 1);
  };

  const onRestored = async () => {
    await load();
    setHistoryKey((k) => k + 1);
  };

  if (loading || !version || !blocks) {
    return (
      <div className="lumi-card p-12 text-center text-sm text-muted-foreground flex items-center justify-center gap-3">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading Presentation Studio…
      </div>
    );
  }

  const meta = presentationStatusMeta(version.status);

  return (
    <div className="space-y-8">
      {/* Status & lifecycle bar */}
      <div className="lumi-card p-6 md:p-8">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div>
            <p className="font-mono-brand text-[10px] tracking-eyebrow uppercase text-muted-foreground mb-1.5">
              Working version
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-display text-2xl tracking-display">
                v{version.version_number}
              </span>
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-full border font-mono-brand text-[10px] tracking-eyebrow uppercase ${meta.tone}`}
              >
                {meta.label}
              </span>
              <span className="text-[11px] text-muted-foreground">{meta.hint}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setShowPreview(true)} className="lumi-btn-ghost">
              <Eye className="h-3.5 w-3.5" />
              Preview as buyer
            </button>
            <button onClick={() => setShowSaveDraft(true)} className="lumi-btn-ghost">
              <Save className="h-3.5 w-3.5" />
              Save draft
            </button>
            <button
              onClick={() => setShowAIWorkspace(true)}
              className="lumi-btn-ghost"
            >
              <Sparkles className="h-3.5 w-3.5" />
              AI Editor
            </button>
            <button
              onClick={() => setShowIMImport(true)}
              className="lumi-btn-ghost"
            >
              <FileUp className="h-3.5 w-3.5" />
              Generate from IM PDF
            </button>
            <button onClick={() => setAdding(true)} className="lumi-btn-primary">
              <Plus className="h-3.5 w-3.5" />
              Add block
            </button>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t hairline">
          <p className="font-mono-brand text-[9px] tracking-eyebrow uppercase text-muted-foreground mb-3">
            Lifecycle
          </p>
          <div className="flex flex-wrap gap-2">
            {PRESENTATION_STATUSES.map((s) => {
              const active = version.status === s.value;
              return (
                <button
                  key={s.value}
                  onClick={() => !active && updateStatus(s.value)}
                  disabled={active}
                  className={`px-3.5 py-2 rounded-sm border text-[10px] tracking-eyebrow uppercase font-mono-brand transition-colors ${
                    active
                      ? "border-primary/60 bg-primary/10 text-primary"
                      : "hairline text-muted-foreground hover:text-foreground hover:border-primary/30"
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Block list */}
      <div className="space-y-3">
        {blocks.length === 0 ? (
          <div className="lumi-card p-12 text-center">
            <Layers className="h-5 w-5 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              No blocks yet. Add the first one to begin.
            </p>
          </div>
        ) : (
          blocks.map((b, i) => (
            <BlockCard
              key={b.id}
              block={b}
              first={i === 0}
              last={i === blocks.length - 1}
              onEdit={() => setEditing(b)}
              onMoveUp={() => move(b, -1)}
              onMoveDown={() => move(b, 1)}
              onToggleHidden={() => toggleHidden(b)}
              onDelete={() => deleteBlock(b)}
            />
          ))
        )}
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Edit {editing ? blockLabel(editing.section_type) : ""} block
            </DialogTitle>
          </DialogHeader>
          {editing && (
            <BlockEditor
              block={editing}
              saving={saving}
              onCancel={() => setEditing(null)}
              onSave={saveBlock}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Add block dialog */}
      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent className="max-w-2xl max-h-[88vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add a block</DialogTitle>
          </DialogHeader>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
            {BLOCK_TYPES.map((bt) => (
              <li key={bt.value}>
                <button
                  onClick={() => addBlock(bt.value)}
                  className="w-full text-left lumi-card p-4 hover:border-primary/40 transition-colors"
                >
                  <p className="font-display text-base tracking-display">{bt.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{bt.hint}</p>
                </button>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>

      {/* Buyer preview dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto p-0">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle>Buyer preview · v{version.version_number}</DialogTitle>
          </DialogHeader>
          <div className="px-2 pb-2">
            <PresentationPreview blocks={blocks.filter((b) => !b.is_hidden)} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Save draft dialog */}
      <Dialog open={showSaveDraft} onOpenChange={setShowSaveDraft}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Save current draft to history</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground leading-[1.7]">
              This captures a full snapshot of the current presentation — every block, in
              order — and adds it to version history. You can preview or restore it later.
            </p>
            <label className="block">
              <span className="font-mono-brand text-[10px] tracking-eyebrow uppercase text-muted-foreground mb-2 block">
                Change summary <span className="text-muted-foreground/60 normal-case tracking-normal">(optional)</span>
              </span>
              <textarea
                className="lumi-input min-h-[100px]"
                value={draftSummary}
                onChange={(e) => setDraftSummary(e.target.value)}
                placeholder="e.g. Updated financial snapshot after Q3 figures"
              />
            </label>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowSaveDraft(false)}
                className="lumi-btn-ghost"
                disabled={savingDraft}
              >
                Cancel
              </button>
              <button
                onClick={saveDraftSnapshot}
                disabled={savingDraft}
                className="lumi-btn-primary disabled:opacity-50"
              >
                {savingDraft ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                Save snapshot
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Version history */}
      <section className="space-y-4 pt-2">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <HistoryIcon className="h-4 w-4 text-primary" strokeWidth={1.5} />
            <h3 className="font-display text-xl tracking-display">Version history</h3>
          </div>
          <p className="text-[11px] text-muted-foreground max-w-md text-right">
            Restoring brings a version back as a new draft. Your live published version is
            never overwritten.
          </p>
        </div>
        <PresentationHistory
          businessId={businessId}
          refreshKey={historyKey}
          onRestored={onRestored}
        />
      </section>

      {/* Voiceover script */}
      <VoiceoverScript businessId={businessId} />

      {/* AI Workspace */}
      {showAIWorkspace && (
        <PresentationAIWorkspace
          businessId={businessId}
          versionId={version.id}
          versionNumber={version.version_number}
          blocks={blocks}
          onClose={() => setShowAIWorkspace(false)}
          onToggleHidden={(b) => {
            void toggleHidden(b);
          }}
          onEdit={(b) => {
            setShowAIWorkspace(false);
            setEditing(b);
          }}
          onBlockUpdated={(updated) => {
            setBlocks((prev) =>
              prev ? prev.map((x) => (x.id === updated.id ? updated : x)) : prev,
            );
            setHistoryKey((k) => k + 1);
          }}
        />
      )}

      <IMImportDialog
        open={showIMImport}
        onOpenChange={(v) => {
          setShowIMImport(v);
          if (!v) {
            setPendingImportId(null);
            if (searchParams.get("openImport")) {
              const next = new URLSearchParams(searchParams);
              next.delete("openImport");
              setSearchParams(next, { replace: true });
            }
          }
        }}
        businessId={businessId}
        hasPublished={hasPublished}
        initialImportId={pendingImportId}
        onApplied={() => {
          void load();
          setHistoryKey((k) => k + 1);
        }}
      />
    </div>
  );
}

/* ---------------- Block list card ---------------- */

function BlockCard({
  block,
  first,
  last,
  onEdit,
  onMoveUp,
  onMoveDown,
  onToggleHidden,
  onDelete,
}: {
  block: BlockRow;
  first: boolean;
  last: boolean;
  onEdit: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onToggleHidden: () => void;
  onDelete: () => void;
}) {
  const meta = BLOCK_TYPE_MAP.get(block.section_type);
  const review = reviewStatusMeta(block.review_status);
  return (
    <div
      className={`lumi-card p-5 md:p-6 transition-opacity ${
        block.is_hidden ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-start gap-4">
        <GripVertical className="h-4 w-4 text-muted-foreground/50 mt-1" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-mono-brand text-[10px] tracking-eyebrow uppercase text-primary">
              {meta?.label ?? block.section_type}
            </span>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full border font-mono-brand text-[9px] tracking-eyebrow uppercase ${review.tone}`}
            >
              {review.label}
            </span>
            {block.is_hidden && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-border font-mono-brand text-[9px] tracking-eyebrow uppercase text-muted-foreground">
                <EyeOff className="h-3 w-3" /> Hidden
              </span>
            )}
            <span className="font-mono-brand text-[9px] tracking-eyebrow uppercase text-muted-foreground">
              Access · {block.required_access_level.replace("_", " ")}
            </span>
          </div>
          <p className="font-display text-lg tracking-display truncate">
            {block.title?.trim() || meta?.label || "Untitled"}
          </p>
          {block.subtitle && (
            <p className="text-xs text-muted-foreground truncate">{block.subtitle}</p>
          )}
          {block.body && (
            <p className="text-sm text-foreground/80 mt-2 leading-[1.7] line-clamp-2">
              {block.body}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={onMoveUp}
            disabled={first}
            className="lumi-icon-btn disabled:opacity-30"
            aria-label="Move up"
            title="Move up"
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onMoveDown}
            disabled={last}
            className="lumi-icon-btn disabled:opacity-30"
            aria-label="Move down"
            title="Move down"
          >
            <ArrowDown className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onToggleHidden}
            className="lumi-icon-btn"
            aria-label={block.is_hidden ? "Show" : "Hide"}
            title={block.is_hidden ? "Show to buyers" : "Hide from buyers"}
          >
            {block.is_hidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={onEdit}
            className="lumi-icon-btn"
            aria-label="Edit"
            title="Edit"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                className="lumi-icon-btn text-destructive hover:bg-destructive/10"
                aria-label="Delete"
                title="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove this block?</AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently removes the block from the working version.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete}>Remove</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Block editor ---------------- */

function BlockEditor({
  block,
  saving,
  onCancel,
  onSave,
}: {
  block: BlockRow;
  saving: boolean;
  onCancel: () => void;
  onSave: (b: BlockRow) => void;
}) {
  const [draft, setDraft] = useState<BlockRow>(block);
  const meta = BLOCK_TYPE_MAP.get(draft.section_type);
  const keyPointsText = useMemo(() => draft.key_points.join("\n"), [draft.key_points]);
  const imagesText = useMemo(() => draft.image_refs.join("\n"), [draft.image_refs]);

  return (
    <div className="space-y-5">
      <p className="text-xs text-muted-foreground">{meta?.hint}</p>

      <Field label="Title">
        <input
          className="lumi-input"
          value={draft.title ?? ""}
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          placeholder={meta?.label}
        />
      </Field>

      <Field label="Subtitle">
        <input
          className="lumi-input"
          value={draft.subtitle ?? ""}
          onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })}
        />
      </Field>

      <Field label="Body text" hint="Markdown-friendly. Keep it tight and confident.">
        <textarea
          className="lumi-input min-h-[140px]"
          value={draft.body ?? ""}
          onChange={(e) => setDraft({ ...draft, body: e.target.value })}
        />
      </Field>

      <Field label="Key points" hint="One point per line.">
        <textarea
          className="lumi-input min-h-[110px]"
          value={keyPointsText}
          onChange={(e) =>
            setDraft({
              ...draft,
              key_points: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean),
            })
          }
        />
      </Field>

      <Field label="Image references" hint="One image URL or storage path per line.">
        <textarea
          className="lumi-input min-h-[80px]"
          value={imagesText}
          onChange={(e) =>
            setDraft({
              ...draft,
              image_refs: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean),
            })
          }
        />
      </Field>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field label="Visibility">
          <select
            className="lumi-input"
            value={draft.visibility}
            onChange={(e) => setDraft({ ...draft, visibility: e.target.value as DocVisibility })}
          >
            {VISIBILITIES.map((v) => (
              <option key={v.value} value={v.value}>
                {v.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Required access">
          <select
            className="lumi-input"
            value={draft.required_access_level}
            onChange={(e) =>
              setDraft({ ...draft, required_access_level: e.target.value as AccessLevel })
            }
          >
            {ACCESS_LEVELS.map((v) => (
              <option key={v.value} value={v.value}>
                {v.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Review status">
          <select
            className="lumi-input"
            value={draft.review_status}
            onChange={(e) =>
              setDraft({ ...draft, review_status: e.target.value as BlockReviewStatus })
            }
          >
            {REVIEW_STATUSES.map((v) => (
              <option key={v.value} value={v.value}>
                {v.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <label className="flex items-center gap-3 text-sm cursor-pointer">
        <input
          type="checkbox"
          checked={draft.is_hidden}
          onChange={(e) => setDraft({ ...draft, is_hidden: e.target.checked })}
          className="h-4 w-4 rounded border-border"
        />
        Hide this block from buyers
      </label>

      <div className="flex items-center justify-end gap-2 pt-3 border-t hairline">
        <button onClick={onCancel} className="lumi-btn-ghost">
          Cancel
        </button>
        <button
          onClick={() => onSave(draft)}
          disabled={saving}
          className="lumi-btn-primary disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          Save block
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="font-mono-brand text-[10px] tracking-eyebrow uppercase text-muted-foreground mb-2 block">
        {label}
      </span>
      {children}
      {hint && <span className="text-[11px] text-muted-foreground/80 block mt-1.5">{hint}</span>}
    </label>
  );
}

/* ---------------- Helpers ---------------- */

function defaultBlockSeed(versionId: string, type: SectionType, position: number) {
  const meta = BLOCK_TYPE_MAP.get(type);
  return {
    version_id: versionId,
    section_type: type,
    position,
    title: meta?.label ?? type,
    subtitle: null,
    body: null,
    key_points: [] as string[],
    image_refs: [] as string[],
    visibility: "im",
    required_access_level: "im",
    is_hidden: false,
    review_status: "draft",
    content: {},
  };
}

function rowToBlock(row: Record<string, unknown>): BlockRow {
  return {
    id: row.id as string,
    version_id: row.version_id as string,
    section_type: row.section_type as SectionType,
    position: (row.position as number) ?? 0,
    title: (row.title as string) ?? null,
    subtitle: (row.subtitle as string) ?? null,
    body: (row.body as string) ?? null,
    key_points: (row.key_points as string[]) ?? [],
    image_refs: (row.image_refs as string[]) ?? [],
    visibility: (row.visibility as DocVisibility) ?? "im",
    required_access_level: (row.required_access_level as AccessLevel) ?? "im",
    is_hidden: (row.is_hidden as boolean) ?? false,
    review_status: (row.review_status as BlockReviewStatus) ?? "draft",
    content: (row.content as Record<string, unknown>) ?? null,
  };
}

/* Tiny CSS utility classes (use existing tokens) */
export const _styles = null;