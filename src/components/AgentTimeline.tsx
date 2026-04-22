import { motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";

export interface AgentStep {
  key: string;
  label: string;
  icon: React.ReactNode;
  status: "pending" | "active" | "done";
}

export const AgentTimeline = ({ steps }: { steps: AgentStep[] }) => (
  <div className="space-y-2">
    {steps.map((s, i) => (
      <motion.div
        key={s.key}
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: i * 0.05 }}
        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-base
          ${s.status === "active" ? "bg-primary-muted" : "bg-transparent"}`}
      >
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-base
            ${s.status === "done" ? "bg-success text-primary-foreground" : ""}
            ${s.status === "active" ? "bg-primary text-primary-foreground" : ""}
            ${s.status === "pending" ? "bg-muted text-muted-foreground" : ""}`}
        >
          {s.status === "done" ? <Check className="h-4 w-4" />
            : s.status === "active" ? <Loader2 className="h-4 w-4 animate-spin" />
            : s.icon}
        </div>
        <span className={`text-sm font-medium ${s.status === "pending" ? "text-muted-foreground" : "text-foreground"}`}>
          {s.label}
        </span>
      </motion.div>
    ))}
  </div>
);
