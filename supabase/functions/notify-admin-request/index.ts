// Edge function: notify-admin-request
//
// Placeholder notification service for new buyer requests.
// Today: logs the payload and records the intended notification, so the
// admin inbox is the single source of truth.
// Tomorrow: wire Resend (or another email provider) here without changing
// the client-side contract.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Payload {
  request_id: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as Payload;
    if (!body?.request_id || typeof body.request_id !== "string") {
      return new Response(
        JSON.stringify({ error: "request_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    // Validate request exists. Service role bypasses RLS.
    const { data: request, error } = await admin
      .from("buyer_requests")
      .select(
        "id, request_type, priority, status, message, created_at, buyer_id, business_id"
      )
      .eq("id", body.request_id)
      .maybeSingle();

    if (error || !request) {
      return new Response(
        JSON.stringify({ error: "Request not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const [{ data: buyer }, { data: business }] = await Promise.all([
      admin.from("profiles").select("email, full_name, first_name, last_name").eq("id", request.buyer_id).maybeSingle(),
      admin.from("businesses").select("name, public_title").eq("id", request.business_id).maybeSingle(),
    ]);

    const resendKey = Deno.env.get("RESEND_API_KEY");
    const adminEmail = Deno.env.get("ADMIN_NOTIFICATION_EMAIL");

    // Log the notification intent — visible in edge function logs.
    console.log("[notify-admin-request]", {
      request_id: request.id,
      type: request.request_type,
      priority: request.priority,
      buyer: buyer?.email,
      business: business?.public_title || business?.name,
      delivery: resendKey && adminEmail ? "resend (not yet wired)" : "logged-only",
    });

    // Resend wiring intentionally left unimplemented until the API key is
    // approved. The structure below is the seam where it will plug in.
    //
    // if (resendKey && adminEmail) {
    //   await fetch("https://api.resend.com/emails", {
    //     method: "POST",
    //     headers: {
    //       Authorization: `Bearer ${resendKey}`,
    //       "Content-Type": "application/json",
    //     },
    //     body: JSON.stringify({
    //       from: "Lumi <noreply@lumi.nz>",
    //       to: adminEmail,
    //       subject: `New ${request.priority === "high" ? "high-priority " : ""}buyer request`,
    //       text: buildEmailBody(request, buyer, business),
    //     }),
    //   });
    // }

    return new Response(
      JSON.stringify({ ok: true, delivered: false, logged: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("[notify-admin-request] error", e);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});