"use client";

import { useMemo } from "react";

import { sortErrorEntries } from "../lib/errorAnalytics";
import { CHART_ROUND_LIMIT } from "../lib/sessionConfig";
import type { RoundHistoryEntry } from "../types/typing";
import { TrendChart } from "./TrendChart";

type ProfileTabProps = {
  roundHistory: RoundHistoryEntry[];
  activeWeakPatterns: string[];
  sessionLetterErrors: Record<string, number>;
  sessionPatternErrors: Record<string, number>;
  onResetSession: () => void;
  wordBankText: string;
  onWordBankTextChange: (nextText: string) => void;
  onApplyWordBank: () => void;
};

export function ProfileTab({
  roundHistory,
  activeWeakPatterns,
  sessionLetterErrors,
  sessionPatternErrors,
  onResetSession,
  wordBankText,
  onWordBankTextChange,
  onApplyWordBank,
}: ProfileTabProps) {
  const getErrorTextColor = (count: number) => {
    return count >= 3 ? "text-zinc-900" : "text-zinc-500";
  };

  const recentRoundHistory = useMemo(() => {
    return roundHistory.slice(-CHART_ROUND_LIMIT);
  }, [roundHistory]);

  const sortedErrorsByLetter = useMemo(() => {
    return sortErrorEntries(sessionLetterErrors);
  }, [sessionLetterErrors]);

  const sortedErrorsByPattern = useMemo(() => {
    return sortErrorEntries(sessionPatternErrors);
  }, [sessionPatternErrors]);

  return (
    <div className="w-full rounded-[1.5rem] border border-zinc-200 bg-zinc-50 px-6 py-10 text-left sm:px-10 sm:py-12">
      <div className="grid gap-4 lg:grid-cols-2">
        <TrendChart
          title="WPM Over Rounds"
          description="Per-round WPM and running average (last 10 rounds)"
          data={recentRoundHistory}
          valueKey="wpm"
          averageKey="averageWpm"
          color="#0f766e"
          averageColor="#0ea5e9"
          valueLabel="Round WPM"
          averageLabel="Avg WPM"
        />
        <TrendChart
          title="Accuracy Over Rounds"
          description="Per-round accuracy and running average (last 10 rounds)"
          data={recentRoundHistory}
          valueKey="accuracy"
          averageKey="averageAccuracy"
          color="#1d4ed8"
          averageColor="#f97316"
          valueLabel="Round Accuracy"
          averageLabel="Avg Accuracy"
          suffix="%"
        />
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white px-5 py-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-zinc-500">
          Active weak patterns
        </h2>
        {activeWeakPatterns.length > 0 ? (
          <p className="mt-2 text-sm text-zinc-700">{activeWeakPatterns.join(", ")}</p>
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
              <li
                key={letter}
                className="flex items-center justify-between rounded-xl bg-zinc-50 px-4 py-3 text-sm"
              >
                <span className={`font-medium ${getErrorTextColor(count)}`}>{letter}</span>
                <span className={getErrorTextColor(count)}>{count}</span>
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
              <li
                key={pattern}
                className="flex items-center justify-between rounded-xl bg-zinc-50 px-4 py-3 text-sm"
              >
                <span className={`font-medium ${getErrorTextColor(count)}`}>{pattern}</span>
                <span className={getErrorTextColor(count)}>{count}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-zinc-500">No error patterns yet.</p>
        )}
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={onResetSession}
          className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-50"
        >
          Reset Session
        </button>
      </div>

      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-zinc-500">
            Word bank
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Edit the word list below, then apply the changes.
          </p>
        </div>

        <label className="sr-only" htmlFor="word-bank-editor">
          Edit comma-separated word bank
        </label>
        <textarea
          id="word-bank-editor"
          value={wordBankText}
          onChange={(event) => onWordBankTextChange(event.target.value)}
          className="mt-4 min-h-36 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400"
          placeholder="the, to, i, and, of"
        />

        <div className="mt-3 flex items-center justify-between gap-4">
          <p className="text-sm text-zinc-500">
            Comma-separated words only. New words will be normalized to lowercase.
          </p>
          <button
            type="button"
            onClick={onApplyWordBank}
            className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-50"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
