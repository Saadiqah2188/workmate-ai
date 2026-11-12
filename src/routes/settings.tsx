import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { CheckCircle2, Loader2, PlugZap, Settings, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app/page-header";
import { AiDisclaimer } from "@/components/app/ai-disclaimer";
import { ErrorBanner } from "@/components/app/error-banner";
import { describeError, streamAi } from "@/lib/ai/client";
import { STORAGE_KEYS } from "@/hooks/use-persistent-state";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings · AI Workplace Productivity Assistant" },
      {
        name: "description",
        content: "Check the built-in AI connection and manage the chats and preferences saved in your browser.",
      },
      { property: "og:title", content: "Settings · Workplace AI" },
      {
        property: "og:description",
        content: "Built-in AI with nothing to set up. Manage your locally saved data.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

type TestState = "idle" | "testing" | "ok";

function SettingsPage() {
  const [test, setTest] = useState<TestState>("idle");
  const [testError, setTestError] = useState<string | null>(null);

  async function runTest() {
    setTest("testing");
    setTestError(null);
    try {
      await streamAi({ task: { feature: "ping" } });
      setTest("ok");
      toast.success("The AI is connected and working");
    } catch (err) {
      setTest("idle");
      setTestError(describeError(err));
    }
  }

  function clearData(kind: "chat" | "all") {
    if (kind === "chat") {
      localStorage.removeItem(STORAGE_KEYS.chat);
      toast.success("Chat history cleared");
      return;
    }
    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
    toast.success("All local data cleared");
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 md:px-8 md:py-8">
      <PageHeader
        icon={Settings}
        title="Settings"
        description="The AI is built in and ready to use — there's nothing to configure."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <section className="surface-card space-y-5 p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-teal-soft text-teal-strong">
              <Sparkles className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-bold text-foreground">Built-in AI</h2>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-soft px-2.5 py-0.5 text-xs font-semibold text-teal-strong">
                  <span className="size-1.5 rounded-full bg-teal" /> Connected
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                The Email Generator, Research Assistant and Workmate chatbot all use the same built-in
                AI. No account, API key or setup is needed.
              </p>
            </div>
          </div>

          <ul className="space-y-2 rounded-xl border border-border bg-secondary/60 p-4 text-sm text-foreground">
            {[
              "Replies stream in as they're written, and you can stop them at any time.",
              "Workmate uses your recent conversation so follow-up questions keep their context.",
              "Each tool uses its own instructions so emails, research and chat are tailored to the task.",
            ].map((item) => (
              <li key={item} className="flex gap-2">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-teal" />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          {testError && <ErrorBanner message={testError} onRetry={runTest} />}

          <div className="flex flex-wrap items-center gap-3">
            <Button variant="brand" onClick={runTest} disabled={test === "testing"}>
              {test === "testing" ? <Loader2 className="animate-spin" /> : <PlugZap />}
              {test === "testing" ? "Testing…" : "Test connection"}
            </Button>
            {test === "ok" && (
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-strong">
                <CheckCircle2 className="size-4" /> Working
              </span>
            )}
          </div>
        </section>

        <aside className="space-y-4">
          <section className="surface-card space-y-3 p-5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-teal-strong" />
              <h2 className="font-bold text-foreground">How your data is handled</h2>
            </div>
            <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              <li>What you type is sent securely to the AI only to generate your reply.</li>
              <li>Chat history, your last research analysis and email preferences are saved in this browser only.</li>
              <li>Avoid entering passwords, personal ID numbers or confidential company data.</li>
            </ul>
          </section>

          <section className="surface-card space-y-3 p-5">
            <h2 className="font-bold text-foreground">Data on this device</h2>
            <p className="text-sm text-muted-foreground">
              Clear what's saved in this browser at any time.
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
