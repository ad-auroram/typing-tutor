import { useEffect, useRef, useState } from "react";

type UsePersistedStateOptions<T> = {
  storageKey: string;
  initialState: T;
  parse: (storedValue: string | null) => T;
  serialize?: (state: T) => string;
};

export function usePersistedState<T>({
  storageKey,
  initialState,
  parse,
  serialize,
}: UsePersistedStateOptions<T>) {
  const [state, setState] = useState<T>(initialState);
  const [hasHydrated, setHasHydrated] = useState(false);
  const parseRef = useRef(parse);
  const serializeRef = useRef(serialize);

  useEffect(() => {
    parseRef.current = parse;
  }, [parse]);

  useEffect(() => {
    serializeRef.current = serialize;
  }, [serialize]);

  useEffect(() => {
    setState(parseRef.current(window.localStorage.getItem(storageKey)));
    setHasHydrated(true);
  }, [storageKey]);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    const toStorage = serializeRef.current
      ? serializeRef.current(state)
      : JSON.stringify(state);

    window.localStorage.setItem(storageKey, toStorage);
  }, [hasHydrated, state, storageKey]);

  return {
    state,
    setState,
    hasHydrated,
  };
}