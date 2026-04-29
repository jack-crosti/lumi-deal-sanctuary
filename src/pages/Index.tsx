import { Link } from "react-router-dom";
import { ArrowRight, Lock, ShieldCheck, Eye } from "lucide-react";
import { Wordmark } from "@/components/brand/Wordmark";
import { useAuth } from "@/hooks/useAuth";

const principles = [
  {
    icon: Lock,
    eyebrow: "Invitation only",
    title: "Private by design",
    body: "Listings are released only to buyers verified by your Lumi broker. No public catalogue, no leaks.",
  },
  {
    icon: Eye,
    eyebrow: "Confidential reveal",
    title: "Information, in stages",
    body: "Teaser, Information Memorandum, financials and due diligence — unlocked as trust is established.",
  },
  {
    icon: ShieldCheck,
    eyebrow: "Audited access",
    title: "Every view recorded",
    body: "Document opens, downloads and questions are logged so brokers and vendors stay fully informed.",
  },
];

const Index = () => {
  const { session, role } = useAuth();

  return (
    <div className="min-h-dvh bg-background text-foreground">
      {/* Top bar */}
      <header className="relative z-20 border-b hairline bg-background/70 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-6 md:px-12 h-16 flex items-center justify-between">
          <Wordmark className="text-lg" />
          <nav className="hidden md:flex items-center gap-10 text-[11px] tracking-eyebrow uppercase text-muted-foreground">
            <a href="#mandate" className="hover:text-foreground transition-colors">Our mandate</a>
            <a href="#process" className="hover:text-foreground transition-colors">Process</a>
            <a href="#assurance" className="hover:text-foreground transition-colors">Assurance</a>
          </nav>
          <Link
            to={session ? (role === "admin" ? "/admin" : "/portal") : "/auth"}
            className="group inline-flex items-center gap-2 rounded-sm border border-primary/40 bg-primary/10 px-4 py-2 text-[11px] tracking-eyebrow uppercase text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            {session ? "Enter deal room" : "Buyer sign in"}
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-radiance pointer-events-none" />
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
            maskImage: "radial-gradient(ellipse at 50% 0%, black, transparent 70%)",
          }}
        />

        <div className="relative mx-auto max-w-7xl px-6 md:px-12 pt-24 pb-32 grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-3 mb-10 border hairline rounded-full px-3 py-1.5">
              <span className="size-1.5 rounded-full bg-primary shadow-[0_0_12px_hsl(var(--primary))]" />
              <span className="font-mono-brand text-[10px] tracking-eyebrow uppercase text-muted-foreground">
                Lumi Business Sales · Private Channel
              </span>
            </div>

            <h1 className="font-display text-5xl md:text-7xl lg:text-[5.25rem] leading-[0.95] tracking-tight text-balance">
              The private deal room for{" "}
              <span className="italic font-light text-primary">extraordinary</span>{" "}
              hospitality businesses.
            </h1>

            <p className="mt-8 max-w-xl text-lg text-muted-foreground leading-relaxed">
              A confidential, broker-curated environment where approved buyers explore
              hand-selected hospitality opportunities — well before they ever reach the open market.
            </p>

            <div className="mt-12 flex flex-wrap items-center gap-4">
              <Link
                to="/auth"
                className="inline-flex items-center gap-3 rounded-sm bg-primary px-6 py-4 text-[11px] tracking-eyebrow uppercase text-primary-foreground hover:bg-primary/90 transition-colors shadow-cinema"
              >
                Enter the deal room
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <a
                href="#mandate"
                className="inline-flex items-center gap-3 rounded-sm border hairline px-6 py-4 text-[11px] tracking-eyebrow uppercase text-foreground hover:border-primary/60 transition-colors"
              >
                Request access
              </a>
            </div>
          </div>

          {/* Stats column */}
          <div className="lg:col-span-5 lg:pl-8">
            <div className="border hairline rounded-sm bg-card/60 backdrop-blur-md shadow-vault">
              <div className="px-8 py-7 border-b hairline">
                <div className="font-mono-brand text-[10px] tracking-eyebrow uppercase text-muted-foreground">
                  Channel snapshot
                </div>
                <div className="mt-2 font-display text-2xl">A quieter way to transact.</div>
              </div>
              <dl className="grid grid-cols-2 divide-x divide-y hairline">
                {[
                  { k: "Vetted buyers", v: "184" },
                  { k: "Active mandates", v: "12" },
                  { k: "Avg. days to LOI", v: "21" },
                  { k: "Confidentiality", v: "Absolute" },
                ].map((s) => (
                  <div key={s.k} className="px-8 py-7">
                    <div className="font-display text-3xl tabular-nums">{s.v}</div>
                    <div className="mt-1 font-mono-brand text-[10px] tracking-eyebrow uppercase text-muted-foreground">
                      {s.k}
                    </div>
                  </div>
                ))}
              </dl>
            </div>

            <p className="mt-6 text-xs text-muted-foreground leading-relaxed">
              Access is granted only after broker verification. Every session is logged and tied to your identity.
            </p>
          </div>
        </div>
      </section>

      {/* Principles */}
      <section id="mandate" className="border-t hairline">
        <div className="mx-auto max-w-7xl px-6 md:px-12 py-24">
          <div className="max-w-2xl mb-16">
            <div className="font-mono-brand text-[10px] tracking-eyebrow uppercase text-primary mb-4">
              Our mandate
            </div>
            <h2 className="font-display text-4xl md:text-5xl leading-tight tracking-tight">
              Discretion is the product.
            </h2>
            <p className="mt-6 text-muted-foreground leading-relaxed">
              Lumi represents vendors whose businesses are too valuable — and too sensitive —
              to list publicly. The deal room is where serious conversations begin.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-hairline border hairline">
            {principles.map((p) => (
              <div key={p.title} className="bg-background p-8 md:p-10">
                <p.icon className="h-5 w-5 text-primary mb-8" strokeWidth={1.5} />
                <div className="font-mono-brand text-[10px] tracking-eyebrow uppercase text-muted-foreground mb-3">
                  {p.eyebrow}
                </div>
                <h3 className="font-display text-2xl mb-3">{p.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t hairline">
        <div className="mx-auto max-w-7xl px-6 md:px-12 py-12 flex flex-col md:flex-row gap-6 md:items-end justify-between">
          <div>
            <Wordmark className="text-base" />
            <p className="mt-4 text-xs text-muted-foreground max-w-md leading-relaxed">
              Lumi Business Sales · (em)powered by The Network · Licensed REAA 2008.
              All access to this deal room is logged and audited.
            </p>
          </div>
          <div className="flex gap-8 font-mono-brand text-[10px] tracking-eyebrow uppercase text-muted-foreground">
            <span>© {new Date().getFullYear()} Lumi</span>
            <span>Auckland · Aotearoa</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
