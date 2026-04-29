import { useEffect, useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { PageHeader, PlaceholderPanel } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import BuyerDocuments from "@/components/buyer/BuyerDocuments";

export default function BuyerBusiness() {
  const { businessId } = useParams<{ businessId: string }>();
  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState<{ id: string; name: string; headline: string | null } | null>(null);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    let active = true;
    if (!businessId) return;
    (async () => {
      // RLS will return zero rows if the buyer isn't assigned — that's our authorisation check.
      const { data, error } = await supabase
        .from("businesses")
        .select("id, name, headline")
        .eq("id", businessId)
        .maybeSingle();
      if (!active) return;
      if (error || !data) {
        setDenied(true);
      } else {
        setBusiness(data);
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [businessId]);

  if (loading) {
    return (
      <div className="flex items-center gap-3 text-muted-foreground font-mono-brand text-[11px] tracking-eyebrow uppercase">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Verifying access…
      </div>
    );
  }

  if (denied) return <Navigate to="/unauthorized" replace />;

  return (
    <>
      <PageHeader
        eyebrow="Confidential mandate"
        title={business?.name ?? "Business"}
        description={business?.headline ?? "The cinematic presentation arrives in the next stage."}
        actions={
          <Link
            to="/buyer/dashboard"
            className="inline-flex items-center gap-2 rounded-sm border hairline px-5 py-3 text-[11px] tracking-eyebrow uppercase text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            All opportunities
          </Link>
        }
      />
      <div className="space-y-12">
        <PlaceholderPanel
          title="Cinematic presentation coming next"
          body="Hero, location advantage, key highlights, financial snapshot, lease summary and offer discussion — staged for the next build."
        />
        {businessId && <BuyerDocuments businessId={businessId} />}
      </div>
    </>
  );
}