import { useEffect, useState } from "react";
import { PageHeader, PlaceholderPanel } from "@/components/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { IntentScorePill } from "@/components/admin/IntentScore";
import { computeIntentScore, type ActivityRow } from "@/lib/intentScore";

export default function BuyerProfile() {
  const { user } = useAuth();
  const [score, setScore] = useState<number | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const { data } = await supabase
        .from("buyer_activity")
        .select("id, created_at, event_type, business_id, buyer_id, metadata")
        .eq("buyer_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1000);
      const list = (data ?? []) as unknown as ActivityRow[];
      setScore(computeIntentScore(list).score);
    })();
  }, [user?.id]);

  return (
    <>
      <PageHeader
        eyebrow="Your details"
        title="Profile"
        description={`Signed in as ${user?.email}.`}
        actions={score !== null ? <IntentScorePill score={score} /> : undefined}
      />
      <PlaceholderPanel
        title="Profile editor coming next"
        body="Update your full name, company, phone and notification preferences. Your broker uses this to verify your identity."
      />
    </>
  );
}