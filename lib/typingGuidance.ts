const HOME_ROW = "A S D F / J K L ;";

const FINGER_LABELS = {
  leftPinky: "left pinky",
  leftRing: "left ring finger",
  leftMiddle: "left middle finger",
  leftIndex: "left index finger",
  rightIndex: "right index finger",
  rightMiddle: "right middle finger",
  rightRing: "right ring finger",
  rightPinky: "right pinky",
  thumb: "thumb",
} as const;

const CHARACTER_TO_FINGER: Record<string, string> = {
  a: FINGER_LABELS.leftPinky,
  q: FINGER_LABELS.leftPinky,
  z: FINGER_LABELS.leftPinky,
  s: FINGER_LABELS.leftRing,
  w: FINGER_LABELS.leftRing,
  x: FINGER_LABELS.leftRing,
  d: FINGER_LABELS.leftMiddle,
  e: FINGER_LABELS.leftMiddle,
  c: FINGER_LABELS.leftMiddle,
  f: FINGER_LABELS.leftIndex,
  r: FINGER_LABELS.leftIndex,
  v: FINGER_LABELS.leftIndex,
  t: FINGER_LABELS.leftIndex,
  g: FINGER_LABELS.leftIndex,
  b: FINGER_LABELS.leftIndex,
  j: FINGER_LABELS.rightIndex,
  y: FINGER_LABELS.rightIndex,
  h: FINGER_LABELS.rightIndex,
  u: FINGER_LABELS.rightIndex,
  n: FINGER_LABELS.rightIndex,
  m: FINGER_LABELS.rightIndex,
  k: FINGER_LABELS.rightMiddle,
  i: FINGER_LABELS.rightMiddle,
  l: FINGER_LABELS.rightRing,
  o: FINGER_LABELS.rightRing,
  p: FINGER_LABELS.rightPinky,
  "[": FINGER_LABELS.rightPinky,
  "]": FINGER_LABELS.rightPinky,
  ";": FINGER_LABELS.rightPinky,
  "'": FINGER_LABELS.rightPinky,
  "/": FINGER_LABELS.rightPinky,
  " ": FINGER_LABELS.thumb,
};

export function getHomeRowGuidance(): string {
  return `Start with your fingers on ${HOME_ROW}.`;
}

export function getFingerGuidance(character: string | undefined): string {
  if (!character) {
    return getHomeRowGuidance();
  }

  const normalizedCharacter = character.toLowerCase();
  const finger = CHARACTER_TO_FINGER[normalizedCharacter];

  if (!finger) {
    return `Use the finger that normally reaches "${character}".`;
  }

  if (normalizedCharacter === " ") {
    return "Use your thumb for the space bar.";
  }

  return `Use your ${finger} for "${character}".`;
}
