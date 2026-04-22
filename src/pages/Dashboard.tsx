import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell, Legend } from "recharts";
import { useT } from "@/lib/i18n";
import { Helmet } from "react-helmet-async";
import { Activity, MapPin, FileText, Languages, Sparkles } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const COLORS = ["hsl(142 70% 29%)", "hsl(27 96% 56%)", "hsl(199 89% 48%)", "hsl(38 95% 50%)", "hsl(174 60% 28%)", "hsl(280 60% 50%)"];

interface Case {
  id: string;
  category: string | null;
  district: string | null;
  language: string;
  urgency: string | null;
  status: string;
  raw_input: string;
  created_at: string;
}

export default function Dashboard() {
  const t = useT();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase
      .from("cases")
      .select("id, category, district, language, urgency, status, raw_input, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    setCases(data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel("cases-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "cases" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const total = cases.length;
  const completed = cases.filter((c) => c.status === "completed").length;
  const last24 = cases.filter((c) => Date.now() - new Date(c.created_at).getTime() < 86400000).length;
  const langCount = new Set(cases.map((c) => c.language)).size;

  const byDistrict = Object.entries(
    cases.reduce<Record<string, number>>((acc, c) => {
      const k = c.district || "Unknown";
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {})
  )
    .map(([district, count]) => ({ district, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const byCategory = Object.entries(
    cases.reduce<Record<string, number>>((acc, c) => {
      const k = (c.category || "other").replace("_", " ");
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  return (
    <>
      <Helmet>
        <title>NyayAI Dashboard — Live legal aid signals across India</title>
        <meta name="description" content="Live aggregate of legal aid requests across India for NGOs, NALSA centers and policy makers." />
      </Helmet>
      <div className="min-h-screen bg-surface">
        <SiteHeader />

        <main className="container py-10">
          <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">B2G · NALSA · NGO Partner Portal</p>
              <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">{t("adminTitle")}</h1>
              <p className="mt-2 text-muted-foreground max-w-2xl">{t("dashboardSub")}</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary-muted px-3 py-1.5 text-xs font-semibold text-primary">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-75 animate-ping" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              Live
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
            {[
              { icon: FileText, label: t("totalCases"), value: total, accent: "primary" },
              { icon: Activity, label: t("last24h"), value: last24, accent: "accent" },
              { icon: Sparkles, label: t("completed"), value: completed, accent: "success" },
              { icon: Languages, label: t("languages"), value: langCount, accent: "info" },
            ].map((k, i) => (
              <Card key={i} className="p-5 shadow-card border-border/60">
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-xl bg-primary-muted flex items-center justify-center">
                    <k.icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-3xl font-display font-extrabold tabular-nums">{k.value}</span>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{k.label}</p>
              </Card>
            ))}
          </div>

          {/* Charts */}
          <div className="grid lg:grid-cols-2 gap-5 mb-8">
            <Card className="p-5 shadow-card">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="h-4 w-4 text-primary" />
                <h2 className="font-display font-bold">{t("casesByDistrict")}</h2>
              </div>
              <div className="h-64">
                {byDistrict.length === 0 ? (
                  <EmptyState />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={byDistrict} layout="vertical" margin={{ left: 8, right: 16 }}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="district" type="category" tick={{ fontSize: 12 }} width={90} />
                      <Tooltip cursor={{ fill: "hsl(var(--muted))" }} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>

            <Card className="p-5 shadow-card">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-4 w-4 text-primary" />
                <h2 className="font-display font-bold">{t("casesByCategory")}</h2>
              </div>
              <div className="h-64">
                {byCategory.length === 0 ? (
                  <EmptyState />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
                        {byCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>
          </div>

          {/* Recent cases */}
          <Card className="shadow-card overflow-hidden">
            <div className="p-5 border-b border-border">
              <h2 className="font-display font-bold">{t("recentCases")}</h2>
            </div>
            <div className="divide-y divide-border">
              {loading ? (
                <div className="p-8 text-center text-muted-foreground">Loading...</div>
              ) : cases.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">{t("noRecentCases")}</div>
              ) : (
                cases.slice(0, 20).map((c) => (
                  <div key={c.id} className="flex items-start gap-3 p-4 hover:bg-surface transition-base">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="capitalize text-xs">{(c.category || "pending").replace("_", " ")}</Badge>
                        {c.urgency === "emergency" && <Badge className="bg-destructive text-destructive-foreground text-xs">Emergency</Badge>}
                        <Badge variant="secondary" className="text-xs">{c.language.toUpperCase()}</Badge>
                        {c.district && <span className="text-xs text-muted-foreground inline-flex items-center gap-0.5"><MapPin className="h-3 w-3" />{c.district}</span>}
                      </div>
                      <p className="mt-1.5 text-sm line-clamp-2">{c.raw_input}</p>
                    </div>
                    <span className="text-[11px] text-muted-foreground shrink-0 whitespace-nowrap">
                      {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </main>
      </div>
    </>
  );
}

const EmptyState = () => (
  <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
    No data yet. Submit a case from the chat to populate.
  </div>
);
