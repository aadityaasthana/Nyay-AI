import { useState, useEffect, useRef } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { ChatBubble } from "@/components/ChatBubble";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { AgentTimeline, AgentStep } from "@/components/AgentTimeline";
import { CaseResultPanel } from "@/components/CaseResultPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Stethoscope, Building2, ShieldCheck, FileText, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useT, useLang } from "@/lib/i18n";
import { getSessionId } from "@/lib/session";
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";

interface Message {
  id: string;
  role: "user" | "system" | "agent";
  content: string;
  meta?: string;
}

const buildSteps = (t: (k: any) => string): AgentStep[] => [
  { key: "diagnose", label: t("diagnosing"), icon: <Stethoscope className="h-4 w-4" />, status: "pending" },
  { key: "jurisdiction", label: t("findingJurisdiction"), icon: <Building2 className="h-4 w-4" />, status: "pending" },
  { key: "aid", label: t("findingAid"), icon: <ShieldCheck className="h-4 w-4" />, status: "pending" },
  { key: "document", label: t("draftingDoc"), icon: <FileText className="h-4 w-4" />, status: "pending" },
];

export default function Chat() {
  const t = useT();
  const { lang } = useLang();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "system",
      content: lang === "hi"
        ? "नमस्ते! मैं NyayAI हूँ। अपनी कानूनी समस्या बताइए — हिंदी में बोलकर या लिखकर। मैं आपके लिए दस्तावेज़ तैयार करूँगा।"
        : "Namaste! I'm NyayAI. Tell me your legal problem — by voice or text, in Hindi or English. I'll draft your document.",
    },
  ]);
  const [input, setInput] = useState("");
  const [district, setDistrict] = useState("");
  const [steps, setSteps] = useState<AgentStep[]>(buildSteps(t));
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, result, steps]);

  const submitProblem = async (text: string, langOverride?: string) => {
    if (!text.trim() || running) return;
    setMessages((m) => [...m, { id: crypto.randomUUID(), role: "user", content: text }]);
    setInput("");
    setRunning(true);
    setResult(null);
    setPdfUrl(null);
    const useLang_ = (langOverride || lang) as string;
    const freshSteps = buildSteps(t).map((s) => ({ ...s }));

    try {
      // 1. Create case
      const { data: caseRow, error: caseErr } = await supabase
        .from("cases")
        .insert({
          session_id: getSessionId(),
          language: useLang_,
          raw_input: text,
          district: district || null,
          state: null,
          anonymous: true,
        })
        .select().single();
      if (caseErr) throw caseErr;

      // 2. Animate steps + run agents
      const stepKeys = ["diagnose", "jurisdiction", "aid", "document"];
      let activeIdx = 0;
      const interval = setInterval(() => {
        if (activeIdx >= stepKeys.length) return;
        setSteps((prev) => prev.map((s, i) => ({
          ...s,
          status: i < activeIdx ? "done" : i === activeIdx ? "active" : "pending",
        })));
        activeIdx++;
      }, 1200);

      const { data, error } = await supabase.functions.invoke("run-agents", {
        body: { caseId: caseRow.id },
      });
      clearInterval(interval);

      if (error || !data?.success) {
        const msg = data?.error || error?.message || "";
        if (msg.includes("429")) toast.error(t("rateLimit"));
        else if (msg.includes("402")) toast.error(t("creditsExhausted"));
        else toast.error(t("genericError"));
        setSteps(buildSteps(t));
        setRunning(false);
        return;
      }

      setSteps((prev) => prev.map((s) => ({ ...s, status: "done" })));
      setResult(data);
      setMessages((m) => [...m, {
        id: crypto.randomUUID(),
        role: "agent",
        content: useLang_ === "hi" ? data.diagnosis.summary_hi : data.diagnosis.summary_en,
        meta: t("inputDetected"),
      }]);
    } catch (e: any) {
      console.error(e);
      toast.error(t("genericError"));
      setSteps(buildSteps(t));
    } finally {
      setRunning(false);
    }
  };

  const handleDownload = async () => {
    if (!result?.documentId) return;
    if (pdfUrl) {
      window.open(pdfUrl, "_blank");
      return;
    }
    setGeneratingPdf(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-pdf", {
        body: { documentId: result.documentId },
      });
      if (error || !data?.url) throw error || new Error("no url");
      setPdfUrl(data.url);
      window.open(data.url, "_blank");
    } catch (e) {
      toast.error(t("genericError"));
    } finally {
      setGeneratingPdf(false);
    }
  };

  const startOver = () => {
    setResult(null);
    setPdfUrl(null);
    setSteps(buildSteps(t));
    setMessages([{
      id: "welcome",
      role: "system",
      content: lang === "hi"
        ? "नया मामला। अपनी समस्या बताइए।"
        : "New case. Tell me your problem.",
    }]);
  };

  const examples = [t("ex1"), t("ex2"), t("ex3"), t("ex4")];

  return (
    <>
      <Helmet>
        <title>NyayAI Chat — Free legal aid in your language</title>
        <meta name="description" content="Describe your legal problem in Hindi or English. Get a ready-to-file legal document in 60 seconds, free." />
      </Helmet>
      <div className="flex flex-col h-[100dvh] bg-background">
        <SiteHeader minimal />

        <div ref={scrollRef} className="flex-1 overflow-y-auto chat-canvas">
          <div className="container max-w-2xl py-6 space-y-4">
            {messages.map((m) => (
              <ChatBubble key={m.id} role={m.role} meta={m.meta}>{m.content}</ChatBubble>
            ))}

            {running && (
              <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-card animate-slide-up">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                  <p className="text-sm font-medium">5 agents working...</p>
                </div>
                <AgentTimeline steps={steps} />
              </div>
            )}

            {result && (
              <CaseResultPanel
                result={result}
                pdfUrl={pdfUrl}
                generatingPdf={generatingPdf}
                onDownload={handleDownload}
                onStartOver={startOver}
              />
            )}

            {!running && !result && messages.length <= 1 && (
              <div className="pt-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">
                  {t("examples")}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {examples.map((ex, i) => (
                    <button
                      key={i}
                      onClick={() => submitProblem(ex)}
                      className="text-left rounded-xl bg-card border border-border/60 px-3 py-2.5 text-sm hover:bg-primary-muted hover:border-primary/30 transition-base shadow-sm"
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Composer */}
        <div className="border-t border-border bg-surface-elevated">
          <div className="container max-w-2xl py-3 px-3 sm:px-6">
            <div className="mb-2">
              <Input
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder={t("yourLocation")}
                className="h-9 text-sm bg-background"
                disabled={running || !!result}
              />
            </div>
            <form
              onSubmit={(e) => { e.preventDefault(); submitProblem(input); }}
              className="flex items-end gap-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t("chatPlaceholder")}
                disabled={running || !!result}
                className="h-12 rounded-full bg-background pl-5"
              />
              {input.trim() ? (
                <Button
                  type="submit"
                  disabled={running || !!result}
                  size="icon"
                  className="h-12 w-12 rounded-full bg-gradient-primary text-primary-foreground shadow-glow"
                >
                  <Send className="h-5 w-5" />
                </Button>
              ) : (
                <VoiceRecorder
                  disabled={running || !!result}
                  onTranscript={(text, l) => submitProblem(text, l)}
                />
              )}
            </form>
            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              {t("threeFreeUses")}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
