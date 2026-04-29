import { useEffect, useState } from "react";
import { toast } from "sonner";
import { History, Loader2, RotateCcw, FileText, User as UserIcon, Eye } from "lucide-react";
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
import { formatRelative } from "@/lib/format";
import {
  presentationStatusMeta,
  type PresentationStatus,
} from "@/lib/presentationBlocks";
import PresentationPreview from "./PresentationPreview";
import type { BlockRow } from "./PresentationStudio";

interface SnapshotRow {
  id: string;
  business_id: string;
  source_version_id: string | null;
  version_number: number;
  status: PresentationStatus;
  change_summary: string | null;
  blocks: unknown[];
  created_by: string | null;
  created_at: string;
}

interface AuthorRow {
  id: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}

const authorName = (a: AuthorRow | undefined) => {
  if (!a) return "Unknown";
  return (
    a.full_name ||
    [a.first_name, a.last_name].filter(Boolean).join(" ") ||
    a.email ||
    "Unknown"
  );
};

export default function PresentationHistory({
  businessId,
  refreshKey,
  onRestored,
}: {
  businessId: string;
  refreshKey: number;
  onRestored: () => void;
}) {
  const [rows, setRows] = useState<SnapshotRow[] | null>(null);
  const [authors, setAuthors] = useState<Map<string, AuthorRow>>(new Map());
  const [previewing, setPreviewing] = useState<SnapshotRow | null>(null);
  const [editingNote, setEditingNote] = useState<SnapshotRow | null>(null);
  const [restoring, setRestoring] = useState<string | null>(null);

  const load = async () => {
    const { data, error } = await supabase
      .from("presentation_snapshots" as never)
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });
    if (error) {
      toast.error(error.message);
      setRows([]);
      return;
    }
    const list = (data ?? []) as unknown as SnapshotRow[];
    setRows(list);

    const ids = Array.from(new Set(list.map((r) => r.created_by).filter(Boolean) as string[]));
    if (ids.length > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, full_name, first_name, last_name, email")
        .in("id", ids);
      setAuthors(new Map((profs ?? []).map((p) => [p.id, p as AuthorRow])));
    } else {
      setAuthors(new Map());
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId, refreshKey]);

  const restore = async (snapshotId: string) => {
    setRestoring(snapshotId);
    const { error } = await supabase.rpc(
      "restore_presentation_snapshot" as never,
      { _snapshot_id: snapshotId } as never,
    );
    setRestoring(null);
    if (error) return toast.error(error.message);
    toast.success("Restored as a new draft. Review before publishing.");
    onRestored();
  };

  const updateNote = async (snapshotId: string, note: string) => {
    const { error } = await supabase
      .from("presentation_snapshots" as never)
      .update({ change_summary: note } as never)
      .eq("id", snapshotId);
    if (error) return toast.error(error.message);
    toast.success("Note updated");
    setEditingNote(null);
    void load();
  };

  if (rows === null) {
    return (
      <div className="lumi-card p-12 text-center text-sm text-muted-foreground flex items-center justify-center gap-3">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading history…
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="lumi-card p-10 text-center">
        <History className="h-5 w-5 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-[1.7]">
          No saved versions yet. Use{" "}
          <span className="text-foreground/90">Save draft</span> in the Studio to capture the
          current presentation. Each save is preserved here.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="lumi-card overflow-hidden">
        <ul className="divide-y divide-border">
          {rows.map((r, i) => {
            const meta = presentationStatusMeta(r.status);
            const blockCount = Array.isArray(r.blocks) ? r.blocks.length : 0;
            const author = authors.get(r.created_by ?? "");
            return (
              <li key={r.id} className="p-5 md:p-6 flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <span className="font-mono-brand text-[10px] tracking-eyebrow uppercase text-primary tabular-nums">
                      v{r.version_number}
                    </span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full border font-mono-brand text-[9px] tracking-eyebrow uppercase ${meta.tone}`}
                    >
                      {meta.label}
                    </span>
                    {i === 0 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full border border-primary/30 bg-primary/10 text-primary font-mono-brand text-[9px] tracking-eyebrow uppercase">
                        Latest
                      </span>
                    )}
                    <span className="font-mono-brand text-[9px] tracking-eyebrow uppercase text-muted-foreground tabular-nums">
                      {blockCount} block{blockCount === 1 ? "" : "s"}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/90 leading-[1.6]">
                    {r.change_summary?.trim() || (
                      <span className="text-muted-foreground/70 italic">No change note</span>
                    )}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-2 flex items-center gap-3 flex-wrap">
                    <span className="inline-flex items-center gap-1.5">
                      <UserIcon className="h-3 w-3" />
                      {authorName(author)}
                    </span>
                    <span>·</span>
                    <span>{formatRelative(r.created_at)}</span>
                    <span>·</span>
                    <span>{new Date(r.created_at).toLocaleString()}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => setPreviewing(r)}
                    className="lumi-btn-ghost text-xs"
                    title="Preview this version"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Preview
                  </button>
                  <button
                    onClick={() => setEditingNote(r)}
                    className="lumi-btn-ghost text-xs"
                    title="Edit change note"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    Note
                  </button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button
                        disabled={restoring === r.id}
                        className="lumi-btn-primary text-xs disabled:opacity-50"
                        title="Restore as new draft"
                      >
                        {restoring === r.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <RotateCcw className="h-3.5 w-3.5" />
                        )}
                        Restore
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Restore this version?</AlertDialogTitle>
                        <AlertDialogDescription>
                          A new <strong>Draft</strong> version will be created from this snapshot.
                          Your current published version stays live until you explicitly publish
                          the new draft.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => restore(r.id)}>
                          Restore as draft
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Preview snapshot */}
      <Dialog open={!!previewing} onOpenChange={(o) => !o && setPreviewing(null)}>
        <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto p-0">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle>
              Preview · v{previewing?.version_number}
              <span className="ml-2 font-mono-brand text-[10px] tracking-eyebrow uppercase text-muted-foreground">
                snapshot {previewing && new Date(previewing.created_at).toLocaleString()}
              </span>
            </DialogTitle>
          </DialogHeader>
          <div className="px-2 pb-2">
            {previewing && (
              <PresentationPreview
                blocks={
                  ((previewing.blocks as Record<string, unknown>[]) ?? [])
                    .map(snapshotToBlock)
                    .filter((b) => !b.is_hidden) as BlockRow[]
                }
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit note */}
      <Dialog open={!!editingNote} onOpenChange={(o) => !o && setEditingNote(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Change note</DialogTitle>
          </DialogHeader>
          {editingNote && (
            <NoteEditor
              initial={editingNote.change_summary ?? ""}
              onCancel={() => setEditingNote(null)}
              onSave={(note) => updateNote(editingNote.id, note)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function NoteEditor({
  initial,
  onCancel,
  onSave,
}: {
  initial: string;
  onCancel: () => void;
  onSave: (note: string) => void;
}) {
  const [value, setValue] = useState(initial);
  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        A short note about what changed in this version. Helps your team scan history.
      </p>
      <textarea
        className="lumi-input min-h-[120px]"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="e.g. Updated financial snapshot after Q3 figures"
      />
      <div className="flex items-center justify-end gap-2">
        <button onClick={onCancel} className="lumi-btn-ghost">
          Cancel
        </button>
        <button onClick={() => onSave(value)} className="lumi-btn-primary">
          Save note
        </button>
      </div>
    </div>
  );
}

/** Convert a snapshot block (from jsonb) into a BlockRow shape for preview rendering. */
function snapshotToBlock(b: Record<string, unknown>): BlockRow {
  return {
    id: (b.id as string) ?? Math.random().toString(36).slice(2),
    version_id: (b.version_id as string) ?? "",
    section_type: b.section_type as BlockRow["section_type"],
    position: (b.position as number) ?? 0,
    title: (b.title as string) ?? null,
    subtitle: (b.subtitle as string) ?? null,
    body: (b.body as string) ?? null,
    key_points: (b.key_points as string[]) ?? [],
    image_refs: (b.image_refs as string[]) ?? [],
    visibility: (b.visibility as BlockRow["visibility"]) ?? "im",
    required_access_level:
      (b.required_access_level as BlockRow["required_access_level"]) ?? "im",
    is_hidden: (b.is_hidden as boolean) ?? false,
    review_status: (b.review_status as BlockRow["review_status"]) ?? "draft",
    content: (b.content as Record<string, unknown>) ?? null,
  };
}