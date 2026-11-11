import { PROVIDERS } from "./providers";
import type { AiSettings } from "./settings";

export type ChatRole = "system" | "user" | "assistant";
export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export type AiErrorCode = "no_key" | "auth" | "rate_limit" | "network" | "bad_request" | "server" | "empty";

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

/** Split an SSE buffer into complete `data:` payloads and the unfinished remainder. */
export function extractSseData(buffer: string): { data: string[]; rest: string } {
  const lines = buffer.split(/\r?\n/);
  const rest = lines.pop() ?? "";
  const data: string[] = [];
  for (const line of lines) {
    const t = line.trim();
    if (t.startsWith("data:")) data.push(t.slice(5).trim());
  }
  return { data, rest };
}

/** Returns the text delta in one SSE payload, null on [DONE]. Throws on in-stream errors. */
export function deltaFromData(payload: string): string | null {
  if (payload === "[DONE]") return null;
  let json: unknown;
  try {
    json = JSON.parse(payload);
  } catch {
    return "";
  }
  const obj = json as {
    error?: { message?: string };
    choices?: { delta?: { content?: string | null } }[];
  };
  if (obj.error) throw new AiError(obj.error.message || "The AI provider returned an error.", "server");
  return obj.choices?.[0]?.delta?.content ?? "";
}

async function errorFromResponse(res: Response, providerLabel: string): Promise<AiError> {
  let detail = "";
  try {
    const body = await res.json();
    const first = Array.isArray(body) ? body[0] : body;
    detail = first?.error?.message ?? first?.message ?? "";
  } catch {
    /* body was not JSON */
  }
  const suffix = detail ? ` (${detail})` : "";
  if (res.status === 401 || res.status === 403)
    return new AiError(
      `${providerLabel} rejected your API key. Check it in Settings and try again.${suffix}`,
      "auth",
      res.status,
    );
  if (res.status === 429)
    return new AiError(
      `Rate limit or quota reached on your ${providerLabel} account. Wait a moment or check your billing.${suffix}`,
      "rate_limit",
      res.status,
    );
  if (res.status === 400 || res.status === 404 || res.status === 422)
    return new AiError(
      `The request was rejected — the model name may be wrong for ${providerLabel}.${suffix}`,
      "bad_request",
      res.status,
    );
  return new AiError(
    `${providerLabel} is having trouble right now (error ${res.status}). Please try again.${suffix}`,
    "server",
    res.status,
  );
}

export interface StreamOptions {
  settings: AiSettings;
  messages: ChatMessage[];
  temperature?: number | undefined;
  signal?: AbortSignal | undefined;
  onToken?: ((fullText: string) => void) | undefined;
}

/** Streams a chat completion directly from the browser using the user's own key. */
export async function streamChat({
  settings,
  messages,
  temperature = 0.7,
  signal,
  onToken,
}: StreamOptions): Promise<string> {
  if (!settings.apiKey) {
    throw new AiError("Add your API key in Settings to use the AI features.", "no_key");
  }
  const provider = PROVIDERS[settings.provider];

  const send = (withTemperature: boolean) =>
    fetch(`${provider.baseUrl}/chat/completions`, {
      method: "POST",
      signal: signal ?? null,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${settings.apiKey}`,
        ...(settings.provider === "openrouter"
          ? { "HTTP-Referer": window.location.origin, "X-Title": "AI Workplace Productivity Assistant" }
          : {}),
      },
      body: JSON.stringify({
        model: settings.model || provider.defaultModel,
        messages,
        stream: true,
        ...(withTemperature ? { temperature } : {}),
      }),
    });

  let res: Response;
  try {
    res = await send(true);
    // Some reasoning models only accept the default temperature.
    if (res.status === 400) {
      const text = await res.clone().text();
      if (/temperature/i.test(text)) res = await send(false);
    }
  } catch (err) {
    if ((err as Error).name === "AbortError") throw err;
    throw new AiError(
      `Couldn't reach ${provider.label}. Check your internet connection or try another provider.`,
      "network",
    );
  }
  if (!res.ok || !res.body) throw await errorFromResponse(res, provider.label);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";
  let done = false;
  while (!done) {
    const chunk = await reader.read();
    if (chunk.done) break;
    buffer += decoder.decode(chunk.value, { stream: true });
    const { data, rest } = extractSseData(buffer);
    buffer = rest;
    for (const payload of data) {
      const delta = deltaFromData(payload);
      if (delta === null) {
        done = true;
        break;
      }
      if (delta) {
        full += delta;
        onToken?.(full);
      }
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
