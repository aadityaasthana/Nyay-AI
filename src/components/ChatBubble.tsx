import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";

interface Props {
  role: "user" | "system" | "agent";
  children: React.ReactNode;
  meta?: string;
}

export const ChatBubble = ({ role, children, meta }: Props) => {
  const align = role === "user" ? "items-end" : "items-start";
  const bubble =
    role === "user"
      ? "bg-chat-outgoing text-foreground rounded-2xl rounded-br-sm"
      : role === "system"
      ? "bg-accent-soft text-foreground rounded-2xl border border-accent/20"
      : "bg-chat-incoming text-foreground rounded-2xl rounded-bl-sm border border-border/60";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col ${align} animate-slide-up`}
    >
      <div className={`max-w-[85%] sm:max-w-[75%] px-4 py-3 shadow-bubble ${bubble}`}>
        {typeof children === "string" ? (
          <div className="prose prose-sm max-w-none prose-p:my-1.5 prose-headings:my-2">
            <ReactMarkdown>{children}</ReactMarkdown>
          </div>
        ) : (
          children
        )}
      </div>
      {meta && <span className="mt-1 px-1 text-[11px] text-muted-foreground">{meta}</span>}
    </motion.div>
  );
};
