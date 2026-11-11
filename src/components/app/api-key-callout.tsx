import { Link } from "@tanstack/react-router";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAiSettings } from "@/lib/ai/settings";

/** Shown on tool pages when no API key is configured. */
export function ApiKeyCallout() {
  const settings = useAiSettings();
  if (settings.apiKey) return null;
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-primary/20 bg-primary-soft p-4 sm:flex-row sm:items-center">
      <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-surface text-primary shadow-card">
        <KeyRound className="size-4" />
      </div>
      <div className="flex-1 text-sm">
        <p className="font-semibold text-foreground">Connect your AI provider to get started</p>
        <p className="text-muted-foreground">
          Add your own OpenAI, Gemini or OpenRouter API key. It stays in this browser.
        </p>
      </div>
      <Button asChild variant="default" size="sm">
        <Link to="/settings">Add API key</Link>
      </Button>
    </div>
  );
}
