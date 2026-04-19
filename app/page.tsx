"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PracticeTab } from "../components/PracticeTab";
import { ProfileTab } from "../components/ProfileTab";

import { wordBank } from "../data/wordBank";
import { useActiveTab } from "../hooks/useActiveTab";
import { useRoundHistory } from "../hooks/useRoundHistory";
import { useSessionErrors } from "../hooks/useSessionErrors";
import {
  RECENT_WORD_LIMIT,
  ROUND_WORD_COUNT,
} from "../lib/sessionConfig";
import { getWeakPatterns, selectNextWords } from "../lib/promptSelection";
import { analyzeTypingAttempt } from "../lib/typingMetrics";

const INITIAL_ROUND_WORDS = wordBank.slice(0, ROUND_WORD_COUNT).map((entry) => entry.word);
const ERROR_RETENTION_ROUNDS = 5;

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

function updateSessionErrorMemory({
  previousCounts,
  previousLastSeen,
  roundErrors,
  currentRound,
  retentionRounds,
}: {
  previousCounts: Record<string, number>;
  previousLastSeen: Record<string, number>;
  roundErrors: Record<string, number>;
  currentRound: number;
  retentionRounds: number;
}) {
  const nextCounts = { ...previousCounts };
  const nextLastSeen = { ...previousLastSeen };

  for (const [errorKey, count] of Object.entries(roundErrors)) {
    if (count <= 0) {
      continue;
    }

    nextCounts[errorKey] = (nextCounts[errorKey] ?? 0) + count;
    nextLastSeen[errorKey] = currentRound;
  }

  for (const errorKey of Object.keys(nextCounts)) {
    const lastSeenRound = nextLastSeen[errorKey];
    if (typeof lastSeenRound !== "number") {
      delete nextCounts[errorKey];
      delete nextLastSeen[errorKey];
      continue;
    }

    if (currentRound - lastSeenRound >= retentionRounds) {
      delete nextCounts[errorKey];
      delete nextLastSeen[errorKey];
    }
  }

  return { counts: nextCounts, lastSeen: nextLastSeen };
}

function getTopErrorKey(errorCounts: Record<string, number>): string | null {
  const [topEntry] = Object.entries(errorCounts).sort(
    (firstEntry, secondEntry) => secondEntry[1] - firstEntry[1],
  );

  return topEntry?.[0] ?? null;
}

export default function Home() {
  const startTimeRef = useRef(Date.now());
  const hasInitializedStarterWordsRef = useRef(false);
  const { activeTab, setActiveTab } = useActiveTab("practice");
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
  const [roundWrongKeyCount, setRoundWrongKeyCount] = useState(0);
  const [roundErroredIndices, setRoundErroredIndices] = useState<number[]>([]);
  const [roundLetterErrors, setRoundLetterErrors] = useState<Record<string, number>>({});
  const [roundPatternErrors, setRoundPatternErrors] = useState<Record<string, number>>({});
  const {
    letterErrors: sessionLetterErrors,
    setLetterErrors: setSessionLetterErrors,
    patternErrors: sessionPatternErrors,
    setPatternErrors: setSessionPatternErrors,
    letterLastSeenRound: sessionLetterLastSeenRound,
    setLetterLastSeenRound: setSessionLetterLastSeenRound,
    patternLastSeenRound: sessionPatternLastSeenRound,
    setPatternLastSeenRound: setSessionPatternLastSeenRound,
    resetSessionErrors,
  } = useSessionErrors();
  const { roundHistory, setRoundHistory } = useRoundHistory();

  const targetText = useMemo(() => {
    return currentRoundWords.join(" ");
  }, [currentRoundWords]);

  const recordBlockedError = (index: number) => {
    const expectedCharacter = targetText[index];

    if (!expectedCharacter) {
      return;
    }

    const normalizedCharacter = expectedCharacter.toLowerCase();
    if (normalizedCharacter !== " ") {
      setRoundLetterErrors((previousErrors) => ({
        ...previousErrors,
        [normalizedCharacter]: (previousErrors[normalizedCharacter] ?? 0) + 1,
      }));
    }

    const previousCharacter = targetText[index - 1] ?? "";
    const pattern = `${previousCharacter.toLowerCase()}${normalizedCharacter}`;
    if (pattern.length === 2 && !pattern.includes(" ")) {
      setRoundPatternErrors((previousErrors) => ({
        ...previousErrors,
        [pattern]: (previousErrors[pattern] ?? 0) + 1,
      }));
    }

    setRoundErroredIndices((previousIndices) => {
      if (previousIndices.includes(index)) {
        return previousIndices;
      }

      return [...previousIndices, index];
    });

    setRoundWrongKeyCount((previousCount) => previousCount + 1);
  };

  const finishRound = (nextTypedText: string) => {
    const elapsedMilliseconds = Date.now() - startTimeRef.current;
    const roundMetrics = analyzeTypingAttempt(targetText, nextTypedText, elapsedMilliseconds);

    const roundAccuracy =
      targetText.length > 0
        ? (targetText.length / (targetText.length + roundWrongKeyCount)) * 100
        : 100;
    const nextRoundCount = roundCount + 1;

    const mergedRoundPatternErrors = mergeCountMaps(roundMetrics.errorsByPattern, roundPatternErrors);
    const mergedRoundLetterErrors = mergeCountMaps(roundMetrics.errorsByLetter, roundLetterErrors);

    const updatedPatternMemory = updateSessionErrorMemory({
      previousCounts: sessionPatternErrors,
      previousLastSeen: sessionPatternLastSeenRound,
      roundErrors: mergedRoundPatternErrors,
      currentRound: nextRoundCount,
      retentionRounds: ERROR_RETENTION_ROUNDS,
    });
    const updatedLetterMemory = updateSessionErrorMemory({
      previousCounts: sessionLetterErrors,
      previousLastSeen: sessionLetterLastSeenRound,
      roundErrors: mergedRoundLetterErrors,
      currentRound: nextRoundCount,
      retentionRounds: ERROR_RETENTION_ROUNDS,
    });
    const updatedSessionPatternErrors = updatedPatternMemory.counts;
    const updatedSessionLetterErrors = updatedLetterMemory.counts;
    const weakPatterns = Array.from(
      new Set([
        getTopErrorKey(updatedSessionLetterErrors),
        ...getWeakPatterns(updatedSessionPatternErrors, 2, 4),
      ].filter((pattern): pattern is string => Boolean(pattern))),
    );
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

    const nextTotalAccuracy = totalAccuracy + roundAccuracy;
    const nextTotalWpm = totalWpm + roundMetrics.wpm;

    setRoundCount((previousCount) => previousCount + 1);
    setTotalAccuracy((previousTotal) => previousTotal + roundAccuracy);
    setTotalWpm((previousTotal) => previousTotal + roundMetrics.wpm);
    setRoundHistory((previousHistory) => [
      ...previousHistory,
      {
        round: nextRoundCount,
        accuracy: roundAccuracy,
        wpm: roundMetrics.wpm,
        averageAccuracy: nextTotalAccuracy / nextRoundCount,
        averageWpm: nextTotalWpm / nextRoundCount,
      },
    ]);
    setSessionPatternErrors(updatedSessionPatternErrors);
    setSessionLetterErrors(updatedSessionLetterErrors);
    setSessionPatternLastSeenRound(updatedPatternMemory.lastSeen);
    setSessionLetterLastSeenRound(updatedLetterMemory.lastSeen);
    setRecentWords(nextRecentWords);
    setCurrentRoundWords(nextRound.map((entry) => entry.word));
    setTypedText("");
    setRoundWrongKeyCount(0);
    setRoundErroredIndices([]);
    setRoundLetterErrors({});
    setRoundPatternErrors({});
    startTimeRef.current = Date.now();
  };

  const averageAccuracy = roundCount > 0 ? totalAccuracy / roundCount : null;
  const averageWpm = roundCount > 0 ? totalWpm / roundCount : null;
  const activeWeakPatterns = useMemo(() => {
    return Array.from(
      new Set([
        getTopErrorKey(sessionLetterErrors),
        ...getWeakPatterns(sessionPatternErrors, 2, 4),
      ].filter((pattern): pattern is string => Boolean(pattern))),
    );
  }, [sessionLetterErrors, sessionPatternErrors]);

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
    setRoundWrongKeyCount(0);
    setRoundErroredIndices([]);
    setRoundLetterErrors({});
    setRoundPatternErrors({});
    startTimeRef.current = Date.now();
  }, []);

  const handleTypeKey = (key: string) => {
    if (typedText.length >= targetText.length) {
      return;
    }

    const currentIndex = typedText.length;
    const expectedCharacter = targetText[currentIndex];

    if (key !== expectedCharacter) {
      recordBlockedError(currentIndex);
      return;
    }

    const nextTypedText = `${typedText}${key}`;
    setTypedText(nextTypedText);

    if (nextTypedText.length === targetText.length) {
      finishRound(nextTypedText);
    }
  };

  const handleResetSession = () => {
    setRoundCount(0);
    setTotalAccuracy(0);
    setTotalWpm(0);
    setRoundWrongKeyCount(0);
    setRoundErroredIndices([]);
    setRoundLetterErrors({});
    setRoundPatternErrors({});
    resetSessionErrors();
    setRecentWords([]);
    setRoundHistory([]);
    setTypedText("");
    setCurrentRoundWords(getRandomStarterWords(ROUND_WORD_COUNT));
    startTimeRef.current = Date.now();
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
              Adaptive typing excercises
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
              erroredIndices={roundErroredIndices}
              averageAccuracy={averageAccuracy}
              averageWpm={averageWpm}
              roundCount={roundCount}
              onTypeKey={handleTypeKey}
            />
          ) : (
            <ProfileTab
              roundHistory={roundHistory}
              activeWeakPatterns={activeWeakPatterns}
              sessionLetterErrors={sessionLetterErrors}
              sessionPatternErrors={sessionPatternErrors}
              onResetSession={handleResetSession}
            />
          )}
        </div>
      </div>
    </main>
  );
}
