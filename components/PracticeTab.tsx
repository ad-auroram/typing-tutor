"use client";

import { MetricCard } from "./MetricCard";
import { PromptDisplay } from "./PromptDisplay";

type PracticeTabProps = {
  targetText: string;
  typedText: string;
  averageAccuracy: number | null;
  averageWpm: number | null;
  roundCount: number;
  onTypedTextChange: (nextTypedText: string) => void;
};

export function PracticeTab({
  targetText,
  typedText,
  averageAccuracy,
  averageWpm,
  roundCount,
  onTypedTextChange,
}: PracticeTabProps) {
  return (
    <div className="w-full rounded-[1.5rem] border border-zinc-200 bg-zinc-50 px-6 py-10 sm:px-10 sm:py-12">
      <PromptDisplay targetText={targetText} typedText={typedText} />

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
          onTypedTextChange(nextTypedText);
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
  );
}
