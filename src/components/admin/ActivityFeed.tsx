import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Activity as ActivityIcon, Smartphone, Tablet, Monitor } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { labelForEvent } from "./IntentScore";
import { formatRelative } from "@/lib/format";

interface Row {
  id: string;
  created_at: string;
  event_type: string;
  business_id: string | null;
  buyer_id: string;
  device_type: string | null;
  metadata: Record<string, unknown> | null;
}

interface Props {
  businessId?: string;
  buyerId?: string;
  limit?: number;
  showFilters?: boolean;
}

const buyerName = (p: {
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}) =>
  p.full_name ||
  [p.first_name, p.last_name].filter(Boolean).join(" ") ||
  p.email ||
  "Unknown buyer";

function DeviceIcon({ d }: { d: string | null }) {
  if (d === "mobile") return <Smartphone className="h-3 w-3" />;
  if (d === "tablet") return <Tablet className="h-3 w-3" />;
  return <Monitor className="h-3 w-3" />;
}

export default function ActivityFeed({
  businessId,
  buyerId,
  limit = 200,
  showFilters = false,
}: Props) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [profiles, setProfiles] = useState<Map<string, { full_name: string | null; first_name: string | null; last_name: string | null; email: string | null }>>(new Map());
  const [businesses, setBusinesses] = useState<Map<string, { name: string; public_title: string | null }>>(new Map());
  const [eventFilter, setEventFilter] = useState<string>("");

  useEffect(() => {
    (async () => {
      let q = supabase
        .from("buyer_activity")
        .select("id, created_at, event_type, business_id, buyer_id, device_type, metadata")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (businessId) q = q.eq("business_id", businessId);
      if (buyerId) q = q.eq("buyer_id", buyerId);
      const { data } = await q;
      const list = (data ?? []) as Row[];
      setRows(list);

      const buyerIds = Array.from(new Set(list.map((r) => r.buyer_id)));
      const businessIds = Array.from(
        new Set(list.map((r) => r.business_id).filter(Boolean) as string[]),
      );
      const [{ data: profs }, { data: biz }] = await Promise.all([
        buyerIds.length > 0
          ? supabase
              .from("profiles")
              .select("id, full_name, first_name, last_name, email")
              .in("id", buyerIds)
          : Promise.resolve({ data: [] as { id: string; full_name: string | null; first_name: string | null; last_name: string | null; email: string | null }[] }),
        businessIds.length > 0
          ? supabase
              .from("businesses")
              .select("id, name, public_title")
              .in("id", businessIds)
          : Promise.resolve({ data: [] as { id: string; name: string; public_title: string | null }[] }),
      ]);
      setProfiles(new Map((profs ?? []).map((p) => [p.id, p])));
      setBusinesses(new Map((biz ?? []).map((b) => [b.id, b])));
    })();
  }, [businessId, buyerId, limit]);

  const eventTypes = useMemo(() => {
    if (!rows) return [];
    return Array.from(new Set(rows.map((r) => r.event_type))).sort();
  }, [rows]);

  const filtered = useMemo(() => {
    if (!rows) return null;
    if (!eventFilter) return rows;
    return rows.filter((r) => r.event_type === eventFilter);
  }, [rows, eventFilter]);

  if (rows === null) {
    return (
      <div className="lumi-card p-12 text-center text-sm text-muted-foreground flex items-center justify-center gap-3">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading activity…
      </div>
    );
  }

  if (filtered && filtered.length === 0) {
    return (
      <div className="lumi-card p-12 text-center">
        <ActivityIcon className="h-5 w-5 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showFilters && eventTypes.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setEventFilter("")}
            className={`px-3 py-1.5 rounded-sm border text-[10px] tracking-eyebrow uppercase font-mono-brand transition-colors ${
              eventFilter === ""
                ? "border-primary/60 bg-primary/10 text-primary"
                : "hairline text-muted-foreground hover:text-foreground"
            }`}
          >
            All
          </button>
          {eventTypes.map((e) => (
            <button
              key={e}
              onClick={() => setEventFilter(e)}
              className={`px-3 py-1.5 rounded-sm border text-[10px] tracking-eyebrow uppercase font-mono-brand transition-colors ${
                eventFilter === e
                  ? "border-primary/60 bg-primary/10 text-primary"
                  : "hairline text-muted-foreground hover:text-foreground"
              }`}
            >
              {labelForEvent(e)}
            </button>
          ))}
        </div>
      )}

      <div className="lumi-card overflow-hidden">
        <ul className="divide-y divide-border">
          {(filtered ?? []).map((r) => {
            const p = profiles.get(r.buyer_id);
            const b = r.business_id ? businesses.get(r.business_id) : null;
            return (
              <li key={r.id} className="p-4 md:p-5 flex items-start gap-4">
                <div className="mt-1 text-muted-foreground">
                  <DeviceIcon d={r.device_type} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-mono-brand text-[10px] tracking-eyebrow uppercase text-primary">
                      {labelForEvent(r.event_type)}
                    </span>
                    <span className="font-mono-brand text-[9px] tracking-eyebrow uppercase text-muted-foreground">
                      {formatRelative(r.created_at)}
                    </span>
                  </div>
                  <p className="text-sm truncate">
                    {!buyerId && p && (
                      <Link
                        to={`/admin/buyers/${r.buyer_id}`}
                        className="text-foreground/90 hover:text-primary transition-colors"
                      >
                        {buyerName(p)}
                      </Link>
                    )}
                    {!businessId && b && (
                      <>
                        {!buyerId && p && <span className="text-muted-foreground"> · </span>}
                        <Link
                          to={`/admin/businesses/${r.business_id}`}
                          className="text-foreground/80 hover:text-primary transition-colors"
                        >
                          {b.public_title || b.name}
                        </Link>
                      </>
                    )}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}