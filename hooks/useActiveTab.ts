import { ACTIVE_TAB_STORAGE_KEY } from "../lib/sessionConfig";
import type { ActiveTab } from "../types/typing";
import { usePersistedState } from "./usePersistedState";

function parseStoredActiveTab(storedValue: string | null, fallbackTab: ActiveTab): ActiveTab {
  if (storedValue === "practice" || storedValue === "profile") {
    return storedValue;
  }

  return fallbackTab;
}

export function useActiveTab(initialTab: ActiveTab = "practice") {
  const { state: activeTab, setState: setActiveTab } = usePersistedState<ActiveTab>({
    storageKey: ACTIVE_TAB_STORAGE_KEY,
    initialState: initialTab,
    parse: (storedValue) => parseStoredActiveTab(storedValue, initialTab),
    serialize: (tab) => tab,
  });

  return { activeTab, setActiveTab };
}
