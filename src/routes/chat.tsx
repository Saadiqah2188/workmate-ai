import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowUp, Check, Copy, MessageSquarePlus, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { BrandMark } from "@/components/app/brand-mark";
import { Markdown } from "@/components/app/markdown";
import { ErrorBanner } from "@/components/app/error-banner";
import { describeError, streamAi } from "@/lib/ai/client";
import { STORAGE_KEYS, usePersistentState } from "@/hooks/use-persistent-state";
import { useCopy } from "@/hooks/use-copy";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "AI Chatbot · AI Workplace Productivity Assistant" },
      {
        name: "description",
        content: "Chat with Workmate, an AI workplace assistant that remembers your conversation context.",
      },
      { property: "og:title", content: "Workmate — AI Workplace Chatbot" },
      {
        property: "og:description",
        content: "Plan, write, summarise and brainstorm with an assistant that keeps context.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ChatPage,
});

interface Msg {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "Help me prioritise my tasks for this week",
  "Create an agenda for a 30-minute project kickoff",
  "Summarise the pros and cons of hybrid work",
  "How do I give constructive feedback to a colleague?",
];

function ChatPage() {
  const [messages, setMessages, hydrated] = usePersistentState<Msg[]>(STORAGE_KEYS.chat, []);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages, loading]);

  useEffect(() => {
    if (!loading) inputRef.current?.focus();
  }, [loading, hydrated]);

  async function respond(history: Msg[]) {
    const assistantId = crypto.randomUUID();
    const controller = new AbortController();
    abortRef.current = controller;
    setError(null);
    setLoading(true);
    setMessages([...history, { id: assistantId, role: "assistant", content: "" }]);
    try {
      await streamAi({
        task: {
          feature: "chat",
          history: history.map((m) => ({ role: m.role, content: m.content })),
        },
        signal: controller.signal,
        onToken: (text) =>
          setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: text } : m))),
      });
    } catch (err) {
      const aborted = (err as Error).name === "AbortError";
      if (!aborted) setError(describeError(err));
      // Drop an empty assistant bubble; keep partial text if the user pressed stop.
      setMessages((prev) => prev.filter((m) => m.id !== assistantId || m.content.trim()));
    } finally {
      setLoading(false);
    }
  }

  function send(text: string) {
    const content = text.trim();
    if (!content || loading) return;
    setInput("");
    void respond([...messages, { id: crypto.randomUUID(), role: "user", content }]);
  }

  function retry() {
    const history = [...messages];
    while (history.length && history.at(-1)?.role === "assistant") history.pop();
    if (history.length) void respond(history);
  }

  function newConversation() {
    abortRef.current?.abort();
    setMessages([]);
    setError(null);
    inputRef.current?.focus();
  }

  const empty = hydrated && messages.length === 0;
  const lastMsg = messages[messages.length - 1];
  const waiting = loading && lastMsg?.role === "assistant" && !lastMsg.content;

  return (
    <div className="flex h-[calc(100svh-3.5rem)] flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-border bg-surface px-4 py-3 md:px-6">
        <div className="flex items-center gap-3">
          <BrandMark className="size-9" />
          <div className="leading-tight">
            <p className="text-sm font-bold text-foreground">Workmate</p>
            <p className="text-xs text-muted-foreground">
              Your AI workplace assistant · history saved in this browser
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={newConversation} disabled={messages.length === 0}>
          <MessageSquarePlus />
          <span className="hidden sm:inline">New conversation</span>
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6 md:px-6">
          {empty && (
            <div className="animate-fade-up py-8 text-center">
              <BrandMark className="mx-auto size-14 rounded-2xl" />
              <h1 className="mt-4 text-2xl font-bold text-foreground">How can I help you work smarter?</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Ask about planning, writing, analysis or anything on your plate today.
              </p>
              <div className="mx-auto mt-6 grid max-w-xl gap-2 sm:grid-cols-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="surface-card px-4 py-3 text-left text-sm text-foreground transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-elevated"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) =>
            m.role === "user" ? (
              <div key={m.id} className="flex justify-end animate-fade-up">
                <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-[0.925rem] leading-relaxed text-primary-foreground shadow-card">
                  {m.content}
                </div>
              </div>
            ) : m.content ? (
              <AssistantMessage key={m.id} content={m.content} streaming={loading && m.id === lastMsg?.id} />
            ) : null,
          )}

          {waiting && (
            <div className="flex items-center gap-3" aria-label="Workmate is typing">
              <BrandMark className="size-8 rounded-lg" />
              <div className="flex gap-1 rounded-2xl bg-secondary px-4 py-3">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="size-1.5 rounded-full bg-muted-foreground animate-typing-dot"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          )}

          {error && <ErrorBanner message={error} onRetry={retry} />}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="border-t border-border bg-surface px-4 pb-4 pt-3 md:px-6">
        <form
          className="mx-auto w-full max-w-3xl"
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <div className="flex items-end gap-2 rounded-2xl border border-input bg-surface p-2 shadow-card focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15">
            <Textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  send(input);
                }
              }}
              rows={1}
              placeholder="Message Workmate…"
              aria-label="Message Workmate"
              className="max-h-40 min-h-[40px] flex-1 resize-none border-0 bg-transparent px-2 py-2 shadow-none focus-visible:ring-0"
            />
            {loading ? (
              <Button
                type="button"
                size="icon"
                variant="outline"
                aria-label="Stop generating"
                onClick={() => abortRef.current?.abort()}
                className="size-10 shrink-0 rounded-xl"
              >
                <Square className="fill-current" />
              </Button>
            ) : (
              <Button
                type="submit"
                size="icon"
                variant="brand"
                aria-label="Send message"
                disabled={!input.trim()}
                className="size-10 shrink-0 rounded-xl"
              >
                <ArrowUp />
              </Button>
            )}
          </div>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            Workmate can make mistakes. Verify important information before relying on it.
          </p>
        </form>
      </div>
    </div>
  );
}

function AssistantMessage({ content, streaming }: { content: string; streaming: boolean }) {
  const { copied, copy } = useCopy();
  return (
    <div className="group flex gap-3 animate-fade-up">
      <BrandMark className="size-8 rounded-lg" />
      <div className="min-w-0 flex-1 pt-0.5">
        <Markdown>{content}</Markdown>
        {!streaming && (
          <button
            onClick={() => copy(content)}
            className={cn(
              "mt-2 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
            )}
          >
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
        )}
      </div>
    </div>
  );
}
