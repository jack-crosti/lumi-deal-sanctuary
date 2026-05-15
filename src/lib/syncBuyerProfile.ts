import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type ClaimBuyerProfileResult = {
  profile_id: string;
  claimed_placeholder: boolean;
  transferred_access_count: number;
};

type ClaimBuyerProfileRpc = {
  rpc: (fn: "claim_pending_buyer_profile") => Promise<{
    data: ClaimBuyerProfileResult[] | null;
    error: { message: string } | null;
  }>;
};

type SyncResult = {
  ok: boolean;
  message?: string;
};

let inFlight: Promise<SyncResult> | null = null;

export async function syncBuyerProfileAccess(sessionOverride?: Session | null): Promise<SyncResult> {
  if (inFlight) return inFlight;

  inFlight = (async () => {
    const session = sessionOverride ?? (await supabase.auth.getSession()).data.session;
    if (!session?.user) return { ok: true };

    const { error } = await (supabase as unknown as ClaimBuyerProfileRpc).rpc(
      "claim_pending_buyer_profile",
    );

    if (error) {
      const message = error.message || "Buyer profile sync failed";
      console.warn("Buyer profile sync failed", message);
      return { ok: false, message };
    }

    return { ok: true };
  })().finally(() => {
    inFlight = null;
  });

  return inFlight;
}
