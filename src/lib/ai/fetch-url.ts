const READER = "https://r.jina.ai/";
const MAX_CHARS = 24000;

export function normaliseUrl(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    return url.hostname.includes(".") ? url.toString() : null;
  } catch {
    return null;
  }
}

/**
 * Browsers block reading most websites directly (CORS), so page text is extracted
 * through the public Jina Reader service. The URL — not your API key — is sent to it.
 */
export async function fetchUrlText(url: string, signal?: AbortSignal): Promise<string> {
  let res: Response;
  try {
    res = await fetch(READER + url, { signal: signal ?? null, headers: { Accept: "text/plain" } });
  } catch (err) {
    if ((err as Error).name === "AbortError") throw err;
    throw new Error("Couldn't load that website. Paste the article text instead.");
  }
  if (!res.ok) {
    throw new Error(
      `Couldn't read that website (error ${res.status}). It may block automated access — paste the article text instead.`,
    );
  }
  const text = (await res.text()).trim();
  if (text.length < 200) {
    throw new Error("That page didn't contain enough readable text. Paste the article text instead.");
  }
  return text.slice(0, MAX_CHARS);
}
