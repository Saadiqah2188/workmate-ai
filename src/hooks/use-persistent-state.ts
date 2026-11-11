import { useEffect, useState, type Dispatch, type SetStateAction } from "react";

/** useState mirrored to localStorage. Reads after mount so SSR and hydration stay consistent. */
export function usePersistentState<T>(
  key: string,
  initial: T,
): [T, Dispatch<SetStateAction<T>>, boolean] {
  const [value, setValue] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) setValue(JSON.parse(raw) as T);
    } catch {
      /* ignore corrupt values */
    }
    setHydrated(true);
  }, [key]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage full or unavailable */
    }
  }, [key, value, hydrated]);

  return [value, setValue, hydrated];
}

export const STORAGE_KEYS = {
  chat: "awpa.chat.messages",
  emailPrefs: "awpa.email.prefs",
  research: "awpa.research.last",
} as const;
