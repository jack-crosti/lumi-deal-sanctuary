import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Search, Pencil, Eye, Users, Upload, Globe2, Archive, MoreHorizontal } from "lucide-react";
import { PageHeader, PlaceholderPanel } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  BusinessStatusPill,
  BUSINESS_STATUS_OPTIONS,
  type BusinessStatus,
} from "@/components/admin/BusinessStatusPill";
import { formatCurrency, formatRelative } from "@/lib/format";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface BusinessRow {
  id: string;
  name: string;
  public_title: string | null;
  confidential_title: string | null;
  status: BusinessStatus;
  asking_price: number | null;
  ebitda: number | null;
  normalised_profit: number | null;
  suburb: string | null;
  city: string | null;
  region: string | null;
  address: string | null;
  location_mode: "blind" | "suburb" | "exact";
  updated_at: string;
}

type StatusFilter = "all" | BusinessStatus;

export default function AdminBusinesses() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<BusinessRow[] | null>(null);
  const [accessCounts, setAccessCounts] = useState<Record<string, number>>({});
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");

  const load = async () => {
    const { data, error } = await supabase
      .from("businesses")
      .select(
        "id,name,public_title,confidential_title,status,asking_price,ebitda,normalised_profit,suburb,city,region,address,location_mode,updated_at",
      )
      .order("updated_at", { ascending: false });
    if (error) {
      toast.error(error.message);
      setRows([]);
      return;
    }
    setRows((data ?? []) as BusinessRow[]);

    const ids = (data ?? []).map((b) => b.id);
    if (ids.length) {
      const { data: access } = await supabase
        .from("buyer_business_access")
        .select("business_id")
        .in("business_id", ids);
      const counts: Record<string, number> = {};
      (access ?? []).forEach((r) => {
        counts[r.business_id] = (counts[r.business_id] ?? 0) + 1;
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
      if (filter !== "all" && r.status !== filter) return false;
      if (query) {
        const q = query.toLowerCase();
        const haystack = [r.name, r.public_title, r.confidential_title, r.suburb, r.city]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [rows, filter, query]);

  const onPublishToggle = async (row: BusinessRow) => {
    const next: BusinessStatus = row.status === "published" ? "ready_to_publish" : "published";
    const { error } = await supabase.from("businesses").update({ status: next }).eq("id", row.id);
    if (error) return toast.error(error.message);
    toast.success(next === "published" ? "Published" : "Unpublished");
    load();
  };

  const onArchive = async (row: BusinessRow) => {
    const { error } = await supabase
      .from("businesses")
      .update({ status: "archived", archived_at: new Date().toISOString() })
      .eq("id", row.id);
    if (error) return toast.error(error.message);
    toast.success("Archived");
    load();
  };

  return (
    <>
      <PageHeader
        eyebrow="Mandates"
        title="Businesses"
        description="Every active, draft and archived listing under your custody."
        actions={
          <Link to="/admin/businesses/new" className="lumi-btn-primary">
            <Plus className="h-3.5 w-3.5" />
            New listing
          </Link>
        }
      />

      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8">
        <div className="flex flex-wrap items-center gap-2">
          <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
            All
          </FilterChip>
          {BUSINESS_STATUS_OPTIONS.map((o) => (
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
            placeholder="Search listings…"
            className="lumi-input pl-9 py-2.5 text-xs"
          />
        </div>
      </div>

      {rows === null ? (
        <div className="lumi-card p-12 text-center text-sm text-muted-foreground">Loading…</div>
      ) : filtered.length === 0 && rows.length === 0 ? (
        <PlaceholderPanel
          title="No businesses yet"
          body="When you create your first listing it will appear here with status, assigned buyers and recent activity."
        />
      ) : filtered.length === 0 ? (
        <div className="lumi-card p-12 text-center text-sm text-muted-foreground">
          No listings match the current filters.
        </div>
      ) : (
        <div className="lumi-card overflow-hidden">
          {/* Header row (md+) */}
          <div className="hidden md:grid grid-cols-[1.6fr_0.9fr_0.9fr_0.9fr_1fr_0.6fr_0.7fr_40px] gap-4 px-6 py-4 border-b hairline font-mono-brand text-[9px] tracking-eyebrow uppercase text-muted-foreground/70">
            <div>Listing</div>
            <div>Status</div>
            <div>Asking</div>
            <div>Profit</div>
            <div>Location</div>
            <div>Buyers</div>
            <div>Updated</div>
            <div />
          </div>

          <ul>
            {filtered.map((row) => {
              const profit = row.ebitda ?? row.normalised_profit ?? null;
              const location = locationDisplay(row);
              const title = row.public_title || row.name;
              const buyers = accessCounts[row.id] ?? 0;
              return (
                <li
                  key={row.id}
                  className="group grid grid-cols-1 md:grid-cols-[1.6fr_0.9fr_0.9fr_0.9fr_1fr_0.6fr_0.7fr_40px] gap-4 px-6 py-5 border-b hairline last:border-b-0 hover:bg-muted/20 transition-colors cursor-pointer"
                  onClick={() => navigate(`/admin/businesses/${row.id}`)}
                >
                  <div className="min-w-0">
                    <div className="font-display text-lg tracking-display truncate">{title}</div>
                    {row.confidential_title && row.confidential_title !== title && (
                      <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                        {row.confidential_title}
                      </div>
                    )}
                  </div>
                  <div className="md:flex md:items-center">
                    <BusinessStatusPill status={row.status} />
                  </div>
                  <div className="md:flex md:items-center text-sm tabular-nums">
                    {formatCurrency(row.asking_price)}
                  </div>
                  <div className="md:flex md:items-center text-sm tabular-nums text-muted-foreground">
                    {formatCurrency(profit)}
                  </div>
                  <div className="md:flex md:items-center text-sm text-muted-foreground truncate">
                    {location}
                  </div>
                  <div className="md:flex md:items-center text-sm tabular-nums text-muted-foreground">
                    {buyers}
                  </div>
                  <div className="md:flex md:items-center text-[11px] text-muted-foreground">
                    {formatRelative(row.updated_at)}
                  </div>
                  <div
                    className="md:flex md:items-center justify-end"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="rounded-md p-2 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuItem onClick={() => navigate(`/admin/businesses/${row.id}/edit`)}>
                          <Pencil className="h-3.5 w-3.5 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/buyer/business/${row.id}`)}>
                          <Eye className="h-3.5 w-3.5 mr-2" /> Preview buyer view
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => navigate(`/admin/businesses/${row.id}?tab=buyer-access`)}
                        >
                          <Users className="h-3.5 w-3.5 mr-2" /> Manage buyers
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => navigate(`/admin/businesses/${row.id}?tab=documents`)}
                        >
                          <Upload className="h-3.5 w-3.5 mr-2" /> Upload documents
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onPublishToggle(row)}>
                          <Globe2 className="h-3.5 w-3.5 mr-2" />
                          {row.status === "published" ? "Unpublish" : "Publish"}
                        </DropdownMenuItem>
                        {row.status !== "archived" && (
                          <DropdownMenuItem
                            onClick={() => onArchive(row)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Archive className="h-3.5 w-3.5 mr-2" /> Archive
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
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

function locationDisplay(row: BusinessRow) {
  if (row.location_mode === "exact") {
    return row.address || [row.suburb, row.city].filter(Boolean).join(", ") || "—";
  }
  if (row.location_mode === "suburb") {
    return [row.suburb, row.city].filter(Boolean).join(", ") || row.region || "—";
  }
  return row.region || "Confidential";
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