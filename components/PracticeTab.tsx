"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { MetricCard } from "./MetricCard";
import { PromptDisplay } from "./PromptDisplay";
import { getFingerGuidance, getHomeRowGuidance } from "../lib/typingGuidance";

type PracticeTabProps = {
  targetText: string;
  typedText: string;
  erroredIndices: number[];
  averageAccuracy: number | null;
  averageWpm: number | null;
  roundCount: number;
  onTypeKey: (key: string) => void;
};

export function PracticeTab({
  targetText,
  typedText,
  erroredIndices,
  averageAccuracy,
  averageWpm,
  roundCount,
  onTypeKey,
}: PracticeTabProps) {
  const typingSurfaceRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [guidanceText, setGuidanceText] = useState(getHomeRowGuidance());

  const currentCharacter = useMemo(() => {
    return typedText.length < targetText.length ? targetText[typedText.length] : undefined;
  }, [targetText, typedText.length]);

  useEffect(() => {
    if (typedText.length === 0) {
      setGuidanceText(getHomeRowGuidance());
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setGuidanceText(getFingerGuidance(currentCharacter));
    }, 1200);

    return () => window.clearTimeout(timeoutId);
  }, [currentCharacter, typedText.length]);

  useEffect(() => {
    if (typedText.length > 0) {
      return;
    }

    setGuidanceText(getHomeRowGuidance());
  }, [typedText.length, targetText]);

  return (
    <div className="w-full rounded-[1.5rem] border border-zinc-200 bg-zinc-50 px-6 py-10 sm:px-10 sm:py-12">
      <div
        ref={typingSurfaceRef}
        role="textbox"
        tabIndex={0}
        aria-label="Typing activity area"
        aria-multiline={false}
        onClick={() => typingSurfaceRef.current?.focus()}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onKeyDown={(event) => {
          if (event.key === "Backspace") {
            event.preventDefault();
            return;
          }

          if (event.key.length !== 1) {
            return;
          }

          event.preventDefault();
          onTypeKey(event.key);
        }}
        className={`mt-2 rounded-2xl border bg-white px-4 py-6 text-left outline-none transition ${
          isFocused
            ? "border-zinc-800 ring-2 ring-zinc-300"
            : "border-zinc-200 hover:border-zinc-400"
        }`}
      >
        <PromptDisplay
          targetText={targetText}
          typedText={typedText}
          erroredIndices={erroredIndices}
        />
      </div>

      <p className="mt-3 text-sm text-zinc-600">{guidanceText}</p>

      <p className="mt-1 text-sm text-zinc-500">
        Click the typing area to focus. You must type the current letter correctly to move forward.
      </p>

      <div className="mt-8 grid gap-4 text-left sm:grid-cols-3">
        <MetricCard
          label="Average Accuracy"
          value={averageAccuracy !== null ? `${averageAccuracy.toFixed(1)}%` : "-"}
          helperText="From all completed rounds"
        />
        <MetricCard
          label="Average WPM"
          value={averageWpm !== null ? averageWpm.toFixed(1) : "-"}
          helperText="From all completed rounds"
        />
        <MetricCard
          label="Completed Rounds"
          value={`${roundCount}`}
          helperText="Finished this session"
        />
      </div>
    </div>
  );
}
