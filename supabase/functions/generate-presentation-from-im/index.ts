import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { extractText, getDocumentProxy } from "https://esm.sh/unpdf@0.12.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an analyst building a draft buyer presentation from an Information Memorandum (IM) PDF.

ABSOLUTE RULES:
- Use ONLY the IM text and admin notes provided. Never invent figures, lease terms, staff numbers, dates, names, addresses, or business claims.
- If a number or fact is not clearly stated in the source, leave it null and add a note in "warnings".
- Preserve numbers exactly. Do not round, restate or reformat.
- Tone: confident, calm, premium. No marketing fluff, no emojis.
- When uncertain, prefer omission over invention. Add a warning.
- For confidentiality flags, list anything that could identify the business (exact addresses, owner names, signage, brand names) so the admin can review.

You must return a single tool call to "generate_presentation".`;

const TARGET_BLOCKS = [
  "hero",
  "business_overview",
  "key_highlights",
  "financial_snapshot",
  "lease_summary",
  "operations_staff",
  "growth_opportunities",
  "buyer_fit",
  "risks_due_diligence",
  "supporting_documents",
  "start_offer_discussion",
] as const;

interface RequestBody {
  import_id: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
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

    const body = (await req.json()) as RequestBody;
    if (!body?.import_id) return json({ error: "import_id required" }, 400);

    const { data: imp, error: impErr } = await admin
      .from("im_imports")
      .select("*")
      .eq("id", body.import_id)
      .single();
    if (impErr || !imp) return json({ error: "Import not found" }, 404);

    if (!LOVABLE_API_KEY) {
      const message =
        "AI is not configured for this workspace yet. Please add an AI key in backend settings.";
      await admin
        .from("im_imports")
        .update({ status: "failed", error_message: message })
        .eq("id", imp.id);
      return json({ error: message, ai_unavailable: true }, 503);
    }

    /* ---------- 1) Download + extract text ---------- */
    await admin.from("im_imports").update({ status: "extracting" }).eq("id", imp.id);

    const { data: file, error: dlErr } = await admin.storage
      .from("im-imports")
      .download(imp.storage_path);
    if (dlErr || !file) {
      const msg = `Could not read PDF: ${dlErr?.message ?? "unknown"}`;
      await admin
        .from("im_imports")
        .update({ status: "failed", error_message: msg })
        .eq("id", imp.id);
      return json({ error: msg }, 500);
    }

    const buf = new Uint8Array(await file.arrayBuffer());
    let extractedText = "";
    try {
      const pdf = await getDocumentProxy(buf);
      const { text } = await extractText(pdf, { mergePages: true });
      extractedText = (Array.isArray(text) ? text.join("\n\n") : text).trim();
    } catch (e) {
      console.error("PDF extraction failed", e);
      const msg = "Could not extract text from this PDF. It may be scanned or encrypted.";
      await admin
        .from("im_imports")
        .update({ status: "failed", error_message: msg })
        .eq("id", imp.id);
      return json({ error: msg }, 422);
    }

    if (!extractedText || extractedText.length < 200) {
      const msg =
        "The PDF appears to contain little or no extractable text (it may be scanned).";
      await admin
        .from("im_imports")
        .update({
          status: "failed",
          error_message: msg,
          extracted_text: extractedText,
        })
        .eq("id", imp.id);
      return json({ error: msg }, 422);
    }

    // Cap text to keep within model context comfortably
    const MAX_CHARS = 60_000;
    const trimmed = extractedText.slice(0, MAX_CHARS);

    await admin
      .from("im_imports")
      .update({ status: "generating", extracted_text: trimmed })
      .eq("id", imp.id);

    /* ---------- 2) Call Lovable AI with structured tool ---------- */
    const tools = [
      {
        type: "function",
        function: {
          name: "generate_presentation",
          description:
            "Return extracted business facts and a set of presentation blocks. Use null when information is missing.",
          parameters: {
            type: "object",
            properties: {
              facts: {
                type: "object",
                properties: {
                  business_name: { type: ["string", "null"] },
                  confidential_title: { type: ["string", "null"] },
                  business_type: { type: ["string", "null"] },
                  industry: { type: ["string", "null"] },
                  location: { type: ["string", "null"] },
                  asking_price: { type: ["string", "null"] },
                  revenue: { type: ["string", "null"] },
                  weekly_sales: { type: ["string", "null"] },
                  profit: { type: ["string", "null"] },
                  rent: { type: ["string", "null"] },
                  lease_terms: { type: ["string", "null"] },
                  staff_structure: { type: ["string", "null"] },
                  owner_involvement: { type: ["string", "null"] },
                  opening_hours: { type: ["string", "null"] },
                  key_strengths: {
                    type: "array",
                    items: { type: "string" },
                  },
                  growth_opportunities: {
                    type: "array",
                    items: { type: "string" },
                  },
                  buyer_fit: {
                    type: "array",
                    items: { type: "string" },
                  },
                  risks: {
                    type: "array",
                    items: { type: "string" },
                  },
                  due_diligence_notes: {
                    type: "array",
                    items: { type: "string" },
                  },
                },
                required: [
                  "key_strengths",
                  "growth_opportunities",
                  "buyer_fit",
                  "risks",
                  "due_diligence_notes",
                ],
                additionalProperties: false,
              },
              blocks: {
                type: "array",
                description:
                  "Presentation blocks in display order. Each must use one of the allowed section_type values.",
                items: {
                  type: "object",
                  properties: {
                    section_type: {
                      type: "string",
                      enum: TARGET_BLOCKS as unknown as string[],
                    },
                    title: { type: ["string", "null"] },
                    subtitle: { type: ["string", "null"] },
                    body: { type: ["string", "null"] },
                    key_points: {
                      type: "array",
                      items: { type: "string" },
                    },
                  },
                  required: ["section_type", "key_points"],
                  additionalProperties: false,
                },
              },
              warnings: {
                type: "array",
                description:
                  "Missing facts, uncertain numbers, or anything the admin should verify.",
                items: { type: "string" },
              },
              confidentiality_flags: {
                type: "array",
                description:
                  "Details in the PDF that could identify the business and may need redaction (e.g. exact address, owner names, signage).",
                items: { type: "string" },
              },
            },
            required: ["facts", "blocks", "warnings", "confidentiality_flags"],
            additionalProperties: false,
          },
        },
      },
    ];

    const userPrompt = `BUSINESS_ID: ${imp.business_id}

ADMIN_NOTES:
${imp.admin_notes ?? "(none provided)"}

IM_PDF_TEXT (verbatim, may be partial):
"""
${trimmed}
"""

Build the draft presentation now. Cover all of these block types in order: ${TARGET_BLOCKS.join(", ")}. For interactive blocks (supporting_documents, start_offer_discussion), keep the body short — they will render as their own components.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "generate_presentation" } },
      }),
    });

    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("AI gateway error", aiResp.status, t);
      let msg = "AI request failed";
      if (aiResp.status === 429) msg = "Rate limit exceeded. Please try again shortly.";
      if (aiResp.status === 402)
        msg = "AI credits exhausted. Add credits in workspace settings.";
      await admin
        .from("im_imports")
        .update({ status: "failed", error_message: msg })
        .eq("id", imp.id);
      return json({ error: msg }, aiResp.status);
    }

    const aiJson = await aiResp.json();
    const toolCall = aiJson.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      console.error("AI response missing tool_calls", JSON.stringify(aiJson).slice(0, 2000));
      const msg = "AI did not return a structured response";
      await admin
        .from("im_imports")
        .update({ status: "failed", error_message: msg })
        .eq("id", imp.id);
      return json({ error: msg }, 500);
    }

    let parsed: {
      facts: Record<string, unknown>;
      blocks: Array<{
        section_type: string;
        title?: string | null;
        subtitle?: string | null;
        body?: string | null;
        key_points?: string[];
      }>;
      warnings: string[];
      confidentiality_flags: string[];
    };
    try {
      const args = toolCall.function?.arguments ?? toolCall.arguments;
      parsed = typeof args === "string" ? JSON.parse(args) : args;
      if (!parsed || typeof parsed !== "object") throw new Error("empty");
      if (!Array.isArray(parsed.blocks)) parsed.blocks = [];
      if (!Array.isArray(parsed.warnings)) parsed.warnings = [];
      if (!Array.isArray(parsed.confidentiality_flags)) parsed.confidentiality_flags = [];
      if (!parsed.facts || typeof parsed.facts !== "object")
        parsed.facts = {} as Record<string, unknown>;
    } catch (parseErr) {
      console.error("AI tool args parse failed", parseErr, toolCall);
      const msg = "AI response was not valid JSON";
      await admin
        .from("im_imports")
        .update({ status: "failed", error_message: msg })
        .eq("id", imp.id);
      return json({ error: msg }, 500);
    }

    const allWarnings = [
      ...(parsed.warnings ?? []),
      ...(parsed.confidentiality_flags ?? []).map((f) => `Confidentiality: ${f}`),
    ];

    await admin
      .from("im_imports")
      .update({
        status: "ready_for_review",
        extracted_facts: parsed.facts,
        generated_blocks: parsed.blocks,
        warnings: allWarnings,
      })
      .eq("id", imp.id);

    return json({
      import_id: imp.id,
      facts: parsed.facts,
      blocks: parsed.blocks,
      warnings: parsed.warnings,
      confidentiality_flags: parsed.confidentiality_flags,
    });
  } catch (e) {
    console.error(e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});