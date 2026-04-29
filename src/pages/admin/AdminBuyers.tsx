import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Search, Mail } from "lucide-react";
import { PageHeader, PlaceholderPanel } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  BUYER_STATUS_OPTIONS,
  type BuyerStatus,
  type CaStatus,
  buyerDisplayName,
} from "@/lib/buyerLabels";
import { BuyerStatusPill, CaStatusPill } from "@/components/admin/BuyerStatusPill";
import { formatRelative } from "@/lib/format";

interface BuyerRow {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  company: string | null;
  buyer_status: BuyerStatus;
  ca_status: CaStatus;
  is_pending: boolean;
  updated_at: string;
}

type StatusFilter = "all" | BuyerStatus;

export default function AdminBuyers() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<BuyerRow[] | null>(null);
  const [accessCounts, setAccessCounts] = useState<Record<string, number>>({});
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");

  const load = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id,email,first_name,last_name,full_name,company,buyer_status,ca_status,is_pending,updated_at",
      )
      .order("updated_at", { ascending: false });
    if (error) {
      toast.error(error.message);
      setRows([]);
      return;
    }
    setRows((data ?? []) as BuyerRow[]);

    const ids = (data ?? []).map((b) => b.id);
    if (ids.length) {
      const { data: access } = await supabase
        .from("buyer_business_access")
        .select("buyer_id")
        .in("buyer_id", ids);
      const counts: Record<string, number> = {};
      (access ?? []).forEach((r) => {
        counts[r.buyer_id] = (counts[r.buyer_id] ?? 0) + 1;
      });
      setAccessCounts(counts);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!rows) return [];
    return rows.filter((r) => {
      if (filter !== "all" && r.buyer_status !== filter) return false;
      if (query) {
        const q = query.toLowerCase();
        const haystack = [r.email, r.first_name, r.last_name, r.full_name, r.company]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [rows, filter, query]);

  return (
    <>
      <PageHeader
        eyebrow="Approved channel"
        title="Buyers"
        description="Vetted buyers, their access levels per business and their engagement history."
        actions={
          <Link to="/admin/buyers/new" className="lumi-btn-primary">
            <Plus className="h-3.5 w-3.5" />
            New buyer
          </Link>
        }
      />

      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8">
        <div className="flex flex-wrap items-center gap-2">
          <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
            All
          </FilterChip>
          {BUYER_STATUS_OPTIONS.map((o) => (
            <FilterChip
              key={o.value}
              active={filter === o.value}
              onClick={() => setFilter(o.value)}
            >
              {o.label}
            </FilterChip>
          ))}
        </div>
        <div className="relative md:ml-auto md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search buyers…"
            className="lumi-input pl-9 py-2.5 text-xs"
          />
        </div>
      </div>

      {rows === null ? (
        <div className="lumi-card p-12 text-center text-sm text-muted-foreground">Loading…</div>
      ) : filtered.length === 0 && rows.length === 0 ? (
        <PlaceholderPanel
          title="No buyers yet"
          body="Add your first buyer to begin granting per-business access at Teaser, IM, Financial, Serious or Full DD level."
        />
      ) : filtered.length === 0 ? (
        <div className="lumi-card p-12 text-center text-sm text-muted-foreground">
          No buyers match the current filters.
        </div>
      ) : (
        <div className="lumi-card overflow-hidden">
          <div className="hidden md:grid grid-cols-[1.6fr_1.4fr_0.8fr_0.9fr_0.6fr_0.7fr] gap-4 px-6 py-4 border-b hairline font-mono-brand text-[9px] tracking-eyebrow uppercase text-muted-foreground/70">
            <div>Buyer</div>
            <div>Email</div>
            <div>CA</div>
            <div>Status</div>
            <div>Access</div>
            <div>Updated</div>
          </div>

          <ul>
            {filtered.map((row) => {
              const display = buyerDisplayName(row);
              const count = accessCounts[row.id] ?? 0;
              return (
                <li
                  key={row.id}
                  className="group grid grid-cols-1 md:grid-cols-[1.6fr_1.4fr_0.8fr_0.9fr_0.6fr_0.7fr] gap-4 px-6 py-5 border-b hairline last:border-b-0 hover:bg-muted/20 transition-colors cursor-pointer"
                  onClick={() => navigate(`/admin/buyers/${row.id}`)}
                >
                  <div className="min-w-0">
                    <div className="font-display text-lg tracking-display truncate flex items-center gap-2">
                      {display}
                      {row.is_pending && (
                        <span className="font-mono-brand text-[8px] tracking-eyebrow uppercase text-muted-foreground border hairline rounded-full px-2 py-0.5">
                          Pending invite
                        </span>
                      )}
                    </div>
                    {row.company && (
                      <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                        {row.company}
                      </div>
                    )}
                  </div>
                  <div className="md:flex md:items-center min-w-0">
                    <span className="text-sm text-muted-foreground truncate inline-flex items-center gap-2">
                      <Mail className="h-3 w-3 opacity-50" />
                      {row.email ?? "—"}
                    </span>
                  </div>
                  <div className="md:flex md:items-center">
                    <CaStatusPill status={row.ca_status} />
                  </div>
                  <div className="md:flex md:items-center">
                    <BuyerStatusPill status={row.buyer_status} />
                  </div>
                  <div className="md:flex md:items-center text-sm tabular-nums text-muted-foreground">
                    {count}
                  </div>
                  <div className="md:flex md:items-center text-[11px] text-muted-foreground">
                    {formatRelative(row.updated_at)}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-sm border text-[10px] tracking-eyebrow uppercase font-mono-brand transition-colors ${
        active
          ? "border-primary/50 text-primary bg-primary/5"
          : "hairline text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}