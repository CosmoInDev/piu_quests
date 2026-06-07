// 추첨 슬롯. mode/type 등 추첨 조건은 레벨에 따라 서버(/api/pick)에서 결정한다.
export const DIFFICULTY_SLOTS = [
  { label: "S19", level: 19 },
  { label: "S20/D20", level: 20 },
  { label: "S21/D21", level: 21 },
  { label: "S22/D22", level: 22 },
  { label: "S23/D23", level: 23 },
  { label: "S24/D24", level: 24 },
  { label: "S25/D25", level: 25 },
  { label: "D26", level: 26 },
] as const;
