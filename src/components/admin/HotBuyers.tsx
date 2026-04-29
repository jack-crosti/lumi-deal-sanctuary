import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Flame, ArrowUpRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  computeIntentScore,
  intentTier,
  intentTierLabel,
  intentTierTone,
  suggestedNextAction,
  type ActivityRow,
} from "@/lib/intentScore";

interface BuyerRollup {
  buyerId: string;
  buyerName: string;
  buyerEmail: string | null;
  topBusinessId: string | null;
  topBusinessName: string | null;
  score: number;
  lastEventAt: string | null;
  suggested: string;
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

export default function HotBuyers() {
  const [rows, setRows] = useState<BuyerRollup[] | null>(null);

  useEffect(() => {
    (async () => {
      const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString();
      const { data: events } = await supabase
        .from("buyer_activity")
        .select("id, created_at, event_type, business_id, buyer_id, metadata")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(2000);

      const list = (events ?? []) as unknown as ActivityRow[];
      if (list.length === 0) {
        setRows([]);
        return;
      }

      const byBuyer = new Map<string, ActivityRow[]>();
      list.forEach((e) => {
        const arr = byBuyer.get(e.buyer_id) ?? [];
        arr.push(e);
        byBuyer.set(e.buyer_id, arr);
      });

      const buyerIds = Array.from(byBuyer.keys());
      const businessIds = Array.from(
        new Set(list.map((e) => e.business_id).filter(Boolean) as string[]),
      );
      const [{ data: profiles }, { data: businesses }] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name, first_name, last_name, email")
          .in("id", buyerIds),
        businessIds.length > 0
          ? supabase
              .from("businesses")
              .select("id, name, public_title")
              .in("id", businessIds)
          : Promise.resolve({ data: [] as { id: string; name: string; public_title: string | null }[] }),
      ]);
      const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
      const businessMap = new Map(
        (businesses ?? []).map((b) => [b.id, b]),
      );

      const rollups: BuyerRollup[] = buyerIds.map((buyerId) => {
        const events = byBuyer.get(buyerId) ?? [];
        const breakdown = computeIntentScore(events);

        // Find the most-engaged business for this buyer
        const counts = new Map<string, number>();
        events.forEach((e) => {
          if (!e.business_id) return;
          counts.set(e.business_id, (counts.get(e.business_id) ?? 0) + 1);
        });
        let topBusinessId: string | null = null;
        let topCount = 0;
        counts.forEach((c, id) => {
          if (c > topCount) {
            topCount = c;
            topBusinessId = id;
          }
        });
        const topBusiness = topBusinessId ? businessMap.get(topBusinessId) : null;
        const profile = profileMap.get(buyerId);

        return {
          buyerId,
          buyerName: profile ? buyerName(profile) : "Unknown buyer",
          buyerEmail: profile?.email ?? null,
          topBusinessId,
          topBusinessName: topBusiness?.public_title || topBusiness?.name || null,
          score: breakdown.score,
          lastEventAt: breakdown.lastEventAt,
          suggested: suggestedNextAction(breakdown),
        };
      });

      rollups.sort((a, b) => b.score - a.score);
      setRows(rollups.slice(0, 8));
    })();
  }, []);

  if (rows === null) {
    return (
      <div className="lumi-card p-12 text-center text-sm text-muted-foreground flex items-center justify-center gap-3">
        <Loader2 className="h-4 w-4 animate-spin" /> Calculating buyer intent…
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="lumi-card p-10 text-center">
        <Flame className="h-5 w-5 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">
          No buyer activity yet. Hot buyers will surface here as soon as they engage.
        </p>
      </div>
    );
  }

  return (
    <div className="lumi-card overflow-hidden">
      <ul className="divide-y divide-border">
        {rows.map((r) => {
          const tier = intentTier(r.score);
          return (
            <li key={r.buyerId} className="p-5 md:p-6 flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border font-mono-brand text-[10px] tracking-eyebrow uppercase tabular-nums ${intentTierTone(tier)}`}
                  >
                    <Flame className="h-3 w-3" />
                    {r.score} · {intentTierLabel(tier)}
                  </span>
                  {r.lastEventAt && (
                    <span className="font-mono-brand text-[9px] tracking-eyebrow uppercase text-muted-foreground">
                      {new Date(r.lastEventAt).toLocaleString()}
                    </span>
                  )}
                </div>
                <p className="font-display text-lg tracking-display truncate">
                  {r.buyerName}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {r.buyerEmail}
                  {r.topBusinessName && (
                    <>
                      {" · "}
                      <span className="text-foreground/80">{r.topBusinessName}</span>
                    </>
                  )}
                </p>
                <p className="text-xs text-foreground/80 mt-2 leading-[1.6]">
                  → {r.suggested}
                </p>
              </div>
              <Link
                to={`/admin/buyers/${r.buyerId}`}
                className="lumi-btn-ghost text-xs whitespace-nowrap self-start md:self-auto"
              >
                View buyer
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}