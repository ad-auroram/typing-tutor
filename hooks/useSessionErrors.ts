import type { SetStateAction } from "react";

import { SESSION_ERRORS_STORAGE_KEY } from "../lib/sessionConfig";
import { usePersistedState } from "./usePersistedState";

type SessionErrorsState = {
  letterErrors: Record<string, number>;
  patternErrors: Record<string, number>;
  letterLastSeenRound: Record<string, number>;
  patternLastSeenRound: Record<string, number>;
};

const EMPTY_SESSION_ERRORS: SessionErrorsState = {
  letterErrors: {},
  patternErrors: {},
  letterLastSeenRound: {},
  patternLastSeenRound: {},
};

function parseStoredSessionErrors(storedValue: string | null): SessionErrorsState {
  if (!storedValue) {
    return EMPTY_SESSION_ERRORS;
  }

  try {
    const parsed = JSON.parse(storedValue) as Partial<SessionErrorsState> | null;
    if (!parsed || typeof parsed !== "object") {
      return EMPTY_SESSION_ERRORS;
    }

    return {
      letterErrors: parsed.letterErrors ?? {},
      patternErrors: parsed.patternErrors ?? {},
      letterLastSeenRound: parsed.letterLastSeenRound ?? {},
      patternLastSeenRound: parsed.patternLastSeenRound ?? {},
    };
  } catch {
    return EMPTY_SESSION_ERRORS;
  }
}

export function useSessionErrors() {
  const { state: sessionErrors, setState: setSessionErrors } = usePersistedState<SessionErrorsState>({
    storageKey: SESSION_ERRORS_STORAGE_KEY,
    initialState: EMPTY_SESSION_ERRORS,
    parse: parseStoredSessionErrors,
  });

  const setLetterErrors = (update: SetStateAction<Record<string, number>>) => {
    setSessionErrors((previousSessionErrors) => ({
      ...previousSessionErrors,
      letterErrors:
        typeof update === "function"
          ? update(previousSessionErrors.letterErrors)
          : update,
    }));
  };

  const setPatternErrors = (update: SetStateAction<Record<string, number>>) => {
    setSessionErrors((previousSessionErrors) => ({
      ...previousSessionErrors,
      patternErrors:
        typeof update === "function"
          ? update(previousSessionErrors.patternErrors)
          : update,
    }));
  };

  const setLetterLastSeenRound = (update: SetStateAction<Record<string, number>>) => {
    setSessionErrors((previousSessionErrors) => ({
      ...previousSessionErrors,
      letterLastSeenRound:
        typeof update === "function"
          ? update(previousSessionErrors.letterLastSeenRound)
          : update,
    }));
  };

  const setPatternLastSeenRound = (update: SetStateAction<Record<string, number>>) => {
    setSessionErrors((previousSessionErrors) => ({
      ...previousSessionErrors,
      patternLastSeenRound:
        typeof update === "function"
          ? update(previousSessionErrors.patternLastSeenRound)
          : update,
    }));
  };

  const resetSessionErrors = () => {
    setSessionErrors(EMPTY_SESSION_ERRORS);
  };

  return {
    letterErrors: sessionErrors.letterErrors,
    setLetterErrors,
    patternErrors: sessionErrors.patternErrors,
    setPatternErrors,
    letterLastSeenRound: sessionErrors.letterLastSeenRound,
    setLetterLastSeenRound,
    patternLastSeenRound: sessionErrors.patternLastSeenRound,
    setPatternLastSeenRound,
    resetSessionErrors,
  };
}
