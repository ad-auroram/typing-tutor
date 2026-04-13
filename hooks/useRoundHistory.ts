import { useEffect, useState } from "react";

import { ROUND_HISTORY_STORAGE_KEY } from "../lib/sessionConfig";
import type { RoundHistoryEntry } from "../types/typing";

function parseStoredRoundHistory(storedValue: string | null): RoundHistoryEntry[] {
  if (!storedValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(storedValue);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed as RoundHistoryEntry[];
  } catch {
    return [];
  }
}

export function useRoundHistory() {
  const [roundHistory, setRoundHistory] = useState<RoundHistoryEntry[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }

    return parseStoredRoundHistory(window.localStorage.getItem(ROUND_HISTORY_STORAGE_KEY));
  });

  useEffect(() => {
    window.localStorage.setItem(ROUND_HISTORY_STORAGE_KEY, JSON.stringify(roundHistory));
  }, [roundHistory]);

  return { roundHistory, setRoundHistory };
}
