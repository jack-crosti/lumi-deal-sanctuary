import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ALLOWED_SECTIONS = new Set([
  "hero",
  "business_overview",
  "key_highlights",
  "financial_snapshot",
  "lease_summary",
  "operations_staff",
  "growth_opportunities",
  "buyer_fit",
  "risks_dd",
  "supporting_documents",
  "start_offer_discussion",
]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) return json({ error: "Not authenticated" }, 401);

    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await userClient.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) return json({ error: "Not authenticated" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) return json({ error: "Admins only" }, 403);

    const { import_id } = (await req.json()) as { import_id: string };
    if (!import_id) return json({ error: "import_id required" }, 400);

    const { data: imp } = await admin
      .from("im_imports")
      .select("*")
      .eq("id", import_id)
      .single();
    if (!imp) return json({ error: "Import not found" }, 404);
    if (imp.status !== "ready_for_review")
      return json({ error: "Import is not ready for review" }, 409);
    if (!Array.isArray(imp.generated_blocks) || imp.generated_blocks.length === 0)
      return json({ error: "No generated blocks to apply" }, 400);

    // Determine next version number
    const { data: lastVersion } = await admin
      .from("presentation_versions")
      .select("version_number")
      .eq("business_id", imp.business_id)
      .order("version_number", { ascending: false })
      .limit(1)
      .maybeSingle();
    const nextNumber = (lastVersion?.version_number ?? 0) + 1;

    const { data: newVersion, error: vErr } = await admin
      .from("presentation_versions")
      .insert({
        business_id: imp.business_id,
        version_number: nextNumber,
        status: "draft",
        notes: `Generated from IM PDF (${imp.file_name ?? "upload"})`,
        created_by: userId,
      })
      .select("*")
      .single();
    if (vErr || !newVersion) return json({ error: vErr?.message ?? "Could not create version" }, 500);

    // Insert blocks
    type Gen = {
      section_type: string;
      title?: string | null;
      subtitle?: string | null;
      body?: string | null;
      key_points?: string[];
    };
    const rows = (imp.generated_blocks as Gen[])
      .filter((b) => ALLOWED_SECTIONS.has(b.section_type))
      .map((b, i) => ({
        version_id: newVersion.id,
        section_type: b.section_type,
        position: i * 10,
        title: b.title ?? null,
        subtitle: b.subtitle ?? null,
        body: b.body ?? null,
        key_points: Array.isArray(b.key_points) ? b.key_points : [],
        image_refs: [],
        visibility: "im",
        required_access_level: "im",
        is_hidden: false,
        review_status: "needs_review",
        content: {},
      }));

    if (rows.length === 0)
      return json({ error: "No valid blocks could be applied" }, 400);

    const { error: insErr } = await admin.from("presentation_sections").insert(rows);
    if (insErr) return json({ error: insErr.message }, 500);

    await admin
      .from("im_imports")
      .update({ status: "applied", draft_version_id: newVersion.id })
      .eq("id", imp.id);

    return json({
      version_id: newVersion.id,
      version_number: newVersion.version_number,
      block_count: rows.length,
    });
  } catch (e) {
    console.error(e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});