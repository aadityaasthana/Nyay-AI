import { Link } from "react-router-dom";
import { Scale, MessageCircle } from "lucide-react";
import { LangToggle } from "./LangToggle";
import { useT } from "@/lib/i18n";

export const SiteHeader = ({ minimal = false }: { minimal?: boolean }) => {
  const t = useT();
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
            <Scale className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-display text-lg font-bold tracking-tight">
              <span className="text-foreground">Nyay</span>
              <span className="text-primary">AI</span>
            </span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground hidden sm:block">
              Justice for Bharat
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-4">
          {!minimal && (
            <Link
              to="/chat"
              className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-base"
            >
              <MessageCircle className="h-4 w-4" />
              {t("tryItNow")}
            </Link>
          )}
          <Link
            to="/dashboard"
            className="hidden sm:inline-flex text-sm font-medium text-muted-foreground hover:text-foreground transition-base"
          >
            Dashboard
          </Link>
          <LangToggle />
        </nav>
      </div>
    </header>
  );
};
