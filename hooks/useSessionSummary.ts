import type { SetStateAction } from "react";

import { SESSION_SUMMARY_STORAGE_KEY } from "../lib/sessionConfig";
import { usePersistedState } from "./usePersistedState";

type SessionSummaryState = {
  roundCount: number;
  totalAccuracy: number;
  totalWpm: number;
};

const EMPTY_SUMMARY: SessionSummaryState = {
  roundCount: 0,
  totalAccuracy: 0,
  totalWpm: 0,
};

function parseStoredSessionSummary(storedValue: string | null): SessionSummaryState {
  if (!storedValue) {
    return EMPTY_SUMMARY;
  }

  try {
    const parsed = JSON.parse(storedValue) as Partial<SessionSummaryState> | null;
    if (!parsed || typeof parsed !== "object") {
      return EMPTY_SUMMARY;
    }

    return {
      roundCount: typeof parsed.roundCount === "number" ? parsed.roundCount : 0,
      totalAccuracy: typeof parsed.totalAccuracy === "number" ? parsed.totalAccuracy : 0,
      totalWpm: typeof parsed.totalWpm === "number" ? parsed.totalWpm : 0,
    };
  } catch {
    return EMPTY_SUMMARY;
  }
}

export function useSessionSummary() {
  const { state: summary, setState: setSummary } = usePersistedState<SessionSummaryState>({
    storageKey: SESSION_SUMMARY_STORAGE_KEY,
    initialState: EMPTY_SUMMARY,
    parse: parseStoredSessionSummary,
  });

  const setRoundCount = (update: SetStateAction<number>) => {
    setSummary((previousSummary) => ({
      ...previousSummary,
      roundCount:
        typeof update === "function" ? update(previousSummary.roundCount) : update,
    }));
  };

  const setTotalAccuracy = (update: SetStateAction<number>) => {
    setSummary((previousSummary) => ({
      ...previousSummary,
      totalAccuracy:
        typeof update === "function" ? update(previousSummary.totalAccuracy) : update,
    }));
  };

  const setTotalWpm = (update: SetStateAction<number>) => {
    setSummary((previousSummary) => ({
      ...previousSummary,
      totalWpm:
        typeof update === "function" ? update(previousSummary.totalWpm) : update,
    }));
  };

  const resetSessionSummary = () => {
    setSummary(EMPTY_SUMMARY);
  };

  return {
    roundCount: summary.roundCount,
    setRoundCount,
    totalAccuracy: summary.totalAccuracy,
    setTotalAccuracy,
    totalWpm: summary.totalWpm,
    setTotalWpm,
    resetSessionSummary,
  };
}
