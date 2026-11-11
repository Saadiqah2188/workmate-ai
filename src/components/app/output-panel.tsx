import { useState, type ReactNode } from "react";
import { Check, Copy, Eye, PencilLine, RefreshCw, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCopy } from "@/hooks/use-copy";
import { Markdown } from "./markdown";

interface OutputPanelProps {
  title: string;
  value: string;
  onChange: (value: string) => void;
  loading: boolean;
  onRegenerate?: (() => void) | undefined;
  onStop?: (() => void) | undefined;
  /** markdown: preview by default with an edit toggle; text: always an editable textarea. */
  format: "text" | "markdown";
  empty: ReactNode;
  footer?: ReactNode | undefined;
}

export function OutputPanel({
  title,
  value,
  onChange,
  loading,
  onRegenerate,
  onStop,
  format,
  empty,
  footer,
}: OutputPanelProps) {
  const { copied, copy } = useCopy();
  const [editing, setEditing] = useState(false);
  const hasValue = value.trim().length > 0;
  const showEditor = format === "text" || editing;

  return (
    <section className="surface-card flex min-h-[420px] flex-col overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
        <h2 className="mr-auto flex items-center gap-2 text-sm font-semibold text-foreground">
          {title}
          {loading && (
            <span className="flex items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-semibold text-primary">
              <span className="size-1.5 animate-pulse rounded-full bg-primary" />
              Generating
            </span>
          )}
          {!loading && hasValue && showEditor && (
            <span className="rounded-full bg-teal-soft px-2 py-0.5 text-[11px] font-semibold text-teal-strong">
              Editable
            </span>
          )}
        </h2>
        {loading && onStop && (
          <Button size="sm" variant="outline" onClick={onStop}>
            <Square className="fill-current" />
            Stop
          </Button>
        )}
        {!loading && hasValue && (
          <>
            {format === "markdown" && (
              <Button size="sm" variant="ghost" onClick={() => setEditing((e) => !e)}>
                {editing ? <Eye /> : <PencilLine />}
                {editing ? "Preview" : "Edit"}
              </Button>
            )}
            {onRegenerate && (
              <Button size="sm" variant="outline" onClick={onRegenerate}>
                <RefreshCw />
                Regenerate
              </Button>
            )}
            <Button size="sm" variant="soft" onClick={() => copy(value)}>
              {copied ? <Check /> : <Copy />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </>
        )}
      </div>

      <div className="flex flex-1 flex-col">
        {!hasValue && !loading ? (
          <div className="flex flex-1 items-center justify-center p-8">{empty}</div>
        ) : !hasValue && loading ? (
          <div className="space-y-3 p-5" aria-label="Generating">
            {[92, 78, 85, 60, 70].map((w, i) => (
              <div
                key={i}
                className="h-3.5 animate-pulse rounded-full bg-muted"
                style={{ width: `${w}%` }}
              />
            ))}
          </div>
        ) : showEditor ? (
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            readOnly={loading}
            aria-label={`${title} (editable)`}
            className="min-h-[360px] flex-1 resize-none rounded-none border-0 px-5 py-4 text-[0.925rem] leading-relaxed shadow-none focus-visible:ring-0"
          />
        ) : (
          <div className="flex-1 overflow-auto px-5 py-4">
            <Markdown>{value}</Markdown>
          </div>
        )}
      </div>
      {footer && <div className="border-t border-border px-4 py-3">{footer}</div>}
    </section>
  );
}
