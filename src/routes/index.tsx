import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, Mail, MessagesSquare, Search, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AiDisclaimer } from "@/components/app/ai-disclaimer";
import heroTools from "@/assets/hero-tools.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard · AI Workplace Productivity Assistant" },
      {
        name: "description",
        content:
          "Your AI workplace hub: generate professional emails, summarise research and chat with an assistant that remembers context.",
      },
      { property: "og:title", content: "AI Workplace Productivity Assistant" },
      {
        property: "og:description",
        content: "Generate emails, analyse research and chat with an AI workplace assistant — built-in AI, no setup needed.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

const FEATURES = [
  {
    title: "Smart Email Generator",
    description: "Turn quick notes into polished emails in a formal, friendly or persuasive tone.",
    icon: Mail,
    url: "/email",
    points: ["3 tone options", "Edit, copy & regenerate"],
    tint: "bg-primary-soft text-primary",
  },
  {
    title: "AI Research Assistant",
    description: "Summarise topics, pasted articles or web pages into findings, insights and next steps.",
    icon: Search,
    url: "/research",
    points: ["Topics, articles & URLs", "Structured analysis"],
    tint: "bg-teal-soft text-teal-strong",
  },
  {
    title: "AI Chatbot",
    description: "Ask anything about your work. Workmate keeps the conversation context as you go.",
    icon: MessagesSquare,
    url: "/chat",
    points: ["Remembers context", "Saved in this browser"],
    tint: "bg-primary-soft text-primary",
  },
] as const;

function Dashboard() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-6 md:px-8 md:py-8">
      {/* Welcome */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-hero text-primary-foreground shadow-elevated">
        <div className="grid items-center gap-6 p-6 sm:p-8 md:grid-cols-[1.4fr_1fr] md:p-10">
          <div className="relative z-10 animate-fade-up">
            <p className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-semibold backdrop-blur">
              <span className="size-1.5 rounded-full bg-teal" />
              AI Workplace Productivity Assistant
            </p>
            <h1 className="mt-4 text-3xl font-extrabold leading-tight sm:text-4xl">
              Welcome back. What can we get done today?
            </h1>
            <p className="mt-3 max-w-lg text-sm text-primary-foreground/85 sm:text-base">
              Draft emails, digest research and get answers in seconds — powered by built-in AI, with
              nothing to set up.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg" variant="secondary" className="rounded-xl">
                <Link to="/email">
                  Write an email <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="teal" className="rounded-xl">
                <Link to="/chat">
                  <MessagesSquare /> Ask Workmate
                </Link>
              </Button>
            </div>
          </div>
          <img
            src={heroTools}
            alt=""
            width={1024}
            height={768}
            className="pointer-events-none mx-auto hidden w-full max-w-sm drop-shadow-2xl md:block"
          />
        </div>
      </section>

      {/* Quick access */}
      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">Quick access</h2>
            <p className="text-sm text-muted-foreground">Jump straight into a tool.</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {FEATURES.map((f) => (
            <Link
              key={f.url}
              to={f.url}
              className="surface-card group flex flex-col p-5 transition-all hover:-translate-y-0.5 hover:shadow-elevated"
            >
              <div className={`grid size-11 place-items-center rounded-xl ${f.tint}`}>
                <f.icon className="size-5" />
              </div>
              <h3 className="mt-4 font-bold text-foreground">{f.title}</h3>
              <p className="mt-1.5 flex-1 text-sm text-muted-foreground">{f.description}</p>
              <ul className="mt-4 space-y-1.5">
                {f.points.map((p) => (
                  <li key={p} className="flex items-center gap-2 text-xs font-medium text-foreground">
                    <CheckCircle2 className="size-3.5 text-teal" /> {p}
                  </li>
                ))}
              </ul>
              <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                Open <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Getting started */}
      <section className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <div className="surface-card p-5 sm:p-6">
          <h2 className="font-bold text-foreground">Getting started</h2>
          <ol className="mt-4 space-y-4">
            {[
              {
                title: "AI is ready",
                body: "Built-in AI is already connected — no account or API key needed.",
                done: true,
              },
              {
                title: "Pick a tool",
                body: "Write an email, analyse research or chat with Workmate.",
                done: false,
              },
              {
                title: "Review before you use it",
                body: "Edit the result and double-check facts before sending or sharing.",
                done: false,
              },
            ].map((step, i) => (
              <li key={step.title} className="flex gap-3">
                <span
                  className={
                    step.done
                      ? "grid size-7 shrink-0 place-items-center rounded-full bg-teal text-xs font-bold text-teal-foreground"
                      : "grid size-7 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-bold text-primary"
                  }
                >
                  {step.done ? <CheckCircle2 className="size-4" /> : i + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{step.title}</p>
                  <p className="text-sm text-muted-foreground">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div className="surface-card flex flex-col p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-teal-strong" />
            <h2 className="font-bold text-foreground">Private by design</h2>
          </div>
          <p className="mt-2 flex-1 text-sm text-muted-foreground">
            No accounts and no API keys. Your chats and preferences are saved only in this browser,
            and your requests are sent securely to the built-in AI just to generate a reply.
          </p>
          <Button asChild variant="outline" className="mt-4 w-full sm:w-auto">
            <Link to="/settings">Privacy & data</Link>
          </Button>
        </div>
      </section>

      <AiDisclaimer />
    </div>
  );
}
