import {
  GatewayError,
  PaymentRequiredError,
  PermissionDeniedError,
  RateLimitError,
  RequestRejectedError,
  streamResponse,
} from "@lovable.dev/ai-gateway";
import type { ChatMessage } from "./prompts";

export const AI_MODEL = "openai/gpt-6-astra" as const;

function friendlyError(err: unknown): { status: number; message: string } {
  if (err instanceof PaymentRequiredError)
    return { status: 402, message: "The app's AI credits have run out. The app owner needs to add credits, then try again." };
  if (err instanceof RateLimitError)
    return { status: 429, message: "The AI is handling a lot of requests right now. Wait a moment and try again." };
  if (err instanceof PermissionDeniedError)
    return { status: 403, message: "The AI service isn't available for this app right now." };
  if (err instanceof RequestRejectedError)
    return { status: 400, message: "The AI couldn't process this request. Try shortening or rephrasing your input." };
  return { status: 502, message: "The AI service had a temporary problem. Please try again." };
}

function logError(err: unknown) {
  if (err instanceof GatewayError) {
    console.error("[ai] gateway error", { name: err.name, code: err.code, status: err.httpStatus, ids: err.ids });
  } else {
    console.error("[ai] unexpected error", err instanceof Error ? err.message : err);
  }
}

/**
 * Streams the reply as newline-delimited JSON: {"delta":"…"} lines, then {"done":true},
 * or {"error":"…"} if the AI fails part-way through.
 */
export async function streamAiReply(messages: ChatMessage[], signal: AbortSignal): Promise<Response> {
  const instructions = messages
    .filter((m) => m.role === "system")
    .map((m) => m.content)
    .join("\n\n");
  const input = messages
    .filter((m): m is ChatMessage & { role: "user" | "assistant" } => m.role !== "system")
    .map((m) => ({ role: m.role, content: m.content }));

  let stream: Awaited<ReturnType<typeof streamResponse<typeof AI_MODEL>>>;
  try {
    stream = await streamResponse(
      { model: AI_MODEL, instructions, input, reasoning: { effort: "low" } },
      { signal },
    );
  } catch (err) {
    logError(err);
    const { status, message } = friendlyError(err);
    return Response.json({ error: message }, { status });
  }

  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (obj: Record<string, unknown>) => controller.enqueue(encoder.encode(`${JSON.stringify(obj)}\n`));
      try {
        for await (const event of stream) {
          if (event.type === "response.output_text.delta" && event.delta) send({ delta: event.delta });
        }
        send({ done: true });
      } catch (err) {
        if (!signal.aborted) {
          logError(err);
          send({ error: friendlyError(err).message });
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(body, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" },
  });
}
