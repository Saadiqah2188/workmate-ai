import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  PlugZap,
  Settings,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PageHeader } from "@/components/app/page-header";
import { AiDisclaimer } from "@/components/app/ai-disclaimer";
import { ErrorBanner } from "@/components/app/error-banner";
import { cn } from "@/lib/utils";
import { PROVIDERS, type ProviderId } from "@/lib/ai/providers";
import { saveAiSettings, useAiSettings, type AiSettings } from "@/lib/ai/settings";
import { describeError, streamChat } from "@/lib/ai/client";
import { STORAGE_KEYS } from "@/hooks/use-persistent-state";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings & API Key · AI Workplace Productivity Assistant" },
      {
        name: "description",
        content: "Connect your own OpenAI, Gemini or OpenRouter API key and understand how it is stored.",
      },
      { property: "og:title", content: "Settings & API Key" },
      {
        property: "og:description",
        content: "Bring your own AI provider key. Stored only in your browser.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const saved = useAiSettings();
  const [draft, setDraft] = useState<AiSettings>(saved);
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);

  // Sync once the browser copy of the settings loads after hydration.
  useEffect(() => setDraft(saved), [saved]);

  const provider = PROVIDERS[draft.provider];
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);

  function selectProvider(id: ProviderId) {
    setDraft((d) => ({
      ...d,
      provider: id,
      model: d.provider === id ? d.model : PROVIDERS[id].defaultModel,
    }));
    setTestError(null);
  }

  function save() {
    saveAiSettings(draft);
    toast.success(draft.apiKey ? "Settings saved" : "Settings saved — add a key to use AI features");
  }

  async function test() {
    setTesting(true);
    setTestError(null);
    try {
      await streamChat({
        settings: draft,
        messages: [{ role: "user", content: "Reply with the single word: Connected" }],
        temperature: 0,
      });
      saveAiSettings(draft);
      toast.success(`${provider.label} is connected and working`);
    } catch (err) {
      setTestError(describeError(err));
    } finally {
      setTesting(false);
    }
  }

  function removeKey() {
    const next = { ...draft, apiKey: "" };
    setDraft(next);
    saveAiSettings(next);
    toast.success("API key removed from this browser");
  }

  function clearData(kind: "chat" | "all") {
    if (kind === "chat") {
      localStorage.removeItem(STORAGE_KEYS.chat);
      toast.success("Chat history cleared");
      return;
    }
    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
    removeKey();
    toast.success("All local data cleared");
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 md:px-8 md:py-8">
      <PageHeader
        icon={Settings}
        title="Settings & API key"
        description="Connect the AI provider you already use. Requests go directly from your browser to that provider."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <section className="surface-card space-y-6 p-5 sm:p-6">
          <div className="space-y-2">
            <Label>AI provider</Label>
            <div className="grid gap-2 sm:grid-cols-3">
              {Object.values(PROVIDERS).map((p) => {
                const active = draft.provider === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => selectProvider(p.id)}
                    aria-pressed={active}
                    className={cn(
                      "rounded-xl border p-3 text-left text-sm font-semibold transition-all",
                      active
                        ? "border-primary bg-primary-soft text-primary ring-1 ring-primary"
                        : "border-border text-foreground hover:border-primary/40",
                    )}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="api-key">{provider.label} API key</Label>
              <a
                href={provider.keyUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                Get a key <ExternalLink className="size-3" />
              </a>
            </div>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="api-key"
                type={showKey ? "text" : "password"}
                autoComplete="off"
                spellCheck={false}
                value={draft.apiKey}
                onChange={(e) => setDraft((d) => ({ ...d, apiKey: e.target.value }))}
                placeholder={provider.keyPlaceholder}
                className="h-10 pl-9 pr-10 font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => setShowKey((s) => !s)}
                aria-label={showKey ? "Hide key" : "Show key"}
                className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                {showKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="model">Model</Label>
            <Input
              id="model"
              value={draft.model}
              onChange={(e) => setDraft((d) => ({ ...d, model: e.target.value }))}
              placeholder={provider.defaultModel}
              className="h-10 font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Default: <code className="font-mono">{provider.defaultModel}</code>. Use any chat model
              your {provider.label} account can access.
            </p>
          </div>

          <div className="flex items-start justify-between gap-4 rounded-xl border border-border bg-secondary/60 p-4">
            <div>
              <Label htmlFor="remember" className="text-sm font-semibold">
                Remember key on this device
              </Label>
              <p className="mt-1 text-xs text-muted-foreground">
                Off: the key is forgotten when you close this tab. On: it stays in this browser's
                local storage until you remove it.
              </p>
            </div>
            <Switch
              id="remember"
              checked={draft.rememberKey}
              onCheckedChange={(v) => setDraft((d) => ({ ...d, rememberKey: v }))}
            />
          </div>

          {testError && <ErrorBanner message={testError} />}

          <div className="flex flex-wrap gap-2">
            <Button variant="brand" onClick={save} disabled={!dirty}>
              <CheckCircle2 /> Save settings
            </Button>
            <Button variant="outline" onClick={test} disabled={!draft.apiKey.trim() || testing}>
              {testing ? <Loader2 className="animate-spin" /> : <PlugZap />}
              {testing ? "Testing…" : "Save & test connection"}
            </Button>
            {saved.apiKey && (
              <Button variant="ghost" onClick={removeKey} className="text-destructive hover:text-destructive">
                <Trash2 /> Remove key
              </Button>
            )}
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rounded-xl border border-warning/40 bg-warning-soft p-5 text-warning-foreground">
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-5" />
              <h2 className="font-bold">API key security — please read</h2>
            </div>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
              <li>
                This app has <strong>no server</strong>. Your key is stored in your browser and sent
                directly to {provider.label} with each request.
              </li>
              <li>
                Browser storage is <strong>not encrypted</strong>. Anyone with access to this device,
                a malicious browser extension, or injected script could read the key.
              </li>
              <li>Don't use this on shared or public computers, and never share screenshots of the key.</li>
              <li>
                Use a dedicated key with a <strong>spending limit</strong> set in your provider
                dashboard, and revoke it if you think it was exposed.
              </li>
              <li>For team or production use, route AI calls through a secure backend instead.</li>
            </ul>
          </section>

          <section className="surface-card space-y-3 p-5">
            <h2 className="font-bold text-foreground">Data on this device</h2>
            <p className="text-sm text-muted-foreground">
              Chat history, your last research analysis and email preferences are saved locally in
              this browser only.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => clearData("chat")}>
                Clear chat history
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => clearData("all")}
                className="text-destructive hover:text-destructive"
              >
                Clear all local data
              </Button>
            </div>
          </section>

          <AiDisclaimer />
        </aside>
      </div>
    </div>
  );
}
