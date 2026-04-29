import logoHorizontal from "@/assets/lumi-logo-horizontal.png";

interface WordmarkProps {
  className?: string;
  showDot?: boolean;
}

export function Wordmark({ className = "" }: WordmarkProps) {
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <img
        src={logoHorizontal}
        alt="Lumi"
        className="h-7 w-auto select-none"
        draggable={false}
      />
      <span className="hidden sm:inline-block h-4 w-px bg-hairline" />
      <span className="hidden sm:inline-flex font-mono-brand text-[0.55em] tracking-eyebrow uppercase text-muted-foreground">
        Private
      </span>
    </div>
  );
}