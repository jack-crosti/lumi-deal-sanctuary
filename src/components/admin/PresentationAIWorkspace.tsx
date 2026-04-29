import { useState } from "react";
import { Eye, EyeOff, Layers, X } from "lucide-react";
import AIChatEditor from "./AIChatEditor";
import PresentationPreview from "./PresentationPreview";
import { blockLabel, reviewStatusMeta } from "@/lib/presentationBlocks";
import type { BlockRow } from "./PresentationStudio";

interface Props {
  businessId: string;
  versionId: string;
  versionNumber: number;
  blocks: BlockRow[];
  onClose: () => void;
  onToggleHidden: (block: BlockRow) => void;
  onEdit: (block: BlockRow) => void;
  onBlockUpdated?: (block: BlockRow) => void;
}

export default function PresentationAIWorkspace({
  businessId,
  versionId,
  versionNumber,
  blocks,
  onClose,
  onToggleHidden,
  onEdit,
  onBlockUpdated,
}: Props) {
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const visibleBlocks = blocks.filter((b) => !b.is_hidden);

  const selected = blocks.find((b) => b.id === selectedBlockId) ?? null;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-5 py-3 border-b hairline flex-shrink-0">
        <div className="flex items-center gap-3">
          <Layers className="h-4 w-4 text-primary" strokeWidth={1.5} />
          <h2 className="font-display text-lg tracking-display">
            Presentation Studio · AI Workspace
          </h2>
          <span className="font-mono-brand text-[10px] tracking-eyebrow uppercase text-muted-foreground">
            v{versionNumber}
          </span>
        </div>
        <button
          onClick={onClose}
          className="lumi-icon-btn"
          aria-label="Close workspace"
          title="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      {/* Three-panel layout */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-[340px_1fr_320px] min-h-0">
        {/* Left: AI Chat */}
        <aside className="border-r hairline min-h-0 overflow-hidden">
          <AIChatEditor
            businessId={businessId}
            versionId={versionId}
            blocks={blocks}
            selectedBlockId={selectedBlockId}
            onSelectBlock={setSelectedBlockId}
            onBlockUpdated={onBlockUpdated}
          />
        </aside>

        {/* Centre: Buyer preview */}
        <main className="overflow-y-auto bg-muted/10">
          <div className="max-w-4xl mx-auto p-4">
            <PresentationPreview blocks={visibleBlocks} />
          </div>
        </main>

        {/* Right: Section controls */}
        <aside className="border-l hairline overflow-y-auto">
          <div className="px-5 py-4 border-b hairline">
            <h3 className="font-display text-base tracking-display">Section controls</h3>
            <p className="text-[11px] text-muted-foreground mt-1.5 leading-[1.6]">
              Pick a section to target with AI, or quickly toggle visibility.
            </p>
          </div>
          <ul className="divide-y divide-border/40">
            {blocks.map((b) => {
              const review = reviewStatusMeta(b.review_status);
              const active = selectedBlockId === b.id;
              return (
                <li
                  key={b.id}
                  className={`px-5 py-3 cursor-pointer transition-colors ${
                    active ? "bg-primary/[0.06]" : "hover:bg-muted/30"
                  }`}
                  onClick={() => setSelectedBlockId(active ? null : b.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-mono-brand text-[9px] tracking-eyebrow uppercase text-primary mb-0.5">
                        {blockLabel(b.section_type)}
                      </p>
                      <p className="text-sm font-medium truncate">
                        {b.title?.trim() || blockLabel(b.section_type)}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        <span
                          className={`inline-flex items-center px-1.5 py-0.5 rounded-full border font-mono-brand text-[8.5px] tracking-eyebrow uppercase ${review.tone}`}
                        >
                          {review.label}
                        </span>
                        {b.is_hidden && (
                          <span className="font-mono-brand text-[8.5px] tracking-eyebrow uppercase text-muted-foreground">
                            Hidden
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleHidden(b);
                        }}
                        className="lumi-icon-btn"
                        aria-label={b.is_hidden ? "Show" : "Hide"}
                        title={b.is_hidden ? "Show to buyers" : "Hide from buyers"}
                      >
                        {b.is_hidden ? (
                          <Eye className="h-3.5 w-3.5" />
                        ) : (
                          <EyeOff className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          {selected && (
            <div className="p-5 border-t hairline space-y-3">
              <p className="font-mono-brand text-[9px] tracking-eyebrow uppercase text-muted-foreground">
                Selected
              </p>
              <p className="font-display text-base tracking-display">
                {selected.title?.trim() || blockLabel(selected.section_type)}
              </p>
              <div className="text-[11px] text-muted-foreground space-y-1">
                <p>Access · {selected.required_access_level.replace("_", " ")}</p>
                <p>Visibility · {selected.visibility}</p>
              </div>
              <button
                onClick={() => onEdit(selected)}
                className="lumi-btn-ghost w-full justify-center"
              >
                Edit block manually
              </button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}