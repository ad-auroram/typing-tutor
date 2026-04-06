"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { wordBank } from "../data/wordBank";
import { getWeakPatterns, selectNextWords } from "../lib/promptSelection";
import { analyzeTypingAttempt } from "../lib/typingMetrics";

const ROUND_WORD_COUNT = 10;
const RECENT_WORD_LIMIT = 30;
const ACTIVE_TAB_STORAGE_KEY = "typingTutor.activeTab";

const INITIAL_ROUND_WORDS = wordBank.slice(0, ROUND_WORD_COUNT).map((entry) => entry.word);

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
  const [activeTab, setActiveTab] = useState<"practice" | "profile">("practice");
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

    setRoundCount((previousCount) => previousCount + 1);
    setTotalAccuracy((previousTotal) => previousTotal + roundMetrics.accuracy);
    setTotalWpm((previousTotal) => previousTotal + roundMetrics.wpm);
    setSessionPatternErrors(updatedSessionPatternErrors);
    setSessionLetterErrors(updatedSessionLetterErrors);
    setActiveWeakPatterns(weakPatterns);
    setRecentWords(nextRecentWords);
    setCurrentRoundWords(nextRound.map((entry) => entry.word));
    setTypedText("");
    startTimeRef.current = Date.now();
  };

  const characterStates = useMemo(() => {
    return Array.from(targetText).map((character, index) => {
      const typedCharacter = typedText[index];

      if (typeof typedCharacter === "undefined") {
        return "pending" as const;
      }

      return typedCharacter === character ? ("correct" as const) : ("mistyped" as const);
    });
  }, [targetText, typedText]);

  const promptSegments = useMemo(() => {
    const words = targetText.split(" ");
    let startIndex = 0;

    return words.map((word, wordIndex) => {
      const hasTrailingSpace = wordIndex < words.length - 1;
      const segmentText = hasTrailingSpace ? `${word} ` : word;
      const segment = { text: segmentText, startIndex };

      startIndex += segmentText.length;
      return segment;
    });
  }, [targetText]);

  const sortedErrorsByLetter = useMemo(() => {
    return Object.entries(sessionLetterErrors).sort((firstEntry, secondEntry) => secondEntry[1] - firstEntry[1]);
  }, [sessionLetterErrors]);

  const sortedErrorsByPattern = useMemo(() => {
    return Object.entries(sessionPatternErrors).sort((firstEntry, secondEntry) => secondEntry[1] - firstEntry[1]);
  }, [sessionPatternErrors]);

  const averageAccuracy = roundCount > 0 ? totalAccuracy / roundCount : null;
  const averageWpm = roundCount > 0 ? totalWpm / roundCount : null;

  useEffect(() => {
    const storedTab = window.localStorage.getItem(ACTIVE_TAB_STORAGE_KEY);

    if (storedTab === "practice" || storedTab === "profile") {
      setActiveTab(storedTab);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, activeTab);
  }, [activeTab]);

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
            <div className="w-full rounded-[1.5rem] border border-zinc-200 bg-zinc-50 px-6 py-10 sm:px-10 sm:py-12">
              <p
                aria-label="Typing prompt"
                className="flex flex-wrap justify-center gap-y-2 text-4xl font-medium leading-relaxed text-zinc-400 sm:text-5xl"
              >
                {promptSegments.map((segment) => (
                  <span key={`${segment.startIndex}-${segment.text}`} className="whitespace-nowrap">
                    {Array.from(segment.text).map((character, offset) => {
                      const index = segment.startIndex + offset;
                      const state = characterStates[index];

                      const colorClass =
                        state === "correct"
                          ? "text-zinc-950"
                          : state === "mistyped"
                            ? "text-red-500"
                            : "text-zinc-400";

                      const underlineClass =
                        index === typedText.length
                          ? "underline decoration-2 underline-offset-[0.18em]"
                          : "";

                      return (
                        <span key={`${character}-${index}`} className={`${colorClass} ${underlineClass}`}>
                          {character === " " ? "\u00a0" : character}
                        </span>
                      );
                    })}
                  </span>
                ))}
              </p>

              <label className="sr-only" htmlFor="typing-input">
                Type the prompt text
              </label>
              <input
                id="typing-input"
                type="text"
                autoComplete="off"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                value={typedText}
                onChange={(event) => {
                  const nextTypedText = event.target.value.slice(0, targetText.length);
                  setTypedText(nextTypedText);

                  if (nextTypedText.length === targetText.length) {
                    finishRound(nextTypedText);
                  }
                }}
                className="mt-8 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-lg text-zinc-900 outline-none transition focus:border-zinc-400"
                placeholder="Type all 10 words; next round appears automatically"
              />

              <div className="mt-8 grid gap-4 text-left sm:grid-cols-3">
                <MetricCard
                  label="Average Accuracy"
                  value={averageAccuracy !== null ? `${averageAccuracy.toFixed(1)}%` : "-"}
                  helperText="Average across all completed rounds"
                />
                <MetricCard
                  label="Average WPM"
                  value={averageWpm !== null ? averageWpm.toFixed(1) : "-"}
                  helperText="Average across all completed rounds"
                />
                <MetricCard
                  label="Completed Rounds"
                  value={`${roundCount}`}
                  helperText="Total 10-word rounds finished this session"
                />
              </div>
            </div>
          ) : (
            <div className="w-full rounded-[1.5rem] border border-zinc-200 bg-zinc-50 px-6 py-10 text-left sm:px-10 sm:py-12">
              <div className="rounded-2xl border border-zinc-200 bg-white px-5 py-4">
                <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-zinc-500">
                  Active weak patterns
                </h2>
                {activeWeakPatterns.length > 0 ? (
                  <p className="mt-2 text-sm text-zinc-700">
                    {activeWeakPatterns.join(", ")}
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-zinc-500">
                    Build up a few repeated mistakes to unlock targeted pattern practice.
                  </p>
                )}
              </div>

              <div className="mt-6 rounded-2xl border border-zinc-200 bg-white px-5 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-zinc-500">
                      Errors by letter
                    </h2>
                    <p className="mt-1 text-sm text-zinc-500">
                      Session totals grouped by target letters that were missed.
                    </p>
                  </div>
                </div>

                {sortedErrorsByLetter.length > 0 ? (
                  <ul className="mt-4 space-y-2">
                    {sortedErrorsByLetter.map(([letter, count]) => (
                      <li key={letter} className="flex items-center justify-between rounded-xl bg-zinc-50 px-4 py-3 text-sm">
                        <span className="font-medium text-zinc-700">{letter}</span>
                        <span className="text-zinc-900">{count}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 text-sm text-zinc-500">No letter-level errors yet.</p>
                )}
              </div>

              <div className="mt-4 rounded-2xl border border-zinc-200 bg-white px-5 py-4">
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-zinc-500">
                    Error patterns
                  </h2>
                  <p className="mt-1 text-sm text-zinc-500">
                    Session totals for missed-letter pairs used in adaptive prompt selection.
                  </p>
                </div>

                {sortedErrorsByPattern.length > 0 ? (
                  <ul className="mt-4 space-y-2">
                    {sortedErrorsByPattern.map(([pattern, count]) => (
                      <li key={pattern} className="flex items-center justify-between rounded-xl bg-zinc-50 px-4 py-3 text-sm">
                        <span className="font-medium text-zinc-700">
                          {pattern}
                          {count > 1 ? <span className="ml-2 text-xs uppercase tracking-[0.2em] text-zinc-400">consistent</span> : null}
                        </span>
                        <span className="text-zinc-900">{count}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 text-sm text-zinc-500">No error patterns yet.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function MetricCard({
  label,
  value,
  helperText,
}: {
  label: string;
  value: string;
  helperText: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">{value}</p>
      <p className="mt-1 text-sm text-zinc-500">{helperText}</p>
    </div>
  );
}
