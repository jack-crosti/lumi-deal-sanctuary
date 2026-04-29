interface WordmarkProps {
  className?: string;
  showDot?: boolean;
}

export function Wordmark({ className = "", showDot = true }: WordmarkProps) {
  return (
    <div className={`inline-flex items-baseline gap-[0.18em] ${className}`}>
      <span className="font-display text-[1.35em] font-light tracking-tight">Lumi</span>
      {showDot && (
        <span className="inline-block h-[0.35em] w-[0.35em] rounded-full bg-primary translate-y-[-0.65em]" />
      )}
      <span className="font-mono-brand text-[0.55em] tracking-eyebrow uppercase text-muted-foreground ml-2">
        Private
      </span>
    </div>
  );
}