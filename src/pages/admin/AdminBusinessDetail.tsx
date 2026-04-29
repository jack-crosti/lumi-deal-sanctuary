import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Pencil,
  Eye,
  Globe2,
  Archive,
  Trash2,
} from "lucide-react";
import { PageHeader, PlaceholderPanel } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  BusinessStatusPill,
  BUSINESS_STATUS_OPTIONS,
  type BusinessStatus,
} from "@/components/admin/BusinessStatusPill";
import { formatCurrency, formatDate, formatRelative } from "@/lib/format";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import BusinessDocuments from "@/components/admin/BusinessDocuments";
import BusinessOfferInterest from "@/components/admin/BusinessOfferInterest";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Business {
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
  stock_value: number | null;
  revenue: number | null;
  weekly_sales_min: number | null;
  weekly_sales_max: number | null;
  normalised_profit: number | null;
  ebitda: number | null;
  rent_per_year: number | null;
  lease_expiry: string | null;
  renewal_rights: string | null;
  staff_summary: string | null;
  owner_involvement: string | null;
  opening_hours: string | null;
  broker_notes: string | null;
  status: BusinessStatus;
  updated_at: string;
  created_at: string;
}

const TABS = [
  { value: "overview", label: "Overview" },
  { value: "presentation", label: "Presentation Studio" },
  { value: "documents", label: "Documents" },
  { value: "financials", label: "Financials" },
  { value: "location", label: "Location" },
  { value: "buyer-access", label: "Buyer Access" },
  { value: "activity", label: "Activity" },
  { value: "questions", label: "Questions & Requests" },
  { value: "offers", label: "Offer Interest" },
  { value: "settings", label: "Settings" },
] as const;

export default function AdminBusinessDetail() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [b, setB] = useState<Business | null>(null);
  const [notFound, setNotFound] = useState(false);

  const tab = searchParams.get("tab") ?? "overview";

  const load = async () => {
    if (!id) return;
    const { data, error } = await supabase
      .from("businesses")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) {
      toast.error(error.message);
      return;
    }
    if (!data) {
      setNotFound(true);
      return;
    }
    setB(data as Business);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (notFound) {
    return <div className="text-center py-20 text-muted-foreground">Listing not found.</div>;
  }
  if (!b) {
    return <div className="lumi-card p-12 text-center text-sm text-muted-foreground">Loading…</div>;
  }

  const title = b.public_title || b.name;
  const isPublished = b.status === "published";

  const updateStatus = async (status: BusinessStatus) => {
    const patch: Partial<Business> = { status };
    if (status === "archived") (patch as Record<string, unknown>).archived_at = new Date().toISOString();
    const { error } = await supabase.from("businesses").update(patch).eq("id", b.id);
    if (error) return toast.error(error.message);
    toast.success(`Status updated to ${status.replace(/_/g, " ")}`);
    load();
  };

  const onDelete = async () => {
    const { error } = await supabase.from("businesses").delete().eq("id", b.id);
    if (error) return toast.error(error.message);
    toast.success("Listing deleted");
    navigate("/admin/businesses");
  };

  return (
    <>
      <PageHeader
        eyebrow={b.business_type || "Information Memorandum"}
        title={title}
        actions={
          <div className="flex items-center gap-2">
            <Link to="/admin/businesses" className="lumi-btn-ghost">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Back</span>
            </Link>
            <Link to={`/buyer/business/${b.id}`} className="lumi-btn-ghost">
              <Eye className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Preview</span>
            </Link>
            <Link to={`/admin/businesses/${b.id}/edit`} className="lumi-btn-ghost">
              <Pencil className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Edit</span>
            </Link>
            <button
              onClick={() => updateStatus(isPublished ? "ready_to_publish" : "published")}
              className="lumi-btn-primary"
            >
              <Globe2 className="h-3.5 w-3.5" />
              {isPublished ? "Unpublish" : "Publish"}
            </button>
          </div>
        }
      />

      <div className="-mt-10 mb-12 flex items-center gap-3 animate-rise">
        <BusinessStatusPill status={b.status} />
        <span className="text-[11px] text-muted-foreground">
          Updated {formatRelative(b.updated_at)}
        </span>
      </div>

      <Tabs
        value={tab}
        onValueChange={(v) => setSearchParams({ tab: v })}
        className="animate-rise"
      >
        <TabsList className="bg-transparent p-0 h-auto gap-1 flex-wrap justify-start border-b hairline rounded-none w-full">
          {TABS.map((t) => (
            <TabsTrigger
              key={t.value}
              value={t.value}
              className="rounded-none bg-transparent border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary text-muted-foreground hover:text-foreground px-4 py-3 text-[10px] tracking-eyebrow uppercase font-mono-brand transition-colors data-[state=active]:shadow-none"
            >
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="mt-10">
          <TabsContent value="overview" className="mt-0">
            <Overview b={b} />
          </TabsContent>
          <TabsContent value="presentation" className="mt-0">
            <PlaceholderPanel
              title="Presentation Studio"
              body="A cinematic, block-based editor for the buyer-facing presentation. Arrives in a later stage."
            />
          </TabsContent>
          <TabsContent value="documents" className="mt-0">
            <BusinessDocuments businessId={b.id} />
          </TabsContent>
          <TabsContent value="financials" className="mt-0">
            <Financials b={b} />
          </TabsContent>
          <TabsContent value="location" className="mt-0">
            <Location b={b} />
          </TabsContent>
          <TabsContent value="buyer-access" className="mt-0">
            <PlaceholderPanel
              title="Buyer Access"
              body="Assign approved buyers to this Information Memorandum and choose their access level: Teaser, IM, Financial, Serious, or Full DD."
            />
          </TabsContent>
          <TabsContent value="activity" className="mt-0">
            <PlaceholderPanel
              title="Buyer Activity"
              body="A timeline of every buyer touchpoint — logins, page views, document opens — with intent scoring."
            />
          </TabsContent>
          <TabsContent value="questions" className="mt-0">
            <PlaceholderPanel
              title="Questions & Requests"
              body="Buyer questions and information requests for this listing will be managed here."
            />
          </TabsContent>
          <TabsContent value="offers" className="mt-0">
            <BusinessOfferInterest businessId={b.id} />
          </TabsContent>
          <TabsContent value="settings" className="mt-0">
            <Settings
              b={b}
              onStatusChange={updateStatus}
              onDelete={onDelete}
            />
          </TabsContent>
        </div>
      </Tabs>
    </>
  );
}

/* ================ Tab content ================ */

function Overview({ b }: { b: Business }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Block title="Identity">
          <DefinitionList
            rows={[
              ["Business name", b.name],
              ["Public title", b.public_title],
              ["Confidential title", b.confidential_title],
              ["Business type", b.business_type],
              ["Industry", b.industry],
            ]}
          />
        </Block>
        <Block title="Lease & operations">
          <DefinitionList
            rows={[
              ["Rent per year", b.rent_per_year != null ? formatCurrency(b.rent_per_year) : null],
              ["Lease expiry", b.lease_expiry ? formatDate(b.lease_expiry) : null],
              ["Renewal rights", b.renewal_rights],
              ["Opening hours", b.opening_hours],
              ["Staff summary", b.staff_summary],
              ["Owner involvement", b.owner_involvement],
            ]}
          />
        </Block>
        <Block title="Broker notes">
          <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
            {b.broker_notes || "No notes recorded."}
          </p>
        </Block>
      </div>
      <div className="space-y-6">
        <Block title="Headline figures">
          <ul className="space-y-5">
            <Stat label="Asking price" value={formatCurrency(b.asking_price)} />
            <Stat label="Annual revenue" value={formatCurrency(b.revenue)} />
            <Stat
              label="Profit (EBITDA)"
              value={formatCurrency(b.ebitda ?? b.normalised_profit)}
            />
          </ul>
        </Block>
        <Block title="Location">
          <DefinitionList
            rows={[
              ["Mode", locationModeLabel(b.location_mode)],
              ["Suburb", b.suburb],
              ["City", b.city],
              ["Region", b.region],
              ["Address", b.address],
            ]}
          />
        </Block>
      </div>
    </div>
  );
}

function Financials({ b }: { b: Business }) {
  const items: { label: string; value: number | null }[] = [
    { label: "Asking price", value: b.asking_price },
    { label: "Stock value", value: b.stock_value },
    { label: "Annual revenue", value: b.revenue },
    { label: "Normalised profit", value: b.normalised_profit },
    { label: "EBITDA / owner profit", value: b.ebitda },
    { label: "Rent per year", value: b.rent_per_year },
  ];
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((it) => (
        <div key={it.label} className="lumi-card p-7">
          <div className="font-mono-brand text-[9px] tracking-eyebrow uppercase text-muted-foreground mb-3">
            {it.label}
          </div>
          <div className="lumi-stat text-3xl">{formatCurrency(it.value)}</div>
        </div>
      ))}
      <div className="lumi-card p-7 md:col-span-2 lg:col-span-3">
        <div className="font-mono-brand text-[9px] tracking-eyebrow uppercase text-muted-foreground mb-3">
          Weekly sales range
        </div>
        <div className="lumi-stat text-3xl">
          {b.weekly_sales_min == null && b.weekly_sales_max == null
            ? "—"
            : `${formatCurrency(b.weekly_sales_min)} – ${formatCurrency(b.weekly_sales_max)}`}
        </div>
      </div>
    </div>
  );
}

function Location({ b }: { b: Business }) {
  const buyerSees =
    b.location_mode === "exact"
      ? b.address || "Address not provided"
      : b.location_mode === "suburb"
        ? [b.suburb, b.city].filter(Boolean).join(", ") || "Suburb not provided"
        : b.region || "Region not provided";
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Block title="Confidentiality">
        <DefinitionList
          rows={[
            ["Mode", locationModeLabel(b.location_mode)],
            ["What buyers see", buyerSees],
          ]}
        />
      </Block>
      <Block title="Internal address">
        <DefinitionList
          rows={[
            ["Suburb", b.suburb],
            ["City", b.city],
            ["Region", b.region],
            ["Exact address", b.address],
          ]}
        />
      </Block>
      <div className="lg:col-span-2">
        <PlaceholderPanel
          title="Map preview"
          body="The Location Advantage map with approved nearby landmarks will be configured in a later stage."
        />
      </div>
    </div>
  );
}

function Settings({
  b,
  onStatusChange,
  onDelete,
}: {
  b: Business;
  onStatusChange: (s: BusinessStatus) => void | Promise<unknown>;
  onDelete: () => void | Promise<unknown>;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Block title="Lifecycle">
        <p className="text-sm text-muted-foreground mb-5">
          Move the listing through its lifecycle. Only "Published" listings are visible to assigned buyers.
        </p>
        <div className="flex flex-wrap gap-2">
          {BUSINESS_STATUS_OPTIONS.map((opt) => {
            const active = b.status === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => !active && onStatusChange(opt.value)}
                disabled={active}
                className={`px-3.5 py-2 rounded-sm border text-[10px] tracking-eyebrow uppercase font-mono-brand transition-colors ${
                  active
                    ? "border-primary/60 bg-primary/10 text-primary"
                    : "hairline text-muted-foreground hover:text-foreground hover:border-primary/30"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </Block>
      <Block title="Danger zone">
        <p className="text-sm text-muted-foreground mb-5">
          Archiving hides the listing from buyers but keeps its history. Deletion is permanent.
        </p>
        <div className="flex flex-wrap gap-2">
          {b.status !== "archived" && (
            <button onClick={() => onStatusChange("archived")} className="lumi-btn-ghost">
              <Archive className="h-3.5 w-3.5" />
              Archive listing
            </button>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="inline-flex items-center justify-center gap-3 rounded-md border border-destructive/40 px-7 py-4 text-[11px] tracking-eyebrow uppercase text-destructive hover:bg-destructive/10 transition-colors">
                <Trash2 className="h-3.5 w-3.5" />
                Delete permanently
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this listing?</AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently removes the business and all related buyer access, documents and activity. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </Block>
    </div>
  );
}

/* ================ Primitives ================ */

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="lumi-card p-7 md:p-9">
      <div className="font-mono-brand text-[10px] tracking-eyebrow uppercase text-primary mb-5 flex items-center gap-3">
        <span className="h-px w-6 bg-primary" />
        {title}
      </div>
      {children}
    </div>
  );
}

function DefinitionList({ rows }: { rows: [string, string | null | undefined][] }) {
  return (
    <dl className="divide-y hairline border-t hairline">
      {rows.map(([k, v]) => (
        <div key={k} className="grid grid-cols-[140px_1fr] gap-4 py-3.5">
          <dt className="font-mono-brand text-[9px] tracking-eyebrow uppercase text-muted-foreground self-start pt-1">
            {k}
          </dt>
          <dd className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
            {v && v.toString().trim() !== "" ? v : <span className="text-muted-foreground/60">—</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <li>
      <div className="font-mono-brand text-[9px] tracking-eyebrow uppercase text-muted-foreground mb-1.5">
        {label}
      </div>
      <div className="lumi-stat text-2xl">{value}</div>
    </li>
  );
}

function locationModeLabel(m: Business["location_mode"]) {
  return m === "blind" ? "Blind" : m === "suburb" ? "Approximate suburb" : "Exact location";
}