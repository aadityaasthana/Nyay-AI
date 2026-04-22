import { Mic, MicOff, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useT, useLang } from "@/lib/i18n";

interface Props {
  onTranscript: (text: string, lang: string) => void;
  disabled?: boolean;
}

export const VoiceRecorder = ({ onTranscript, disabled }: Props) => {
  const t = useT();
  const { setLang } = useLang();
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => () => {
    mediaRef.current?.stream.getTracks().forEach((tr) => tr.stop());
  }, []);

  const start = async () => {
    if (disabled || processing) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];
      mr.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      mr.onstop = async () => {
        stream.getTracks().forEach((tr) => tr.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        if (blob.size < 800) { setProcessing(false); return; }
        setProcessing(true);
        try {
          const buf = await blob.arrayBuffer();
          // base64 encode
          let bin = "";
          const bytes = new Uint8Array(buf);
          for (let i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i]);
          const b64 = btoa(bin);
          const { data, error } = await supabase.functions.invoke("transcribe-voice", {
            body: { audioBase64: b64, mimeType: "audio/webm" },
          });
          if (error) throw error;
          if (data?.transcript) {
            const detectedLang = data.language === "hi" ? "hi" : "en";
            setLang(detectedLang);
            onTranscript(data.transcript, detectedLang);
          }
        } catch (e: any) {
          console.error(e);
          toast.error(t("genericError"));
        } finally {
          setProcessing(false);
        }
      };
      mediaRef.current = mr;
      mr.start();
      setRecording(true);
    } catch (e) {
      toast.error(t("micPermission"));
    }
  };

  const stop = () => {
    if (mediaRef.current && recording) {
      mediaRef.current.stop();
      setRecording(false);
    }
  };

  return (
    <button
      type="button"
      disabled={disabled || processing}
      onPointerDown={start}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      className={`relative inline-flex h-14 w-14 items-center justify-center rounded-full transition-spring select-none touch-none
        ${recording ? "bg-destructive scale-110 animate-pulse-ring" : "bg-gradient-primary hover:scale-105 shadow-glow"}
        ${(disabled || processing) ? "opacity-50 cursor-not-allowed" : ""}`}
      aria-label="Record voice"
    >
      {processing ? (
        <Loader2 className="h-6 w-6 text-primary-foreground animate-spin" />
      ) : recording ? (
        <MicOff className="h-6 w-6 text-primary-foreground" />
      ) : (
        <Mic className="h-6 w-6 text-primary-foreground" />
      )}
    </button>
  );
};
