import { describe, expect, it } from "vitest";
import { AiError, deltaFromData, extractSseData } from "./client";
import { buildChatMessages, buildEmailMessages, buildResearchMessages, CHAT_CONTEXT_TURNS } from "./prompts";

describe("SSE parsing", () => {
  it("keeps an unfinished line for the next chunk", () => {
    const { data, rest } = extractSseData('data: {"a":1}\n\ndata: {"b"');
    expect(data).toEqual(['{"a":1}']);
    expect(rest).toBe('data: {"b"');
  });

  it("reads text deltas and stops on [DONE]", () => {
    expect(deltaFromData('{"choices":[{"delta":{"content":"Hi"}}]}')).toBe("Hi");
    expect(deltaFromData("[DONE]")).toBeNull();
  });

  it("throws provider errors sent inside the stream", () => {
    expect(() => deltaFromData('{"error":{"message":"quota"}}')).toThrow(AiError);
  });
});

describe("email prompt", () => {
  const base = { instructions: "Ask for Friday off", length: "short" as const };

  it("applies the chosen tone", () => {
    expect(buildEmailMessages({ ...base, tone: "formal" })[0]?.content).toContain("Formal:");
    expect(buildEmailMessages({ ...base, tone: "friendly" })[0]?.content).toContain("Friendly:");
    expect(buildEmailMessages({ ...base, tone: "persuasive" })[0]?.content).toContain("call to action");
  });

  it("asks for a different version when regenerating", () => {
    const msgs = buildEmailMessages({ ...base, tone: "formal", previousDraft: "Subject: Old" });
    expect(msgs).toHaveLength(4);
    expect(msgs[2]).toEqual({ role: "assistant", content: "Subject: Old" });
  });
});

describe("research prompt", () => {
  it("includes URL text and pasted article as sources", () => {
    const [system, user] = buildResearchMessages({
      topic: "Remote work",
      url: "https://x.com/a",
      urlContent: "URL BODY",
      article: "ARTICLE BODY",
    });
    expect(system?.content).toContain("Base your analysis on the provided source material");
    expect(user?.content).toContain("URL BODY");
    expect(user?.content).toContain("ARTICLE BODY");
  });
});

describe("chat context", () => {
  it("sends the system prompt plus the most recent turns", () => {
    const history = Array.from({ length: 40 }, (_, i) => ({
      role: (i % 2 ? "assistant" : "user") as "user" | "assistant",
      content: `m${i}`,
    }));
    const msgs = buildChatMessages(history);
    expect(msgs[0]?.role).toBe("system");
    expect(msgs).toHaveLength(CHAT_CONTEXT_TURNS + 1);
    expect(msgs.at(-1)?.content).toBe("m39");
  });
});
