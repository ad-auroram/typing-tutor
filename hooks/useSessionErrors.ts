import { useEffect, useState } from "react";

import { SESSION_ERRORS_STORAGE_KEY } from "../lib/sessionConfig";

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
  const [letterErrors, setLetterErrors] = useState<Record<string, number>>(() => {
    if (typeof window === "undefined") {
      return {};
    }

    return parseStoredSessionErrors(window.localStorage.getItem(SESSION_ERRORS_STORAGE_KEY)).letterErrors;
  });
  const [patternErrors, setPatternErrors] = useState<Record<string, number>>(() => {
    if (typeof window === "undefined") {
      return {};
    }

    return parseStoredSessionErrors(window.localStorage.getItem(SESSION_ERRORS_STORAGE_KEY)).patternErrors;
  });
  const [letterLastSeenRound, setLetterLastSeenRound] = useState<Record<string, number>>(() => {
    if (typeof window === "undefined") {
      return {};
    }

    return parseStoredSessionErrors(window.localStorage.getItem(SESSION_ERRORS_STORAGE_KEY)).letterLastSeenRound;
  });
  const [patternLastSeenRound, setPatternLastSeenRound] = useState<Record<string, number>>(() => {
    if (typeof window === "undefined") {
      return {};
    }

    return parseStoredSessionErrors(window.localStorage.getItem(SESSION_ERRORS_STORAGE_KEY)).patternLastSeenRound;
  });

  useEffect(() => {
    const payload: SessionErrorsState = {
      letterErrors,
      patternErrors,
      letterLastSeenRound,
      patternLastSeenRound,
    };

    window.localStorage.setItem(SESSION_ERRORS_STORAGE_KEY, JSON.stringify(payload));
  }, [letterErrors, letterLastSeenRound, patternErrors, patternLastSeenRound]);

  const resetSessionErrors = () => {
    setLetterErrors({});
    setPatternErrors({});
    setLetterLastSeenRound({});
    setPatternLastSeenRound({});
  };

  return {
    letterErrors,
    setLetterErrors,
    patternErrors,
    setPatternErrors,
    letterLastSeenRound,
    setLetterLastSeenRound,
    patternLastSeenRound,
    setPatternLastSeenRound,
    resetSessionErrors,
  };
}
