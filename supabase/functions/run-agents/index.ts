// NyayAI multi-agent orchestrator
// Pipeline: Translation -> Diagnosis -> Jurisdiction -> Aid -> Document
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3-flash-preview";

async function callAI(messages: any[], tools?: any[], toolChoice?: any) {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) throw new Error("LOVABLE_API_KEY missing");
  const body: any = { model: MODEL, messages };
  if (tools) { body.tools = tools; body.tool_choice = toolChoice; }
  const res = await fetch(AI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`AI gateway ${res.status}: ${txt}`);
  }
  return await res.json();
}

function extractTool(resp: any) {
  const msg = resp.choices?.[0]?.message;
  const call = msg?.tool_calls?.[0];
  if (call) return JSON.parse(call.function.arguments);
  // Fallback: try parsing raw content as JSON
  try { return JSON.parse(msg?.content || "{}"); } catch { return {}; }
}

// ----- Agent prompts -----
const SYSTEM_BASE = `You are part of NyayAI — a free legal aid AI helping ordinary Indians navigate the legal system.
Be empathetic, simple, accurate. Cite the correct Indian law when relevant.
NEVER invent phone numbers or officer names; use widely known public helplines only (e.g. 181, 100, 1098, 112, NALSA 15100).`;

const DIAGNOSIS_TOOL = {
  type: "function",
  function: {
    name: "diagnose_case",
    description: "Classify the citizen's legal problem into the Indian legal framework.",
    parameters: {
      type: "object",
      properties: {
        category: { type: "string", enum: ["consumer", "labour", "rti", "domestic_violence", "tenancy", "wage_theft", "police_complaint", "family", "criminal", "civil", "other"] },
        subcategory: { type: "string" },
        summary_en: { type: "string", description: "1-2 sentence neutral summary in English" },
        summary_hi: { type: "string", description: "Same summary in simple Hindi" },
        applicable_laws: { type: "array", items: { type: "string" }, description: "Indian acts/sections that apply" },
        urgency: { type: "string", enum: ["low", "normal", "high", "emergency"] },
        emergency_action: { type: "string", description: "Immediate safety action if emergency, else empty" },
        recommended_document: { type: "string", enum: ["rti_application", "consumer_complaint", "labour_notice", "dv_protection_application", "police_complaint", "legal_notice"] },
        next_steps: { type: "array", items: { type: "string" } },
      },
      required: ["category", "summary_en", "summary_hi", "applicable_laws", "urgency", "recommended_document", "next_steps"],
    },
  },
};

const JURISDICTION_TOOL = {
  type: "function",
  function: {
    name: "find_jurisdiction",
    description: "Identify the correct Indian authority/court to file at.",
    parameters: {
      type: "object",
      properties: {
        authority: { type: "string", description: "e.g. District Consumer Disputes Redressal Commission" },
        forum_level: { type: "string", enum: ["district", "state", "national", "tribunal", "police_station", "ngo"] },
        location_hint: { type: "string", description: "City/district where to file" },
        filing_steps: { type: "array", items: { type: "string" } },
        fees_inr: { type: "string", description: "Approx fees, or 'Free'" },
        timeline: { type: "string", description: "Typical resolution timeline" },
      },
      required: ["authority", "forum_level", "filing_steps"],
    },
  },
};

const AID_TOOL = {
  type: "function",
  function: {
    name: "find_legal_aid",
    description: "Surface free legal aid resources (NALSA / DLSA / NGOs / helplines).",
    parameters: {
      type: "object",
      properties: {
        primary_helpline: { type: "object", properties: { name: { type: "string" }, number: { type: "string" }, description: { type: "string" } }, required: ["name", "number"] },
        nalsa_office: { type: "string", description: "Nearest DLSA office name based on district" },
        nalsa_number: { type: "string", description: "Use 15100 (NALSA national)" },
        ngos: { type: "array", items: { type: "object", properties: { name: { type: "string" }, focus: { type: "string" } }, required: ["name"] } },
        free_eligibility: { type: "string", description: "Whether user qualifies for free aid under Legal Services Authorities Act 1987" },
      },
      required: ["primary_helpline", "nalsa_number"],
    },
  },
};

const DOCUMENT_TOOL = {
  type: "function",
  function: {
    name: "draft_document",
    description: "Draft a complete, ready-to-file legal document in proper Indian format.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string" },
        recipient: { type: "string", description: "Whom the document is addressed to (formal)" },
        body_markdown: { type: "string", description: "Full document body in markdown. Include date placeholder [DATE], applicant name placeholder [YOUR NAME], address [YOUR ADDRESS]. Use proper Indian legal phrasing." },
        attachments_needed: { type: "array", items: { type: "string" } },
      },
      required: ["title", "recipient", "body_markdown"],
    },
  },
};

async function logRun(supabase: any, caseId: string, agent: string, input: any, output: any, ms: number) {
  await supabase.from("agent_runs").insert({ case_id: caseId, agent, input, output, duration_ms: ms });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { caseId } = await req.json();
    if (!caseId) throw new Error("caseId required");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: caseRow, error } = await supabase.from("cases").select("*").eq("id", caseId).single();
    if (error || !caseRow) throw new Error("case not found");

    const lang = caseRow.language || "en";
    const userText = caseRow.transcript || caseRow.raw_input;
    const location = [caseRow.district, caseRow.state].filter(Boolean).join(", ") || "India";

    // 1. DIAGNOSIS
    let t = Date.now();
    const diagResp = await callAI([
      { role: "system", content: SYSTEM_BASE },
      { role: "user", content: `Citizen problem (language: ${lang}, location: ${location}):\n"${userText}"\n\nDiagnose the legal issue.` },
    ], [DIAGNOSIS_TOOL], { type: "function", function: { name: "diagnose_case" } });
    const diagnosis = extractTool(diagResp);
    await logRun(supabase, caseId, "diagnosis", { userText, lang }, diagnosis, Date.now() - t);

    // 2. JURISDICTION
    t = Date.now();
    const jurResp = await callAI([
      { role: "system", content: SYSTEM_BASE },
      { role: "user", content: `Diagnosis: ${JSON.stringify(diagnosis)}\nLocation: ${location}\nFind the correct Indian authority to file at.` },
    ], [JURISDICTION_TOOL], { type: "function", function: { name: "find_jurisdiction" } });
    const jurisdiction = extractTool(jurResp);
    await logRun(supabase, caseId, "jurisdiction", { diagnosis, location }, jurisdiction, Date.now() - t);

    // 3. AID
    t = Date.now();
    const aidResp = await callAI([
      { role: "system", content: SYSTEM_BASE },
      { role: "user", content: `Category: ${diagnosis.category}, urgency: ${diagnosis.urgency}, location: ${location}.\nFind free legal aid + helplines.` },
    ], [AID_TOOL], { type: "function", function: { name: "find_legal_aid" } });
    const aid = extractTool(aidResp);
    await logRun(supabase, caseId, "aid", { diagnosis, location }, aid, Date.now() - t);

    // 4. DOCUMENT
    t = Date.now();
    const docResp = await callAI([
      { role: "system", content: SYSTEM_BASE + "\nDraft formal legal documents matching Indian legal conventions." },
      { role: "user", content: `Case facts: "${userText}"\nDiagnosis: ${JSON.stringify(diagnosis)}\nJurisdiction: ${JSON.stringify(jurisdiction)}\nLocation: ${location}\nLanguage of document: ${lang === "hi" ? "Hindi (Devanagari)" : "English"}\n\nDraft the recommended document (${diagnosis.recommended_document}) in full, ready to file. Use placeholders [YOUR NAME], [YOUR ADDRESS], [DATE], [PHONE]. Be specific to these facts.` },
    ], [DOCUMENT_TOOL], { type: "function", function: { name: "draft_document" } });
    const doc = extractTool(docResp);
    await logRun(supabase, caseId, "document", { diagnosis, jurisdiction }, doc, Date.now() - t);

    // Persist generated doc
    const { data: savedDoc } = await supabase.from("generated_documents").insert({
      case_id: caseId,
      document_type: diagnosis.recommended_document,
      title: doc.title,
      body_markdown: doc.body_markdown,
      recipient: doc.recipient,
      jurisdiction: jurisdiction.authority,
      aid_contact: aid,
      language: lang,
    }).select().single();

    // Update case
    await supabase.from("cases").update({
      category: diagnosis.category,
      subcategory: diagnosis.subcategory,
      urgency: diagnosis.urgency,
      status: "completed",
      updated_at: new Date().toISOString(),
    }).eq("id", caseId);

    return new Response(JSON.stringify({
      success: true,
      diagnosis, jurisdiction, aid, document: doc, documentId: savedDoc?.id,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("run-agents error:", e);
    const msg = e instanceof Error ? e.message : String(e);
    const status = msg.includes("429") ? 429 : msg.includes("402") ? 402 : 500;
    return new Response(JSON.stringify({ error: msg }), {
      status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
