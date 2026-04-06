import type { WordBankEntry } from "../data/wordBank";

export type PromptSelectionInput = {
  wordBank: WordBankEntry[];
  weakPatterns: string[];
  recentWords: string[];
  fallbackWord?: string;
  fallbackWords?: string[];
};

export function getWordsByTag(wordBank: WordBankEntry[], tag: string): WordBankEntry[] {
  const normalizedTag = tag.trim().toLowerCase();
  if (normalizedTag.length === 0) {
    return [];
  }

  return wordBank.filter((entry) => entry.tags.includes(normalizedTag));
}

export function getWeakPatterns(
  patternErrorCounts: Record<string, number>,
  minimumOccurrences = 2,
  maxPatterns = 4,
): string[] {
  return Object.entries(patternErrorCounts)
    .filter(([, count]) => count >= minimumOccurrences)
    .sort((firstEntry, secondEntry) => secondEntry[1] - firstEntry[1])
    .slice(0, maxPatterns)
    .map(([pattern]) => pattern);
}

export function selectNextWord({
  wordBank,
  weakPatterns,
  recentWords,
  fallbackWord,
}: PromptSelectionInput): WordBankEntry {
  return selectNextWords(
    {
      wordBank,
      weakPatterns,
      recentWords,
      fallbackWord,
    },
    1,
  )[0]!;
}

function shuffleEntries(entries: WordBankEntry[]): WordBankEntry[] {
  const shuffled = [...entries];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const current = shuffled[index]!;
    shuffled[index] = shuffled[swapIndex]!;
    shuffled[swapIndex] = current;
  }

  return shuffled;
}

function pickWeightedRandomIndex(weights: number[]): number {
  const totalWeight = weights.reduce((sum, weight) => sum + Math.max(weight, 0), 0);

  if (totalWeight <= 0) {
    return Math.floor(Math.random() * weights.length);
  }

  let randomValue = Math.random() * totalWeight;

  for (let index = 0; index < weights.length; index += 1) {
    randomValue -= Math.max(weights[index]!, 0);
    if (randomValue <= 0) {
      return index;
    }
  }

  return weights.length - 1;
}

export function selectNextWords(
  {
    wordBank,
    weakPatterns,
    recentWords,
    fallbackWord,
    fallbackWords,
  }: PromptSelectionInput,
  count: number,
): WordBankEntry[] {
  if (count <= 0) {
    return [];
  }

  if (wordBank.length === 0) {
    const fallback = fallbackWords?.[0] ?? fallbackWord ?? "";
    return [{ word: fallback, tags: [] }];
  }

  const selected = new Map<string, WordBankEntry>();
  const recentWordSet = new Set(recentWords.map((word) => word.toLowerCase()));
  const scoredWords = new Map<string, { entry: WordBankEntry; score: number }>();

  weakPatterns.forEach((pattern, patternIndex) => {
    const weight = weakPatterns.length - patternIndex;

    getWordsByTag(wordBank, pattern).forEach((entry) => {
      if (recentWordSet.has(entry.word.toLowerCase())) {
        return;
      }

      const existing = scoredWords.get(entry.word);
      if (existing) {
        existing.score += weight;
        return;
      }

      scoredWords.set(entry.word, { entry, score: weight });
    });
  });

  const preferredPool = Array.from(scoredWords.values());
  const focusRatio = weakPatterns.length > 0 ? 0.7 : 0;
  const focusTargetCount = Math.min(
    count,
    preferredPool.length,
    Math.max(0, Math.floor(count * focusRatio)),
  );

  const weightedCandidates = [...preferredPool];
  for (let pickCount = 0; pickCount < focusTargetCount; pickCount += 1) {
    if (weightedCandidates.length === 0) {
      break;
    }

    const weights = weightedCandidates.map((candidate) => candidate.score);
    const selectedIndex = pickWeightedRandomIndex(weights);
    const [picked] = weightedCandidates.splice(selectedIndex, 1);

    if (picked) {
      selected.set(picked.entry.word, picked.entry);
    }
  }

  const nonRecentPool = shuffleEntries(
    wordBank.filter((entry) => !recentWordSet.has(entry.word.toLowerCase()) && !selected.has(entry.word)),
  );

  for (const entry of nonRecentPool) {
    if (selected.size >= count) {
      break;
    }

    selected.set(entry.word, entry);
  }

  const fullFallbackPool = shuffleEntries(
    wordBank.filter((entry) => !selected.has(entry.word)),
  );

  for (const entry of fullFallbackPool) {
    if (selected.size >= count) {
      break;
    }

    selected.set(entry.word, entry);
  }

  if (selected.size === 0) {
    const fallback = fallbackWords?.[0] ?? fallbackWord ?? wordBank[0]!.word;
    selected.set(fallback, { word: fallback, tags: [] });
  }

  return Array.from(selected.values()).slice(0, count);
}
