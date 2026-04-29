import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ACCESS_LEVEL_OPTIONS, type AccessLevel } from "@/lib/buyerLabels";
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

interface BusinessOption {
  id: string;
  name: string;
  public_title: string | null;
}

interface AccessRow {
  id: string;
  business_id: string;
  access_level: AccessLevel;
  business?: BusinessOption | null;
}

export function BuyerAccessManager({ buyerId }: { buyerId: string }) {
  const { user } = useAuth();
  const [businesses, setBusinesses] = useState<BusinessOption[]>([]);
  const [rows, setRows] = useState<AccessRow[] | null>(null);
  const [selectedBiz, setSelectedBiz] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<AccessLevel>("teaser");
  const [adding, setAdding] = useState(false);

  const load = async () => {
    const [bizRes, accRes] = await Promise.all([
      supabase
        .from("businesses")
        .select("id,name,public_title")
        .neq("status", "archived")
        .order("name"),
      supabase
        .from("buyer_business_access")
        .select("id,business_id,access_level, business:businesses(id,name,public_title)")
        .eq("buyer_id", buyerId)
        .order("created_at", { ascending: false }),
    ]);
    if (bizRes.error) toast.error(bizRes.error.message);
    else setBusinesses((bizRes.data ?? []) as BusinessOption[]);
    if (accRes.error) toast.error(accRes.error.message);
    else setRows((accRes.data ?? []) as unknown as AccessRow[]);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buyerId]);

  const onAdd = async () => {
    if (!selectedBiz) return;
    if (rows?.some((r) => r.business_id === selectedBiz)) {
      toast.error("That business is already assigned. Edit the existing row.");
      return;
    }
    setAdding(true);
    const { error } = await supabase.from("buyer_business_access").insert([
      {
        buyer_id: buyerId,
        business_id: selectedBiz,
        access_level: selectedLevel,
        assigned_by: user?.id ?? null,
      },
    ]);
    setAdding(false);
    if (error) return toast.error(error.message);
    toast.success("Access granted");
    setSelectedBiz("");
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

  const available = businesses.filter((b) => !rows?.some((r) => r.business_id === b.id));

  return (
    <div className="space-y-8">
      {/* Add new access */}
      <div className="lumi-card p-6 md:p-8">
        <div className="font-mono-brand text-[10px] tracking-eyebrow uppercase text-primary mb-5 flex items-center gap-3">
          <span className="h-px w-6 bg-primary" />
          Grant access
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr_auto] gap-3">
          <select
            className="lumi-input"
            value={selectedBiz}
            onChange={(e) => setSelectedBiz(e.target.value)}
          >
            <option value="">Select a business…</option>
            {available.map((b) => (
              <option key={b.id} value={b.id}>
                {b.public_title || b.name}
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
            disabled={!selectedBiz || adding}
            onClick={onAdd}
          >
            <Plus className="h-3.5 w-3.5" />
            {adding ? "Adding…" : "Add"}
          </button>
        </div>
        {available.length === 0 && businesses.length > 0 && (
          <p className="mt-4 text-[11px] text-muted-foreground">
            All available businesses have already been assigned to this buyer.
          </p>
        )}
      </div>

      {/* Existing rows */}
      {rows === null ? (
        <div className="lumi-card p-12 text-center text-sm text-muted-foreground">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="lumi-card p-12 text-center text-sm text-muted-foreground">
          This buyer has no business access yet.
        </div>
      ) : (
        <ul className="lumi-card divide-y hairline overflow-hidden">
          {rows.map((r) => (
            <li
              key={r.id}
              className="grid grid-cols-1 md:grid-cols-[1.6fr_1fr_auto] items-center gap-4 px-6 py-5"
            >
              <div className="min-w-0">
                <div className="font-display text-lg tracking-display truncate">
                  {r.business?.public_title || r.business?.name || "—"}
                </div>
                <div className="font-mono-brand text-[9px] tracking-eyebrow uppercase text-muted-foreground mt-1">
                  {r.business?.name && r.business?.public_title && r.business.public_title !== r.business.name
                    ? r.business.name
                    : "Mandate"}
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
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="rounded-md p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors justify-self-end">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Revoke access?</AlertDialogTitle>
                    <AlertDialogDescription>
                      The buyer will no longer see this business.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onRemove(r.id)}>Revoke</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}