import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an editor for a private business-for-sale presentation.

STRICT RULES:
- You may only use information that appears in the provided block, business data, or broker notes.
- Never invent or estimate financial figures, revenue, profit, EBITDA, rent, lease terms, staff numbers, dates, or business claims.
- If the admin asks for something the source data does not support, say what is missing in the "warnings" array and leave that detail out of the revised text.
- Keep tone confident, calm, and premium. No marketing fluff. No emojis.
- Preserve factual numbers exactly as given. Do not round or rephrase numerical values.
- If the instruction is to hide identifying details, remove names, exact addresses, and obvious identifiers.
- Output must use the revise_block tool. Only fill fields you are confident about. Use null for fields you should not change.
- key_points should be short, punchy lines (max ~12 words each). Max 6 items.
`;

interface BlockInput {
  id: string;
  section_type: string;
  title: string | null;
  subtitle: string | null;
  body: string | null;
  key_points: string[];
}

interface RequestBody {
  request_id: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) {
      return json({ error: "Not authenticated" }, 401);
    }

    // Auth client (verify caller is admin)
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
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
    if (!body?.request_id) return json({ error: "request_id required" }, 400);

    // Load the AI edit request
    const { data: reqRow, error: reqErr } = await admin
      .from("ai_edit_requests")
      .select("*")
      .eq("id", body.request_id)
      .single();
    if (reqErr || !reqRow) return json({ error: "Request not found" }, 404);

    // Mark processing
    await admin
      .from("ai_edit_requests")
      .update({ status: "processing" })
      .eq("id", reqRow.id);

    // Load business + target block + broker notes
    const { data: business } = await admin
      .from("businesses")
      .select(
        "id,name,public_title,confidential_title,headline,summary,industry,business_type,suburb,region,city,location_mode,broker_notes",
      )
      .eq("id", reqRow.business_id)
      .single();

    let block: BlockInput | null = null;
    let allBlocks: BlockInput[] = [];

    if (reqRow.version_id) {
      const { data: blocks } = await admin
        .from("presentation_sections")
        .select("id,section_type,title,subtitle,body,key_points,position")
        .eq("version_id", reqRow.version_id)
        .order("position");
      allBlocks = (blocks ?? []) as BlockInput[];
      if (reqRow.target_block_id) {
        block = allBlocks.find((b) => b.id === reqRow.target_block_id) ?? null;
      }
    }

    if (!LOVABLE_API_KEY) {
      const message =
        "AI is not configured for this workspace yet. Please add an AI key in backend settings.";
      await admin
        .from("ai_edit_requests")
        .update({
          status: "failed",
          error_message: message,
          result_preview: message,
        })
        .eq("id", reqRow.id);
      return json({ error: message, ai_unavailable: true }, 503);
    }

    // Build user prompt
    const sourceContext = {
      business: business ?? {},
      target_block: block,
      other_blocks_summary: allBlocks
        .filter((b) => b.id !== block?.id)
        .map((b) => ({
          section_type: b.section_type,
          title: b.title,
          summary: (b.body ?? "").slice(0, 240),
        })),
      broker_notes: business?.broker_notes ?? null,
    };

    const userPrompt = block
      ? `Admin instruction: ${reqRow.instruction}

Revise the TARGET BLOCK below using only the provided source data.

SOURCE DATA (JSON):
${JSON.stringify(sourceContext, null, 2)}`
      : `Admin instruction: ${reqRow.instruction}

No specific block was selected. Suggest changes that apply to the whole presentation, but do not invent any business detail.

SOURCE DATA (JSON):
${JSON.stringify(sourceContext, null, 2)}`;

    const tools = [
      {
        type: "function",
        function: {
          name: "revise_block",
          description:
            "Return revised block content. Use null for fields that should not change. Add warnings for any uncertain or missing information.",
          parameters: {
            type: "object",
            properties: {
              title: { type: ["string", "null"] },
              subtitle: { type: ["string", "null"] },
              body: { type: ["string", "null"] },
              key_points: {
                type: ["array", "null"],
                items: { type: "string" },
              },
              summary_of_changes: { type: "string" },
              warnings: {
                type: "array",
                items: { type: "string" },
                description:
                  "List anything the AI was asked to do but could not verify, or details intentionally omitted.",
              },
            },
            required: ["summary_of_changes", "warnings"],
            additionalProperties: false,
          },
        },
      },
    ];

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "revise_block" } },
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
        .from("ai_edit_requests")
        .update({ status: "failed", error_message: msg, result_preview: msg })
        .eq("id", reqRow.id);
      return json({ error: msg }, aiResp.status);
    }

    const aiJson = await aiResp.json();
    const toolCall = aiJson.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      const msg = "AI did not return a structured response";
      await admin
        .from("ai_edit_requests")
        .update({ status: "failed", error_message: msg, result_preview: msg })
        .eq("id", reqRow.id);
      return json({ error: msg }, 500);
    }

    let parsed: {
      title?: string | null;
      subtitle?: string | null;
      body?: string | null;
      key_points?: string[] | null;
      summary_of_changes: string;
      warnings: string[];
    };
    try {
      parsed = JSON.parse(toolCall.function.arguments);
    } catch (e) {
      const msg = "AI response was not valid JSON";
      await admin
        .from("ai_edit_requests")
        .update({ status: "failed", error_message: msg, result_preview: msg })
        .eq("id", reqRow.id);
      return json({ error: msg }, 500);
    }

    // Save proposal
    const previewText = [
      parsed.summary_of_changes,
      parsed.warnings?.length ? `\n⚠ Warnings:\n- ${parsed.warnings.join("\n- ")}` : "",
    ].join("");

    await admin
      .from("ai_edit_requests")
      .update({
        status: "pending", // awaiting admin decision
        result_preview: previewText,
        proposal: parsed,
        warnings: parsed.warnings ?? [],
      })
      .eq("id", reqRow.id);

    return json({
      request_id: reqRow.id,
      proposal: parsed,
      target_block_id: reqRow.target_block_id,
    });
  } catch (e) {
    console.error(e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }

  function json(data: unknown, status = 200) {
    return new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});