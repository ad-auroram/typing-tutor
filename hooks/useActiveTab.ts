import { useEffect, useState } from "react";

import { ACTIVE_TAB_STORAGE_KEY } from "../lib/sessionConfig";
import type { ActiveTab } from "../types/typing";

export function useActiveTab(initialTab: ActiveTab = "practice") {
  const [activeTab, setActiveTab] = useState<ActiveTab>(initialTab);

  useEffect(() => {
    const storedTab = window.localStorage.getItem(ACTIVE_TAB_STORAGE_KEY);

    if (storedTab === "practice" || storedTab === "profile") {
      setActiveTab(storedTab);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, activeTab);
  }, [activeTab]);

  return { activeTab, setActiveTab };
}
