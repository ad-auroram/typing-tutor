import { ROUND_HISTORY_STORAGE_KEY } from "../lib/sessionConfig";
import type { RoundHistoryEntry } from "../types/typing";
import { usePersistedState } from "./usePersistedState";

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
  const { state: roundHistory, setState: setRoundHistory } = usePersistedState<RoundHistoryEntry[]>({
    storageKey: ROUND_HISTORY_STORAGE_KEY,
    initialState: [],
    parse: parseStoredRoundHistory,
  });

  return { roundHistory, setRoundHistory };
}
