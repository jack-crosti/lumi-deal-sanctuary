import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  Lock,
  MapPin,
  Sparkles,
  TrendingUp,
  Building2,
  FileSignature,
  Users,
  Rocket,
  Target,
  ShieldAlert,
  Image as ImageIcon,
  MessageSquare,
  HandCoins,
  Send,
  Check,
  Quote,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import BuyerDocuments from "@/components/buyer/BuyerDocuments";
import { formatCurrency } from "@/lib/format";
import { ACCESS_LEVEL_OPTIONS, type AccessLevel } from "@/lib/buyerLabels";

type LocationMode = "blind" | "suburb" | "exact";

interface BusinessDetail {
  id: string;
  name: string;
  public_title: string | null;
  confidential_title: string | null;
  headline: string | null;
  summary: string | null;
  business_type: string | null;
  industry: string | null;
  location_mode: LocationMode;
  suburb: string | null;
  city: string | null;
  region: string | null;
  address: string | null;
  asking_price: number | null;
  ebitda: number | null;
  normalised_profit: number | null;
  revenue: number | null;
  stock_value: number | null;
  weekly_sales_min: number | null;
  weekly_sales_max: number | null;
  rent_per_year: number | null;
  lease_expiry: string | null;
  renewal_rights: string | null;
  tenure: string | null;
  staff_summary: string | null;
  owner_involvement: string | null;
  opening_hours: string | null;
  hero_image_url: string | null;
}

const SECTIONS = [
  { id: "hero", label: "Overview" },
  { id: "location", label: "Location" },
  { id: "highlights", label: "Highlights" },
  { id: "about", label: "Business" },
  { id: "financials", label: "Financials" },
  { id: "lease", label: "Lease" },
  { id: "operations", label: "Operations" },
  { id: "growth", label: "Growth" },
  { id: "fit", label: "Buyer Fit" },
  { id: "risks", label: "Due Diligence" },
  { id: "gallery", label: "Gallery" },
  { id: "documents", label: "Documents" },
  { id: "ask", label: "Ask" },
  { id: "offer", label: "Offer" },
];

export default function BuyerBusiness() {
  const { businessId } = useParams<{ businessId: string }>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState<BusinessDetail | null>(null);
  const [accessLevel, setAccessLevel] = useState<AccessLevel | null>(null);
  const [denied, setDenied] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");
  const trackedView = useRef(false);

  useEffect(() => {
    let active = true;
    if (!businessId || !user) return;
    (async () => {
      const [{ data: biz, error: bizErr }, { data: access }] = await Promise.all([
        supabase
          .from("businesses")
          .select(
            "id,name,public_title,confidential_title,headline,summary,business_type,industry,location_mode,suburb,city,region,address,asking_price,ebitda,normalised_profit,revenue,stock_value,weekly_sales_min,weekly_sales_max,rent_per_year,lease_expiry,renewal_rights,tenure,staff_summary,owner_involvement,opening_hours,hero_image_url"
          )
          .eq("id", businessId)
          .maybeSingle(),
        supabase
          .from("buyer_business_access")
          .select("access_level")
          .eq("buyer_id", user.id)
          .eq("business_id", businessId)
          .maybeSingle(),
      ]);
      if (!active) return;
      if (bizErr || !biz) {
        setDenied(true);
      } else {
        setBusiness(biz as BusinessDetail);
        setAccessLevel((access?.access_level as AccessLevel) ?? "teaser");
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [businessId, user]);

  // Track page view once
  useEffect(() => {
    if (!business || !user || trackedView.current) return;
    trackedView.current = true;
    void supabase.from("buyer_activity").insert({
      buyer_id: user.id,
      business_id: business.id,
      event_type: "business_view",
      metadata: {},
    });
  }, [business, user]);

  // Section observer for active nav highlight
  useEffect(() => {
    if (!business) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActiveSection(e.target.id);
        });
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
    );
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [business]);

  if (loading) {
    return (
      <div className="flex items-center gap-3 text-muted-foreground font-mono-brand text-[11px] tracking-eyebrow uppercase">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Verifying access…
      </div>
    );
  }
  if (denied || !business) return <Navigate to="/unauthorized" replace />;

  const showFinancials =
    accessLevel === "financial" || accessLevel === "serious" || accessLevel === "full_dd";
  const showExactLocation = business.location_mode === "exact";
  const accessLabel =
    ACCESS_LEVEL_OPTIONS.find((o) => o.value === accessLevel)?.label ?? "Teaser";

  return (
    <div className="-mx-6 md:-mx-12 -my-14 md:-my-20">
      {/* Back bar */}
      <div className="sticky top-20 z-20 border-b hairline bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-[1400px] px-6 md:px-12 py-3 flex items-center justify-between gap-4">
          <Link
            to="/buyer/dashboard"
            className="inline-flex items-center gap-2 font-mono-brand text-[10px] tracking-eyebrow uppercase text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-3 w-3" />
            All opportunities
          </Link>
          <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 font-mono-brand text-[9px] tracking-eyebrow uppercase border border-primary/40 bg-primary/10 text-primary">
            <span className="size-1.5 rounded-full bg-primary animate-shimmer" />
            {accessLabel} access
          </span>
        </div>
      </div>

      <div className="relative mx-auto max-w-[1400px] px-6 md:px-12 py-12 md:py-16">
        <div className="lg:grid lg:grid-cols-[200px_1fr] lg:gap-12">
          {/* Sticky side nav (desktop) */}
          <aside className="hidden lg:block">
            <nav className="sticky top-36 space-y-1">
              <div className="font-mono-brand text-[9px] tracking-eyebrow uppercase text-muted-foreground mb-4 pl-3">
                Sections
              </div>
              {SECTIONS.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className={`block pl-3 pr-2 py-1.5 text-[10px] tracking-eyebrow uppercase border-l transition-all duration-300 ${
                    activeSection === s.id
                      ? "border-primary text-primary"
                      : "border-hairline text-muted-foreground hover:text-foreground hover:border-foreground/40"
                  }`}
                >
                  {s.label}
                </a>
              ))}
            </nav>
          </aside>

          <div className="space-y-28 md:space-y-36">
            <HeroSection
              business={business}
              showFinancials={showFinancials}
              showExactLocation={showExactLocation}
            />
            <LocationSection business={business} showExactLocation={showExactLocation} />
            <HighlightsSection business={business} />
            <AboutSection business={business} />
            <FinancialsSection business={business} showFinancials={showFinancials} />
            <LeaseSection business={business} showFinancials={showFinancials} />
            <OperationsSection business={business} />
            <GrowthSection />
            <BuyerFitSection />
            <RisksSection />
            <GallerySection business={business} />
            <section id="documents" className="scroll-mt-32">
              <SectionEyebrow icon={FileSignature} eyebrow="File room" title="Supporting documents" />
              <div className="mt-10">
                <BuyerDocuments businessId={business.id} />
              </div>
            </section>
            <AskSection businessId={business.id} />
            <OfferSection businessId={business.id} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Shared atoms ---------- */

function SectionEyebrow({
  icon: Icon,
  eyebrow,
  title,
  intro,
}: {
  icon: React.ComponentType<{ className?: string }>;
  eyebrow: string;
  title: string;
  intro?: string;
}) {
  return (
    <div className="max-w-3xl">
      <div className="font-mono-brand text-[10px] tracking-eyebrow uppercase text-primary mb-5 flex items-center gap-3">
        <span className="h-px w-8 bg-primary" />
        <Icon className="h-3 w-3" />
        {eyebrow}
      </div>
      <h2 className="font-display text-3xl md:text-5xl tracking-display leading-[1.05] text-balance">
        {title}
      </h2>
      {intro && (
        <p className="mt-6 text-base md:text-lg text-muted-foreground leading-[1.8] max-w-2xl">
          {intro}
        </p>
      )}
    </div>
  );
}

function StatBlock({
  label,
  value,
  sub,
  locked,
}: {
  label: string;
  value: string;
  sub?: string;
  locked?: boolean;
}) {
  return (
    <div className="relative lumi-card p-7 overflow-hidden">
      <div className="absolute top-3 right-3 size-2 border-t border-r border-primary/30" />
      <div className="font-mono-brand text-[9px] tracking-eyebrow uppercase text-muted-foreground mb-3 flex items-center gap-2">
        {locked && <Lock className="h-3 w-3 text-primary/60" />}
        {label}
      </div>
      <div
        className={`lumi-stat text-3xl md:text-4xl ${
          locked ? "text-muted-foreground/60" : "text-foreground"
        }`}
      >
        {value}
      </div>
      {sub && (
        <div className="mt-2 font-mono-brand text-[9px] tracking-eyebrow uppercase text-muted-foreground">
          {sub}
        </div>
      )}
    </div>
  );
}

/* ---------- Hero ---------- */

function HeroSection({
  business,
  showFinancials,
  showExactLocation,
}: {
  business: BusinessDetail;
  showFinancials: boolean;
  showExactLocation: boolean;
}) {
  const title = business.confidential_title || business.public_title || business.name;
  const profit = business.ebitda ?? business.normalised_profit;
  const locationLine = locationDisplay(business, showExactLocation);

  return (
    <section id="hero" className="scroll-mt-32 -mt-12 md:-mt-16">
      <div className="relative lumi-card-elevated overflow-hidden grain">
        {/* Hero image */}
        <div className="relative aspect-[16/10] md:aspect-[21/9] overflow-hidden">
          {business.hero_image_url ? (
            <img
              src={business.hero_image_url}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-card to-background-deep" />
          )}
          <div className="absolute inset-0 bg-radiance opacity-70 pointer-events-none" />
          <div className="absolute inset-0 bg-vignette pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-background via-background/80 to-transparent" />
        </div>

        {/* Hero content */}
        <div className="relative -mt-32 md:-mt-48 px-6 md:px-14 pb-14 md:pb-16">
          <div className="font-mono-brand text-[10px] tracking-eyebrow uppercase text-primary mb-5 flex items-center gap-3 animate-rise">
            <span className="h-px w-8 bg-primary" />
            Confidential Information Memorandum
            {business.business_type && <span className="text-muted-foreground">· {business.business_type}</span>}
          </div>
          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl tracking-display leading-[1.0] text-balance max-w-4xl animate-rise delay-100">
            {title}
          </h1>
          {business.headline && (
            <p className="mt-6 font-display-italic text-lg md:text-2xl text-foreground/85 max-w-2xl leading-[1.4] animate-rise delay-200">
              {business.headline}
            </p>
          )}

          <div className="mt-7 flex items-center gap-2 text-sm text-muted-foreground animate-rise delay-300">
            {showExactLocation ? (
              <MapPin className="h-3.5 w-3.5 text-primary" />
            ) : (
              <Lock className="h-3.5 w-3.5 text-primary" />
            )}
            <span>{locationLine}</span>
          </div>

          {/* Stat row */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5 animate-rise delay-300">
            <StatBlock
              label="Asking price"
              value={formatCurrency(business.asking_price, { compact: true })}
            />
            <StatBlock
              label="Profit (EBITDA)"
              value={showFinancials ? formatCurrency(profit, { compact: true }) : "Locked"}
              sub={!showFinancials ? "Financial access required" : undefined}
              locked={!showFinancials}
            />
            <StatBlock
              label="Business type"
              value={business.business_type || business.industry || "—"}
            />
            <StatBlock label="Tenure" value={business.tenure || "On enquiry"} />
          </div>

          {/* CTAs */}
          <div className="mt-12 flex flex-wrap gap-3 animate-rise delay-500">
            <a href="#ask" className="lumi-btn-primary">
              <MessageSquare className="h-3.5 w-3.5" />
              Ask a question
            </a>
            <a href="#documents" className="lumi-btn-ghost">
              <FileSignature className="h-3.5 w-3.5" />
              Request more information
            </a>
            <a href="#offer" className="lumi-btn-ghost">
              <HandCoins className="h-3.5 w-3.5" />
              Discuss an offer
            </a>
          </div>
        </div>
      </div>

      {/* Broker summary */}
      {business.summary && (
        <div className="mt-16 max-w-3xl mx-auto text-center animate-rise delay-700">
          <Quote className="h-5 w-5 text-primary/60 mx-auto mb-5" strokeWidth={1.25} />
          <p className="font-display-italic text-xl md:text-2xl text-foreground/90 leading-[1.5] text-balance">
            “{business.summary}”
          </p>
          <div className="mt-6 font-mono-brand text-[9px] tracking-eyebrow uppercase text-muted-foreground">
            Broker introduction · Lumi Private
          </div>
        </div>
      )}
    </section>
  );
}

/* ---------- Location ---------- */

function LocationSection({
  business,
  showExactLocation,
}: {
  business: BusinessDetail;
  showExactLocation: boolean;
}) {
  return (
    <section id="location" className="scroll-mt-32">
      <SectionEyebrow
        icon={MapPin}
        eyebrow="Location advantage"
        title={
          showExactLocation
            ? "A site that does the trading for you."
            : "Strategically positioned in a high-demand catchment."
        }
        intro={
          showExactLocation
            ? "Exact address available below. Surrounded by complementary demand drivers."
            : "Specific location remains confidential. Detailed demand analysis is available once buyer access progresses."
        }
      />
      <div className="mt-10 grid md:grid-cols-2 gap-6">
        <div className="relative lumi-card-elevated overflow-hidden aspect-[4/3]">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-card to-background-deep" />
          <div className="absolute inset-0 bg-spotlight opacity-60" />
          {/* Map placeholder grid */}
          <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="hsl(var(--primary))" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="relative inline-flex">
                <MapPin className="h-8 w-8 text-primary" strokeWidth={1.5} />
                <span className="absolute inset-0 animate-ping rounded-full bg-primary/30" />
              </div>
              <div className="mt-4 font-mono-brand text-[9px] tracking-eyebrow uppercase text-muted-foreground">
                {showExactLocation ? "Exact pin" : "Approximate area"}
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-5">
          <div className="lumi-card p-7">
            <div className="font-mono-brand text-[9px] tracking-eyebrow uppercase text-muted-foreground mb-2">
              Address
            </div>
            <div className="text-base">{locationDisplay(business, showExactLocation)}</div>
          </div>
          <div className="lumi-card p-7">
            <div className="font-mono-brand text-[9px] tracking-eyebrow uppercase text-muted-foreground mb-3">
              Demand drivers
            </div>
            <ul className="space-y-2 text-sm text-foreground/85">
              {[
                "High-traffic commercial precinct",
                "Strong residential catchment",
                "Adjacent anchor tenants",
                "Public transport access",
              ].map((d) => (
                <li key={d} className="flex items-center gap-3">
                  <span className="size-1 rounded-full bg-primary" />
                  {d}
                </li>
              ))}
            </ul>
            <div className="mt-5 pt-4 border-t hairline font-mono-brand text-[9px] tracking-eyebrow uppercase text-muted-foreground">
              Detailed demand map staged for next release
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Highlights ---------- */

function HighlightsSection({ business }: { business: BusinessDetail }) {
  const highlights = useMemo(() => {
    const items: { label: string; value: string }[] = [];
    if (business.weekly_sales_min || business.weekly_sales_max) {
      const min = business.weekly_sales_min ? formatCurrency(business.weekly_sales_min, { compact: true }) : null;
      const max = business.weekly_sales_max ? formatCurrency(business.weekly_sales_max, { compact: true }) : null;
      items.push({
        label: "Weekly sales",
        value: min && max ? `${min} – ${max}` : (min ?? max ?? "—"),
      });
    }
    if (business.tenure) items.push({ label: "Tenure", value: business.tenure });
    if (business.opening_hours) items.push({ label: "Trading hours", value: business.opening_hours });
    if (business.owner_involvement) items.push({ label: "Owner role", value: business.owner_involvement });
    if (business.staff_summary) items.push({ label: "Staff", value: business.staff_summary });
    if (business.industry) items.push({ label: "Industry", value: business.industry });
    while (items.length < 4) {
      items.push({ label: "Detail to follow", value: "Released on access progression" });
    }
    return items.slice(0, 6);
  }, [business]);

  return (
    <section id="highlights" className="scroll-mt-32">
      <SectionEyebrow
        icon={Sparkles}
        eyebrow="Key highlights"
        title="What makes this opportunity stand out."
      />
      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {highlights.map((h, i) => (
          <div key={i} className="relative lumi-card p-7 group hover:border-primary/40 transition-colors">
            <div className="absolute top-0 left-0 h-px w-12 bg-gradient-to-r from-primary to-transparent" />
            <div className="font-mono-brand text-[9px] tracking-eyebrow uppercase text-muted-foreground mb-3">
              0{i + 1} · {h.label}
            </div>
            <div className="text-lg leading-[1.5] text-foreground/90">{h.value}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------- About ---------- */

function AboutSection({ business }: { business: BusinessDetail }) {
  return (
    <section id="about" className="scroll-mt-32">
      <SectionEyebrow icon={Building2} eyebrow="Business overview" title="The story behind the numbers." />
      <div className="mt-10 grid md:grid-cols-3 gap-10">
        <div className="md:col-span-2">
          <p className="text-base md:text-lg leading-[1.9] text-foreground/85 whitespace-pre-line">
            {business.summary ||
              business.headline ||
              "A full editorial overview is being prepared by the Lumi team. The narrative below will cover the founding story, market positioning, customer profile and operating rhythm — written to give you a complete sense of how the business runs day-to-day."}
          </p>
        </div>
        <aside className="space-y-4">
          <FactRow label="Industry" value={business.industry} />
          <FactRow label="Type" value={business.business_type} />
          <FactRow label="Tenure" value={business.tenure} />
          <FactRow label="Trading hours" value={business.opening_hours} />
        </aside>
      </div>
    </section>
  );
}

function FactRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="border-b hairline pb-3">
      <div className="font-mono-brand text-[9px] tracking-eyebrow uppercase text-muted-foreground mb-1">
        {label}
      </div>
      <div className="text-sm">{value || "—"}</div>
    </div>
  );
}

/* ---------- Financials ---------- */

function FinancialsSection({
  business,
  showFinancials,
}: {
  business: BusinessDetail;
  showFinancials: boolean;
}) {
  if (!showFinancials) {
    return (
      <section id="financials" className="scroll-mt-32">
        <SectionEyebrow icon={TrendingUp} eyebrow="Financial snapshot" title="Financials are released to qualified buyers." />
        <div className="mt-10 relative lumi-card-elevated p-12 md:p-16 overflow-hidden">
          <div className="absolute inset-0 bg-radiance opacity-40 pointer-events-none" />
          <Lock className="h-6 w-6 text-primary mb-6" strokeWidth={1.25} />
          <h3 className="font-display text-2xl md:text-3xl tracking-display mb-4 max-w-xl text-balance">
            Revenue, profit and trading metrics are released once your access progresses to Financial.
          </h3>
          <p className="text-sm text-muted-foreground max-w-xl leading-[1.8]">
            This typically follows a brief introduction call and confidentiality formalities. Reach out to your broker via the Ask panel below to begin.
          </p>
          <a href="#ask" className="mt-7 inline-flex lumi-btn-primary">
            <MessageSquare className="h-3.5 w-3.5" />
            Request access
          </a>
        </div>
      </section>
    );
  }

  const profit = business.ebitda ?? business.normalised_profit;
  return (
    <section id="financials" className="scroll-mt-32">
      <SectionEyebrow icon={TrendingUp} eyebrow="Financial snapshot" title="Trading performance, normalised." />
      <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
        <StatBlock label="Revenue" value={formatCurrency(business.revenue, { compact: true })} sub="Annualised" />
        <StatBlock label="Normalised profit" value={formatCurrency(profit, { compact: true })} sub="EBITDA basis" />
        <StatBlock
          label="Weekly sales"
          value={
            business.weekly_sales_min || business.weekly_sales_max
              ? `${formatCurrency(business.weekly_sales_min, { compact: true })} – ${formatCurrency(business.weekly_sales_max, { compact: true })}`
              : "—"
          }
        />
        <StatBlock label="Stock at value" value={formatCurrency(business.stock_value, { compact: true })} />
      </div>
      <div className="mt-6 lumi-card p-7 text-sm text-muted-foreground leading-[1.8]">
        Detailed financial statements, GST returns and POS reports are available in the file room below, subject to your access level.
      </div>
    </section>
  );
}

/* ---------- Lease ---------- */

function LeaseSection({
  business,
  showFinancials,
}: {
  business: BusinessDetail;
  showFinancials: boolean;
}) {
  return (
    <section id="lease" className="scroll-mt-32">
      <SectionEyebrow icon={FileSignature} eyebrow="Lease summary" title="Security of tenure." />
      <div className="mt-10 grid md:grid-cols-3 gap-5">
        <StatBlock
          label="Annual rent"
          value={showFinancials ? formatCurrency(business.rent_per_year, { compact: true }) : "Locked"}
          locked={!showFinancials}
        />
        <StatBlock
          label="Lease expiry"
          value={
            business.lease_expiry
              ? new Date(business.lease_expiry).toLocaleDateString("en-NZ", {
                  month: "short",
                  year: "numeric",
                })
              : "—"
          }
        />
        <StatBlock label="Renewal rights" value={business.renewal_rights || "On enquiry"} />
      </div>
      <div className="mt-6 lumi-card p-7 text-sm text-muted-foreground leading-[1.8]">
        Full lease document is available in the file room subject to access. Renewal terms, rent reviews and assignment provisions will be highlighted by your broker.
      </div>
    </section>
  );
}

/* ---------- Operations ---------- */

function OperationsSection({ business }: { business: BusinessDetail }) {
  return (
    <section id="operations" className="scroll-mt-32">
      <SectionEyebrow icon={Users} eyebrow="Operations & staff" title="How the business runs." />
      <div className="mt-10 grid md:grid-cols-2 gap-5">
        <div className="lumi-card p-8">
          <div className="font-mono-brand text-[9px] tracking-eyebrow uppercase text-primary mb-4">Staff</div>
          <p className="text-base leading-[1.8] text-foreground/85">
            {business.staff_summary || "Staff structure and key roles will be detailed by the broker during the IM walkthrough."}
          </p>
        </div>
        <div className="lumi-card p-8">
          <div className="font-mono-brand text-[9px] tracking-eyebrow uppercase text-primary mb-4">Owner involvement</div>
          <p className="text-base leading-[1.8] text-foreground/85">
            {business.owner_involvement || "The owner's day-to-day role and transition plan will be discussed in the next stage."}
          </p>
        </div>
        <div className="lumi-card p-8 md:col-span-2">
          <div className="font-mono-brand text-[9px] tracking-eyebrow uppercase text-primary mb-4">Trading hours</div>
          <p className="text-base leading-[1.8] text-foreground/85">
            {business.opening_hours || "Standard trading hours apply. Full schedule released in the IM."}
          </p>
        </div>
      </div>
    </section>
  );
}

/* ---------- Growth ---------- */

function GrowthSection() {
  const items = [
    { title: "Operational uplift", body: "Tighten margins through supplier review, scheduling and inventory discipline." },
    { title: "Marketing leverage", body: "Modernise the brand presence and capture the digital channel that is currently under-served." },
    { title: "Capacity expansion", body: "Trade hours, additional services and footprint expansion remain on the table." },
  ];
  return (
    <section id="growth" className="scroll-mt-32">
      <SectionEyebrow
        icon={Rocket}
        eyebrow="Growth opportunities"
        title="Where the next chapter is written."
        intro="Three directions an incoming owner can pursue from day one."
      />
      <div className="mt-10 grid md:grid-cols-3 gap-5">
        {items.map((it, i) => (
          <div key={i} className="relative lumi-card p-8 group">
            <div className="font-mono-brand text-[9px] tracking-eyebrow uppercase text-primary mb-4">
              0{i + 1}
            </div>
            <h3 className="font-display text-xl tracking-display mb-3">{it.title}</h3>
            <p className="text-sm text-muted-foreground leading-[1.8]">{it.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------- Buyer Fit ---------- */

function BuyerFitSection() {
  const fits = [
    "Hands-on hospitality operator looking for a turnkey, established trading business",
    "Investor seeking a managed asset with documented systems and proven revenue",
    "Strategic acquirer with adjacent operations searching for accretive bolt-on",
  ];
  return (
    <section id="fit" className="scroll-mt-32">
      <SectionEyebrow icon={Target} eyebrow="Buyer fit" title="Who this opportunity is built for." />
      <div className="mt-10 lumi-card-elevated p-10 md:p-14">
        <ul className="space-y-6">
          {fits.map((f, i) => (
            <li key={i} className="flex items-start gap-5">
              <span className="mt-1 grid place-items-center size-7 rounded-full border border-primary/40 bg-primary/10 text-primary font-mono-brand text-[10px]">
                {i + 1}
              </span>
              <p className="text-base md:text-lg text-foreground/90 leading-[1.6]">{f}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ---------- Risks ---------- */

function RisksSection() {
  const risks = [
    { title: "Lease covenant", body: "Confirm assignment provisions and any landlord conditions ahead of settlement." },
    { title: "Key person dependency", body: "Plan handover of supplier and customer relationships during the transition window." },
    { title: "Working capital", body: "Stock-at-value and trade creditors should be modelled into your day-one funding." },
  ];
  return (
    <section id="risks" className="scroll-mt-32">
      <SectionEyebrow
        icon={ShieldAlert}
        eyebrow="Due diligence"
        title="Items to validate before proceeding."
        intro="Lumi flags these so you can investigate them properly with your advisors."
      />
      <div className="mt-10 grid md:grid-cols-3 gap-5">
        {risks.map((r) => (
          <div key={r.title} className="lumi-card p-7 border-l-2 border-l-primary/50">
            <h3 className="text-base font-medium mb-3">{r.title}</h3>
            <p className="text-sm text-muted-foreground leading-[1.8]">{r.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------- Gallery ---------- */

function GallerySection({ business }: { business: BusinessDetail }) {
  return (
    <section id="gallery" className="scroll-mt-32">
      <SectionEyebrow icon={ImageIcon} eyebrow="Photo gallery" title="See the business." />
      <div className="mt-10 grid grid-cols-2 md:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className={`relative lumi-card overflow-hidden ${
              i === 0 ? "col-span-2 row-span-2 aspect-square md:aspect-[4/3]" : "aspect-square"
            }`}
          >
            {i === 0 && business.hero_image_url ? (
              <img src={business.hero_image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <>
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-card to-background-deep" />
                <div className="absolute inset-0 bg-spotlight opacity-30" />
                <div className="absolute inset-0 grid place-items-center text-muted-foreground/40">
                  <ImageIcon className="h-6 w-6" strokeWidth={1.25} />
                </div>
              </>
            )}
          </div>
        ))}
      </div>
      <p className="mt-6 font-mono-brand text-[9px] tracking-eyebrow uppercase text-muted-foreground">
        Full gallery released alongside the IM
      </p>
    </section>
  );
}

/* ---------- Ask ---------- */

function AskSection({ businessId }: { businessId: string }) {
  const { user } = useAuth();
  const [question, setQuestion] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submit = async () => {
    if (!user || !question.trim()) return;
    setSubmitting(true);
    const { error } = await supabase.from("buyer_questions").insert({
      buyer_id: user.id,
      business_id: businessId,
      question: question.trim(),
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    void supabase.from("buyer_activity").insert({
      buyer_id: user.id,
      business_id: businessId,
      event_type: "question_submitted",
      metadata: {},
    });
    setSubmitted(true);
    setQuestion("");
    toast.success("Question sent. The broker will respond directly.");
  };

  return (
    <section id="ask" className="scroll-mt-32">
      <SectionEyebrow
        icon={MessageSquare}
        eyebrow="Ask about this business"
        title="Speak directly with the assigned broker."
        intro="Questions are reviewed personally and answered in confidence."
      />
      <div className="mt-10 lumi-card-elevated p-8 md:p-10">
        {submitted ? (
          <div className="text-center py-6">
            <Check className="h-6 w-6 text-primary mx-auto mb-4" />
            <h3 className="font-display text-2xl mb-2">Your question is with the broker.</h3>
            <p className="text-sm text-muted-foreground">You will receive a response by email within one business day.</p>
            <button
              onClick={() => setSubmitted(false)}
              className="mt-6 lumi-btn-ghost"
            >
              Ask another
            </button>
          </div>
        ) : (
          <>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={5}
              placeholder="What would you like to know? Lease terms, growth, owner transition, supplier mix…"
              className="lumi-input resize-none"
            />
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="font-mono-brand text-[9px] tracking-eyebrow uppercase text-muted-foreground">
                Confidential · sent to broker only
              </p>
              <button
                onClick={submit}
                disabled={submitting || !question.trim()}
                className="lumi-btn-primary disabled:opacity-50"
              >
                {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                Send question
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

/* ---------- Offer ---------- */

function OfferSection({ businessId }: { businessId: string }) {
  const { user } = useAuth();
  const [amount, setAmount] = useState("");
  const [terms, setTerms] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submit = async () => {
    if (!user || !accepted) return;
    setSubmitting(true);
    const numericAmount = amount ? Number(amount.replace(/[^\d.]/g, "")) : null;
    const { error } = await supabase.from("offer_interest").insert({
      buyer_id: user.id,
      business_id: businessId,
      indicative_amount: numericAmount,
      terms: terms.trim() || null,
      disclaimer_accepted: true,
      status: "submitted",
      submitted_at: new Date().toISOString(),
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    void supabase.from("buyer_activity").insert({
      buyer_id: user.id,
      business_id: businessId,
      event_type: "offer_submitted",
      metadata: { indicative_amount: numericAmount },
    });
    setSubmitted(true);
    toast.success("Offer discussion request sent.");
  };

  return (
    <section id="offer" className="scroll-mt-32">
      <SectionEyebrow
        icon={HandCoins}
        eyebrow="Start offer discussion"
        title="Indicate your interest, on your terms."
        intro="This is not a binding offer — it opens a confidential conversation with the broker."
      />
      <div className="mt-10 lumi-card-elevated p-8 md:p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-radiance opacity-40 pointer-events-none" />
        <div className="relative">
          {submitted ? (
            <div className="text-center py-8">
              <Check className="h-7 w-7 text-primary mx-auto mb-5" />
              <h3 className="font-display text-3xl mb-3">Discussion opened.</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto leading-[1.8]">
                The broker has been notified and will reach out shortly to discuss next steps and prepare appropriate documentation.
              </p>
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="font-mono-brand text-[9px] tracking-eyebrow uppercase text-muted-foreground mb-2 block">
                    Indicative amount (NZD)
                  </label>
                  <input
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 850,000"
                    className="lumi-input"
                  />
                </div>
                <div>
                  <label className="font-mono-brand text-[9px] tracking-eyebrow uppercase text-muted-foreground mb-2 block">
                    Settlement preference
                  </label>
                  <input
                    value={terms.split("\n")[0] || ""}
                    onChange={(e) => setTerms(e.target.value)}
                    placeholder="e.g. 60 days, subject to DD"
                    className="lumi-input"
                  />
                </div>
              </div>
              <div className="mt-5">
                <label className="font-mono-brand text-[9px] tracking-eyebrow uppercase text-muted-foreground mb-2 block">
                  Notes for the broker
                </label>
                <textarea
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  rows={4}
                  placeholder="Conditions, finance status, structure preference…"
                  className="lumi-input resize-none"
                />
              </div>
              <label className="mt-6 flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={(e) => setAccepted(e.target.checked)}
                  className="mt-1 size-4 accent-primary"
                />
                <span className="text-xs text-muted-foreground leading-[1.7]">
                  This is not a binding agreement. My offer details will be sent to the broker, who will contact me to discuss next steps and prepare the correct documentation if appropriate.
                </span>
              </label>
              <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
                <p className="font-mono-brand text-[9px] tracking-eyebrow uppercase text-muted-foreground">
                  Strictly confidential · broker only
                </p>
                <button
                  onClick={submit}
                  disabled={!accepted || submitting}
                  className="lumi-btn-primary disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <HandCoins className="h-3.5 w-3.5" />}
                  Submit offer discussion
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

/* ---------- Helpers ---------- */

function locationDisplay(b: BusinessDetail, exact: boolean) {
  if (exact) {
    return (
      b.address ||
      [b.suburb, b.city].filter(Boolean).join(", ") ||
      "Exact location available on request"
    );
  }
  if (b.location_mode === "suburb") {
    return [b.suburb, b.city].filter(Boolean).join(", ") || b.region || "Suburb confidential";
  }
  return b.region || "Location confidential";
}
