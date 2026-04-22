import { useLang } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

export const LangToggle = ({ className = "" }: { className?: string }) => {
  const { lang, setLang } = useLang();
  return (
    <div className={`inline-flex rounded-full bg-secondary p-1 ${className}`}>
      <button
        onClick={() => setLang("en")}
        className={`px-3 py-1 text-sm font-medium rounded-full transition-base ${
          lang === "en" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground"
        }`}
      >
        EN
      </button>
      <button
        onClick={() => setLang("hi")}
        className={`px-3 py-1 text-sm font-medium rounded-full font-devanagari transition-base ${
          lang === "hi" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground"
        }`}
      >
        हिं
      </button>
    </div>
  );
};
