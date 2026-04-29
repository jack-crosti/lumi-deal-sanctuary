import type { ActivityEvent } from "./activity";

/**
 * Per-event score weights. A given event may fire many times for the same
 * buyer/business — to avoid runaway scores we apply each weight at most once
 * unless explicitly marked as repeatable.
 */
export const EVENT_WEIGHTS: Record<ActivityEvent, number> = {
  login: 5,
  dashboard_view: 0, // counted via `login` & per-business activity
  business_view: 10,
  hero_view: 0, // implicit in business_view
  im_view: 10,
  financial_view: 20,
  location_view: 0, // tracked but not scored
  lease_view: 15,
  documents_section_view: 0, // tracked but not scored
  document_view: 5,
  document_download: 20,
  document_access_request: 20,
  question_submitted: 25,
  request_submitted: 0, // priced via type below (call vs general)
  call_request: 30,
  offer_started: 40,
  offer_submitted: 60,
  return_visit: 15,
};

/** Events whose score we apply once-per-buyer-per-business, even if logged multiple times. */
const ONCE_PER_BUSINESS: ReadonlySet<ActivityEvent> = new Set([
  "business_view",
  "im_view",
  "financial_view",
  "lease_view",
  "offer_submitted",
]);

export interface ActivityRow {
  id: string;
  created_at: string;
  event_type: string;
  business_id: string | null;
  buyer_id: string;
  metadata: Record<string, unknown> | null;
}

export interface IntentBreakdown {
  score: number;
  visits: number;
  contributions: { event: string; points: number; count: number }[];
  lastEventAt: string | null;
  // counts for rules
  financialViews: number;
  leaseDownloads: number;
  offerStarted: boolean;
  offerSubmitted: boolean;
  callRequested: boolean;
  questionsAsked: number;
}

/**
 * Compute an intent score for a buyer (optionally filtered to one business).
 */
export function computeIntentScore(
  events: ActivityRow[],
  filterBusinessId?: string | null,
): IntentBreakdown {
  const filtered = filterBusinessId
    ? events.filter((e) => e.business_id === filterBusinessId)
    : events;

  // Count business visits (distinct day per business helps detect "returned")
  const visitsPerBusiness = new Map<string, Set<string>>();
  filtered.forEach((e) => {
    if (e.event_type === "business_view" && e.business_id) {
      const day = new Date(e.created_at).toISOString().slice(0, 10);
      const set = visitsPerBusiness.get(e.business_id) ?? new Set();
      set.add(day);
      visitsPerBusiness.set(e.business_id, set);
    }
  });
  const totalDistinctVisits = Array.from(visitsPerBusiness.values()).reduce(
    (a, s) => a + s.size,
    0,
  );

  // First-pass: for "ONCE_PER_BUSINESS" events we only score the first per business.
  const seenOnce = new Set<string>();
  const counts: Record<string, number> = {};
  let score = 0;

  filtered.forEach((e) => {
    counts[e.event_type] = (counts[e.event_type] ?? 0) + 1;
    const w = EVENT_WEIGHTS[e.event_type as ActivityEvent] ?? 0;
    if (w === 0) return;
    if (ONCE_PER_BUSINESS.has(e.event_type as ActivityEvent)) {
      const key = `${e.event_type}:${e.business_id ?? "_"}`;
      if (seenOnce.has(key)) return;
      seenOnce.add(key);
    }
    score += w;
  });

  // Bonus: returned more than once (per business). +15 each repeat business.
  let returnBonus = 0;
  visitsPerBusiness.forEach((days) => {
    if (days.size > 1) returnBonus += EVENT_WEIGHTS.return_visit;
  });
  score += returnBonus;

  const contributions = Object.entries(counts)
    .map(([event, count]) => ({
      event,
      count,
      points:
        ONCE_PER_BUSINESS.has(event as ActivityEvent)
          ? Math.min(count, visitsPerBusiness.size || 1) *
            (EVENT_WEIGHTS[event as ActivityEvent] ?? 0)
          : count * (EVENT_WEIGHTS[event as ActivityEvent] ?? 0),
    }))
    .filter((c) => c.points > 0)
    .sort((a, b) => b.points - a.points);

  const lastEventAt =
    filtered.length > 0
      ? filtered.reduce(
          (acc, e) => (e.created_at > acc ? e.created_at : acc),
          filtered[0].created_at,
        )
      : null;

  return {
    score,
    visits: totalDistinctVisits,
    contributions,
    lastEventAt,
    financialViews: counts.financial_view ?? 0,
    leaseDownloads: filtered.filter(
      (e) =>
        e.event_type === "document_download" &&
        ((e.metadata?.doc_type as string) ?? "").toLowerCase().includes("lease"),
    ).length,
    offerStarted: (counts.offer_started ?? 0) > 0,
    offerSubmitted: (counts.offer_submitted ?? 0) > 0,
    callRequested:
      (counts.call_request ?? 0) > 0 ||
      filtered.some(
        (e) =>
          e.event_type === "request_submitted" &&
          ((e.metadata?.preferred_contact as string) ?? "") === "phone",
      ),
    questionsAsked: counts.question_submitted ?? 0,
  };
}

export type IntentTier = "cold" | "warm" | "hot" | "very_hot";

export const intentTier = (score: number): IntentTier => {
  if (score >= 120) return "very_hot";
  if (score >= 60) return "hot";
  if (score >= 25) return "warm";
  return "cold";
};

export const intentTierLabel = (t: IntentTier): string => {
  switch (t) {
    case "very_hot":
      return "Very hot";
    case "hot":
      return "Hot";
    case "warm":
      return "Warm";
    case "cold":
      return "Cold";
  }
};

export const intentTierTone = (t: IntentTier): string => {
  switch (t) {
    case "very_hot":
      return "bg-rose-500/15 text-rose-300 border-rose-500/40";
    case "hot":
      return "bg-amber-500/15 text-amber-300 border-amber-500/40";
    case "warm":
      return "bg-primary/10 text-primary border-primary/30";
    case "cold":
      return "bg-muted text-muted-foreground border-border";
  }
};

/**
 * Rule-based suggested next action for a buyer (or buyer × business).
 */
export function suggestedNextAction(b: IntentBreakdown): string {
  if (b.offerSubmitted) {
    return "Reply within 24h. Confirm receipt and book a follow-up call.";
  }
  if (b.offerStarted) {
    return "Call buyer and ask what held them back from submitting.";
  }
  if (b.callRequested) {
    return "Schedule the call they asked for — within one business day.";
  }
  if (b.leaseDownloads > 0) {
    return "Ask whether they want to discuss lease terms.";
  }
  if (b.financialViews > 2) {
    return "Follow up about the financials.";
  }
  if (b.questionsAsked > 0) {
    return "Reply to their question and offer a 15-min call.";
  }
  if (b.visits >= 2) {
    return "Buyer has returned. Send a personal note and offer a tour.";
  }
  if (b.score >= 25) {
    return "Send the next-tier document pack to keep momentum.";
  }
  if (b.score === 0) {
    return "Encourage first visit — confirm credentials and resend the link.";
  }
  return "Keep nurturing — share a relevant insight or update.";
}