"use client";

import { useMemo } from "react";

type PromptDisplayProps = {
  targetText: string;
  typedText: string;
  erroredIndices?: number[];
};

export function PromptDisplay({
  targetText,
  typedText,
  erroredIndices = [],
}: PromptDisplayProps) {
  const erroredIndexSet = useMemo(() => new Set(erroredIndices), [erroredIndices]);

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

  return (
    <p
      aria-label="Typing prompt"
      className="flex flex-wrap justify-center gap-y-2 text-4xl font-medium leading-relaxed text-zinc-400 sm:text-5xl"
    >
      {promptSegments.map((segment) => (
        <span key={`${segment.startIndex}-${segment.text}`} className="whitespace-nowrap">
          {Array.from(segment.text).map((character, offset) => {
            const index = segment.startIndex + offset;
            const state = characterStates[index];
            const isErroredIndex = erroredIndexSet.has(index);

            const colorClass =
              isErroredIndex
                ? "text-red-500"
                : state === "correct"
                ? "text-zinc-950"
                : state === "mistyped"
                  ? "text-red-500"
                  : "text-zinc-400";

            const underlineClass =
              index === typedText.length ? "underline decoration-2 underline-offset-[0.18em]" : "";

            return (
              <span key={`${character}-${index}`} className={`${colorClass} ${underlineClass}`}>
                {character === " " ? "\u00a0" : character}
              </span>
            );
          })}
        </span>
      ))}
    </p>
  );
}
