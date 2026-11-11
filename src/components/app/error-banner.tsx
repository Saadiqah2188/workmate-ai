import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-col gap-3 rounded-xl border border-destructive/25 bg-destructive-soft p-3.5 text-sm text-destructive sm:flex-row sm:items-center"
    >
      <AlertCircle className="size-4 shrink-0" />
      <p className="flex-1">{message}</p>
      {onRetry && (
        <Button size="sm" variant="outline" onClick={onRetry} className="shrink-0">
          <RotateCcw />
          Try again
        </Button>
      )}
    </div>
  );
}
