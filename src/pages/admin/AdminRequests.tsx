import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Loader2,
  MessageSquare,
  ArrowUpRight,
  AlertTriangle,
  Inbox,
  Search,
  Building2,
  User,
  Clock,
  Phone,
  Mail,
} from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  REQUEST_STATUS_OPTIONS,
  contactMethodLabel,
  requestStatusLabel,
  requestTypeLabel,
  statusTone,
  type RequestStatus,
} from "@/lib/requestLabels";

interface AdminRequestRow {
  id: string;
  created_at: string;
  request_type: string;
  status: string;
  message: string | null;
  priority: string | null;
  preferred_contact: string | null;
  preferred_call_time: string | null;
  buyer_id: string;
  business_id: string;
  buyer?: {
    id: string;
    full_name: string | null;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  } | null;
  business?: {
    id: string;
    name: string;
    public_title: string | null;
  } | null;
}

const STATUS_FILTERS: { value: "all" | RequestStatus; label: string }[] = [
  { value: "all", label: "All" },
  ...REQUEST_STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
];

export default function AdminRequests() {
  const [rows, setRows] = useState<AdminRequestRow[] | null>(null);
  const [filter, setFilter] = useState<"all" | RequestStatus>("all");
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    const { data, error } = await supabase
      .from("buyer_requests")
      .select(
        "id, created_at, request_type, status, message, priority, preferred_contact, preferred_call_time, buyer_id, business_id"
      )
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      toast.error(error.message);
      setRows([]);
      return;
    }
    const requests = (data ?? []) as unknown as AdminRequestRow[];

    if (requests.length === 0) {
      setRows([]);
      return;
    }

    const buyerIds = Array.from(new Set(requests.map((r) => r.buyer_id)));
    const businessIds = Array.from(new Set(requests.map((r) => r.business_id)));

    const [{ data: buyers }, { data: businesses }] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, first_name, last_name, email")
        .in("id", buyerIds),
      supabase.from("businesses").select("id, name, public_title").in("id", businessIds),
    ]);

    const buyerMap = new Map((buyers ?? []).map((b) => [b.id, b]));
    const businessMap = new Map((businesses ?? []).map((b) => [b.id, b]));

    setRows(
      requests.map((r) => ({
        ...r,
        buyer: buyerMap.get(r.buyer_id) ?? null,
        business: businessMap.get(r.business_id) ?? null,
      }))
    );
  };

  useEffect(() => {
    void load();
  }, []);

  const updateStatus = async (id: string, status: RequestStatus) => {
    setBusyId(id);
    const update: Record<string, unknown> = { status };
    if (status === "closed" || status === "replied") {
      update.resolved_at = new Date().toISOString();
    }
    // Cast to unknown so TS accepts new enum values until types regenerate
    const { error } = await supabase
      .from("buyer_requests")
      .update(update as never)
      .eq("id", id);
    setBusyId(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Marked ${requestStatusLabel(status).toLowerCase()}.`);
    setRows((prev) =>
      prev ? prev.map((r) => (r.id === id ? { ...r, status } : r)) : prev
    );
  };

  const filtered = useMemo(() => {
    if (!rows) return null;
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter !== "all" && r.status !== filter) return false;
      if (!q) return true;
      const blob = [
        r.buyer?.full_name,
        r.buyer?.first_name,
        r.buyer?.last_name,
        r.buyer?.email,
        r.business?.public_title,
        r.business?.name,
        r.message,
        requestTypeLabel(r.request_type),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return blob.includes(q);
    });
  }, [rows, filter, query]);

  const counts = useMemo(() => {
    const out: Record<string, number> = { all: rows?.length ?? 0 };
    rows?.forEach((r) => {
      out[r.status] = (out[r.status] ?? 0) + 1;
    });
    return out;
  }, [rows]);

  return (
    <>
      <PageHeader
        eyebrow="Inbox"
        title="Buyer requests"
        description="Triage incoming buyer requests — questions, document access, call and meeting requests, due diligence."
      />

      {/* Filters + search */}
      <div className="mb-8 flex flex-col lg:flex-row lg:items-center gap-4 justify-between animate-rise">
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((f) => {
            const active = filter === f.value;
            const count = counts[f.value] ?? 0;
            return (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`px-4 py-2 rounded-full font-mono-brand text-[10px] tracking-eyebrow uppercase border transition-all duration-300 ${
                  active
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-hairline-strong text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                }`}
              >
                {f.label}
                {count > 0 && (
                  <span className="ml-2 text-[9px] opacity-70 tabular-nums">{count}</span>
                )}
              </button>
            );
          })}
        </div>
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search buyer, business or message…"
            className="lumi-input pl-9 text-sm"
          />
        </div>
      </div>

      {/* Body */}
      {filtered === null ? (
        <div className="lumi-card p-12 text-center text-sm text-muted-foreground flex items-center justify-center gap-3">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading requests…
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState hasAny={(rows?.length ?? 0) > 0} />
      ) : (
        <div className="space-y-4">
          {filtered.map((r) => (
            <RequestCard
              key={r.id}
              r={r}
              busy={busyId === r.id}
              onUpdateStatus={updateStatus}
            />
          ))}
        </div>
      )}
    </>
  );
}

/* ---------- atoms ---------- */

function EmptyState({ hasAny }: { hasAny: boolean }) {
  return (
    <div className="lumi-card-elevated p-16 text-center overflow-hidden relative">
      <div className="absolute inset-0 bg-radiance opacity-30 pointer-events-none" />
      <div className="relative">
        <Inbox className="h-6 w-6 text-primary mx-auto mb-6" strokeWidth={1.25} />
        <div className="font-mono-brand text-[10px] tracking-eyebrow uppercase text-primary mb-3">
          {hasAny ? "Nothing matches" : "Inbox is clear"}
        </div>
        <h3 className="font-display text-2xl md:text-3xl tracking-display mb-2">
          {hasAny ? "Try a different filter or search." : "No buyer requests yet."}
        </h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto leading-[1.7]">
          {hasAny
            ? "Adjust the filter chips above or clear the search to see all requests."
            : "When a buyer submits a question or document request, it lands here for triage."}
        </p>
      </div>
    </div>
  );
}

function RequestCard({
  r,
  busy,
  onUpdateStatus,
}: {
  r: AdminRequestRow;
  busy: boolean;
  onUpdateStatus: (id: string, status: RequestStatus) => void;
}) {
  const buyerName =
    r.buyer?.full_name ||
    [r.buyer?.first_name, r.buyer?.last_name].filter(Boolean).join(" ") ||
    r.buyer?.email ||
    "Unknown buyer";

  const businessName = r.business?.public_title || r.business?.name || "Unknown business";
  const isHigh = r.priority === "high";
  const date = new Date(r.created_at).toLocaleDateString("en-NZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const time = new Date(r.created_at).toLocaleTimeString("en-NZ", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <article
      className={`lumi-card p-6 md:p-8 transition-all duration-300 ${
        isHigh ? "border-l-2 border-l-primary" : ""
      }`}
    >
      <div className="flex flex-col lg:flex-row lg:items-start gap-6">
        {/* Left — meta */}
        <div className="lg:w-64 shrink-0 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <StatusPill status={r.status} />
            {isHigh && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full font-mono-brand text-[9px] tracking-eyebrow uppercase border border-primary/50 bg-primary/15 text-primary">
                <AlertTriangle className="h-3 w-3" /> High
              </span>
            )}
          </div>
          <div>
            <div className="font-mono-brand text-[9px] tracking-eyebrow uppercase text-muted-foreground mb-1">
              {requestTypeLabel(r.request_type)}
            </div>
            <div className="font-display text-xl tracking-display leading-tight">
              {buyerName}
            </div>
            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
              <Building2 className="h-3 w-3" />
              <span className="truncate">{businessName}</span>
            </div>
          </div>
          <div className="font-mono-brand text-[9px] tracking-eyebrow uppercase text-muted-foreground flex items-center gap-1.5">
            <Clock className="h-3 w-3" />
            {date} · {time}
          </div>
        </div>

        {/* Right — content */}
        <div className="flex-1 min-w-0">
          {r.message ? (
            <p className="text-sm md:text-base text-foreground/90 leading-[1.7] line-clamp-3">
              {r.message}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground italic">No message provided.</p>
          )}

          {/* Contact preferences */}
          {(r.preferred_contact || r.preferred_call_time) && (
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono-brand text-[9px] tracking-eyebrow uppercase text-muted-foreground">
              {r.preferred_contact && (
                <span className="inline-flex items-center gap-1.5">
                  {r.preferred_contact === "phone" ? (
                    <Phone className="h-3 w-3" />
                  ) : (
                    <Mail className="h-3 w-3" />
                  )}
                  {contactMethodLabel(r.preferred_contact)}
                </span>
              )}
              {r.preferred_call_time && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3 w-3" />
                  {r.preferred_call_time}
                </span>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <Link
              to={`/admin/buyers/${r.buyer_id}`}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md font-mono-brand text-[10px] tracking-eyebrow uppercase border border-hairline-strong text-foreground/85 hover:border-primary/50 hover:text-primary transition-colors"
            >
              <User className="h-3 w-3" />
              View buyer
            </Link>
            <Link
              to={`/admin/businesses/${r.business_id}`}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md font-mono-brand text-[10px] tracking-eyebrow uppercase border border-hairline-strong text-foreground/85 hover:border-primary/50 hover:text-primary transition-colors"
            >
              <ArrowUpRight className="h-3 w-3" />
              View business
            </Link>

            <div className="flex-1" />

            {/* Status quick actions */}
            {r.status !== "in_progress" && r.status !== "closed" && (
              <button
                disabled={busy}
                onClick={() => onUpdateStatus(r.id, "in_progress")}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-md font-mono-brand text-[10px] tracking-eyebrow uppercase border border-hairline-strong text-foreground/85 hover:border-primary/50 hover:text-primary transition-colors disabled:opacity-40"
              >
                <MessageSquare className="h-3 w-3" />
                Mark in progress
              </button>
            )}
            {r.status !== "closed" && (
              <button
                disabled={busy}
                onClick={() => onUpdateStatus(r.id, "closed")}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-md font-mono-brand text-[10px] tracking-eyebrow uppercase border border-hairline-strong text-muted-foreground hover:border-foreground/40 hover:text-foreground transition-colors disabled:opacity-40"
              >
                Mark closed
              </button>
            )}

            {/* Status select for full control */}
            <select
              value={r.status}
              disabled={busy}
              onChange={(e) => onUpdateStatus(r.id, e.target.value as RequestStatus)}
              className="lumi-input !py-2 !px-3 text-xs w-auto disabled:opacity-40"
              aria-label="Change status"
            >
              {REQUEST_STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </article>
  );
}

function StatusPill({ status }: { status: string }) {
  const tone = statusTone(status);
  const cls =
    tone === "primary"
      ? "border-primary/50 bg-primary/15 text-primary"
      : tone === "warn"
      ? "border-amber-400/40 bg-amber-400/10 text-amber-300"
      : tone === "ok"
      ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
      : "border-hairline-strong text-muted-foreground";
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono-brand text-[9px] tracking-eyebrow uppercase border ${cls}`}
    >
      <span className={`size-1.5 rounded-full ${tone === "primary" ? "bg-primary animate-shimmer" : "bg-current"}`} />
      {requestStatusLabel(status)}
    </span>
  );
}