import { wordBank, createWordBankEntries } from "../data/wordBank";
import { WORD_BANK_STORAGE_KEY } from "../lib/sessionConfig";
import type { WordBankEntry } from "../data/wordBank";
import { usePersistedState } from "./usePersistedState";

function parseStoredWordBank(storedValue: string | null): WordBankEntry[] {
  if (!storedValue) {
    return wordBank;
  }

  try {
    const parsed = JSON.parse(storedValue);
    if (!Array.isArray(parsed)) {
      return wordBank;
    }

    const nextWords = parsed.filter((item): item is string => typeof item === "string");
    const nextEntries = createWordBankEntries(nextWords);

    return nextEntries.length > 0 ? nextEntries : wordBank;
  } catch {
    return wordBank;
  }
}

export function useWordBank() {
  const { state: wordBankEntries, setState: setWordBankEntries } = usePersistedState<WordBankEntry[]>({
    storageKey: WORD_BANK_STORAGE_KEY,
    initialState: wordBank,
    parse: parseStoredWordBank,
    serialize: (entries) => JSON.stringify(entries.map((entry) => entry.word)),
  });

  return {
    wordBankEntries,
    setWordBankEntries,
  };
}
