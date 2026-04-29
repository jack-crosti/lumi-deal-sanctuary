import { Link } from "react-router-dom";
import { ArrowRight, Mail } from "lucide-react";
import { Wordmark } from "@/components/brand/Wordmark";

export default function Invite() {
  return (
    <div className="min-h-dvh bg-background text-foreground relative overflow-hidden grid place-items-center">
      <div className="absolute inset-0 bg-radiance pointer-events-none" />
      <div className="relative z-10 w-full max-w-lg px-6">
        <div className="text-center mb-10">
          <Wordmark className="text-base justify-center inline-flex" />
        </div>
        <div className="border hairline bg-card/70 backdrop-blur-md p-10 shadow-vault text-center">
          <Mail className="h-6 w-6 text-primary mx-auto mb-6" strokeWidth={1.5} />
          <div className="font-mono-brand text-[10px] tracking-eyebrow uppercase text-primary mb-3">
            By invitation
          </div>
          <h1 className="font-display text-3xl tracking-tight mb-4">
            Access is granted by your broker.
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed mb-8">
            The Lumi deal room is invitation-only. If you have been in contact with a Lumi broker,
            ask them to issue your access. Once issued you will receive an email with a sign-in link.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-3 rounded-sm bg-primary px-6 py-3 text-[11px] tracking-eyebrow uppercase text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            I already have access
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}