import { createFileRoute } from "@tanstack/react-router";
import { aiTaskSchema, buildTaskMessages } from "@/lib/ai/tasks";

export const Route = createFileRoute("/api/ai")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "The request was empty or malformed." }, { status: 400 });
        }
        const parsed = aiTaskSchema.safeParse(body);
        if (!parsed.success) {
          return Response.json(
            { error: "That request couldn't be processed — it may be empty or too long." },
            { status: 400 },
          );
        }
        const { streamAiReply } = await import("@/lib/ai/gateway.server");
        return streamAiReply(buildTaskMessages(parsed.data), request.signal);
      },
    },
  },
});
