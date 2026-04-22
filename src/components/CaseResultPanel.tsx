import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Phone, MapPin, Scale, AlertTriangle, FileText, Building2, ShieldCheck, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useT } from "@/lib/i18n";

interface CaseResult {
  diagnosis: any;
  jurisdiction: any;
  aid: any;
  document: any;
  documentId: string;
}

interface Props {
  result: CaseResult;
  pdfUrl: string | null;
  generatingPdf: boolean;
  onDownload: () => void;
  onStartOver: () => void;
}

export const CaseResultPanel = ({ result, pdfUrl, generatingPdf, onDownload, onStartOver }: Props) => {
  const t = useT();
  const { diagnosis, jurisdiction, aid, document } = result;
  const isEmergency = diagnosis?.urgency === "emergency";

  return (
    <div className="space-y-4">
      {isEmergency && (
        <Card className="border-destructive/40 bg-destructive/5 p-4 animate-slide-up">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-destructive">{t("emergencyAlert")}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <a href="tel:181" className="inline-flex items-center gap-1.5 rounded-full bg-destructive px-3 py-1 text-sm font-medium text-destructive-foreground">
                  <Phone className="h-3.5 w-3.5" /> 181 (Women)
                </a>
                <a href="tel:112" className="inline-flex items-center gap-1.5 rounded-full bg-destructive px-3 py-1 text-sm font-medium text-destructive-foreground">
                  <Phone className="h-3.5 w-3.5" /> 112 (Emergency)
                </a>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Diagnosis */}
      <Card className="p-4 sm:p-5 animate-slide-up shadow-card">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-muted">
            <Scale className="h-4 w-4 text-primary" />
          </div>
          <h3 className="font-display font-semibold">{t("diagnosisLabel")}</h3>
          <Badge variant="secondary" className="ml-auto capitalize">{diagnosis.category?.replace("_", " ")}</Badge>
        </div>
        <p className="text-sm text-foreground/90 mb-3">{diagnosis.summary_en}</p>
        {diagnosis.applicable_laws?.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("applicableLaws")}</p>
            <div className="flex flex-wrap gap-1.5">
              {diagnosis.applicable_laws.map((l: string, i: number) => (
                <Badge key={i} variant="outline" className="font-normal text-xs">{l}</Badge>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Jurisdiction */}
      <Card className="p-4 sm:p-5 animate-slide-up shadow-card">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-muted">
            <Building2 className="h-4 w-4 text-primary" />
          </div>
          <h3 className="font-display font-semibold">{t("jurisdictionLabel")}</h3>
        </div>
        <div className="space-y-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("fileAt")}</p>
            <p className="font-medium">{jurisdiction.authority}</p>
            {jurisdiction.location_hint && (
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="h-3 w-3" /> {jurisdiction.location_hint}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-3 pt-2 text-sm">
            {jurisdiction.fees_inr && (
              <div><span className="text-muted-foreground">{t("fees")}: </span><span className="font-medium">{jurisdiction.fees_inr}</span></div>
            )}
            {jurisdiction.timeline && (
              <div><span className="text-muted-foreground">{t("timeline")}: </span><span className="font-medium">{jurisdiction.timeline}</span></div>
            )}
          </div>
        </div>
      </Card>

      {/* Aid */}
      <Card className="p-4 sm:p-5 animate-slide-up shadow-card border-accent/30 bg-accent-soft/40">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/20">
            <ShieldCheck className="h-4 w-4 text-accent" />
          </div>
          <h3 className="font-display font-semibold">{t("freeAidAvailable")}</h3>
        </div>
        <div className="space-y-3">
          {aid.primary_helpline && (
            <a href={`tel:${aid.primary_helpline.number}`} className="flex items-center justify-between rounded-xl bg-background p-3 shadow-sm hover:shadow-md transition-base">
              <div>
                <p className="font-medium">{aid.primary_helpline.name}</p>
                <p className="text-xs text-muted-foreground">{aid.primary_helpline.description}</p>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground">
                <Phone className="h-3.5 w-3.5" /> {aid.primary_helpline.number}
              </div>
            </a>
          )}
          {aid.nalsa_number && (
            <a href={`tel:${aid.nalsa_number}`} className="flex items-center justify-between rounded-xl bg-background p-3 shadow-sm hover:shadow-md transition-base">
              <div>
                <p className="font-medium">NALSA · {aid.nalsa_office || "National Legal Services"}</p>
                <p className="text-xs text-muted-foreground">{t("freeAidAvailable")}</p>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground">
                <Phone className="h-3.5 w-3.5" /> {aid.nalsa_number}
              </div>
            </a>
          )}
        </div>
      </Card>

      {/* Document */}
      <Card className="p-4 sm:p-5 animate-slide-up shadow-elevated border-primary/20">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <FileText className="h-4 w-4" />
          </div>
          <h3 className="font-display font-semibold">{t("yourDocument")}</h3>
        </div>
        <h4 className="font-display text-lg font-bold mb-1">{document.title}</h4>
        {document.recipient && (
          <p className="text-sm text-muted-foreground italic mb-3">To: {document.recipient}</p>
        )}
        <div className="max-h-72 overflow-y-auto rounded-xl border border-border/60 bg-surface p-4 text-sm">
          <div className="prose prose-sm max-w-none prose-p:my-2 prose-headings:my-3">
            <ReactMarkdown>{document.body_markdown}</ReactMarkdown>
          </div>
        </div>
        <div className="mt-4 flex flex-col sm:flex-row gap-2">
          <Button onClick={onDownload} disabled={generatingPdf} className="bg-gradient-primary text-primary-foreground hover:opacity-95 flex-1">
            {generatingPdf ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{t("generatingPdf")}</>
              : <><Download className="h-4 w-4 mr-2" />{pdfUrl ? t("downloadAndShare") : t("download")}</>}
          </Button>
          <Button variant="outline" onClick={onStartOver} className="sm:w-auto">
            {t("startOver")}
          </Button>
        </div>
      </Card>
    </div>
  );
};
