export type ChatRole = "system" | "user" | "assistant";
export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export type EmailTone = "formal" | "friendly" | "persuasive";
export type EmailLength = "short" | "medium" | "detailed";

export const EMAIL_TONES: { id: EmailTone; label: string; description: string }[] = [
  { id: "formal", label: "Formal", description: "Polished and businesslike" },
  { id: "friendly", label: "Friendly", description: "Warm and approachable" },
  { id: "persuasive", label: "Persuasive", description: "Confident, drives action" },
];

const TONE_GUIDE: Record<EmailTone, string> = {
  formal:
    "Formal: professional, courteous and precise. Use complete sentences, no slang or contractions, a respectful greeting (e.g. 'Dear ...') and a formal sign-off (e.g. 'Kind regards').",
  friendly:
    "Friendly: warm, positive and conversational while still professional. Contractions are fine, use a relaxed greeting (e.g. 'Hi ...') and a warm sign-off (e.g. 'Cheers' or 'Best').",
  persuasive:
    "Persuasive: confident and benefit-focused. Open with a hook relevant to the reader, back claims with the reasons given, address likely objections, and end with one clear, specific call to action.",
};

const LENGTH_GUIDE: Record<EmailLength, string> = {
  short: "Keep the body under 90 words.",
  medium: "Keep the body between 100 and 180 words.",
  detailed: "The body may be 200–320 words, organised into clear paragraphs.",
};

export interface EmailRequest {
  instructions: string;
  tone: EmailTone;
  length: EmailLength;
  recipient?: string | undefined;
  senderName?: string | undefined;
  /** Previous draft, when regenerating, so the model produces a genuinely different version. */
  previousDraft?: string | undefined;
}

export function buildEmailMessages(req: EmailRequest): ChatMessage[] {
  const system = [
    "You are an expert workplace communication writer.",
    "Write one complete, ready-to-send professional email based strictly on the user's instructions.",
    `Tone — ${TONE_GUIDE[req.tone]}`,
    `Length — ${LENGTH_GUIDE[req.length]}`,
    "Rules:",
    "- First line must be exactly: Subject: <concise, specific subject line>",
    "- Then a blank line, then the greeting, body and sign-off.",
    "- Use only facts provided by the user. Where a needed detail is missing (date, figure, name), insert a clear placeholder in square brackets like [date].",
    "- Plain text only. No markdown, no commentary before or after the email.",
  ].join("\n");

  const details = [
    `Instructions: ${req.instructions.trim()}`,
    req.recipient?.trim() ? `Recipient: ${req.recipient.trim()}` : null,
    req.senderName?.trim() ? `Sender name for sign-off: ${req.senderName.trim()}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const messages: ChatMessage[] = [
    { role: "system", content: system },
    { role: "user", content: details },
  ];
  if (req.previousDraft?.trim()) {
    messages.push(
      { role: "assistant", content: req.previousDraft.trim() },
      {
        role: "user",
        content:
          "Write a fresh alternative version of this email with the same intent and tone, but a different subject line, opening and structure.",
      },
    );
  }
  return messages;
}

export interface ResearchRequest {
  topic?: string | undefined;
  article?: string | undefined;
  url?: string | undefined;
  urlContent?: string | undefined;
}

const MAX_SOURCE_CHARS = 24000;

export function buildResearchMessages(req: ResearchRequest): ChatMessage[] {
  const hasSources = Boolean(req.article?.trim() || req.urlContent?.trim());
  const system = [
    "You are a meticulous research analyst supporting busy professionals.",
    hasSources
      ? "Base your analysis on the provided source material. Do not introduce facts that are not in the sources; if you add general context, label it clearly as background."
      : "No source material was provided, so draw on your general knowledge. Flag any claims that may be outdated or uncertain, and never invent statistics, quotes or citations.",
    "Respond in Markdown using exactly these sections:",
    "## Summary — a clear 1–2 paragraph overview.",
    "## Key Findings — 4–7 bullet points with the most important facts or arguments.",
    "## Insights — 3–5 bullets on implications, patterns or what matters for a workplace audience.",
    "## Recommendations — 3–5 concrete, actionable next steps.",
    "## Limitations & What to Verify — gaps, biases or claims the reader should double-check.",
    "Be specific to the material. Avoid generic filler.",
  ].join("\n");

  const parts: string[] = [];
  if (req.topic?.trim()) parts.push(`Research topic / focus: ${req.topic.trim()}`);
  if (req.urlContent?.trim()) {
    parts.push(
      `Source from URL (${req.url}):\n"""\n${req.urlContent.trim().slice(0, MAX_SOURCE_CHARS)}\n"""`,
    );
  }
  if (req.article?.trim()) {
    parts.push(`Pasted article:\n"""\n${req.article.trim().slice(0, MAX_SOURCE_CHARS)}\n"""`);
  }

  return [
    { role: "system", content: system },
    { role: "user", content: parts.join("\n\n") },
  ];
}

export const CHAT_SYSTEM_PROMPT = [
  "You are Workmate, a capable AI workplace productivity assistant.",
  "Help with planning, writing, summarising, brainstorming, meeting prep, prioritisation, spreadsheets and professional communication.",
  "Use the conversation so far for context and refer back to earlier details when relevant.",
  "Be concise and practical: lead with the answer, then supporting detail. Use Markdown headings, bullet lists and tables when they make answers easier to scan.",
  "If a request is ambiguous, make a sensible assumption and state it, or ask one short clarifying question.",
  "Be honest about uncertainty and remind the user to verify important facts, legal, financial or HR matters.",
].join("\n");

/** Keep the most recent turns so long conversations stay within the model's context window. */
export const CHAT_CONTEXT_TURNS = 30;

export function buildChatMessages(history: { role: "user" | "assistant"; content: string }[]): ChatMessage[] {
  return [
    { role: "system", content: CHAT_SYSTEM_PROMPT },
    ...history.slice(-CHAT_CONTEXT_TURNS).map((m) => ({ role: m.role, content: m.content })),
  ];
}

/** Tiny request used by Settings to confirm the AI connection works. */
export const PING_MESSAGES: ChatMessage[] = [
  { role: "system", content: "You are a connection check. Reply with exactly the single word: Connected" },
  { role: "user", content: "Connection check" },
];
