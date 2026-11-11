import { useSyncExternalStore } from "react";
import { PROVIDERS, type ProviderId } from "./providers";

export interface AiSettings {
  provider: ProviderId;
  apiKey: string;
  model: string;
  /** true: key kept in localStorage; false: key kept in sessionStorage (cleared when the tab closes). */
  rememberKey: boolean;
}

const SETTINGS_KEY = "awpa.settings";
const SESSION_KEY = "awpa.apiKey";

export const DEFAULT_SETTINGS: AiSettings = {
  provider: "openai",
  apiKey: "",
  model: PROVIDERS.openai.defaultModel,
  rememberKey: false,
};

let cache: AiSettings | null = null;
const listeners = new Set<() => void>();

function read(): AiSettings {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    const stored = raw ? (JSON.parse(raw) as Partial<AiSettings>) : {};
    const provider = stored.provider && stored.provider in PROVIDERS ? stored.provider : "openai";
    const rememberKey = Boolean(stored.rememberKey);
    cache = {
      provider,
      rememberKey,
      model: stored.model || PROVIDERS[provider].defaultModel,
      apiKey: rememberKey ? (stored.apiKey ?? "") : (sessionStorage.getItem(SESSION_KEY) ?? ""),
    };
  } catch {
    cache = DEFAULT_SETTINGS;
  }
  return cache;
}

export function getAiSettings(): AiSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  return read();
}

export function saveAiSettings(next: AiSettings) {
  const clean = { ...next, apiKey: next.apiKey.trim(), model: next.model.trim() };
  const { apiKey, ...rest } = clean;
  localStorage.setItem(
    SETTINGS_KEY,
    JSON.stringify(clean.rememberKey ? clean : { ...rest, apiKey: "" }),
  );
  if (clean.rememberKey) sessionStorage.removeItem(SESSION_KEY);
  else if (apiKey) sessionStorage.setItem(SESSION_KEY, apiKey);
  else sessionStorage.removeItem(SESSION_KEY);
  cache = clean;
  listeners.forEach((l) => l());
}

export function clearApiKey() {
  saveAiSettings({ ...getAiSettings(), apiKey: "" });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Server render uses defaults; the browser snapshot takes over after hydration. */
export function useAiSettings(): AiSettings {
  return useSyncExternalStore(subscribe, getAiSettings, () => DEFAULT_SETTINGS);
}
