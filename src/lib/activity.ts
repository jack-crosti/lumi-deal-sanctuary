import { supabase } from "@/integrations/supabase/client";

export type ActivityEvent =
  | "login"
  | "dashboard_view"
  | "business_view"
  | "hero_view"
  | "im_view"
  | "financial_view"
  | "location_view"
  | "lease_view"
  | "documents_section_view"
  | "document_view"
  | "document_download"
  | "document_access_request"
  | "question_submitted"
  | "request_submitted"
  | "call_request"
  | "offer_started"
  | "offer_submitted"
  | "return_visit";

const detectDevice = (): string => {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent || "";
  if (/Mobi|Android|iPhone|iPod/i.test(ua)) return "mobile";
  if (/iPad|Tablet/i.test(ua)) return "tablet";
  return "desktop";
};

interface LogOptions {
  buyerId: string;
  businessId?: string | null;
  event: ActivityEvent;
  metadata?: Record<string, unknown>;
}

/**
 * Insert a buyer_activity row. Fire-and-forget — never blocks UX.
 * Errors are swallowed silently (RLS denials are expected for unauthenticated cases).
 */
export async function logActivity({
  buyerId,
  businessId,
  event,
  metadata,
}: LogOptions): Promise<void> {
  try {
    await supabase.from("buyer_activity").insert({
      buyer_id: buyerId,
      business_id: businessId ?? null,
      // Cast as never until types regenerate to cover newly-added enum values.
      event_type: event as never,
      metadata: (metadata ?? {}) as never,
      user_agent:
        typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 500) : null,
      device_type: detectDevice(),
    });
  } catch {
    // Silent — activity logging should never surface errors to the buyer.
  }
}

/**
 * Track the same event only once per page lifetime.
 * Use this for section-view events fired by IntersectionObserver.
 */
export function makeOnceTracker() {
  const fired = new Set<string>();
  return (key: string): boolean => {
    if (fired.has(key)) return false;
    fired.add(key);
    return true;
  };
}