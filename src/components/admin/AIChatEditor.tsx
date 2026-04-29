import { useEffect, useRef, useState } from "react";
import { Loader2, Send, Sparkles, Wand2, CheckCircle2, XCircle } from "lucide-react";
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

const PLACEHOLDER_RESPONSE = "AI editing will be connected in the next stage.";

export default function AIChatEditor({
  businessId,
  versionId,
  blocks,
  selectedBlockId,
  onSelectBlock,
}: Props) {
  const [history, setHistory] = useState<RequestRow[]>([]);
  const [instruction, setInstruction] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
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
      setHistory((data ?? []) as RequestRow[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [history.length]);

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
        result_preview: PLACEHOLDER_RESPONSE,
      })
      .select("*")
      .single();
    setSubmitting(false);
    if (error || !data) {
      toast.error(error?.message ?? "Could not save instruction");
      return;
    }
    setHistory((prev) => [...prev, data as RequestRow]);
    setInstruction("");
  };

  const updateApproval = async (
    id: string,
    approval: "approved" | "rejected",
  ) => {
    const { error } = await supabase
      .from("ai_edit_requests")
      .update({
        approval_status: approval,
        status: approval === "approved" ? "applied" : "rejected",
      })
      .eq("id", id);
    if (error) return toast.error(error.message);
    setHistory((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              approval_status: approval,
              status: approval === "approved" ? "applied" : "rejected",
            }
          : r,
      ),
    );
    toast.success(approval === "approved" ? "Marked applied" : "Rejected");
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
          Type an instruction. Drafts are saved for review — nothing is published automatically.
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
              {/* AI placeholder reply */}
              <div className="flex justify-start">
                <div className="max-w-[90%] px-3.5 py-2.5 rounded-sm border hairline bg-card/40">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Wand2 className="h-3 w-3 text-primary" strokeWidth={1.5} />
                    <span className="font-mono-brand text-[9px] tracking-eyebrow uppercase text-muted-foreground">
                      {r.status}
                    </span>
                  </div>
                  <p className="text-[12.5px] leading-[1.55] text-muted-foreground italic">
                    {r.result_preview ?? PLACEHOLDER_RESPONSE}
                  </p>
                  {r.approval_status === "unreviewed" && (
                    <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t hairline">
                      <button
                        onClick={() => updateApproval(r.id, "approved")}
                        className="inline-flex items-center gap-1 text-[10px] tracking-eyebrow uppercase font-mono-brand px-2.5 py-1 rounded-sm border border-primary/30 text-primary hover:bg-primary/10 transition-colors"
                      >
                        <CheckCircle2 className="h-3 w-3" /> Mark applied
                      </button>
                      <button
                        onClick={() => updateApproval(r.id, "rejected")}
                        className="inline-flex items-center gap-1 text-[10px] tracking-eyebrow uppercase font-mono-brand px-2.5 py-1 rounded-sm border hairline text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <XCircle className="h-3 w-3" /> Reject
                      </button>
                    </div>
                  )}
                  {r.approval_status !== "unreviewed" && (
                    <p className="font-mono-brand text-[9px] tracking-eyebrow uppercase mt-2 text-muted-foreground">
                      {r.approval_status}
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