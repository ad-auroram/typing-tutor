export type TypingErrorType = "insertion" | "deletion" | "substitution";

export type TypingError = {
  type: TypingErrorType;
  targetLetter: string | null;
  inputLetter: string | null;
};

export type TypingMetrics = {
  accuracy: number;
  wpm: number;
  correctCharacters: number;
  totalTargetCharacters: number;
  errorsByLetter: Record<string, number>;
  errorsByPattern: Record<string, number>;
  errors: TypingError[];
};

type AlignmentStep =
  | { action: "match"; targetIndex: number; inputIndex: number }
  | { action: "substitution"; targetIndex: number; inputIndex: number }
  | { action: "insertion"; targetIndex: number; inputIndex: number }
  | { action: "deletion"; targetIndex: number; inputIndex: number };

function normalizeLetter(letter: string | null): string {
  if (letter === null) {
    return "[missing]";
  }

  return letter === " " ? "[space]" : letter;
}

function buildPatternKey(targetCharacters: string[], targetIndex: number): string | null {
  const currentLetter = targetCharacters[targetIndex];

  if (typeof currentLetter === "undefined") {
    return null;
  }

  const previousLetter = targetIndex > 0 ? targetCharacters[targetIndex - 1] ?? null : null;
  return `${normalizeLetter(previousLetter)}${normalizeLetter(currentLetter)}`;
}

function buildAlignment(targetText: string, inputText: string): AlignmentStep[] {
  const targetCharacters = Array.from(targetText);
  const inputCharacters = Array.from(inputText);
  const targetLength = targetCharacters.length;
  const inputLength = inputCharacters.length;

  const distanceMatrix = Array.from({ length: targetLength + 1 }, () =>
    Array.from({ length: inputLength + 1 }, () => 0),
  );

  for (let targetIndex = 0; targetIndex <= targetLength; targetIndex += 1) {
    distanceMatrix[targetIndex]![0] = targetIndex;
  }

  for (let inputIndex = 0; inputIndex <= inputLength; inputIndex += 1) {
    distanceMatrix[0]![inputIndex] = inputIndex;
  }

  for (let targetIndex = 1; targetIndex <= targetLength; targetIndex += 1) {
    for (let inputIndex = 1; inputIndex <= inputLength; inputIndex += 1) {
      const targetCharacter = targetCharacters[targetIndex - 1]!;
      const inputCharacter = inputCharacters[inputIndex - 1]!;
      const substitutionCost = targetCharacter === inputCharacter ? 0 : 1;

      distanceMatrix[targetIndex]![inputIndex] = Math.min(
        distanceMatrix[targetIndex - 1]![inputIndex]! + 1,
        distanceMatrix[targetIndex]![inputIndex - 1]! + 1,
        distanceMatrix[targetIndex - 1]![inputIndex - 1]! + substitutionCost,
      );
    }
  }

  const alignment: AlignmentStep[] = [];
  let targetIndex = targetLength;
  let inputIndex = inputLength;

  while (targetIndex > 0 || inputIndex > 0) {
    if (
      targetIndex > 0 &&
      inputIndex > 0 &&
      targetCharacters[targetIndex - 1] === inputCharacters[inputIndex - 1] &&
      distanceMatrix[targetIndex]![inputIndex] === distanceMatrix[targetIndex - 1]![inputIndex - 1]
    ) {
      alignment.push({ action: "match", targetIndex: targetIndex - 1, inputIndex: inputIndex - 1 });
      targetIndex -= 1;
      inputIndex -= 1;
      continue;
    }

    if (
      targetIndex > 0 &&
      inputIndex > 0 &&
      distanceMatrix[targetIndex]![inputIndex] === distanceMatrix[targetIndex - 1]![inputIndex - 1]! + 1
    ) {
      alignment.push({ action: "substitution", targetIndex: targetIndex - 1, inputIndex: inputIndex - 1 });
      targetIndex -= 1;
      inputIndex -= 1;
      continue;
    }

    if (
      inputIndex > 0 &&
      distanceMatrix[targetIndex]![inputIndex] === distanceMatrix[targetIndex]![inputIndex - 1]! + 1
    ) {
      alignment.push({ action: "insertion", targetIndex, inputIndex: inputIndex - 1 });
      inputIndex -= 1;
      continue;
    }

    alignment.push({ action: "deletion", targetIndex: targetIndex - 1, inputIndex });
    targetIndex -= 1;
  }

  return alignment.reverse();
}

export function analyzeTypingAttempt(targetText: string, inputText: string, elapsedMilliseconds: number): TypingMetrics {
  const targetCharacters = Array.from(targetText);
  const alignment = buildAlignment(targetText, inputText);

  let correctCharacters = 0;
  const errors: TypingError[] = [];
  const errorsByLetter: Record<string, number> = {};
  const errorsByPattern: Record<string, number> = {};

  for (const step of alignment) {
    if (step.action === "match") {
      correctCharacters += 1;
      continue;
    }

    const targetLetter = step.targetIndex < targetCharacters.length ? targetCharacters[step.targetIndex] ?? null : null;
    const inputLetter = step.inputIndex < Array.from(inputText).length ? Array.from(inputText)[step.inputIndex] ?? null : null;

    errors.push({
      type: step.action,
      targetLetter,
      inputLetter,
    });

    const key = normalizeLetter(targetLetter);
    errorsByLetter[key] = (errorsByLetter[key] ?? 0) + 1;

    const patternKey = buildPatternKey(targetCharacters, step.targetIndex);
    if (patternKey !== null) {
      errorsByPattern[patternKey] = (errorsByPattern[patternKey] ?? 0) + 1;
    }
  }

  const totalTargetCharacters = targetCharacters.length;
  const accuracy = totalTargetCharacters === 0 ? 0 : (correctCharacters / totalTargetCharacters) * 100;
  const minutesElapsed = Math.max(elapsedMilliseconds / 60000, 1 / 60000);
  const wpm = Math.max(((inputText.length / 5) / minutesElapsed), 0);

  return {
    accuracy,
    wpm,
    correctCharacters,
    totalTargetCharacters,
    errorsByLetter,
    errorsByPattern,
    errors,
  };
}
