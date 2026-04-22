// Voice transcription via Lovable AI gateway (Gemini multimodal)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { audioBase64, mimeType = "audio/webm" } = await req.json();
    if (!audioBase64) throw new Error("audioBase64 required");
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY missing");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: "You are a multilingual transcription engine for Indian languages (Hindi, English, Marathi, Bengali, Tamil, Telugu, Kannada, Gujarati, Punjabi). Transcribe the audio EXACTLY as spoken, in the original script. Then on a new line starting with 'LANG:', output the ISO 639-1 code of the dominant language (en, hi, mr, bn, ta, te, kn, gu, pa).",
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Transcribe this audio." },
              { type: "input_audio", input_audio: { data: audioBase64, format: mimeType.includes("mp3") ? "mp3" : "webm" } } as any,
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const t = await res.text();
      const status = res.status === 429 ? 429 : res.status === 402 ? 402 : 500;
      return new Response(JSON.stringify({ error: `Transcription failed: ${t}` }), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const data = await res.json();
    const content: string = data.choices?.[0]?.message?.content || "";
    const langMatch = content.match(/LANG:\s*(\w+)/i);
    const language = langMatch?.[1]?.toLowerCase() || "en";
    const transcript = content.replace(/LANG:.*/i, "").trim();

    return new Response(JSON.stringify({ transcript, language }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
