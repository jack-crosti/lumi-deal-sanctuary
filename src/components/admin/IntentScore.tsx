import { Flame } from "lucide-react";
import {
  intentTier,
  intentTierLabel,
  intentTierTone,
  type IntentBreakdown,
} from "@/lib/intentScore";

export function IntentScorePill({ score }: { score: number }) {
  const tier = intentTier(score);
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border font-mono-brand text-[10px] tracking-eyebrow uppercase tabular-nums ${intentTierTone(tier)}`}
    >
      <Flame className="h-3 w-3" />
      {score} · {intentTierLabel(tier)}
    </span>
  );
}

export function IntentScoreCard({
  breakdown,
  suggestedAction,
  title = "Buyer intent",
}: {
  breakdown: IntentBreakdown;
  suggestedAction: string;
  title?: string;
}) {
  const tier = intentTier(breakdown.score);

  return (
    <div className="lumi-card p-6 md:p-8 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="font-mono-brand text-[10px] tracking-eyebrow uppercase text-muted-foreground mb-1">
            {title}
          </p>
          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="lumi-stat text-5xl md:text-6xl text-foreground">
              {breakdown.score}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border font-mono-brand text-[10px] tracking-eyebrow uppercase ${intentTierTone(tier)}`}
            >
              <Flame className="h-3 w-3" />
              {intentTierLabel(tier)}
            </span>
          </div>
        </div>
        <div className="text-right text-[11px] text-muted-foreground space-y-0.5">
          <div>
            <span className="text-foreground tabular-nums">{breakdown.visits}</span>{" "}
            distinct visits
          </div>
          {breakdown.lastEventAt && (
            <div>
              Last seen{" "}
              <span className="text-foreground">
                {new Date(breakdown.lastEventAt).toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-lg border hairline bg-card/40 p-4">
        <p className="font-mono-brand text-[9px] tracking-eyebrow uppercase text-primary mb-2">
          Suggested next action
        </p>
        <p className="text-sm md:text-base leading-[1.6]">{suggestedAction}</p>
      </div>

      {breakdown.contributions.length > 0 && (
        <div>
          <p className="font-mono-brand text-[9px] tracking-eyebrow uppercase text-muted-foreground mb-3">
            Score breakdown
          </p>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
            {breakdown.contributions.map((c) => (
              <li
                key={c.event}
                className="flex items-center justify-between gap-3 border-b hairline py-1.5"
              >
                <span className="text-muted-foreground">
                  {labelForEvent(c.event)}
                  {c.count > 1 && (
                    <span className="ml-1.5 text-[10px] text-muted-foreground/70 tabular-nums">
                      ×{c.count}
                    </span>
                  )}
                </span>
                <span className="text-foreground tabular-nums">+{c.points}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

const EVENT_LABELS: Record<string, string> = {
  login: "Logged in",
  dashboard_view: "Opened dashboard",
  business_view: "Opened business page",
  hero_view: "Viewed hero",
  im_view: "Viewed IM",
  financial_view: "Viewed financials",
  location_view: "Viewed location",
  lease_view: "Viewed lease summary",
  documents_section_view: "Browsed documents",
  document_view: "Viewed a document",
  document_download: "Downloaded a document",
  document_access_request: "Requested document access",
  question_submitted: "Asked a question",
  request_submitted: "Submitted a request",
  call_request: "Requested a call",
  offer_started: "Started offer form",
  offer_submitted: "Submitted offer discussion",
  return_visit: "Returned to a business",
};

export const labelForEvent = (e: string): string =>
  EVENT_LABELS[e] ?? e.replace(/_/g, " ");