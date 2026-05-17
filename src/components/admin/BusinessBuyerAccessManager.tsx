import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Trash2, UserRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ACCESS_LEVEL_OPTIONS, buyerDisplayName, type AccessLevel } from "@/lib/buyerLabels";
import { useAuth } from "@/hooks/useAuth";
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

interface BuyerOption {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  company: string | null;
  is_pending: boolean;
}

interface AccessRow {
  id: string;
  buyer_id: string;
  access_level: AccessLevel;
  buyer?: BuyerOption | null;
}

export function BusinessBuyerAccessManager({ businessId }: { businessId: string }) {
  const { user } = useAuth();
  const [buyers, setBuyers] = useState<BuyerOption[]>([]);
  const [rows, setRows] = useState<AccessRow[] | null>(null);
  const [selectedBuyer, setSelectedBuyer] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<AccessLevel>("teaser");
  const [adding, setAdding] = useState(false);

  const load = async () => {
    const [buyerRes, accessRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("id,email,first_name,last_name,full_name,company,is_pending")
        .order("full_name", { ascending: true, nullsFirst: false }),
      supabase
        .from("buyer_business_access")
        .select("id,buyer_id,access_level")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false }),
    ]);

    const buyerList = buyerRes.error ? [] : ((buyerRes.data ?? []) as BuyerOption[]);
    const buyerById = new Map(buyerList.map((b) => [b.id, b]));

    if (buyerRes.error) toast.error(buyerRes.error.message);
    else setBuyers(buyerList);

    if (accessRes.error) {
      toast.error(accessRes.error.message);
    } else {
      const accessRows = (accessRes.data ?? []).map((row) => ({
        ...(row as Omit<AccessRow, "buyer">),
        buyer: buyerById.get(row.buyer_id) ?? null,
      }));
      setRows(accessRows);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);

  const onAdd = async () => {
    if (!selectedBuyer) return;
    if (rows?.some((r) => r.buyer_id === selectedBuyer)) {
      toast.error("That buyer already has access. Edit the existing row.");
      return;
    }

    setAdding(true);
    const { error } = await supabase.from("buyer_business_access").insert([
      {
        buyer_id: selectedBuyer,
        business_id: businessId,
        access_level: selectedLevel,
        assigned_by: user?.id ?? null,
      },
    ]);
    setAdding(false);

    if (error) return toast.error(error.message);
    toast.success("Buyer access granted");
    setSelectedBuyer("");
    setSelectedLevel("teaser");
    load();
  };

  const onChangeLevel = async (id: string, level: AccessLevel) => {
    const { error } = await supabase
      .from("buyer_business_access")
      .update({ access_level: level })
      .eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Access level updated");
    load();
  };

  const onRemove = async (id: string) => {
    const { error } = await supabase.from("buyer_business_access").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Access revoked");
    load();
  };

  const available = buyers.filter((b) => !rows?.some((r) => r.buyer_id === b.id));

  return (
    <div className="space-y-8">
      <div className="lumi-card p-6 md:p-8">
        <div className="font-mono-brand text-[10px] tracking-eyebrow uppercase text-primary mb-5 flex items-center gap-3">
          <span className="h-px w-6 bg-primary" />
          Grant buyer access
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr_auto] gap-3">
          <select
            className="lumi-input"
            value={selectedBuyer}
            onChange={(e) => setSelectedBuyer(e.target.value)}
          >
            <option value="">Select a buyer…</option>
            {available.map((b) => (
              <option key={b.id} value={b.id}>
                {buyerLabel(b)}
              </option>
            ))}
          </select>
          <select
            className="lumi-input"
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value as AccessLevel)}
          >
            {ACCESS_LEVEL_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label} access
              </option>
            ))}
          </select>
          <button
            type="button"
            className="lumi-btn-primary whitespace-nowrap"
            disabled={!selectedBuyer || adding}
            onClick={onAdd}
          >
            <Plus className="h-3.5 w-3.5" />
            {adding ? "Adding…" : "Add"}
          </button>
        </div>
        {available.length === 0 && buyers.length > 0 && (
          <p className="mt-4 text-[11px] text-muted-foreground">
            Every buyer currently in the system already has an access row for this business.
          </p>
        )}
      </div>

      {rows === null ? (
        <div className="lumi-card p-12 text-center text-sm text-muted-foreground">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="lumi-card p-12 text-center text-sm text-muted-foreground">
          No buyers currently have access to this business.
        </div>
      ) : (
        <ul className="lumi-card divide-y hairline overflow-hidden">
          {rows.map((r) => (
            <li
              key={r.id}
              className="grid grid-cols-1 md:grid-cols-[1.6fr_1fr_auto] items-center gap-4 px-6 py-5"
            >
              <div className="min-w-0">
                <div className="font-display text-lg tracking-display truncate flex items-center gap-2">
                  <UserRound className="h-4 w-4 text-primary/70 shrink-0" />
                  {r.buyer ? buyerDisplayName(r.buyer) : "Buyer"}
                </div>
                <div className="font-mono-brand text-[9px] tracking-eyebrow uppercase text-muted-foreground mt-1 truncate">
                  {r.buyer?.email || "No email recorded"}
                  {r.buyer?.is_pending ? " · Pending signup" : ""}
                </div>
              </div>
              <select
                className="lumi-input"
                value={r.access_level}
                onChange={(e) => onChangeLevel(r.id, e.target.value as AccessLevel)}
              >
                {ACCESS_LEVEL_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label} access
                  </option>
                ))}
              </select>
              <div className="flex items-center justify-end gap-1">
                {r.buyer_id && (
                  <Link
                    to={`/admin/buyers/${r.buyer_id}?tab=access`}
                    className="rounded-md p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                    title="Open buyer"
                  >
                    <UserRound className="h-4 w-4" />
                  </Link>
                )}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button className="rounded-md p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Revoke access?</AlertDialogTitle>
                      <AlertDialogDescription>
                        The buyer will no longer see this business in their private deal room.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onRemove(r.id)}>Revoke</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function buyerLabel(b: BuyerOption) {
  const name = buyerDisplayName(b);
  const email = b.email ? ` · ${b.email}` : "";
  const pending = b.is_pending ? " · Pending" : "";
  return `${name}${email}${pending}`;
}
