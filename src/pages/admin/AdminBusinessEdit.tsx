import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { BusinessForm, type BusinessFormInitial } from "@/components/admin/BusinessForm";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function AdminBusinessEdit() {
  const { id } = useParams<{ id: string }>();
  const [initial, setInitial] = useState<BusinessFormInitial | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
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
      setInitial({
        id: data.id,
        name: data.name ?? "",
        public_title: data.public_title ?? "",
        confidential_title: data.confidential_title ?? "",
        business_type: data.business_type ?? "",
        industry: data.industry ?? "",
        location_mode: data.location_mode,
        suburb: data.suburb ?? "",
        city: data.city ?? "",
        region: data.region ?? "",
        address: data.address ?? "",
        asking_price: data.asking_price?.toString() ?? "",
        stock_value: data.stock_value?.toString() ?? "",
        revenue: data.revenue?.toString() ?? "",
        weekly_sales_min: data.weekly_sales_min?.toString() ?? "",
        weekly_sales_max: data.weekly_sales_max?.toString() ?? "",
        normalised_profit: data.normalised_profit?.toString() ?? "",
        ebitda: data.ebitda?.toString() ?? "",
        rent_per_year: data.rent_per_year?.toString() ?? "",
        lease_expiry: data.lease_expiry ?? "",
        renewal_rights: data.renewal_rights ?? "",
        staff_summary: data.staff_summary ?? "",
        owner_involvement: data.owner_involvement ?? "",
        opening_hours: data.opening_hours ?? "",
        broker_notes: data.broker_notes ?? "",
        status: data.status,
      });
    })();
  }, [id]);

  if (notFound) {
    return (
      <div className="text-center py-20 text-muted-foreground">Listing not found.</div>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Edit mandate"
        title={initial?.name || "Edit listing"}
        description="Refine the details. Changes are saved to the listing record."
        actions={
          <Link to={id ? `/admin/businesses/${id}` : "/admin/businesses"} className="lumi-btn-ghost">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Link>
        }
      />
      {initial ? (
        <BusinessForm initial={initial} />
      ) : (
        <div className="lumi-card p-12 text-center text-sm text-muted-foreground">Loading…</div>
      )}
    </>
  );
}