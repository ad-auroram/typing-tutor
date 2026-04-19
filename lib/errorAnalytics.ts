import { getWeakPatterns } from "./promptSelection";

export function sortErrorEntries(errorCounts: Record<string, number>): Array<[string, number]> {
  return Object.entries(errorCounts).sort(
    (firstEntry, secondEntry) => secondEntry[1] - firstEntry[1],
  );
}

export function getTopErrorKey(errorCounts: Record<string, number>): string | null {
  const [topEntry] = sortErrorEntries(errorCounts);

  return topEntry?.[0] ?? null;
}

export function getActiveWeakPatterns(
  letterErrorCounts: Record<string, number>,
  patternErrorCounts: Record<string, number>,
  minimumOccurrences = 2,
  maxPatterns = 4,
): string[] {
  return Array.from(
    new Set([
      getTopErrorKey(letterErrorCounts),
      ...getWeakPatterns(patternErrorCounts, minimumOccurrences, maxPatterns),
    ].filter((pattern): pattern is string => Boolean(pattern))),
  );
}