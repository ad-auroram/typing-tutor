"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PracticeTab } from "../components/PracticeTab";
import { ProfileTab } from "../components/ProfileTab";

import { wordBank } from "../data/wordBank";
import {
  ACTIVE_TAB_STORAGE_KEY,
  RECENT_WORD_LIMIT,
  ROUND_HISTORY_STORAGE_KEY,
  ROUND_WORD_COUNT,
} from "../lib/sessionConfig";
import { getWeakPatterns, selectNextWords } from "../lib/promptSelection";
import { analyzeTypingAttempt } from "../lib/typingMetrics";
import type { ActiveTab, RoundHistoryEntry } from "../types/typing";

const INITIAL_ROUND_WORDS = wordBank.slice(0, ROUND_WORD_COUNT).map((entry) => entry.word);

function getRandomStarterWords(count: number): string[] {
  return selectNextWords(
    {
      wordBank,
      weakPatterns: [],
      recentWords: [],
      fallbackWords: INITIAL_ROUND_WORDS,
    },
    count,
  ).map((entry) => entry.word);
}

function mergeCountMaps(
  previousCounts: Record<string, number>,
  nextCounts: Record<string, number>,
): Record<string, number> {
  const merged = { ...previousCounts };

  for (const [key, value] of Object.entries(nextCounts)) {
    merged[key] = (merged[key] ?? 0) + value;
  }

  return merged;
}

export default function Home() {
  const startTimeRef = useRef(Date.now());
  const hasInitializedStarterWordsRef = useRef(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>("practice");
  const [currentRoundWords, setCurrentRoundWords] = useState<string[]>(() => {
    if (INITIAL_ROUND_WORDS.length > 0) {
      return INITIAL_ROUND_WORDS;
    }

    return ["hello"];
  });
  const [typedText, setTypedText] = useState("");
  const [recentWords, setRecentWords] = useState<string[]>([]);
  const [roundCount, setRoundCount] = useState(0);
  const [totalAccuracy, setTotalAccuracy] = useState(0);
  const [totalWpm, setTotalWpm] = useState(0);
  const [sessionLetterErrors, setSessionLetterErrors] = useState<Record<string, number>>({});
  const [sessionPatternErrors, setSessionPatternErrors] = useState<Record<string, number>>({});
  const [activeWeakPatterns, setActiveWeakPatterns] = useState<string[]>([]);
  const [roundHistory, setRoundHistory] = useState<RoundHistoryEntry[]>(() => {
    if (typeof window === "undefined") return [];
    const stored = window.localStorage.getItem(ROUND_HISTORY_STORAGE_KEY);

    if (!stored) {
      return [];
    }

    try {
      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed as RoundHistoryEntry[];
    } catch {
      return [];
    }
  });

  const targetText = useMemo(() => {
    return currentRoundWords.join(" ");
  }, [currentRoundWords]);

  const finishRound = (nextTypedText: string) => {
    const elapsedMilliseconds = Date.now() - startTimeRef.current;
    const roundMetrics = analyzeTypingAttempt(targetText, nextTypedText, elapsedMilliseconds);

    const updatedSessionPatternErrors = mergeCountMaps(
      sessionPatternErrors,
      roundMetrics.errorsByPattern,
    );
    const updatedSessionLetterErrors = mergeCountMaps(
      sessionLetterErrors,
      roundMetrics.errorsByLetter,
    );
    const weakPatterns = getWeakPatterns(updatedSessionPatternErrors, 2, 4);
    const nextRecentWords = [...recentWords, ...currentRoundWords].slice(-RECENT_WORD_LIMIT);
    const nextRound = selectNextWords(
      {
        wordBank,
        weakPatterns,
        recentWords: nextRecentWords,
        fallbackWords: currentRoundWords,
      },
      ROUND_WORD_COUNT,
    );

    const nextRoundCount = roundCount + 1;
    const nextTotalAccuracy = totalAccuracy + roundMetrics.accuracy;
    const nextTotalWpm = totalWpm + roundMetrics.wpm;

    setRoundCount((previousCount) => previousCount + 1);
    setTotalAccuracy((previousTotal) => previousTotal + roundMetrics.accuracy);
    setTotalWpm((previousTotal) => previousTotal + roundMetrics.wpm);
    setRoundHistory((previousHistory) => [
      ...previousHistory,
      {
        round: nextRoundCount,
        accuracy: roundMetrics.accuracy,
        wpm: roundMetrics.wpm,
        averageAccuracy: nextTotalAccuracy / nextRoundCount,
        averageWpm: nextTotalWpm / nextRoundCount,
      },
    ]);
    setSessionPatternErrors(updatedSessionPatternErrors);
    setSessionLetterErrors(updatedSessionLetterErrors);
    setActiveWeakPatterns(weakPatterns);
    setRecentWords(nextRecentWords);
    setCurrentRoundWords(nextRound.map((entry) => entry.word));
    setTypedText("");
    startTimeRef.current = Date.now();
  };

  const averageAccuracy = roundCount > 0 ? totalAccuracy / roundCount : null;
  const averageWpm = roundCount > 0 ? totalWpm / roundCount : null;

  useEffect(() => {
    const storedTab = window.localStorage.getItem(ACTIVE_TAB_STORAGE_KEY);

    if (storedTab === "practice" || storedTab === "profile") {
      setActiveTab(storedTab);
    }
  }, []);

  useEffect(() => {
    if (hasInitializedStarterWordsRef.current) {
      return;
    }

    hasInitializedStarterWordsRef.current = true;

    const randomStarterWords = getRandomStarterWords(ROUND_WORD_COUNT);
    if (randomStarterWords.length === 0) {
      return;
    }

    setCurrentRoundWords(randomStarterWords);
    setTypedText("");
    startTimeRef.current = Date.now();
  }, []);

  useEffect(() => {
    window.localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, activeTab);
  }, [activeTab]);

  useEffect(() => {
    window.localStorage.setItem(ROUND_HISTORY_STORAGE_KEY, JSON.stringify(roundHistory));
  }, [roundHistory]);

  const handleTypedTextChange = (nextTypedText: string) => {
    setTypedText(nextTypedText);

    if (nextTypedText.length === targetText.length) {
      finishRound(nextTypedText);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#f8f8f8_0%,_#ececec_55%,_#e5e5e5_100%)] px-6 text-center">
      <div className="w-full max-w-4xl rounded-[2rem] border border-black/5 bg-white/80 px-8 py-14 shadow-[0_20px_80px_rgba(0,0,0,0.08)] backdrop-blur-sm sm:px-12">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-8">
          <div className="space-y-3">
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-zinc-500">
              Typing Tutor Prototype
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-5xl">
              Adaptive typing excercises for pattern improvement
            </h1>
            <p className="text-base text-zinc-600 sm:text-lg">
              Complete each round of 10 words to get a new adaptive prompt set based on weak
              patterns.
            </p>
          </div>

          <div className="w-full rounded-2xl border border-zinc-200 bg-white p-1">
            <div className="grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={() => setActiveTab("practice")}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  activeTab === "practice"
                    ? "bg-zinc-900 text-white"
                    : "bg-transparent text-zinc-600 hover:bg-zinc-100"
                }`}
              >
                Practice
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("profile")}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  activeTab === "profile"
                    ? "bg-zinc-900 text-white"
                    : "bg-transparent text-zinc-600 hover:bg-zinc-100"
                }`}
              >
                User Profile
              </button>
            </div>
          </div>

          {activeTab === "practice" ? (
            <PracticeTab
              targetText={targetText}
              typedText={typedText}
              averageAccuracy={averageAccuracy}
              averageWpm={averageWpm}
              roundCount={roundCount}
              onTypedTextChange={handleTypedTextChange}
            />
          ) : (
            <ProfileTab
              roundHistory={roundHistory}
              activeWeakPatterns={activeWeakPatterns}
              sessionLetterErrors={sessionLetterErrors}
              sessionPatternErrors={sessionPatternErrors}
            />
          )}
        </div>
      </div>
    </main>
  );
}
