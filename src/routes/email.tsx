import { useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Mail, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/app/page-header";
import { OutputPanel } from "@/components/app/output-panel";
import { AiDisclaimer } from "@/components/app/ai-disclaimer";
import { ErrorBanner } from "@/components/app/error-banner";
import { cn } from "@/lib/utils";
import { describeError, streamAi } from "@/lib/ai/client";
import {
  EMAIL_TONES,
  type EmailLength,
  type EmailTone,
} from "@/lib/ai/prompts";
import { STORAGE_KEYS, usePersistentState } from "@/hooks/use-persistent-state";

export const Route = createFileRoute("/email")({
  head: () => ({
    meta: [
      { title: "Smart Email Generator · AI Workplace Productivity Assistant" },
      {
        name: "description",
        content: "Generate professional emails from quick instructions in a formal, friendly or persuasive tone.",
      },
      { property: "og:title", content: "Smart Email Generator" },
      {
        property: "og:description",
        content: "Turn quick notes into polished, editable emails in the tone you need.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EmailPage,
});

const LENGTHS: { id: EmailLength; label: string }[] = [
  { id: "short", label: "Short" },
  { id: "medium", label: "Medium" },
  { id: "detailed", label: "Detailed" },
];

const EXAMPLES = [
  "Ask my manager for Friday off next week to attend a family event; my tasks are covered by Sam.",
  "Follow up with a client who hasn't replied to our proposal sent two weeks ago.",
  "Pitch a 4-day pilot of async stand-ups to the engineering team.",
];

interface EmailPrefs {
  tone: EmailTone;
  length: EmailLength;
  senderName: string;
}

function EmailPage() {
  const [prefs, setPrefs] = usePersistentState<EmailPrefs>(STORAGE_KEYS.emailPrefs, {
    tone: "formal",
    length: "medium",
    senderName: "",
  });
  const [instructions, setInstructions] = useState("");
  const [recipient, setRecipient] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const canGenerate = instructions.trim().length >= 8 && !loading;

  async function generate(regenerate = false) {
    if (instructions.trim().length < 8) {
      setError("Describe what the email should say (at least a short sentence).");
      return;
    }
    const previousDraft = regenerate ? output : undefined;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setError(null);
    setLoading(true);
    setOutput("");
    try {
      await streamAi({
        task: {
          feature: "email",
          request: {
            instructions,
            recipient,
            senderName: prefs.senderName,
            tone: prefs.tone,
            length: prefs.length,
            previousDraft,
          },
        },
        signal: controller.signal,
        onToken: setOutput,
      });
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setError(describeError(err));
        if (previousDraft) setOutput(previousDraft);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 md:px-8 md:py-8">
      <PageHeader
        icon={Mail}
        title="Smart Email Generator"
        description="Describe what you need to say. Choose a tone, then edit, copy or regenerate the draft."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <form
          className="surface-card space-y-5 p-5"
          onSubmit={(e) => {
            e.preventDefault();
            void generate(false);
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="instructions">What should the email say?</Label>
            <Textarea
              id="instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. Let the team know the quarterly review moves to Thursday 2pm and ask them to update their slides by Wednesday."
              className="min-h-[140px] resize-y"
            />
            <div className="flex flex-wrap gap-1.5">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => setInstructions(ex)}
                  className="rounded-full border border-border bg-secondary px-2.5 py-1 text-left text-xs text-secondary-foreground transition-colors hover:border-primary/30 hover:bg-primary-soft"
                >
                  {ex.length > 46 ? `${ex.slice(0, 46)}…` : ex}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tone</Label>
            <div role="radiogroup" aria-label="Tone" className="grid grid-cols-3 gap-2">
              {EMAIL_TONES.map((t) => {
                const active = prefs.tone === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setPrefs((p) => ({ ...p, tone: t.id }))}
                    className={cn(
                      "rounded-xl border p-3 text-left transition-all",
                      active
                        ? "border-primary bg-primary-soft shadow-card ring-1 ring-primary"
                        : "border-border bg-surface hover:border-primary/40",
                    )}
                  >
                    <span className={cn("block text-sm font-semibold", active ? "text-primary" : "text-foreground")}>
                      {t.label}
                    </span>
                    <span className="mt-0.5 hidden text-xs text-muted-foreground sm:block">{t.description}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Length</Label>
            <div className="flex w-fit rounded-lg border border-border bg-secondary p-1">
              {LENGTHS.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  aria-pressed={prefs.length === l.id}
                  onClick={() => setPrefs((p) => ({ ...p, length: l.id }))}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
                    prefs.length === l.id
                      ? "bg-surface text-primary shadow-card"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="recipient">Recipient (optional)</Label>
              <Input
                id="recipient"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="e.g. Priya, Head of Sales"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sender">Your name (optional)</Label>
              <Input
                id="sender"
                value={prefs.senderName}
                onChange={(e) => setPrefs((p) => ({ ...p, senderName: e.target.value }))}
                placeholder="Used in the sign-off"
              />
            </div>
          </div>

          <Button type="submit" variant="brand" size="lg" className="w-full" disabled={!canGenerate}>
            {loading ? <Loader2 className="animate-spin" /> : <Wand2 />}
            {loading ? "Writing your email…" : "Generate email"}
          </Button>
        </form>

        <div className="space-y-4">
          {error && <ErrorBanner message={error} onRetry={() => generate(false)} />}
          <OutputPanel
            title="Your email"
            format="text"
            value={output}
            onChange={setOutput}
            loading={loading}
            onStop={() => abortRef.current?.abort()}
            onRegenerate={() => generate(true)}
            empty={
              <div className="max-w-xs text-center">
                <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary-soft text-primary">
                  <Mail className="size-5" />
                </div>
                <p className="mt-3 font-semibold text-foreground">Your draft appears here</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  You can edit it directly, copy it, or regenerate a fresh version.
                </p>
              </div>
            }
          />
          <AiDisclaimer compact />
        </div>
      </div>
    </div>
  );
}
