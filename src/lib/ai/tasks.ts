import { z } from "zod";
import {
  buildChatMessages,
  buildEmailMessages,
  buildResearchMessages,
  PING_MESSAGES,
  type ChatMessage,
} from "./prompts";

/** Input limits keep requests well inside the model's context and stop the endpoint being misused. */
export const LIMITS = {
  emailInstructions: 4000,
  previousDraft: 8000,
  researchTopic: 500,
  article: 60000,
  urlContent: 30000,
  chatMessage: 12000,
  chatHistory: 200,
} as const;

const optional = (max: number) => z.string().max(max).optional();

/**
 * Everything the browser may ask the AI to do. The server builds the actual prompts from
 * these fields, so the endpoint only ever runs the app's own three features.
 */
export const aiTaskSchema = z.discriminatedUnion("feature", [
  z.object({
    feature: z.literal("email"),
    request: z.object({
      instructions: z.string().trim().min(8).max(LIMITS.emailInstructions),
      tone: z.enum(["formal", "friendly", "persuasive"]),
      length: z.enum(["short", "medium", "detailed"]),
      recipient: optional(200),
      senderName: optional(120),
      previousDraft: optional(LIMITS.previousDraft),
    }),
  }),
  z.object({
    feature: z.literal("research"),
    request: z
      .object({
        topic: optional(LIMITS.researchTopic),
        article: optional(LIMITS.article),
        url: optional(2000),
        urlContent: optional(LIMITS.urlContent),
      })
      .refine((r) => Boolean(r.topic?.trim() || r.article?.trim() || r.urlContent?.trim()), {
        message: "Add a topic, website or article to analyse.",
      }),
  }),
  z.object({
    feature: z.literal("chat"),
    history: z
      .array(
        z.object({
          role: z.enum(["user", "assistant"]),
          content: z.string().trim().min(1).max(LIMITS.chatMessage),
        }),
      )
      .min(1)
      .max(LIMITS.chatHistory),
  }),
  z.object({ feature: z.literal("ping") }),
]);

export type AiTask = z.infer<typeof aiTaskSchema>;

export function buildTaskMessages(task: AiTask): ChatMessage[] {
  switch (task.feature) {
    case "email":
      return buildEmailMessages(task.request);
    case "research":
      return buildResearchMessages(task.request);
    case "chat":
      return buildChatMessages(task.history);
    case "ping":
      return PING_MESSAGES;
  }
}
