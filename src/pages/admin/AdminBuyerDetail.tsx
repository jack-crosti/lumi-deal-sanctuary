import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  buyerDisplayName,
  type BuyerStatus,
  type CaStatus,
  type BuyerType,
  type FinanceStatus,
  type OwnerIntent,
  BUYER_TYPE_OPTIONS,
  FINANCE_STATUS_OPTIONS,
  OWNER_INTENT_OPTIONS,
} from "@/lib/buyerLabels";
import { BuyerStatusPill, CaStatusPill } from "@/components/admin/BuyerStatusPill";
import { BuyerAccessManager } from "@/components/admin/BuyerAccessManager";
import { BuyerForm } from "@/components/admin/BuyerForm";
import { formatCurrency, formatRelative } from "@/lib/format";
import { IntentScoreCard } from "@/components/admin/IntentScore";
import ActivityFeed from "@/components/admin/ActivityFeed";
import { computeIntentScore, suggestedNextAction, type ActivityRow } from "@/lib/intentScore";

interface BuyerProfile {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  phone: string | null;
  company: string | null;
  buyer_type: BuyerType | null;
  budget_min: number | null;
  budget_max: number | null;
  finance_status: FinanceStatus;
  hospitality_experience: string | null;
  preferred_business_type: string | null;
  preferred_location: string | null;
  owner_intent: OwnerIntent | null;
  ca_status: CaStatus;
  buyer_status: BuyerStatus;
  admin_notes: string | null;
  is_pending: boolean;
  created_at: string;
  updated_at: string;
}

const TABS = [
  { value: "overview", label: "Overview" },
  { value: "access", label: "Business Access" },
  { value: "intent", label: "Intent" },
  { value: "activity", label: "Activity" },
  { value: "edit", label: "Edit profile" },
] as const;

export default function AdminBuyerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") ?? "overview";
  const [b, setB] = useState<BuyerProfile | null>(null);
  const [notFound, setNotFound] = useState(false);

  const load = async () => {
    if (!id) return;
    const { data, error } = await supabase
      .from("profiles")
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
    setB(data as BuyerProfile);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (notFound) {
    return <div className="text-center py-20 text-muted-foreground">Buyer not found.</div>;
  }
  if (!b) {
    return <div className="lumi-card p-12 text-center text-sm text-muted-foreground">Loading…</div>;
  }

  const display = buyerDisplayName(b);

  const onDelete = async () => {
    const { error } = await supabase.from("profiles").delete().eq("id", b.id);
    if (error) return toast.error(error.message);
    toast.success("Buyer deleted");
    navigate("/admin/buyers");
  };

  return (
    <>
      <PageHeader
        eyebrow={b.is_pending ? "Pending invite" : "Buyer"}
        title={display}
        description={b.email ?? undefined}
        actions={
          <div className="flex items-center gap-2">
            <Link to="/admin/buyers" className="lumi-btn-ghost">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Back</span>
            </Link>
            <button onClick={() => setSearchParams({ tab: "edit" })} className="lumi-btn-ghost">
              <Pencil className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Edit</span>
            </button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="inline-flex items-center justify-center gap-2 rounded-md border border-destructive/40 px-4 py-2.5 text-[10px] tracking-eyebrow uppercase text-destructive hover:bg-destructive/10 transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Delete</span>
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this buyer?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This permanently removes the buyer profile and any business access granted to them. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        }
      />

      <div className="-mt-10 mb-12 flex flex-wrap items-center gap-3 animate-rise">
        <BuyerStatusPill status={b.buyer_status} />
        <CaStatusPill status={b.ca_status} />
        <span className="text-[11px] text-muted-foreground">
          Updated {formatRelative(b.updated_at)}
        </span>
      </div>

      <Tabs value={tab} onValueChange={(v) => setSearchParams({ tab: v })} className="animate-rise">
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
          <TabsContent value="access" className="mt-0">
            <BuyerAccessManager buyerId={b.id} />
          </TabsContent>
          <TabsContent value="intent" className="mt-0">
            <BuyerIntent buyerId={b.id} />
          </TabsContent>
          <TabsContent value="activity" className="mt-0">
            <ActivityFeed buyerId={b.id} showFilters />
          </TabsContent>
          <TabsContent value="edit" className="mt-0">
            <BuyerForm
              initial={{
                id: b.id,
                is_pending: b.is_pending,
                first_name: b.first_name ?? "",
                last_name: b.last_name ?? "",
                email: b.email ?? "",
                phone: b.phone ?? "",
                company: b.company ?? "",
                buyer_type: (b.buyer_type ?? "") as never,
                budget_min: b.budget_min?.toString() ?? "",
                budget_max: b.budget_max?.toString() ?? "",
                finance_status: b.finance_status,
                hospitality_experience: b.hospitality_experience ?? "",
                preferred_business_type: b.preferred_business_type ?? "",
                preferred_location: b.preferred_location ?? "",
                owner_intent: (b.owner_intent ?? "") as never,
                ca_status: b.ca_status,
                buyer_status: b.buyer_status,
                admin_notes: b.admin_notes ?? "",
              }}
            />
          </TabsContent>
        </div>
      </Tabs>
    </>
  );
}

function Overview({ b }: { b: BuyerProfile }) {
  const buyerTypeLabel = BUYER_TYPE_OPTIONS.find((o) => o.value === b.buyer_type)?.label ?? null;
  const financeLabel = FINANCE_STATUS_OPTIONS.find((o) => o.value === b.finance_status)?.label ?? null;
  const intentLabel = OWNER_INTENT_OPTIONS.find((o) => o.value === b.owner_intent)?.label ?? null;
  const budget =
    b.budget_min == null && b.budget_max == null
      ? null
      : `${formatCurrency(b.budget_min)} – ${formatCurrency(b.budget_max)}`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Block title="Contact">
          <DefinitionList
            rows={[
              ["First name", b.first_name],
              ["Last name", b.last_name],
              ["Email", b.email],
              ["Phone", b.phone],
              ["Company", b.company],
            ]}
          />
        </Block>
        <Block title="Buyer profile">
          <DefinitionList
            rows={[
              ["Buyer type", buyerTypeLabel],
              ["Working owner / investor", intentLabel],
              ["Budget range", budget],
              ["Finance status", financeLabel],
              ["Preferred business type", b.preferred_business_type],
              ["Preferred location", b.preferred_location],
              ["Hospitality experience", b.hospitality_experience],
            ]}
          />
        </Block>
        <Block title="Admin notes">
          <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
            {b.admin_notes || "No notes recorded."}
          </p>
        </Block>
      </div>
      <div className="space-y-6">
        <Block title="Pipeline">
          <DefinitionList
            rows={[
              ["Buyer status", b.buyer_status.replace(/_/g, " ")],
              ["Confidentiality", b.ca_status.replace(/_/g, " ")],
              ["Account state", b.is_pending ? "Pending invite" : "Active"],
            ]}
          />
        </Block>
      </div>
    </div>
  );
}

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
        <div key={k} className="grid grid-cols-[160px_1fr] gap-4 py-3.5">
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