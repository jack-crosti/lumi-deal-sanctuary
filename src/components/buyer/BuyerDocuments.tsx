import { useEffect, useState } from "react";
import { Eye, Download, Lock, FileText, Loader2, Send, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { formatRelative } from "@/lib/format";
import {
  documentTypeLabel,
  formatBytes,
  type DocumentType,
  type DocumentAvailability,
} from "@/lib/documentLabels";
import { accessLevelLabel, type AccessLevel } from "@/lib/buyerLabels";

const BUCKET = "business-documents";

interface BuyerDoc {
  id: string;
  business_id: string;
  title: string;
  doc_type: DocumentType;
  storage_path: string | null;
  mime_type: string | null;
  file_size: number | null;
  availability: DocumentAvailability;
  required_access_level: AccessLevel;
  download_allowed: boolean;
  created_at: string;
}

export default function BuyerDocuments({ businessId }: { businessId: string }) {
  const { user } = useAuth();
  const [docs, setDocs] = useState<BuyerDoc[]>([]);
  const [requested, setRequested] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("documents")
      .select(
        "id, business_id, title, doc_type, storage_path, mime_type, file_size, availability, required_access_level, download_allowed, created_at"
      )
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });
    if (error) {
      toast.error(error.message);
      setDocs([]);
    } else {
      setDocs((data ?? []) as BuyerDoc[]);
    }

    if (user?.id) {
      const { data: reqs } = await supabase
        .from("buyer_requests")
        .select("message, status, business_id")
        .eq("buyer_id", user.id)
        .eq("business_id", businessId)
        .eq("request_type", "document_access");
      if (reqs) {
        const ids = new Set<string>();
        for (const r of reqs) {
          // We encode the document id as the message prefix "doc:<id>|"
          const m = (r.message ?? "").match(/^doc:([0-9a-f-]{36})\|/i);
          if (m && r.status !== "closed") ids.add(m[1]);
        }
        setRequested(ids);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId, user?.id]);

  const trackActivity = async (
    eventType: "document_view" | "document_download" | "document_access_request",
    docId: string
  ) => {
    if (!user?.id) return;
    await supabase.from("buyer_activity").insert({
      buyer_id: user.id,
      business_id: businessId,
      event_type: eventType,
      metadata: { document_id: docId },
    });
  };

  const openDoc = async (d: BuyerDoc, mode: "view" | "download") => {
    if (!d.storage_path) return toast.error("File not available");
    if (mode === "download" && !d.download_allowed) {
      return toast.error("This document is view only");
    }
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(
        d.storage_path,
        60 * 5,
        mode === "download" ? { download: d.title } : undefined
      );
    if (error || !data?.signedUrl) {
      return toast.error(error?.message || "Could not generate secure link");
    }
    void trackActivity(mode === "download" ? "document_download" : "document_view", d.id);
    window.open(data.signedUrl, "_blank", "noopener");
  };

  const requestAccess = async (d: BuyerDoc) => {
    if (!user?.id) return;
    const message = `doc:${d.id}|Request access to "${d.title}"`;
    const { error } = await supabase.from("buyer_requests").insert({
      buyer_id: user.id,
      business_id: businessId,
      request_type: "document_access",
      message,
    });
    if (error) return toast.error(error.message);
    void trackActivity("document_access_request", d.id);
    setRequested((s) => new Set(s).add(d.id));
    toast.success("Access requested. The broker will review and follow up.");
  };

  return (
    <section className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <div className="font-mono-brand text-[10px] tracking-eyebrow uppercase text-primary mb-1">
            <span className="inline-block h-px w-6 bg-primary align-middle mr-3" />
            Supporting documents
          </div>
          <h2 className="text-xl font-medium">Confidential file room</h2>
        </div>
      </div>

      {loading ? (
        <div className="lumi-card p-12 text-center text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
          Loading documents…
        </div>
      ) : docs.length === 0 ? (
        <div className="lumi-card p-12 text-center text-sm text-muted-foreground">
          No documents are available to you yet. Your broker will release files as your access progresses.
        </div>
      ) : (
        <ul className="lumi-card p-0 overflow-hidden divide-y hairline">
          {docs.map((d) => (
            <li key={d.id} className="px-6 py-5 flex items-start gap-4">
              <div className="mt-1 h-10 w-10 rounded-sm border hairline flex items-center justify-center text-muted-foreground">
                <FileText className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{d.title}</div>
                <div className="mt-1 flex items-center gap-3 flex-wrap text-[11px] text-muted-foreground">
                  <span>{documentTypeLabel(d.doc_type)}</span>
                  <span>·</span>
                  <span>{formatBytes(d.file_size)}</span>
                  <span>·</span>
                  <span>Released {formatRelative(d.created_at)}</span>
                  {d.availability === "requires_approval" && (
                    <span className="inline-flex items-center gap-1 text-amber-600">
                      <Lock className="h-3 w-3" />
                      Requires {accessLevelLabel(d.required_access_level)} approval
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {d.availability === "requires_approval" ? (
                  requested.has(d.id) ? (
                    <span className="inline-flex items-center gap-2 text-[11px] text-primary">
                      <Check className="h-3.5 w-3.5" />
                      Requested
                    </span>
                  ) : (
                    <button onClick={() => requestAccess(d)} className="lumi-btn-primary">
                      <Send className="h-3.5 w-3.5" />
                      Request access
                    </button>
                  )
                ) : (
                  <>
                    <button onClick={() => openDoc(d, "view")} className="lumi-btn-ghost" title="View">
                      <Eye className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">View</span>
                    </button>
                    {d.download_allowed && (
                      <button onClick={() => openDoc(d, "download")} className="lumi-btn-ghost" title="Download">
                        <Download className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Download</span>
                      </button>
                    )}
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}