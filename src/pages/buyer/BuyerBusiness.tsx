import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
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
import OfferDiscussionDialog from "@/components/buyer/OfferDiscussionDialog";
import { formatCurrency } from "@/lib/format";
import { ACCESS_LEVEL_OPTIONS, type AccessLevel } from "@/lib/buyerLabels";
import {
  REQUEST_TYPE_OPTIONS,
  CONTACT_METHOD_OPTIONS,
  PRIORITY_OPTIONS,
  type RequestType,
  type ContactMethod,
  type RequestPriority,
} from "@/lib/requestLabels";
import { logActivity, makeOnceTracker, type ActivityEvent } from "@/lib/activity";

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
  // Financial snapshot
  gross_profit: number | null;
  gross_profit_pct: number | null;
  wage_cost: number | null;
  wage_pct: number | null;
  rent_pct_sales: number | null;
  owner_profit: number | null;
  add_backs: number | null;
  asking_price_multiple: number | null;
  financial_notes: string | null;
  financial_source:
    | "accountant"
    | "gst_returns"
    | "pos_reports"
    | "vendor_supplied"
    | "broker_estimate"
    | "other"
    | null;
  financial_review_status:
    | "draft"
    | "needs_verification"
    | "verified"
    | "not_available";
}

const SECTIONS = [
  { id: "hero", label: "Overview", num: "01" },
  { id: "location", label: "Location", num: "02" },
  { id: "highlights", label: "Highlights", num: "03" },
  { id: "about", label: "Business", num: "04" },
  { id: "financials", label: "Financials", num: "05" },
  { id: "lease", label: "Lease", num: "06" },
  { id: "operations", label: "Operations", num: "07" },
  { id: "growth", label: "Growth", num: "08" },
  { id: "fit", label: "Buyer Fit", num: "09" },
  { id: "risks", label: "Diligence", num: "10" },
  { id: "gallery", label: "Gallery", num: "11" },
  { id: "documents", label: "File room", num: "12" },
  { id: "ask", label: "Ask", num: "13" },
  { id: "offer", label: "Offer", num: "14" },
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
            "id,name,public_title,confidential_title,headline,summary,business_type,industry,location_mode,suburb,city,region,address,asking_price,ebitda,normalised_profit,revenue,stock_value,weekly_sales_min,weekly_sales_max,rent_per_year,lease_expiry,renewal_rights,tenure,staff_summary,owner_involvement,opening_hours,hero_image_url,gross_profit,gross_profit_pct,wage_cost,wage_pct,rent_pct_sales,owner_profit,add_backs,asking_price_multiple,financial_notes,financial_source,financial_review_status"
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

  // Track business view + return visit once per page lifetime
  useEffect(() => {
    if (!business || !user || trackedView.current) return;
    trackedView.current = true;
    (async () => {
      // Detect prior visits to this business by this buyer (return visit signal)
      const { count } = await supabase
        .from("buyer_activity")
        .select("id", { count: "exact", head: true })
        .eq("buyer_id", user.id)
        .eq("business_id", business.id)
        .eq("event_type", "business_view");

      void logActivity({
        buyerId: user.id,
        businessId: business.id,
        event: "business_view",
      });

      if ((count ?? 0) >= 1) {
        void logActivity({
          buyerId: user.id,
          businessId: business.id,
          event: "return_visit",
          metadata: { previous_views: count },
        });
      }
    })();
  }, [business, user]);

  // Section observer — drives nav highlight + per-section activity logging
  useEffect(() => {
    if (!business || !user) return;
    const onceFor = makeOnceTracker();
    const sectionToEvent: Record<string, ActivityEvent | null> = {
      hero: "hero_view",
      location: "location_view",
      about: "im_view",
      financials: "financial_view",
      lease: "lease_view",
      documents: "documents_section_view",
      // Other sections are tracked for nav state only
      highlights: null,
      operations: null,
      growth: null,
      buyer_fit: null,
      risks: null,
      gallery: null,
      ask: null,
      offer: null,
    };
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          setActiveSection(e.target.id);
          const event = sectionToEvent[e.target.id];
          if (event && onceFor(`section:${e.target.id}`)) {
            void logActivity({
              buyerId: user.id,
              businessId: business.id,
              event,
            });
          }
        });
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
    );
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [business, user]);

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
    <div className="-mx-6 md:-mx-12 -my-14 md:-my-20 bg-background text-foreground">
      {/* Top utility bar — quiet, editorial */}
      <div className="sticky top-20 z-30 border-b hairline bg-background/85 backdrop-blur-xl">
        <div className="mx-auto max-w-[1600px] px-6 md:px-12 py-3 flex items-center justify-between gap-4">
          <Link
            to="/buyer/dashboard"
            className="inline-flex items-center gap-2 font-mono-brand text-[10px] tracking-eyebrow uppercase text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-3 w-3" />
            All opportunities
          </Link>
          <div className="hidden md:flex items-center gap-3 font-mono-brand text-[9px] tracking-eyebrow uppercase text-muted-foreground">
            <span>Lumi Private</span>
            <span className="size-1 rounded-full bg-hairline" />
            <span>File no. {business.id.slice(0, 6).toUpperCase()}</span>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 font-mono-brand text-[9px] tracking-eyebrow uppercase border border-primary/40 bg-primary/10 text-primary">
            <span className="size-1.5 rounded-full bg-primary animate-shimmer" />
            {accessLabel} access
          </span>
        </div>
      </div>

      <HeroFullBleed
        business={business}
        showFinancials={showFinancials}
        showExactLocation={showExactLocation}
      />

      {/* Side rail nav (desktop only) */}
      <SideRail activeSection={activeSection} />

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

      {/* File room */}
      <SectionFrame
        id="documents"
        eyebrow="12 — File room"
        title="Supporting documents."
        intro="Released in stages as your access progresses."
        icon={FileSignature}
      >
        <BuyerDocuments businessId={business.id} />
      </SectionFrame>

      <AskSection businessId={business.id} />
      <OfferSection businessId={business.id} businessName={business.public_title || business.name} />

      <Footer business={business} />
    </div>
  );
}

/* =====================================================================
 * Cinematic side rail (desktop)
 * ================================================================== */

function SideRail({ activeSection }: { activeSection: string }) {
  return (
    <nav className="hidden xl:block fixed top-1/2 -translate-y-1/2 right-6 z-20">
      <div className="space-y-2.5">
        {SECTIONS.map((s) => {
          const active = activeSection === s.id;
          return (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="group flex items-center justify-end gap-3"
              aria-label={s.label}
            >
              <span
                className={`font-mono-brand text-[9px] tracking-eyebrow uppercase transition-all duration-500 ${
                  active
                    ? "text-primary opacity-100 translate-x-0"
                    : "text-muted-foreground opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
                }`}
              >
                {s.label}
              </span>
              <span
                className={`block transition-all duration-500 ${
                  active
                    ? "h-px w-10 bg-primary"
                    : "h-px w-5 bg-hairline group-hover:bg-foreground/60 group-hover:w-8"
                }`}
              />
            </a>
          );
        })}
      </div>
    </nav>
  );
}

/* =====================================================================
 * Section framing primitives
 * ================================================================== */

function SectionFrame({
  id,
  eyebrow,
  title,
  intro,
  icon: Icon,
  children,
  tone = "default",
}: {
  id: string;
  eyebrow: string;
  title: string;
  intro?: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  tone?: "default" | "deep";
}) {
  return (
    <section
      id={id}
      className={`scroll-mt-32 relative border-t hairline ${
        tone === "deep" ? "bg-background-deep/40" : ""
      }`}
    >
      <div className="mx-auto max-w-[1600px] px-6 md:px-12 py-32 md:py-44">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 mb-16 md:mb-20">
          <div className="lg:col-span-5">
            <div className="font-mono-brand text-[10px] tracking-eyebrow uppercase text-primary mb-6 flex items-center gap-3">
              <span className="h-px w-8 bg-primary" />
              {Icon && <Icon className="h-3 w-3" />}
              {eyebrow}
            </div>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl tracking-display leading-[1.0] text-balance">
              {title}
            </h2>
          </div>
          {intro && (
            <div className="lg:col-span-6 lg:col-start-7 lg:pt-4">
              <p className="text-lg md:text-xl text-foreground/80 leading-[1.7] max-w-2xl">
                {intro}
              </p>
            </div>
          )}
        </div>
        {children}
      </div>
    </section>
  );
}

function PullStat({
  label,
  value,
  sub,
  locked,
  size = "md",
}: {
  label: string;
  value: string;
  sub?: string;
  locked?: boolean;
  size?: "md" | "lg" | "xl";
}) {
  const sizeClass =
    size === "xl"
      ? "text-7xl md:text-[8rem]"
      : size === "lg"
      ? "text-5xl md:text-7xl"
      : "text-4xl md:text-5xl";
  return (
    <div className="border-t hairline pt-6">
      <div className="font-mono-brand text-[9px] tracking-eyebrow uppercase text-muted-foreground mb-4 flex items-center gap-2">
        {locked && <Lock className="h-3 w-3 text-primary/60" />}
        {label}
      </div>
      <div
        className={`lumi-stat ${sizeClass} ${
          locked ? "text-muted-foreground/50" : "text-foreground"
        }`}
      >
        {value}
      </div>
      {sub && (
        <div className="mt-3 font-mono-brand text-[9px] tracking-eyebrow uppercase text-muted-foreground">
          {sub}
        </div>
      )}
    </div>
  );
}

/* =====================================================================
 * Hero — full-bleed, Apple-style
 * ================================================================== */

function HeroFullBleed({
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
    <section id="hero" className="relative scroll-mt-32">
      {/* Full-viewport image */}
      <div className="relative h-[100svh] min-h-[680px] w-full overflow-hidden">
        {business.hero_image_url ? (
          <img
            src={business.hero_image_url}
            alt=""
            className="absolute inset-0 w-full h-full object-cover scale-[1.03]"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/25 via-card to-background-deep" />
        )}
        {/* Cinematic stack: vignette + radiance + bottom-fade to bg */}
        <div className="absolute inset-0 bg-vignette pointer-events-none" />
        <div className="absolute inset-0 bg-radiance opacity-60 pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-background via-background/85 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-background/70 to-transparent pointer-events-none" />

        {/* Corner ticks */}
        <span className="absolute top-8 left-8 size-4 border-t border-l border-primary/60" />
        <span className="absolute top-8 right-8 size-4 border-t border-r border-primary/60" />

        {/* Editorial caption — bottom-left */}
        <div className="absolute inset-x-0 bottom-0">
          <div className="mx-auto max-w-[1600px] px-6 md:px-12 pb-20 md:pb-28">
            <div className="font-mono-brand text-[10px] tracking-eyebrow uppercase text-primary mb-6 flex items-center gap-3 animate-rise">
              <span className="h-px w-10 bg-primary" />
              Confidential Information Memorandum
              {business.business_type && (
                <span className="text-muted-foreground">· {business.business_type}</span>
              )}
            </div>
            <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-[7.5rem] tracking-display leading-[0.92] text-balance max-w-5xl animate-rise delay-100">
              {title}
            </h1>
            {business.headline && (
              <p className="mt-8 font-display-italic text-xl md:text-3xl text-foreground/85 max-w-3xl leading-[1.35] text-balance animate-rise delay-200">
                {business.headline}
              </p>
            )}
            <div className="mt-8 flex items-center gap-3 text-sm text-muted-foreground animate-rise delay-300">
              {showExactLocation ? (
                <MapPin className="h-3.5 w-3.5 text-primary" />
              ) : (
                <Lock className="h-3.5 w-3.5 text-primary" />
              )}
              <span>{locationLine}</span>
            </div>
          </div>
        </div>

        {/* Scroll cue */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-6 font-mono-brand text-[9px] tracking-eyebrow uppercase text-muted-foreground/70 flex flex-col items-center gap-2 animate-shimmer">
          <span>Scroll</span>
          <span className="block h-8 w-px bg-gradient-to-b from-primary/70 to-transparent" />
        </div>
      </div>

      {/* Floating data sash — overlaps hero & first section */}
      <div className="relative -mt-24 md:-mt-28 z-10 mx-auto max-w-[1600px] px-6 md:px-12 animate-rise delay-500">
        <div className="lumi-card-elevated grain p-8 md:p-12 grid grid-cols-2 md:grid-cols-4 gap-x-10 gap-y-10 backdrop-blur-xl">
          <PullStat
            label="Asking price"
            value={formatCurrency(business.asking_price, { compact: true })}
            size="lg"
          />
          <PullStat
            label="Profit · EBITDA"
            value={showFinancials ? formatCurrency(profit, { compact: true }) : "Locked"}
            sub={!showFinancials ? "Financial access required" : "Annualised"}
            locked={!showFinancials}
            size="lg"
          />
          <PullStat
            label="Format"
            value={business.business_type || business.industry || "—"}
            size="md"
          />
          <PullStat label="Tenure" value={business.tenure || "On enquiry"} size="md" />
        </div>

        <div className="mt-12 flex flex-wrap gap-3 animate-rise delay-700">
          <a href="#ask" className="lumi-btn-primary group">
            <MessageSquare className="h-3.5 w-3.5" />
            Ask a question
            <ArrowRight className="h-3 w-3 transition-transform duration-500 group-hover:translate-x-1" />
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

      {/* Editorial overture — broker introduction */}
      {business.summary && (
        <div className="relative mx-auto max-w-[1600px] px-6 md:px-12 pt-32 md:pt-44 pb-32 md:pb-40">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
            <div className="lg:col-span-4">
              <Quote className="h-6 w-6 text-primary/70 mb-6" strokeWidth={1.25} />
              <div className="font-mono-brand text-[10px] tracking-eyebrow uppercase text-primary mb-3">
                Broker introduction
              </div>
              <div className="font-mono-brand text-[9px] tracking-eyebrow uppercase text-muted-foreground">
                Lumi Private · curated channel
              </div>
            </div>
            <div className="lg:col-span-8">
              <p className="font-display-italic text-2xl md:text-4xl lg:text-[2.75rem] text-foreground/95 leading-[1.25] text-balance">
                “{business.summary}”
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

/* =====================================================================
 * Location — immersive map canvas
 * ================================================================== */

function LocationSection({
  business,
  showExactLocation,
}: {
  business: BusinessDetail;
  showExactLocation: boolean;
}) {
  return (
    <section id="location" className="scroll-mt-32 relative border-t hairline bg-background-deep/40">
      {/* Full-bleed canvas */}
      <div className="relative h-[80svh] min-h-[560px] w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-card to-background-deep" />
        <div className="absolute inset-0 bg-spotlight opacity-50" />
        <svg className="absolute inset-0 w-full h-full opacity-25" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid-lg" width="80" height="80" patternUnits="userSpaceOnUse">
              <path d="M 80 0 L 0 0 0 80" fill="none" stroke="hsl(var(--primary))" strokeWidth="0.5" />
            </pattern>
            <radialGradient id="fade" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="black" stopOpacity="0" />
              <stop offset="100%" stopColor="black" stopOpacity="1" />
            </radialGradient>
            <mask id="grid-mask">
              <rect width="100%" height="100%" fill="white" />
              <rect width="100%" height="100%" fill="url(#fade)" />
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-lg)" mask="url(#grid-mask)" />
        </svg>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

        {/* Pin */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
          <div className="relative inline-flex">
            <span className="absolute inset-0 -m-6 rounded-full border border-primary/30 animate-ping" />
            <span className="absolute inset-0 -m-3 rounded-full border border-primary/50" />
            <MapPin className="h-10 w-10 text-primary relative" strokeWidth={1.5} />
          </div>
          <div className="mt-6 font-mono-brand text-[10px] tracking-eyebrow uppercase text-primary">
            {showExactLocation ? "Exact pin" : "Approximate area"}
          </div>
        </div>

        {/* Editorial overlay */}
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-[1600px] px-6 md:px-12 pb-16 md:pb-24">
          <div className="font-mono-brand text-[10px] tracking-eyebrow uppercase text-primary mb-5 flex items-center gap-3">
            <span className="h-px w-8 bg-primary" />
            <MapPin className="h-3 w-3" />
            02 — Location advantage
          </div>
          <h2 className="font-display text-4xl md:text-6xl lg:text-7xl tracking-display leading-[1.0] text-balance max-w-4xl">
            {showExactLocation
              ? "A site that does the trading for you."
              : "Strategically positioned in a high-demand catchment."}
          </h2>
        </div>
      </div>

      {/* Detail strip — editorial two-column */}
      <div className="mx-auto max-w-[1600px] px-6 md:px-12 py-24 md:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
          <div className="lg:col-span-7">
            <p className="text-lg md:text-xl text-foreground/85 leading-[1.7] max-w-2xl">
              {showExactLocation
                ? "Exact address available below. Surrounded by complementary demand drivers, this site benefits from sustained foot traffic and an enviable trading rhythm."
                : "Specific location remains confidential. Detailed demand analysis is shared once buyer access progresses to the next stage."}
            </p>
            <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-8">
              <div>
                <div className="font-mono-brand text-[9px] tracking-eyebrow uppercase text-muted-foreground mb-2">
                  Address
                </div>
                <div className="text-base md:text-lg text-foreground/90">
                  {locationDisplay(business, showExactLocation)}
                </div>
              </div>
              <div>
                <div className="font-mono-brand text-[9px] tracking-eyebrow uppercase text-muted-foreground mb-2">
                  Catchment
                </div>
                <div className="text-base md:text-lg text-foreground/90">
                  {[business.suburb, business.city, business.region].filter(Boolean).join(" · ") ||
                    "Released on access progression"}
                </div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-5">
            <div className="font-mono-brand text-[10px] tracking-eyebrow uppercase text-primary mb-6">
              Demand drivers
            </div>
            <ul className="space-y-5">
              {[
                "High-traffic commercial precinct",
                "Strong residential catchment",
                "Adjacent anchor tenants",
                "Public transport access",
              ].map((d, i) => (
                <li
                  key={d}
                  className="flex items-baseline gap-5 border-b hairline pb-5 last:border-b-0"
                >
                  <span className="font-mono-brand text-[10px] tracking-eyebrow uppercase text-primary tabular-nums">
                    0{i + 1}
                  </span>
                  <span className="text-base md:text-lg text-foreground/90">{d}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8 font-mono-brand text-[9px] tracking-eyebrow uppercase text-muted-foreground">
              Detailed demand map staged for next release
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* =====================================================================
 * Highlights — editorial list, no cards
 * ================================================================== */

function HighlightsSection({ business }: { business: BusinessDetail }) {
  const highlights = useMemo(() => {
    const items: { label: string; value: string }[] = [];
    if (business.weekly_sales_min || business.weekly_sales_max) {
      const min = business.weekly_sales_min
        ? formatCurrency(business.weekly_sales_min, { compact: true })
        : null;
      const max = business.weekly_sales_max
        ? formatCurrency(business.weekly_sales_max, { compact: true })
        : null;
      items.push({
        label: "Weekly sales",
        value: min && max ? `${min} – ${max}` : min ?? max ?? "—",
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
    <SectionFrame
      id="highlights"
      eyebrow="03 — Key highlights"
      title="What makes this opportunity stand out."
      icon={Sparkles}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-2">
        {highlights.map((h, i) => (
          <div
            key={i}
            className="group grid grid-cols-[3rem_1fr] items-baseline gap-6 border-t hairline py-8 md:py-10 hover:border-primary/40 transition-colors"
          >
            <span className="font-mono-brand text-[10px] tracking-eyebrow uppercase text-primary tabular-nums">
              0{i + 1}
            </span>
            <div>
              <div className="font-mono-brand text-[9px] tracking-eyebrow uppercase text-muted-foreground mb-3">
                {h.label}
              </div>
              <div className="font-display text-2xl md:text-3xl tracking-display leading-[1.15] text-balance">
                {h.value}
              </div>
            </div>
          </div>
        ))}
      </div>
    </SectionFrame>
  );
}

/* =====================================================================
 * About — editorial spread
 * ================================================================== */

function AboutSection({ business }: { business: BusinessDetail }) {
  const summary =
    business.summary ||
    business.headline ||
    "A full editorial overview is being prepared by the Lumi team. The narrative below will cover the founding story, market positioning, customer profile and operating rhythm — written to give you a complete sense of how the business runs day-to-day.";

  const facts = [
    { label: "Industry", value: business.industry },
    { label: "Type", value: business.business_type },
    { label: "Tenure", value: business.tenure },
    { label: "Trading hours", value: business.opening_hours },
  ];

  return (
    <SectionFrame
      id="about"
      eyebrow="04 — Business overview"
      title="The story behind the numbers."
      icon={Building2}
      tone="deep"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-20">
        <div className="lg:col-span-7">
          <div className="font-display-italic text-2xl md:text-3xl text-foreground/90 leading-[1.4] mb-10 text-balance border-l-2 border-primary/60 pl-6">
            {business.headline || "A confidential introduction to a business of substance."}
          </div>
          <p className="text-base md:text-lg leading-[1.9] text-foreground/85 whitespace-pre-line">
            {summary}
          </p>
        </div>
        <aside className="lg:col-span-5 lg:pt-2">
          <div className="font-mono-brand text-[10px] tracking-eyebrow uppercase text-primary mb-8">
            At a glance
          </div>
          <div className="space-y-0">
            {facts.map((f) => (
              <div
                key={f.label}
                className="grid grid-cols-[1fr_2fr] gap-6 border-b hairline py-5"
              >
                <div className="font-mono-brand text-[9px] tracking-eyebrow uppercase text-muted-foreground">
                  {f.label}
                </div>
                <div className="text-base md:text-lg text-foreground/90">{f.value || "—"}</div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </SectionFrame>
  );
}

/* =====================================================================
 * Financials — oversized stat band
 * ================================================================== */

function FinancialsSection({
  business,
  showFinancials,
}: {
  business: BusinessDetail;
  showFinancials: boolean;
}) {
  if (!showFinancials) {
    return (
      <section
        id="financials"
        className="scroll-mt-32 relative border-t hairline overflow-hidden"
      >
        <div className="absolute inset-0 bg-radiance opacity-50 pointer-events-none" />
        <div className="absolute inset-0 bg-spotlight opacity-30 pointer-events-none" />
        <div className="relative mx-auto max-w-[1600px] px-6 md:px-12 py-32 md:py-44">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-end">
            <div className="lg:col-span-7">
              <div className="font-mono-brand text-[10px] tracking-eyebrow uppercase text-primary mb-6 flex items-center gap-3">
                <span className="h-px w-8 bg-primary" />
                <Lock className="h-3 w-3" />
                05 — Financial snapshot
              </div>
              <h2 className="font-display text-4xl md:text-6xl lg:text-7xl tracking-display leading-[1.0] text-balance">
                Financials are released to qualified buyers.
              </h2>
              <p className="mt-8 text-lg md:text-xl text-foreground/80 leading-[1.7] max-w-2xl">
                Revenue, profit and trading metrics are released once your access progresses to
                Financial. This typically follows a brief introduction call and confidentiality
                formalities.
              </p>
              <a href="#ask" className="mt-10 inline-flex lumi-btn-primary">
                <MessageSquare className="h-3.5 w-3.5" />
                Request access
              </a>
            </div>
            <div className="lg:col-span-5 grid grid-cols-2 gap-x-8 gap-y-10">
              <PullStat label="Revenue" value="——" locked size="lg" />
              <PullStat label="EBITDA" value="——" locked size="lg" />
              <PullStat label="Weekly sales" value="——" locked />
              <PullStat label="Stock at value" value="——" locked />
            </div>
          </div>
        </div>
      </section>
    );
  }

  const profit = business.ebitda ?? business.normalised_profit;
  const weekly =
    business.weekly_sales_min || business.weekly_sales_max
      ? `${formatCurrency(business.weekly_sales_min, { compact: true })} – ${formatCurrency(
          business.weekly_sales_max,
          { compact: true }
        )}`
      : "—";

  return (
    <SectionFrame
      id="financials"
      eyebrow="05 — Financial snapshot"
      title="Trading performance, normalised."
      intro="Detailed statements, GST returns and POS reports are available in the file room — released in line with your access level."
      icon={TrendingUp}
    >
      {/* Hero stat — revenue full-bleed */}
      <div className="border-t hairline pt-10 mb-12">
        <div className="font-mono-brand text-[10px] tracking-eyebrow uppercase text-muted-foreground mb-6">
          Revenue · annualised
        </div>
        <div className="lumi-stat text-7xl md:text-[10rem] lg:text-[14rem] text-gradient-gold leading-[0.9]">
          {formatCurrency(business.revenue, { compact: true })}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-10 gap-y-10">
        <PullStat
          label="Normalised profit"
          value={formatCurrency(profit, { compact: true })}
          sub="EBITDA basis"
          size="lg"
        />
        <PullStat label="Weekly sales" value={weekly} size="lg" />
        <PullStat
          label="Stock at value"
          value={formatCurrency(business.stock_value, { compact: true })}
          size="lg"
        />
      </div>
    </SectionFrame>
  );
}

/* =====================================================================
 * Lease
 * ================================================================== */

function LeaseSection({
  business,
  showFinancials,
}: {
  business: BusinessDetail;
  showFinancials: boolean;
}) {
  return (
    <SectionFrame
      id="lease"
      eyebrow="06 — Lease summary"
      title="Security of tenure."
      intro="Full lease document available in the file room. Renewal terms, rent reviews and assignment provisions will be highlighted by your broker."
      icon={FileSignature}
      tone="deep"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-10 gap-y-12">
        <PullStat
          label="Annual rent"
          value={showFinancials ? formatCurrency(business.rent_per_year, { compact: true }) : "Locked"}
          locked={!showFinancials}
          size="lg"
        />
        <PullStat
          label="Lease expiry"
          value={
            business.lease_expiry
              ? new Date(business.lease_expiry).toLocaleDateString("en-NZ", {
                  month: "short",
                  year: "numeric",
                })
              : "—"
          }
          size="lg"
        />
        <PullStat
          label="Renewal rights"
          value={business.renewal_rights || "On enquiry"}
          size="lg"
        />
      </div>
    </SectionFrame>
  );
}

/* =====================================================================
 * Operations — editorial paragraphs, no cards
 * ================================================================== */

function OperationsSection({ business }: { business: BusinessDetail }) {
  const blocks = [
    {
      label: "Staff",
      body:
        business.staff_summary ||
        "Staff structure and key roles will be detailed by the broker during the IM walkthrough.",
    },
    {
      label: "Owner involvement",
      body:
        business.owner_involvement ||
        "The owner's day-to-day role and transition plan will be discussed in the next stage.",
    },
    {
      label: "Trading hours",
      body:
        business.opening_hours ||
        "Standard trading hours apply. Full schedule released in the IM.",
    },
  ];
  return (
    <SectionFrame
      id="operations"
      eyebrow="07 — Operations & staff"
      title="How the business runs."
      icon={Users}
    >
      <div className="space-y-0">
        {blocks.map((b, i) => (
          <div
            key={b.label}
            className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-12 border-t hairline py-12 md:py-16"
          >
            <div className="md:col-span-3">
              <div className="font-mono-brand text-[10px] tracking-eyebrow uppercase text-primary tabular-nums mb-3">
                0{i + 1}
              </div>
              <div className="font-display text-2xl md:text-3xl tracking-display">{b.label}</div>
            </div>
            <p className="md:col-span-8 md:col-start-5 text-lg md:text-xl text-foreground/85 leading-[1.7] max-w-3xl">
              {b.body}
            </p>
          </div>
        ))}
      </div>
    </SectionFrame>
  );
}

/* =====================================================================
 * Growth — large numbered editorial blocks
 * ================================================================== */

function GrowthSection() {
  const items = [
    {
      title: "Operational uplift",
      body:
        "Tighten margins through supplier review, scheduling and inventory discipline. Documented systems make this an immediate, controllable win for an incoming operator.",
    },
    {
      title: "Marketing leverage",
      body:
        "Modernise the brand presence and capture the digital channel that is currently under-served. Existing customer goodwill provides an unusually warm starting point.",
    },
    {
      title: "Capacity expansion",
      body:
        "Trade hours, additional services and footprint expansion remain on the table. Demand consistently exceeds the current operating envelope.",
    },
  ];
  return (
    <SectionFrame
      id="growth"
      eyebrow="08 — Growth opportunities"
      title="Where the next chapter is written."
      intro="Three directions an incoming owner can pursue from day one."
      icon={Rocket}
      tone="deep"
    >
      <div className="space-y-0">
        {items.map((it, i) => (
          <div
            key={it.title}
            className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-12 border-t hairline py-14 md:py-20 group"
          >
            <div className="md:col-span-4">
              <div className="lumi-stat text-6xl md:text-8xl text-gradient-gold leading-none">
                0{i + 1}
              </div>
            </div>
            <div className="md:col-span-7 md:col-start-6">
              <h3 className="font-display text-3xl md:text-4xl tracking-display mb-5 text-balance">
                {it.title}
              </h3>
              <p className="text-lg md:text-xl text-foreground/85 leading-[1.7] max-w-2xl">
                {it.body}
              </p>
            </div>
          </div>
        ))}
      </div>
    </SectionFrame>
  );
}

/* =====================================================================
 * Buyer Fit — single immersive panel
 * ================================================================== */

function BuyerFitSection() {
  const fits = [
    "Hands-on hospitality operator looking for a turnkey, established trading business.",
    "Investor seeking a managed asset with documented systems and proven revenue.",
    "Strategic acquirer with adjacent operations searching for an accretive bolt-on.",
  ];
  return (
    <SectionFrame
      id="fit"
      eyebrow="09 — Buyer fit"
      title="Who this opportunity is built for."
      icon={Target}
    >
      <div className="space-y-0">
        {fits.map((f, i) => (
          <div
            key={i}
            className="flex items-start gap-8 md:gap-12 border-t hairline py-10 md:py-14"
          >
            <span className="grid place-items-center size-12 md:size-14 rounded-full border border-primary/40 bg-primary/5 text-primary font-mono-brand text-[11px] tracking-eyebrow uppercase shrink-0">
              0{i + 1}
            </span>
            <p className="font-display-italic text-xl md:text-3xl text-foreground/90 leading-[1.35] text-balance pt-2">
              {f}
            </p>
          </div>
        ))}
      </div>
    </SectionFrame>
  );
}

/* =====================================================================
 * Risks — editorial list
 * ================================================================== */

function RisksSection() {
  const risks = [
    {
      title: "Lease covenant",
      body: "Confirm assignment provisions and any landlord conditions ahead of settlement.",
    },
    {
      title: "Key person dependency",
      body:
        "Plan handover of supplier and customer relationships during the transition window.",
    },
    {
      title: "Working capital",
      body: "Stock-at-value and trade creditors should be modelled into your day-one funding.",
    },
  ];
  return (
    <SectionFrame
      id="risks"
      eyebrow="10 — Due diligence"
      title="Items to validate before proceeding."
      intro="Lumi flags these so you can investigate them properly with your advisors. Honest framing, surfaced early."
      icon={ShieldAlert}
      tone="deep"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-12 gap-y-12">
        {risks.map((r, i) => (
          <div key={r.title} className="border-t-2 border-primary/40 pt-6">
            <div className="font-mono-brand text-[10px] tracking-eyebrow uppercase text-primary mb-4 tabular-nums">
              0{i + 1}
            </div>
            <h3 className="font-display text-2xl md:text-3xl tracking-display mb-4 text-balance">
              {r.title}
            </h3>
            <p className="text-base md:text-lg text-foreground/80 leading-[1.7]">{r.body}</p>
          </div>
        ))}
      </div>
    </SectionFrame>
  );
}

/* =====================================================================
 * Gallery — cinematic mosaic
 * ================================================================== */

function GallerySection({ business }: { business: BusinessDetail }) {
  const tiles = Array.from({ length: 5 });
  return (
    <section
      id="gallery"
      className="scroll-mt-32 relative border-t hairline"
    >
      <div className="mx-auto max-w-[1600px] px-6 md:px-12 pt-32 md:pt-44 pb-12 md:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
          <div className="lg:col-span-5">
            <div className="font-mono-brand text-[10px] tracking-eyebrow uppercase text-primary mb-6 flex items-center gap-3">
              <span className="h-px w-8 bg-primary" />
              <ImageIcon className="h-3 w-3" />
              11 — Photo gallery
            </div>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl tracking-display leading-[1.0] text-balance">
              See the business.
            </h2>
          </div>
          <div className="lg:col-span-6 lg:col-start-7 lg:pt-4">
            <p className="text-lg md:text-xl text-foreground/80 leading-[1.7] max-w-2xl">
              A cinematic look at the space, the operation and the small details that make this
              business what it is. Full gallery released alongside the IM.
            </p>
          </div>
        </div>
      </div>

      {/* Hero plate */}
      <div className="mx-auto max-w-[1600px] px-6 md:px-12">
        <div className="relative w-full aspect-[21/9] overflow-hidden border hairline-strong rounded-sm grain">
          {business.hero_image_url ? (
            <img
              src={business.hero_image_url}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <>
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-card to-background-deep" />
              <div className="absolute inset-0 grid place-items-center text-muted-foreground/40">
                <ImageIcon className="h-8 w-8" strokeWidth={1.25} />
              </div>
            </>
          )}
          <div className="absolute inset-0 bg-vignette pointer-events-none" />
          <span className="absolute top-4 left-4 size-3 border-t border-l border-primary/70" />
          <span className="absolute top-4 right-4 size-3 border-t border-r border-primary/70" />
          <span className="absolute bottom-4 left-4 size-3 border-b border-l border-primary/70" />
          <span className="absolute bottom-4 right-4 size-3 border-b border-r border-primary/70" />
        </div>
      </div>

      {/* Mosaic grid */}
      <div className="mx-auto max-w-[1600px] px-6 md:px-12 mt-4 md:mt-6 pb-32 md:pb-44">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {tiles.map((_, i) => (
            <div
              key={i}
              className={`relative overflow-hidden border hairline rounded-sm ${
                i === 0 ? "col-span-2 md:col-span-2 aspect-[2/1]" : "aspect-[4/5]"
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-card to-background-deep" />
              <div className="absolute inset-0 bg-spotlight opacity-30" />
              <div className="absolute inset-0 grid place-items-center text-muted-foreground/40">
                <ImageIcon className="h-6 w-6" strokeWidth={1.25} />
              </div>
              <div className="absolute bottom-3 left-3 font-mono-brand text-[8px] tracking-eyebrow uppercase text-muted-foreground/60 tabular-nums">
                Plate · {String(i + 2).padStart(2, "0")}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 font-mono-brand text-[9px] tracking-eyebrow uppercase text-muted-foreground">
          Full gallery released alongside the IM
        </div>
      </div>
    </section>
  );
}

/* =====================================================================
 * Ask
 * ================================================================== */

function AskSection({ businessId }: { businessId: string }) {
  const { user } = useAuth();
  const [requestType, setRequestType] = useState<RequestType>("information");
  const [message, setMessage] = useState("");
  const [contactMethod, setContactMethod] = useState<ContactMethod>("email");
  const [callTime, setCallTime] = useState("");
  const [priority, setPriority] = useState<RequestPriority>("normal");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const wantsCall = requestType === "call" || requestType === "vendor_meeting" || contactMethod === "phone" || contactMethod === "either";

  const reset = () => {
    setMessage("");
    setCallTime("");
    setPriority("normal");
    setContactMethod("email");
    setRequestType("information");
    setSubmitted(false);
  };

  const submit = async () => {
    if (!user || !message.trim()) return;
    setSubmitting(true);

    const { data: inserted, error } = await supabase
      .from("buyer_requests")
      .insert({
        buyer_id: user.id,
        business_id: businessId,
        // Cast through unknown so TS accepts new enum values until types regenerate
        request_type: requestType as unknown as "information" | "document_access" | "call" | "other",
        message: message.trim(),
        preferred_contact: contactMethod,
        preferred_call_time: wantsCall ? callTime.trim() || null : null,
        priority,
      } as never)
      .select("id")
      .single();

    setSubmitting(false);
    if (error || !inserted) {
      toast.error(error?.message || "Could not send your request.");
      return;
    }

    void logActivity({
      buyerId: user.id,
      businessId,
      event: "request_submitted",
      metadata: {
        request_id: (inserted as { id: string }).id,
        request_type: requestType,
        priority,
        preferred_contact: contactMethod,
      },
    });
    if (requestType === "information" || requestType === "other") {
      void logActivity({
        buyerId: user.id,
        businessId,
        event: "question_submitted",
        metadata: { request_id: (inserted as { id: string }).id },
      });
    }
    if (wantsCall) {
      void logActivity({
        buyerId: user.id,
        businessId,
        event: "call_request",
        metadata: {
          request_id: (inserted as { id: string }).id,
          preferred_call_time: callTime.trim() || null,
        },
      });
    }

    // Fire-and-forget admin notification (placeholder — currently logs only)
    void supabase.functions
      .invoke("notify-admin-request", { body: { request_id: (inserted as { id: string }).id } })
      .catch(() => {
        /* notification failures must not break the buyer flow */
      });

    setSubmitted(true);
    toast.success("Request sent. The broker will respond directly.");
  };

  return (
    <SectionFrame
      id="ask"
      eyebrow="13 — Ask about this business"
      title="Speak directly with the assigned broker."
      intro="Questions, document requests, calls and meetings — all routed personally and answered in confidence."
      icon={MessageSquare}
    >
      <div className="border-t hairline pt-10 max-w-3xl">
        {submitted ? (
          <div className="py-10">
            <Check className="h-6 w-6 text-primary mb-5" />
            <h3 className="font-display text-3xl md:text-4xl tracking-display mb-3">
              Your request is with the broker.
            </h3>
            <p className="text-base md:text-lg text-muted-foreground leading-[1.7] max-w-xl">
              You will receive a personal response, typically within one business day. Anything
              urgent is flagged and answered first.
            </p>
            <button onClick={reset} className="mt-8 lumi-btn-ghost">
              Send another request
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Request type chips */}
            <div>
              <label className="font-mono-brand text-[9px] tracking-eyebrow uppercase text-muted-foreground mb-3 block">
                Request type
              </label>
              <div className="flex flex-wrap gap-2">
                {REQUEST_TYPE_OPTIONS.filter((o) => o.value !== "document_access").map((o) => {
                  const active = requestType === o.value;
                  return (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => setRequestType(o.value as RequestType)}
                      className={`px-4 py-2 rounded-full font-mono-brand text-[10px] tracking-eyebrow uppercase border transition-all duration-300 ${
                        active
                          ? "border-primary bg-primary/15 text-primary"
                          : "border-hairline-strong text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                      }`}
                    >
                      {o.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="font-mono-brand text-[9px] tracking-eyebrow uppercase text-muted-foreground mb-3 block">
                Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                placeholder="Share context, specific questions or what you would like to discuss…"
                className="lumi-input resize-none text-base md:text-lg leading-[1.6]"
              />
            </div>

            {/* Contact + urgency */}
            <div className="grid md:grid-cols-2 gap-6 md:gap-10">
              <div>
                <label className="font-mono-brand text-[9px] tracking-eyebrow uppercase text-muted-foreground mb-3 block">
                  Preferred contact method
                </label>
                <select
                  value={contactMethod}
                  onChange={(e) => setContactMethod(e.target.value as ContactMethod)}
                  className="lumi-input text-base"
                >
                  {CONTACT_METHOD_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-mono-brand text-[9px] tracking-eyebrow uppercase text-muted-foreground mb-3 block">
                  Urgency
                </label>
                <div className="flex gap-2">
                  {PRIORITY_OPTIONS.map((o) => {
                    const active = priority === o.value;
                    return (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => setPriority(o.value as RequestPriority)}
                        className={`flex-1 px-4 py-3 rounded-md font-mono-brand text-[10px] tracking-eyebrow uppercase border transition-all duration-300 ${
                          active
                            ? o.value === "high"
                              ? "border-primary bg-primary/20 text-primary"
                              : "border-foreground/60 bg-foreground/5 text-foreground"
                            : "border-hairline-strong text-muted-foreground hover:border-foreground/40"
                        }`}
                      >
                        {o.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Preferred call time — conditional */}
            {wantsCall && (
              <div>
                <label className="font-mono-brand text-[9px] tracking-eyebrow uppercase text-muted-foreground mb-3 block">
                  Preferred call time
                </label>
                <input
                  value={callTime}
                  onChange={(e) => setCallTime(e.target.value)}
                  placeholder="e.g. Weekdays 9am–11am NZT, or specific date and time"
                  className="lumi-input text-base"
                />
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <p className="font-mono-brand text-[9px] tracking-eyebrow uppercase text-muted-foreground">
                Confidential · sent to broker only
              </p>
              <button
                onClick={submit}
                disabled={submitting || !message.trim()}
                className="lumi-btn-primary disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                Send request
              </button>
            </div>
          </div>
        )}
      </div>
    </SectionFrame>
  );
}

/* =====================================================================
 * Offer
 * ================================================================== */

function OfferSection({
  businessId,
  businessName,
}: {
  businessId: string;
  businessName: string;
}) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  return (
    <section
      id="offer"
      className="scroll-mt-32 relative border-t hairline overflow-hidden"
    >
      <div className="absolute inset-0 bg-radiance opacity-50 pointer-events-none" />
      <div className="absolute inset-0 bg-spotlight opacity-30 pointer-events-none" />
      <div className="relative mx-auto max-w-[1600px] px-6 md:px-12 py-32 md:py-44">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 mb-16">
          <div className="lg:col-span-6">
            <div className="font-mono-brand text-[10px] tracking-eyebrow uppercase text-primary mb-6 flex items-center gap-3">
              <span className="h-px w-8 bg-primary" />
              <HandCoins className="h-3 w-3" />
              14 — Start offer discussion
            </div>
            <h2 className="font-display text-4xl md:text-6xl lg:text-7xl tracking-display leading-[1.0] text-balance">
              Indicate your interest, on your terms.
            </h2>
          </div>
          <div className="lg:col-span-5 lg:col-start-8 lg:pt-4">
            <p className="text-lg md:text-xl text-foreground/80 leading-[1.7] max-w-xl">
              If you are seriously interested in this business, you can start an offer
              discussion here. This does not create a binding agreement. It simply helps
              the broker understand your proposed terms before preparing the correct
              next step.
            </p>
          </div>
        </div>

        <div className="lumi-card-elevated grain p-8 md:p-14 max-w-5xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <div className="max-w-xl">
              <h3 className="font-display text-2xl md:text-3xl tracking-display mb-3">
                Ready to open the conversation?
              </h3>
              <p className="text-sm md:text-base text-muted-foreground leading-[1.7]">
                A short, structured form covering price, conditions, timing and your
                advisors. The broker will reach out personally to discuss next steps.
              </p>
            </div>
            <button
              onClick={() => {
                setOpen(true);
                if (user) {
                  void logActivity({
                    buyerId: user.id,
                    businessId,
                    event: "offer_started",
                  });
                }
              }}
              className="lumi-btn-primary text-sm md:text-base whitespace-nowrap"
            >
              <HandCoins className="h-3.5 w-3.5" />
              Start Offer Discussion
            </button>
          </div>

          <div className="mt-8 pt-6 border-t hairline flex items-start gap-3">
            <span className="font-mono-brand text-[9px] tracking-eyebrow uppercase text-muted-foreground">
              Strictly confidential · broker only · not a binding agreement
            </span>
          </div>
        </div>
      </div>

      <OfferDiscussionDialog
        open={open}
        onOpenChange={setOpen}
        businessId={businessId}
        businessName={businessName}
      />
    </section>
  );
}

/* =====================================================================
 * Footer — quiet sign-off
 * ================================================================== */

function Footer({ business }: { business: BusinessDetail }) {
  return (
    <footer className="relative border-t hairline">
      <div className="mx-auto max-w-[1600px] px-6 md:px-12 py-20 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-end">
          <div className="md:col-span-7">
            <div className="font-mono-brand text-[10px] tracking-eyebrow uppercase text-primary mb-4">
              Lumi Private · End of presentation
            </div>
            <div className="font-display text-3xl md:text-4xl tracking-display text-balance">
              Discretion is the product.
            </div>
          </div>
          <div className="md:col-span-5 md:text-right font-mono-brand text-[9px] tracking-eyebrow uppercase text-muted-foreground space-y-2">
            <div>File no. {business.id.slice(0, 6).toUpperCase()}</div>
            <div>Confidential · for the named recipient only</div>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* =====================================================================
 * Helpers
 * ================================================================== */

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