import type { AiTask } from "./tasks";

export type AiErrorCode = "credits" | "rate_limit" | "network" | "bad_request" | "server" | "empty";

export class AiError extends Error {
  constructor(
    message: string,
    public code: AiErrorCode,
    public status?: number,
  ) {
    super(message);
    this.name = "AiError";
  }
}

export interface StreamLine {
  delta?: string;
  error?: string;
  done?: boolean;
}

/** Split a buffer into complete JSON lines and the unfinished remainder. */
export function splitLines(buffer: string): { lines: string[]; rest: string } {
  const parts = buffer.split("\n");
  const rest = parts.pop() ?? "";
  return { lines: parts.map((l) => l.trim()).filter(Boolean), rest };
}

/** Parses one streamed line. Throws when the server reports an error mid-stream. */
export function parseStreamLine(line: string): StreamLine {
  let obj: StreamLine;
  try {
    obj = JSON.parse(line) as StreamLine;
  } catch {
    return {};
  }
  if (obj.error) throw new AiError(obj.error, "server");
  return obj;
}

export function codeForStatus(status: number): AiErrorCode {
  if (status === 402) return "credits";
  if (status === 429) return "rate_limit";
  if (status === 400 || status === 413 || status === 422) return "bad_request";
  return "server";
}

export interface StreamOptions {
  task: AiTask;
  signal?: AbortSignal | undefined;
  onToken?: ((fullText: string) => void) | undefined;
}

/** Streams an AI reply from the app's built-in AI connection. */
export async function streamAi({ task, signal, onToken }: StreamOptions): Promise<string> {
  let res: Response;
  try {
    res = await fetch("/api/ai", {
      method: "POST",
      signal: signal ?? null,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(task),
    });
  } catch (err) {
    if ((err as Error).name === "AbortError") throw err;
    throw new AiError("Couldn't reach the AI service. Check your internet connection and try again.", "network");
  }

  if (!res.ok || !res.body) {
    let message = "";
    try {
      message = ((await res.json()) as { error?: string }).error ?? "";
    } catch {
      /* not JSON */
    }
    throw new AiError(
      message || `The AI service had a problem (error ${res.status}). Please try again.`,
      codeForStatus(res.status),
      res.status,
    );
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";
  for (;;) {
    const chunk = await reader.read();
    if (chunk.done) break;
    buffer += decoder.decode(chunk.value, { stream: true });
    const { lines, rest } = splitLines(buffer);
    buffer = rest;
    for (const line of lines) {
      const { delta } = parseStreamLine(line);
      if (delta) {
        full += delta;
        onToken?.(full);
      }
    }
  }
  if (buffer.trim()) {
    const { delta } = parseStreamLine(buffer.trim());
    if (delta) {
      full += delta;
      onToken?.(full);
    }
  }
  if (!full.trim()) throw new AiError("The AI returned an empty response. Please try again.", "empty");
  return full;
}

export function describeError(err: unknown): string {
  if (err instanceof AiError) return err.message;
  if (err instanceof Error && err.name === "AbortError") return "Generation stopped.";
  return err instanceof Error ? err.message : "Something went wrong. Please try again.";
}
