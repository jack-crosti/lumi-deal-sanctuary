import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Lock, ShieldCheck, Eye, Sparkles } from "lucide-react";
import { Wordmark } from "@/components/brand/Wordmark";
import { useAuth } from "@/hooks/useAuth";
import { getDashboardPathForRole } from "@/lib/authRoles";
import heroLobby from "@/assets/hero-lobby.jpg";

const principles = [
  {
    icon: Lock,
    eyebrow: "01 · Invitation",
    title: "Private by design.",
    body: "Listings are released only to buyers verified by your Lumi broker. No public catalogue, no leaks, no noise.",
  },
  {
    icon: Eye,
    eyebrow: "02 · Reveal",
    title: "Information, in stages.",
    body: "Teaser, Information Memorandum, financials and due diligence — each unlocked as trust is established.",
  },
  {
    icon: ShieldCheck,
    eyebrow: "03 · Assurance",
    title: "Every view recorded.",
    body: "Document opens, downloads and questions are logged so brokers and vendors stay fully informed.",
  },
];

const process = [
  { n: "I",  k: "Introduction",      v: "Vetted by your Lumi broker. Identity, capacity and intent confirmed." },
  { n: "II", k: "Teaser & NDA",      v: "Anonymised teaser issued. Confidentiality executed inside the room." },
  { n: "III",k: "Information Memo",  v: "Full IM, financials and lease summary released stage-by-stage." },
  { n: "IV", k: "Discussion",        v: "Indicative offer started in-room. Broker arranges next conversation." },
];

const Index = () => {
  const { session, role } = useAuth();
  const enterPath = session ? getDashboardPathForRole(role) : "/login";
  const enterLabel = session ? "Enter deal room" : "Buyer sign in";

  return (
    <div className="min-h-dvh bg-background text-foreground overflow-hidden">
      {/* ============================================================ */}
      {/* TOP BAR */}
      {/* ============================================================ */}
      <header className="fixed top-0 inset-x-0 z-40 border-b hairline bg-background/60 backdrop-blur-xl">
        <div className="mx-auto max-w-[1400px] px-6 md:px-12 h-20 flex items-center justify-between">
          <Wordmark className="text-lg animate-fade-cinema" />
          <nav className="hidden md:flex items-center gap-12 text-[10px] tracking-eyebrow uppercase text-muted-foreground">
            <a href="#mandate" className="lumi-link hover:text-foreground">Our mandate</a>
            <a href="#process" className="lumi-link hover:text-foreground">Process</a>
            <a href="#assurance" className="lumi-link hover:text-foreground">Assurance</a>
          </nav>
          <Link
            to={enterPath}
            className="group inline-flex items-center gap-2 rounded-md border border-primary/30 bg-primary/5 px-5 py-2.5 text-[10px] tracking-eyebrow uppercase text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-500"
          >
            {enterLabel}
            <ArrowRight className="h-3 w-3 transition-transform duration-500 group-hover:translate-x-1" />
          </Link>
        </div>
      </header>

      {/* ============================================================ */}
      {/* HERO — split editorial */}
      {/* ============================================================ */}
      <section className="relative pt-20">
        {/* Ambient washes */}
        <div className="absolute inset-0 bg-radiance pointer-events-none" />
        <div className="absolute inset-0 bg-spotlight pointer-events-none" />
        {/* Grid */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
            maskImage: "radial-gradient(ellipse at 50% 0%, black, transparent 70%)",
          }}
        />

        <div className="relative mx-auto max-w-[1400px] px-6 md:px-12 pt-20 pb-32 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Copy column */}
          <div className="lg:col-span-7 relative z-10">
            <div className="inline-flex items-center gap-3 mb-12 border hairline-strong rounded-full px-4 py-2 animate-rise">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-60" />
                <span className="relative rounded-full h-1.5 w-1.5 bg-primary" />
              </span>
              <span className="font-mono-brand text-[10px] tracking-eyebrow uppercase text-muted-foreground">
                Lumi Business Sales · Private Channel
              </span>
            </div>

            <h1 className="font-display text-balance text-[2.75rem] sm:text-6xl lg:text-[6.5rem] leading-[0.92] tracking-display animate-rise delay-100">
              The private<br />
              deal room for<br />
              <span className="font-display-italic text-gradient-gold">extraordinary</span>{" "}
              hospitality.
            </h1>

            <p className="mt-10 max-w-xl text-base md:text-lg text-muted-foreground leading-[1.7] animate-rise delay-300">
              A confidential, broker-curated environment where approved buyers explore
              hand-selected hospitality opportunities — long before they ever reach the open market.
            </p>

            <div className="mt-14 flex flex-wrap items-center gap-4 animate-rise delay-500">
              <Link to={enterPath} className="lumi-btn-primary group">
                {enterLabel}
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-500 group-hover:translate-x-1" />
              </Link>
              <Link to="/invite" className="lumi-btn-ghost">
                Request access
              </Link>
            </div>

            <div className="mt-20 grid grid-cols-3 gap-8 max-w-xl animate-rise delay-700">
              {[
                { v: "184", k: "Vetted buyers" },
                { v: "12", k: "Active mandates" },
                { v: "21d", k: "Avg. to LOI" },
              ].map((s) => (
                <div key={s.k} className="border-l hairline-strong pl-5">
                  <div className="lumi-stat text-3xl md:text-4xl">{s.v}</div>
                  <div className="mt-2 font-mono-brand text-[9px] tracking-eyebrow uppercase text-muted-foreground">
                    {s.k}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cinematic image card */}
          <div className="lg:col-span-5 relative z-10 animate-rise-slow delay-300">
            <div className="relative aspect-[3/4] overflow-hidden rounded-lg border hairline-strong shadow-portrait grain">
              <img
                src={heroLobby}
                alt="A quiet luxury hospitality interior at twilight"
                className="absolute inset-0 h-full w-full object-cover scale-105"
              />
              <div className="absolute inset-0 bg-vignette pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent pointer-events-none" />

              {/* corner ticks */}
              <span className="absolute top-4 left-4 size-3 border-t border-l border-primary/70" />
              <span className="absolute top-4 right-4 size-3 border-t border-r border-primary/70" />
              <span className="absolute bottom-4 left-4 size-3 border-b border-l border-primary/70" />
              <span className="absolute bottom-4 right-4 size-3 border-b border-r border-primary/70" />

              {/* caption */}
              <div className="absolute left-6 right-6 bottom-6">
                <div className="font-mono-brand text-[9px] tracking-eyebrow uppercase text-primary mb-2 animate-shimmer">
                  Confidential mandate · No. 037
                </div>
                <div className="font-display text-xl md:text-2xl leading-tight">
                  An award-winning city restaurant.
                </div>
                <div className="mt-1 font-mono-brand text-[10px] tracking-eyebrow uppercase text-muted-foreground">
                  Auckland CBD · EBITDA undisclosed
                </div>
              </div>
            </div>

            {/* floating credential pill */}
            <div className="absolute -left-4 -bottom-4 hidden md:flex items-center gap-3 px-5 py-3 rounded-full border hairline-strong bg-card/90 backdrop-blur-xl shadow-vault">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="font-mono-brand text-[9px] tracking-eyebrow uppercase text-muted-foreground">
                AES-256 · Audited · NZ Licensed REAA 2008
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* MANDATE — quote / editorial */}
      {/* ============================================================ */}
      <section id="mandate" className="relative border-t hairline">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent pointer-events-none" />
        <div className="relative mx-auto max-w-[1400px] px-6 md:px-12 py-32 md:py-40">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
            <div className="lg:col-span-4">
              <div className="font-mono-brand text-[10px] tracking-eyebrow uppercase text-primary mb-6">
                Our mandate
              </div>
              <div className="lumi-stat text-6xl md:text-7xl text-gradient-gold">037</div>
              <div className="mt-3 font-mono-brand text-[10px] tracking-eyebrow uppercase text-muted-foreground">
                Mandates closed since 2019
              </div>
            </div>
            <div className="lg:col-span-8">
              <h2 className="font-display text-4xl md:text-6xl leading-[0.98] tracking-display text-balance">
                Discretion is{" "}
                <span className="font-display-italic text-primary">the product.</span>
              </h2>
              <p className="mt-10 text-base md:text-lg text-muted-foreground leading-[1.8] max-w-2xl">
                Lumi represents vendors whose businesses are too valuable — and too sensitive —
                to list publicly. The deal room is where serious conversations begin, between people
                who have already proven they belong in the room.
              </p>
              <div className="mt-12 flex items-center gap-6 text-[10px] tracking-eyebrow uppercase text-muted-foreground font-mono-brand">
                <span className="h-px w-12 bg-primary" />
                Jack Daniels · Principal Broker
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* PRINCIPLES — editorial cards */}
      {/* ============================================================ */}
      <section id="assurance" className="relative border-t hairline">
        <div className="mx-auto max-w-[1400px] px-6 md:px-12 py-32">
          <div className="max-w-3xl mb-20">
            <div className="font-mono-brand text-[10px] tracking-eyebrow uppercase text-primary mb-6">
              Assurance
            </div>
            <h2 className="font-display text-4xl md:text-5xl leading-[1.0] tracking-display text-balance">
              Every interaction, considered.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {principles.map((p, i) => (
              <article
                key={p.title}
                className="group relative lumi-card-elevated p-10 md:p-12 transition-all duration-700 hover:border-primary/30 hover:translate-y-[-4px]"
                style={{ animationDelay: `${i * 120}ms` }}
              >
                {/* hover glow */}
                <div className="absolute inset-0 rounded-lg bg-primary/0 group-hover:bg-primary/[0.02] transition-colors duration-700 pointer-events-none" />

                <div className="relative">
                  <div className="flex items-center justify-between mb-12">
                    <p.icon className="h-5 w-5 text-primary transition-transform duration-700 group-hover:scale-110" strokeWidth={1.25} />
                    <span className="font-mono-brand text-[9px] tracking-eyebrow uppercase text-muted-foreground">
                      {p.eyebrow}
                    </span>
                  </div>
                  <h3 className="font-display text-2xl md:text-3xl tracking-display mb-5 leading-tight">
                    {p.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-[1.8]">{p.body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* PROCESS — numbered editorial */}
      {/* ============================================================ */}
      <section id="process" className="relative border-t hairline">
        <div className="mx-auto max-w-[1400px] px-6 md:px-12 py-32">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-20">
            <div className="lg:col-span-4">
              <div className="font-mono-brand text-[10px] tracking-eyebrow uppercase text-primary mb-6">
                Process
              </div>
              <h2 className="font-display text-4xl md:text-5xl leading-[1.0] tracking-display">
                A measured<br />
                <span className="font-display-italic text-primary">cadence.</span>
              </h2>
            </div>
            <div className="lg:col-span-8">
              <p className="text-base md:text-lg text-muted-foreground leading-[1.8] max-w-2xl">
                From first introduction to final discussion, every step inside the deal room is
                deliberate. Buyers move through four stages — at the speed your broker permits.
              </p>
            </div>
          </div>

          <ol className="divide-y hairline border-y hairline">
            {process.map((step) => (
              <li
                key={step.n}
                className="group grid grid-cols-12 gap-6 py-10 md:py-12 px-2 transition-colors duration-500 hover:bg-card/40"
              >
                <div className="col-span-2 md:col-span-1 font-display-italic text-3xl md:text-4xl text-primary/80 group-hover:text-primary transition-colors">
                  {step.n}
                </div>
                <div className="col-span-10 md:col-span-3">
                  <div className="font-display text-xl md:text-2xl tracking-display">
                    {step.k}
                  </div>
                </div>
                <div className="col-span-12 md:col-span-7 md:col-start-6 text-sm md:text-base text-muted-foreground leading-[1.8]">
                  {step.v}
                </div>
                <div className="col-span-12 md:col-span-1 hidden md:flex items-start justify-end">
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-all duration-500 group-hover:rotate-45" />
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ============================================================ */}
      {/* CTA */}
      {/* ============================================================ */}
      <section className="relative border-t hairline">
        <div className="absolute inset-0 bg-radiance pointer-events-none" />
        <div className="relative mx-auto max-w-[1400px] px-6 md:px-12 py-32 text-center">
          <div className="font-mono-brand text-[10px] tracking-eyebrow uppercase text-primary mb-8">
            By invitation
          </div>
          <h2 className="font-display text-4xl md:text-6xl lg:text-7xl leading-[0.98] tracking-display text-balance max-w-4xl mx-auto">
            Step inside the room where{" "}
            <span className="font-display-italic text-gradient-gold">quiet deals</span>{" "}
            are made.
          </h2>
          <div className="mt-14 flex flex-wrap items-center justify-center gap-4">
            <Link to={enterPath} className="lumi-btn-primary group">
              {enterLabel}
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-500 group-hover:translate-x-1" />
            </Link>
            <Link to="/invite" className="lumi-btn-ghost">
              Request access
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* FOOTER */}
      {/* ============================================================ */}
      <footer className="border-t hairline">
        <div className="mx-auto max-w-[1400px] px-6 md:px-12 py-16 grid grid-cols-1 md:grid-cols-12 gap-10">
          <div className="md:col-span-6">
            <Wordmark className="text-base" />
            <p className="mt-6 text-sm text-muted-foreground max-w-md leading-[1.8]">
              Lumi Business Sales · Empowered by The Network · Licensed REAA 2008.
              All access to this deal room is logged and audited.
            </p>
          </div>
          <div className="md:col-span-3 font-mono-brand text-[10px] tracking-eyebrow uppercase text-muted-foreground space-y-3">
            <div className="text-foreground/60">Office</div>
            <div>Auckland · Aotearoa</div>
            <div>Open by appointment</div>
          </div>
          <div className="md:col-span-3 font-mono-brand text-[10px] tracking-eyebrow uppercase text-muted-foreground space-y-3">
            <div className="text-foreground/60">Channel</div>
            <div>© {new Date().getFullYear()} Lumi</div>
            <div>v · Private 1.0</div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
