import { useEffect, useRef, useState } from "react";
import {
  Loader2,
  Send,
  Sparkles,
  Wand2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { blockLabel } from "@/lib/presentationBlocks";
import type { BlockRow } from "./PresentationStudio";

interface Props {
  businessId: string;
  versionId: string;
  blocks: BlockRow[];
  selectedBlockId: string | null;
  onSelectBlock: (id: string | null) => void;
  onBlockUpdated?: (block: BlockRow) => void;
}

interface Proposal {
  title?: string | null;
  subtitle?: string | null;
  body?: string | null;
  key_points?: string[] | null;
  summary_of_changes: string;
  warnings: string[];
}

interface RequestRow {
  id: string;
  business_id: string;
  version_id: string | null;
  target_block_id: string | null;
  admin_id: string;
  instruction: string;
  status: "pending" | "processing" | "applied" | "rejected" | "failed";
  result_preview: string | null;
  approval_status: "unreviewed" | "approved" | "rejected";
  created_at: string;
  proposal: Proposal | null;
  warnings: string[];
  error_message: string | null;
}

const QUICK_PROMPTS = [
  "Rewrite the opening section with a more premium tone",
  "Make the financial section easier to understand",
  "Hide the exact address",
  "Add more focus on the location",
  "Make the buyer fit section sharper",
  "Shorten the overview",
  "Turn this into bullet cards",
  "Remove anything that could identify the business",
  "Make this suitable for a first-time buyer",
  "Make this suitable for an experienced hospitality operator",
];

export default function AIChatEditor({
  businessId,
  versionId,
  blocks,
  selectedBlockId,
  onSelectBlock,
  onBlockUpdated,
}: Props) {
  const [history, setHistory] = useState<RequestRow[]>([]);
  const [instruction, setInstruction] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("ai_edit_requests")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: true });
    if (error) {
      toast.error(error.message);
    } else {
      setHistory((data ?? []) as unknown as RequestRow[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [history.length]);

  const upsertRow = (row: RequestRow) => {
    setHistory((prev) => {
      const exists = prev.some((r) => r.id === row.id);
      return exists ? prev.map((r) => (r.id === row.id ? row : r)) : [...prev, row];
    });
  };

  const callAI = async (requestId: string) => {
    setBusyId(requestId);
    const { data, error } = await supabase.functions.invoke("ai-edit-block", {
      body: { request_id: requestId },
    });
    setBusyId(null);
    if (error) {
      const msg =
        (data as { error?: string } | null)?.error ?? error.message ?? "AI request failed";
      toast.error(msg);
    }
    // Reload the row regardless — function persists status + proposal
    const { data: row } = await supabase
      .from("ai_edit_requests")
      .select("*")
      .eq("id", requestId)
      .single();
    if (row) upsertRow(row as unknown as RequestRow);
  };

  const submit = async (text?: string) => {
    const value = (text ?? instruction).trim();
    if (!value) return;
    setSubmitting(true);
    const { data: auth } = await supabase.auth.getUser();
    const adminId = auth.user?.id;
    if (!adminId) {
      setSubmitting(false);
      toast.error("Not authenticated");
      return;
    }
    const { data, error } = await supabase
      .from("ai_edit_requests")
      .insert({
        business_id: businessId,
        version_id: versionId,
        target_block_id: selectedBlockId,
        admin_id: adminId,
        instruction: value,
        status: "pending",
      })
      .select("*")
      .single();
    setSubmitting(false);
    if (error || !data) {
      toast.error(error?.message ?? "Could not save instruction");
      return;
    }
    const row = data as unknown as RequestRow;
    upsertRow(row);
    setInstruction("");
    void callAI(row.id);
  };

  const retry = async (r: RequestRow) => {
    // Reuse same instruction + target — create a fresh request
    setSubmitting(true);
    const { data: auth } = await supabase.auth.getUser();
    const adminId = auth.user?.id;
    if (!adminId) {
      setSubmitting(false);
      return;
    }
    const { data } = await supabase
      .from("ai_edit_requests")
      .insert({
        business_id: businessId,
        version_id: versionId,
        target_block_id: r.target_block_id,
        admin_id: adminId,
        instruction: r.instruction,
        status: "pending",
      })
      .select("*")
      .single();
    setSubmitting(false);
    if (data) {
      const row = data as unknown as RequestRow;
      upsertRow(row);
      void callAI(row.id);
    }
  };

  const applyProposal = async (r: RequestRow) => {
    if (!r.target_block_id || !r.proposal) {
      toast.error("Nothing to apply");
      return;
    }
    setBusyId(r.id);
    const block = blocks.find((b) => b.id === r.target_block_id);
    if (!block) {
      setBusyId(null);
      toast.error("Block no longer exists");
      return;
    }
    const p = r.proposal;
    const patch: Record<string, unknown> = {
      review_status: "needs_review",
    };
    if (p.title !== null && p.title !== undefined) patch.title = p.title;
    if (p.subtitle !== null && p.subtitle !== undefined) patch.subtitle = p.subtitle;
    if (p.body !== null && p.body !== undefined) patch.body = p.body;
    if (Array.isArray(p.key_points)) patch.key_points = p.key_points;

    const { error } = await supabase
      .from("presentation_sections")
      .update(patch as never)
      .eq("id", block.id);
    if (error) {
      setBusyId(null);
      toast.error(error.message);
      return;
    }

    // Save snapshot of working version
    await supabase.rpc("save_presentation_snapshot" as never, {
      _version_id: versionId,
      _change_summary: `AI edit applied to ${blockLabel(block.section_type)}: ${r.instruction.slice(0, 120)}`,
    } as never);

    // Mark request applied
    const { data: updated } = await supabase
      .from("ai_edit_requests")
      .update({ status: "applied", approval_status: "approved" })
      .eq("id", r.id)
      .select("*")
      .single();
    if (updated) upsertRow(updated as unknown as RequestRow);

    onBlockUpdated?.({
      ...block,
      ...(patch as Partial<BlockRow>),
      review_status: "needs_review",
    } as BlockRow);

    setBusyId(null);
    toast.success("Applied. Block marked Needs Review.");
  };

  const reject = async (r: RequestRow) => {
    const { data } = await supabase
      .from("ai_edit_requests")
      .update({ status: "rejected", approval_status: "rejected" })
      .eq("id", r.id)
      .select("*")
      .single();
    if (data) upsertRow(data as unknown as RequestRow);
  };

  const targetLabel = (id: string | null) => {
    if (!id) return "Whole presentation";
    const b = blocks.find((x) => x.id === id);
    return b ? blockLabel(b.section_type) : "Removed block";
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-4 border-b hairline">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" strokeWidth={1.5} />
          <h3 className="font-display text-base tracking-display">AI Editor</h3>
        </div>
        <p className="text-[11px] text-muted-foreground mt-1.5 leading-[1.6]">
          The AI uses only the existing block, business data and broker notes. It never
          publishes — every change needs your approval.
        </p>
        <div className="mt-3">
          <label className="font-mono-brand text-[9px] tracking-eyebrow uppercase text-muted-foreground block mb-1.5">
            Target
          </label>
          <select
            className="lumi-input text-sm"
            value={selectedBlockId ?? ""}
            onChange={(e) => onSelectBlock(e.target.value || null)}
          >
            <option value="">Whole presentation</option>
            {blocks.map((b) => (
              <option key={b.id} value={b.id}>
                {blockLabel(b.section_type)}
                {b.title ? ` — ${b.title}` : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {loading ? (
          <div className="text-center text-xs text-muted-foreground py-8 flex items-center justify-center gap-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading history…
          </div>
        ) : history.length === 0 ? (
          <div className="space-y-3">
            <p className="font-mono-brand text-[10px] tracking-eyebrow uppercase text-muted-foreground">
              Try one of these
            </p>
            <div className="flex flex-col gap-1.5">
              {QUICK_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => setInstruction(p)}
                  className="text-left text-[12px] leading-[1.5] px-3 py-2 rounded-sm border hairline hover:border-primary/40 hover:bg-primary/[0.03] transition-colors text-foreground/80"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        ) : (
          history.map((r) => (
            <div key={r.id} className="space-y-2">
              {/* Admin instruction */}
              <div className="flex justify-end">
                <div className="max-w-[85%] px-3.5 py-2.5 rounded-sm bg-primary/10 border border-primary/20">
                  <p className="font-mono-brand text-[9px] tracking-eyebrow uppercase text-primary/80 mb-1">
                    {targetLabel(r.target_block_id)}
                  </p>
                  <p className="text-[13px] leading-[1.55] text-foreground">
                    {r.instruction}
                  </p>
                </div>
              </div>

              {/* AI reply */}
              <div className="flex justify-start">
                <div className="max-w-[92%] w-full px-3.5 py-2.5 rounded-sm border hairline bg-card/40">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Wand2 className="h-3 w-3 text-primary" strokeWidth={1.5} />
                    <span className="font-mono-brand text-[9px] tracking-eyebrow uppercase text-muted-foreground">
                      {r.status === "processing" || busyId === r.id
                        ? "Thinking…"
                        : r.status}
                    </span>
                  </div>

                  {r.status === "processing" || busyId === r.id ? (
                    <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Drafting a revision…
                    </div>
                  ) : r.status === "failed" ? (
                    <p className="text-[12.5px] leading-[1.55] text-destructive">
                      {r.error_message ?? r.result_preview ?? "AI request failed."}
                    </p>
                  ) : r.proposal ? (
                    <ProposalCard proposal={r.proposal} />
                  ) : (
                    <p className="text-[12.5px] leading-[1.55] text-muted-foreground">
                      {r.result_preview ?? "No preview available."}
                    </p>
                  )}

                  {/* Actions */}
                  {r.proposal && r.status !== "applied" && r.status !== "rejected" && (
                    <div className="flex flex-wrap items-center gap-2 mt-3 pt-2.5 border-t hairline">
                      <button
                        onClick={() => applyProposal(r)}
                        disabled={busyId === r.id || !r.target_block_id}
                        className="inline-flex items-center gap-1 text-[10px] tracking-eyebrow uppercase font-mono-brand px-2.5 py-1 rounded-sm border border-primary/40 text-primary hover:bg-primary/10 transition-colors disabled:opacity-40"
                        title={
                          r.target_block_id
                            ? "Apply to block as draft"
                            : "Select a target block to apply"
                        }
                      >
                        <CheckCircle2 className="h-3 w-3" /> Apply
                      </button>
                      <button
                        onClick={() => reject(r)}
                        disabled={busyId === r.id}
                        className="inline-flex items-center gap-1 text-[10px] tracking-eyebrow uppercase font-mono-brand px-2.5 py-1 rounded-sm border hairline text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <XCircle className="h-3 w-3" /> Reject
                      </button>
                      <button
                        onClick={() => retry(r)}
                        disabled={busyId === r.id}
                        className="inline-flex items-center gap-1 text-[10px] tracking-eyebrow uppercase font-mono-brand px-2.5 py-1 rounded-sm border hairline text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <RefreshCw className="h-3 w-3" /> Try again
                      </button>
                    </div>
                  )}

                  {(r.status === "applied" || r.status === "rejected") && (
                    <p className="font-mono-brand text-[9px] tracking-eyebrow uppercase mt-2 text-muted-foreground">
                      {r.status === "applied" ? "Applied as draft" : "Rejected"}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="border-t hairline p-3 space-y-2">
        <textarea
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              void submit();
            }
          }}
          placeholder="Describe what you'd like the AI to change…"
          className="lumi-input min-h-[72px] text-sm"
        />
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] text-muted-foreground">⌘ + Enter to send</span>
          <button
            onClick={() => void submit()}
            disabled={submitting || !instruction.trim()}
            className="lumi-btn-primary disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

function ProposalCard({ proposal }: { proposal: Proposal }) {
  return (
    <div className="space-y-2.5">
      <p className="text-[12.5px] leading-[1.55] text-foreground">
        {proposal.summary_of_changes}
      </p>

      {proposal.title && (
        <Field label="Title">
          <p className="text-[12.5px] text-foreground">{proposal.title}</p>
        </Field>
      )}
      {proposal.subtitle && (
        <Field label="Subtitle">
          <p className="text-[12.5px] text-foreground">{proposal.subtitle}</p>
        </Field>
      )}
      {proposal.body && (
        <Field label="Body">
          <p className="text-[12.5px] text-foreground whitespace-pre-wrap leading-[1.6]">
            {proposal.body}
          </p>
        </Field>
      )}
      {Array.isArray(proposal.key_points) && proposal.key_points.length > 0 && (
        <Field label="Key points">
          <ul className="text-[12.5px] text-foreground space-y-0.5 list-disc list-inside">
            {proposal.key_points.map((k, i) => (
              <li key={i}>{k}</li>
            ))}
          </ul>
        </Field>
      )}

      {proposal.warnings?.length > 0 && (
        <div className="mt-2 px-2.5 py-2 rounded-sm border border-amber-500/30 bg-amber-500/5 text-amber-600 dark:text-amber-400">
          <div className="flex items-center gap-1.5 mb-1">
            <AlertTriangle className="h-3 w-3" />
            <span className="font-mono-brand text-[9px] tracking-eyebrow uppercase">
              Verify before applying
            </span>
          </div>
          <ul className="text-[11.5px] leading-[1.5] space-y-0.5 list-disc list-inside">
            {proposal.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-mono-brand text-[9px] tracking-eyebrow uppercase text-muted-foreground mb-0.5">
        {label}
      </p>
      {children}
    </div>
  );
}
