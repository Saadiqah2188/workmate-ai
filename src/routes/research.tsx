import { useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { FileText, Globe, Loader2, Search, Telescope, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/app/page-header";
import { OutputPanel } from "@/components/app/output-panel";
import { AiDisclaimer } from "@/components/app/ai-disclaimer";
import { ErrorBanner } from "@/components/app/error-banner";
import { describeError, streamAi } from "@/lib/ai/client";
import { fetchUrlText, normaliseUrl } from "@/lib/ai/fetch-url";
import { STORAGE_KEYS, usePersistentState } from "@/hooks/use-persistent-state";

export const Route = createFileRoute("/research")({
  head: () => ({
    meta: [
      { title: "AI Research Assistant · AI Workplace Productivity Assistant" },
      {
        name: "description",
        content:
          "Summarise research topics, pasted articles and web pages into key findings, insights and recommendations.",
      },
      { property: "og:title", content: "AI Research Assistant" },
      {
        property: "og:description",
        content: "Turn topics, articles and URLs into structured summaries, findings and next steps.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResearchPage,
});

interface LastResearch {
  label: string;
  output: string;
}

type Stage = "idle" | "reading" | "analysing";

function ResearchPage() {
  const [topic, setTopic] = useState("");
  const [url, setUrl] = useState("");
  const [article, setArticle] = useState("");
  const [last, setLast] = usePersistentState<LastResearch | null>(STORAGE_KEYS.research, null);
  const [output, setOutput] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const shown = output ?? last?.output ?? "";
  const loading = stage !== "idle";
  const hasInput = Boolean(topic.trim() || url.trim() || article.trim());

  async function run() {
    if (!hasInput) {
      setError("Add a topic, a website URL or some article text to analyse.");
      return;
    }
    const normalised = url.trim() ? normaliseUrl(url) : null;
    if (url.trim() && !normalised) {
      setError("That URL doesn't look right. Use a full address like https://example.com/article.");
      return;
    }
    if (article.trim() && article.trim().length < 150) {
      setError("The pasted article is very short — paste more text for a meaningful analysis.");
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setError(null);
    setOutput("");

    try {
      let urlContent: string | undefined;
      if (normalised) {
        setStage("reading");
        urlContent = await fetchUrlText(normalised, controller.signal);
      }
      setStage("analysing");
      const result = await streamAi({
        task: {
          feature: "research",
          request: { topic, article, url: normalised ?? undefined, urlContent },
        },
        signal: controller.signal,
        onToken: setOutput,
      });
      setLast({ label: topic.trim() || normalised || "Pasted article", output: result });
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setError(describeError(err));
        setOutput(null);
      }
    } finally {
      setStage("idle");
    }
  }

  function updateOutput(value: string) {
    setOutput(value);
    setLast((l) => ({ label: l?.label ?? "Research", output: value }));
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 md:px-8 md:py-8">
      <PageHeader
        icon={Search}
        title="AI Research Assistant"
        description="Give a topic, a website URL, pasted article text — or any combination — and get a structured analysis."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <form
          className="surface-card space-y-5 p-5"
          onSubmit={(e) => {
            e.preventDefault();
            void run();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="topic" className="flex items-center gap-2">
              <Telescope className="size-4 text-primary" /> Research topic or question
            </Label>
            <Input
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Impact of a 4-day work week on productivity"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="url" className="flex items-center gap-2">
              <Globe className="size-4 text-primary" /> Website URL
            </Label>
            <Input
              id="url"
              inputMode="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/article"
            />
            <p className="text-xs text-muted-foreground">
              Page text is read through the free Jina Reader service. Some sites block this — paste
              the text below instead.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="article" className="flex items-center gap-2">
                <FileText className="size-4 text-primary" /> Paste an article or notes
              </Label>
              {article && (
                <span className="text-xs text-muted-foreground">{article.length.toLocaleString()} chars</span>
              )}
            </div>
            <Textarea
              id="article"
              value={article}
              onChange={(e) => setArticle(e.target.value)}
              placeholder="Paste report text, an article or meeting notes…"
              className="min-h-[160px] resize-y"
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" variant="brand" size="lg" className="flex-1" disabled={loading || !hasInput}>
              {loading ? <Loader2 className="animate-spin" /> : <Search />}
              {stage === "reading" ? "Reading website…" : stage === "analysing" ? "Analysing…" : "Analyse"}
            </Button>
            {(topic || url || article) && !loading && (
              <Button
                type="button"
                variant="outline"
                size="lg"
                aria-label="Clear inputs"
                onClick={() => {
                  setTopic("");
                  setUrl("");
                  setArticle("");
                }}
              >
                <Trash2 />
              </Button>
            )}
          </div>
        </form>

        <div className="space-y-4">
          {error && <ErrorBanner message={error} onRetry={run} />}
          <OutputPanel
            title={!loading && output === null && last ? `Last analysis · ${last.label}` : "Research analysis"}
            format="markdown"
            value={shown}
            onChange={updateOutput}
            loading={loading}
            onStop={() => abortRef.current?.abort()}
            onRegenerate={hasInput ? run : undefined}
            empty={
              <div className="max-w-sm text-center">
                <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-teal-soft text-teal-strong">
                  <Telescope className="size-5" />
                </div>
                <p className="mt-3 font-semibold text-foreground">Your analysis appears here</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Summary, key findings, insights, recommendations and what to verify.
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
