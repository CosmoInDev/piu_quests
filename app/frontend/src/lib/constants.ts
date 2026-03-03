export const DIFFICULTY_SLOTS = [
  { label: "S19", level: 19, mode: "single" as const },
  { label: "S20/D20", level: 20, mode: undefined },
  { label: "S21/D21", level: 21, mode: undefined },
  { label: "S22/D22", level: 22, mode: undefined },
  { label: "S23/D23", level: 23, mode: undefined },
  { label: "S24/D24", level: 24, mode: undefined },
  { label: "S25/D25", level: 25, mode: undefined },
  { label: "D26", level: 26, mode: "double" as const },
] as const;
