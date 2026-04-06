export type ActiveTab = "practice" | "profile";

export type RoundHistoryEntry = {
  round: number;
  accuracy: number;
  wpm: number;
  averageAccuracy: number;
  averageWpm: number;
};
