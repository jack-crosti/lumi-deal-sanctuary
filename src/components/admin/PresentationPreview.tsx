import { MessageSquare, FileQuestion, HandCoins, Image as ImageIcon } from "lucide-react";
import { BLOCK_TYPE_MAP, blockLabel, type SectionType } from "@/lib/presentationBlocks";
import type { BlockRow } from "./PresentationStudio";

/**
 * Renders the buyer-facing presentation as it would appear, given the
 * supplied (already filtered) blocks. Interactive blocks render a
 * non-functional preview card so the admin can see them in context.
 */
export default function PresentationPreview({ blocks }: { blocks: BlockRow[] }) {
  if (blocks.length === 0) {
    return (
      <div className="lumi-card p-12 text-center text-sm text-muted-foreground">
        No visible blocks. Toggle blocks back on or add new ones to preview.
      </div>
    );
  }

  return (
    <div className="bg-background rounded-lg overflow-hidden">
      {blocks.map((b, i) => (
        <BlockPreview key={b.id} block={b} index={i} />
      ))}
    </div>
  );
}

function BlockPreview({ block, index }: { block: BlockRow; index: number }) {
  const meta = BLOCK_TYPE_MAP.get(block.section_type);
  const eyebrow = (meta?.label ?? block.section_type).toUpperCase();
  const title = block.title?.trim() || meta?.label || "Untitled";

  // Hero treatment
  if (block.section_type === "hero") {
    return (
      <section className="relative px-6 md:px-12 py-16 md:py-24 border-b hairline bg-card-gradient">
        <p className="font-mono-brand text-[10px] tracking-eyebrow uppercase text-primary mb-4">
          {eyebrow}
        </p>
        <h1 className="font-display text-4xl md:text-6xl tracking-display mb-4">
          {title}
        </h1>
        {block.subtitle && (
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl leading-[1.5]">
            {block.subtitle}
          </p>
        )}
        {block.body && (
          <p className="text-sm md:text-base text-foreground/80 mt-6 max-w-3xl leading-[1.8] whitespace-pre-wrap">
            {block.body}
          </p>
        )}
        {block.key_points.length > 0 && (
          <ul className="grid grid-cols-2 md:grid-cols-4 gap-px bg-hairline border hairline rounded-lg overflow-hidden mt-10">
            {block.key_points.slice(0, 4).map((kp, i) => (
              <li key={i} className="bg-card p-5">
                <p className="font-mono-brand text-[9px] tracking-eyebrow uppercase text-muted-foreground mb-1">
                  Highlight {i + 1}
                </p>
                <p className="text-sm text-foreground/90 leading-[1.6]">{kp}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    );
  }

  // Photo gallery
  if (block.section_type === "photo_gallery") {
    return (
      <SectionShell eyebrow={eyebrow} title={title} subtitle={block.subtitle} index={index}>
        {block.image_refs.length === 0 ? (
          <div className="border hairline rounded-lg p-12 text-center text-sm text-muted-foreground">
            <ImageIcon className="h-5 w-5 mx-auto mb-3" />
            No images attached yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {block.image_refs.map((src, i) => (
              <div key={i} className="aspect-[4/3] overflow-hidden rounded-md border hairline bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}
        {block.body && (
          <p className="text-sm text-foreground/80 mt-6 leading-[1.8] whitespace-pre-wrap">
            {block.body}
          </p>
        )}
      </SectionShell>
    );
  }

  // Interactive blocks — show a teaser card
  if (
    block.section_type === "ask_question" ||
    block.section_type === "request_information" ||
    block.section_type === "start_offer_discussion"
  ) {
    return (
      <SectionShell eyebrow={eyebrow} title={title} subtitle={block.subtitle} index={index}>
        {block.body && (
          <p className="text-sm text-foreground/80 mb-6 leading-[1.8] whitespace-pre-wrap">
            {block.body}
          </p>
        )}
        <InteractiveCard type={block.section_type} />
      </SectionShell>
    );
  }

  // Voiceover script — admin-only preview indicator
  if (block.section_type === "voiceover_script") {
    return (
      <SectionShell
        eyebrow="Internal · Voiceover script"
        title={title}
        subtitle="Hidden from buyers."
        index={index}
      >
        <pre className="whitespace-pre-wrap text-xs text-muted-foreground font-mono-brand bg-muted/40 p-4 rounded-md border hairline">
          {block.body || "No script written yet."}
        </pre>
      </SectionShell>
    );
  }

  // Default text block with optional key points & images
  return (
    <SectionShell eyebrow={eyebrow} title={title} subtitle={block.subtitle} index={index}>
      {block.body && (
        <p className="text-sm md:text-base text-foreground/85 leading-[1.85] whitespace-pre-wrap">
          {block.body}
        </p>
      )}
      {block.key_points.length > 0 && (
        <ul className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
          {block.key_points.map((kp, i) => (
            <li
              key={i}
              className="border hairline rounded-md p-4 text-sm text-foreground/90 leading-[1.6] flex gap-3"
            >
              <span className="font-mono-brand text-[10px] tracking-eyebrow uppercase text-primary shrink-0 pt-0.5">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span>{kp}</span>
            </li>
          ))}
        </ul>
      )}
      {block.image_refs.length > 0 && (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {block.image_refs.map((src, i) => (
            <div key={i} className="aspect-video overflow-hidden rounded-md border hairline bg-muted">
              <img src={src} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      )}
    </SectionShell>
  );
}

function SectionShell({
  eyebrow,
  title,
  subtitle,
  index,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string | null;
  index: number;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`px-6 md:px-12 py-12 md:py-16 border-b hairline ${
        index % 2 === 1 ? "bg-card/40" : ""
      }`}
    >
      <p className="font-mono-brand text-[10px] tracking-eyebrow uppercase text-primary mb-3">
        {eyebrow}
      </p>
      <h2 className="font-display text-2xl md:text-4xl tracking-display mb-3">
        {title}
      </h2>
      {subtitle && (
        <p className="text-sm md:text-base text-muted-foreground max-w-2xl leading-[1.6] mb-6">
          {subtitle}
        </p>
      )}
      {children}
    </section>
  );
}

function InteractiveCard({ type }: { type: SectionType }) {
  const config: Record<string, { icon: typeof MessageSquare; label: string; cta: string }> = {
    ask_question: {
      icon: MessageSquare,
      label: "Buyer question form",
      cta: "Ask about this business",
    },
    request_information: {
      icon: FileQuestion,
      label: "Buyer information request",
      cta: "Request information",
    },
    start_offer_discussion: {
      icon: HandCoins,
      label: "Non-binding offer discussion",
      cta: "Start offer discussion",
    },
  };
  const c = config[type];
  if (!c) return null;
  const Icon = c.icon;
  return (
    <div className="lumi-card-elevated p-8 md:p-10 flex items-start gap-5">
      <div className="rounded-md border hairline p-3">
        <Icon className="h-5 w-5 text-primary" strokeWidth={1.25} />
      </div>
      <div className="flex-1">
        <p className="font-mono-brand text-[10px] tracking-eyebrow uppercase text-muted-foreground mb-1">
          {c.label}
        </p>
        <p className="font-display text-lg tracking-display mb-3">
          Buyers can {blockLabel(type).toLowerCase()} from this point.
        </p>
        <span className="inline-flex items-center px-3 py-1.5 rounded-sm border border-primary/40 text-primary font-mono-brand text-[10px] tracking-eyebrow uppercase">
          {c.cta}
        </span>
      </div>
    </div>
  );
}