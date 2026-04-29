import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Lock, MapPin } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ACCESS_LEVEL_OPTIONS, type AccessLevel } from "@/lib/buyerLabels";
import { formatCurrency } from "@/lib/format";

interface AssignedBusiness {
  id: string;
  name: string;
  public_title: string | null;
  confidential_title: string | null;
  business_type: string | null;
  industry: string | null;
  location_mode: "blind" | "suburb" | "exact";
  suburb: string | null;
  city: string | null;
  region: string | null;
  address: string | null;
  asking_price: number | null;
  ebitda: number | null;
  normalised_profit: number | null;
  status: string;
  hero_image_url: string | null;
  access_level: AccessLevel;
}

export default function BuyerDashboard() {
  const { user } = useAuth();
  const [items, setItems] = useState<AssignedBusiness[] | null>(null);

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      // Pull access rows joined with the assigned business. RLS ensures we only get our own.
      const { data, error } = await supabase
        .from("buyer_business_access")
        .select(
          `access_level,
           business:businesses(
             id,name,public_title,confidential_title,business_type,industry,
             location_mode,suburb,city,region,address,
             asking_price,ebitda,normalised_profit,status,hero_image_url
           )`,
        )
        .eq("buyer_id", user.id);

      if (!active) return;
      if (error) {
        toast.error(error.message);
        setItems([]);
        return;
      }

      type Row = { access_level: AccessLevel; business: Omit<AssignedBusiness, "access_level"> | null };
      const mapped: AssignedBusiness[] = (data as unknown as Row[])
        .filter((r) => r.business && r.business.status === "published")
        .map((r) => ({ ...(r.business as Omit<AssignedBusiness, "access_level">), access_level: r.access_level }));

      setItems(mapped);
    })();
    return () => {
      active = false;
    };
  }, [user]);

  return (
    <>
      <PageHeader
        eyebrow="Private channel"
        title="Your assigned opportunities."
        description={`Signed in as ${user?.email}. Only Information Memorandums personally shared with you appear here.`}
      />

      {items === null ? (
        <div className="lumi-card p-12 text-center text-sm text-muted-foreground animate-rise">
          Loading your opportunities…
        </div>
      ) : items.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-rise">
          {items.map((b) => (
            <OpportunityCard key={b.id} b={b} />
          ))}
        </div>
      )}
    </>
  );
}

function OpportunityCard({ b }: { b: AssignedBusiness }) {
  const accessLabel =
    ACCESS_LEVEL_OPTIONS.find((o) => o.value === b.access_level)?.label ?? b.access_level;
  const showFinancials = ["financial", "serious", "full_dd"].includes(b.access_level);
  const title = b.confidential_title || b.public_title || b.name;
  const profit = b.ebitda ?? b.normalised_profit;

  return (
    <Link
      to={`/buyer/business/${b.id}`}
      className="group relative lumi-card-elevated overflow-hidden flex flex-col transition-all duration-500 hover:-translate-y-0.5 hover:shadow-cinema"
    >
      {/* Hero strip */}
      <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-primary/15 via-card to-background">
        {b.hero_image_url ? (
          <img
            src={b.hero_image_url}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <div className="absolute inset-0 bg-radiance opacity-60" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono-brand text-[9px] tracking-eyebrow uppercase border border-primary/40 bg-primary/10 text-primary backdrop-blur-sm">
            <span className="size-1.5 rounded-full bg-primary" />
            {accessLabel} access
          </span>
          {b.business_type && (
            <span className="font-mono-brand text-[9px] tracking-eyebrow uppercase text-foreground/80 backdrop-blur-sm bg-background/40 rounded-full px-2.5 py-1 border hairline">
              {b.business_type}
            </span>
          )}
        </div>
      </div>

      <div className="relative p-7 flex-1 flex flex-col">
        <h3 className="font-display text-2xl tracking-display leading-tight text-balance mb-3">
          {title}
        </h3>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-6">
          {b.location_mode === "blind" ? (
            <Lock className="h-3 w-3 text-primary/70" />
          ) : (
            <MapPin className="h-3 w-3 text-primary/70" />
          )}
          <span className="truncate">{locationDisplay(b)}</span>
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 mb-7">
          <Stat label="Asking" value={formatCurrency(b.asking_price)} />
          <Stat
            label="Profit"
            value={showFinancials ? formatCurrency(profit) : "Locked"}
            locked={!showFinancials}
          />
        </dl>

        <div className="mt-auto pt-5 border-t hairline flex items-center justify-between">
          <span className="font-mono-brand text-[9px] tracking-eyebrow uppercase text-muted-foreground">
            View opportunity
          </span>
          <span className="inline-flex items-center justify-center size-8 rounded-full border border-primary/40 bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function Stat({ label, value, locked }: { label: string; value: string; locked?: boolean }) {
  return (
    <div>
      <dt className="font-mono-brand text-[9px] tracking-eyebrow uppercase text-muted-foreground mb-1">
        {label}
      </dt>
      <dd
        className={`lumi-stat text-lg flex items-center gap-1.5 ${
          locked ? "text-muted-foreground/70" : ""
        }`}
      >
        {locked && <Lock className="h-3 w-3" />}
        {value}
      </dd>
    </div>
  );
}

function locationDisplay(b: AssignedBusiness) {
  if (b.location_mode === "exact") {
    return b.address || [b.suburb, b.city].filter(Boolean).join(", ") || "Location available on request";
  }
  if (b.location_mode === "suburb") {
    return [b.suburb, b.city].filter(Boolean).join(", ") || b.region || "Suburb confidential";
  }
  return b.region || "Location confidential";
}

function EmptyState() {
  return (
    <div className="relative lumi-card-elevated overflow-hidden animate-rise delay-200">
      <div className="absolute inset-0 bg-radiance opacity-50 pointer-events-none" />
      <span className="absolute top-4 left-4 size-3 border-t border-l border-primary/40" />
      <span className="absolute top-4 right-4 size-3 border-t border-r border-primary/40" />
      <span className="absolute bottom-4 left-4 size-3 border-b border-l border-primary/40" />
      <span className="absolute bottom-4 right-4 size-3 border-b border-r border-primary/40" />
      <div className="relative p-12 md:p-20 text-center max-w-2xl mx-auto">
        <Lock className="h-5 w-5 text-primary mx-auto mb-8" strokeWidth={1.25} />
        <div className="font-mono-brand text-[10px] tracking-eyebrow uppercase text-primary mb-5">
          Awaiting introduction
        </div>
        <h2 className="font-display text-3xl md:text-4xl tracking-display leading-[1.05] text-balance mb-6">
          You do not currently have access to any business opportunities.
        </h2>
        <p className="text-sm md:text-base text-muted-foreground leading-[1.8]">
          If you are expecting access, please contact your broker. New Information Memorandums will appear here the moment they are shared with you.
        </p>
      </div>
    </div>
  );
}
