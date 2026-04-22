import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Mic, FileText, Building2, ShieldCheck, Stethoscope, Languages, MessageCircle, Sparkles, CheckCircle2, Phone } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import { Helmet } from "react-helmet-async";
import farmerHero from "@/assets/farmer-hero.jpg";

export default function Landing() {
  const t = useT();

  const agents = [
    { icon: Languages, label: "Translation Agent", sub: "22 Indian languages", color: "from-info/20 to-info/5" },
    { icon: Stethoscope, label: "Diagnosis Agent", sub: "Identifies legal issue", color: "from-primary/20 to-primary/5" },
    { icon: Building2, label: "Jurisdiction Agent", sub: "Finds the right court", color: "from-accent/20 to-accent/5" },
    { icon: ShieldCheck, label: "Aid Agent", sub: "Connects to free help", color: "from-success/20 to-success/5" },
    { icon: FileText, label: "Document Agent", sub: "Drafts your filing", color: "from-warning/20 to-warning/5" },
  ];

  const stats = [
    { n: "5 cr", label: "Pending court cases in India" },
    { n: "₹0", label: "Cost to citizens, forever" },
    { n: "60s", label: "Problem to ready-to-file doc" },
    { n: "400M", label: "Indians who finally have help" },
  ];

  return (
    <>
      <Helmet>
        <title>NyayAI — Free AI legal aid for every Indian, in any language</title>
        <meta name="description" content="A multi-agent AI platform that drafts legal documents, finds the right court and connects citizens to free legal aid — in Hindi, English and 22 Indian languages." />
        <link rel="canonical" href="/" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <SiteHeader />

        {/* HERO */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-soft" />
          <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />

          <div className="container relative grid lg:grid-cols-2 gap-10 lg:gap-16 py-12 sm:py-20 lg:py-28 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-muted px-3 py-1.5 text-xs font-semibold text-primary mb-6">
                <Sparkles className="h-3.5 w-3.5" />
                India's first AI legal aid agent · Free forever
              </div>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-balance leading-[1.05]">
                <span className="text-foreground">When the system fails,</span><br />
                <span className="bg-gradient-hero bg-clip-text text-transparent">we draft the way out.</span>
              </h1>
              <p className="mt-5 text-lg text-muted-foreground text-pretty max-w-xl">
                {t("heroSub")}
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Button asChild size="lg" className="bg-gradient-primary text-primary-foreground hover:opacity-95 shadow-glow h-14 px-7 text-base rounded-full">
                  <Link to="/chat">
                    <MessageCircle className="h-5 w-5 mr-2" />
                    {t("cta")}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-14 px-7 text-base rounded-full">
                  <a href="#how">{t("ctaSecondary")}</a>
                </Button>
              </div>
              <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-primary" /> Hindi · English · regional</span>
                <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-primary" /> Voice or text</span>
                <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-primary" /> No app needed</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="relative"
            >
              <div className="relative rounded-3xl overflow-hidden shadow-elevated border border-border/40">
                <img
                  src={farmerHero}
                  alt="An elderly farmer in rural India holding a smartphone"
                  width={1280}
                  height={1280}
                  className="w-full h-auto aspect-square object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
                {/* Floating chat bubble overlay */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="absolute bottom-5 left-5 right-5 sm:bottom-8 sm:left-8 sm:right-8"
                >
                  <div className="rounded-2xl bg-chat-outgoing/95 backdrop-blur-md p-4 shadow-card border border-primary/20">
                    <p className="text-sm font-devanagari text-foreground/90">
                      "साब, मेरा पैसा लिया और काम नहीं दिया ठेकेदार ने"
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <Mic className="h-3 w-3" />
                      <span>Voice note · 0:08</span>
                    </div>
                  </div>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.4 }}
                    className="mt-2 ml-auto max-w-[80%] rounded-2xl bg-chat-incoming p-3 shadow-card border border-border/60"
                  >
                    <p className="text-xs font-semibold text-primary mb-1">📋 Labour Notice drafted</p>
                    <p className="text-xs text-muted-foreground">File at Labour Commissioner, Pune · NALSA Aid: 15100</p>
                  </motion.div>
                </motion.div>
              </div>
              {/* Floating stat */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.2 }}
                className="absolute -left-4 top-8 hidden lg:block rounded-2xl bg-card shadow-elevated border border-border/40 p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-saffron flex items-center justify-center">
                    <Phone className="h-5 w-5 text-accent-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">NALSA Aid</p>
                    <p className="font-bold">15100</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* STATS */}
        <section className="border-y border-border bg-surface-elevated">
          <div className="container py-10 grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="text-center"
              >
                <div className="font-display text-3xl sm:text-4xl font-extrabold bg-gradient-hero bg-clip-text text-transparent">{s.n}</div>
                <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* AGENTS */}
        <section id="how" className="container py-16 sm:py-24">
          <div className="max-w-2xl mx-auto text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">The 5-agent pipeline</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
              Five specialist agents, working in seconds.
            </h2>
            <p className="mt-3 text-muted-foreground text-pretty">
              Built on Lovable AI. Each agent is tuned for a single job in the Indian legal flow — together they go from a citizen's voice note to a ready-to-file document.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            {agents.map((a, i) => (
              <motion.div
                key={a.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className={`relative rounded-2xl border border-border/60 bg-gradient-to-br ${a.color} p-5 hover:shadow-card transition-base`}
              >
                <div className="absolute top-3 right-3 text-[10px] font-mono text-muted-foreground/60">0{i+1}</div>
                <div className="h-10 w-10 rounded-xl bg-card shadow-sm flex items-center justify-center mb-3">
                  <a.icon className="h-5 w-5 text-foreground/80" strokeWidth={2} />
                </div>
                <p className="font-semibold text-sm leading-tight">{a.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">{a.sub}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* USE CASES */}
        <section className="bg-surface border-t border-border">
          <div className="container py-16 sm:py-20">
            <div className="max-w-2xl mb-12">
              <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Real cases. Real Indians.</p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
                Three problems we solve today.
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-5">
              {[
                { title: "RTI Filing", desc: "Ration card not issued for 6 months → drafts a complete RTI to the District PDS officer.", tag: "Govt service" },
                { title: "Consumer Complaint", desc: "Flipkart didn't refund ₹3,000 → drafts a District Consumer Forum complaint with the right format.", tag: "E-commerce" },
                { title: "Domestic Violence", desc: "Sensitive case → instantly surfaces helpline 181, drafts a protection order application, finds nearest Mahila Thana.", tag: "Urgent" },
              ].map((u, i) => (
                <motion.article
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="rounded-2xl bg-card border border-border/60 p-6 shadow-sm hover:shadow-card transition-base"
                >
                  <span className="inline-block rounded-full bg-primary-muted px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                    {u.tag}
                  </span>
                  <h3 className="mt-4 font-display text-xl font-bold">{u.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{u.desc}</p>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="container py-20">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-hero p-10 sm:p-16 text-center shadow-elevated">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 left-1/4 h-64 w-64 rounded-full bg-accent/40 blur-3xl" />
              <div className="absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-primary-glow/40 blur-3xl" />
            </div>
            <div className="relative">
              <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-primary-foreground tracking-tight text-balance">
                Justice doesn't have to be expensive.
              </h2>
              <p className="mt-4 text-primary-foreground/80 max-w-xl mx-auto">
                Start a case in your language. Free. Anonymous. Always.
              </p>
              <Button asChild size="lg" className="mt-8 h-14 px-8 rounded-full bg-background text-primary hover:bg-background/95 text-base font-semibold">
                <Link to="/chat">
                  {t("tryItNow")} <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <footer className="border-t border-border py-10">
          <div className="container flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} NyayAI · For Bharat, with love.</p>
            <p>{t("poweredBy")}</p>
          </div>
        </footer>
      </div>
    </>
  );
}
