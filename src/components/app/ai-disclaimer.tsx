import { ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export function AiDisclaimer({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <div
      role="note"
      className={cn(
        "flex items-start gap-2.5 rounded-xl border border-border bg-warning-soft/60 text-warning-foreground",
        compact ? "px-3 py-2 text-xs" : "px-4 py-3 text-sm",
        className,
      )}
    >
      <ShieldAlert className={cn("mt-0.5 shrink-0", compact ? "size-3.5" : "size-4")} />
      <p>
        <span className="font-semibold">Responsible AI:</span> AI can be inaccurate or out of date.
        Review and verify all generated content — especially facts, figures and advice — before
        sharing or acting on it.
      </p>
    </div>
  );
}
