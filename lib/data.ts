export type Stage = "group" | "r32" | "r16" | "qf" | "sf" | "final" | "champion";

export const SCORING = {
  groupWin: 2,
  groupWinnerBonus: 1,
  milestones: { r32: 3, r16: 2, qf: 3, sf: 4, final: 5, champion: 8 } as Record<Exclude<Stage, "group">, number>,
};

// Stage ordering used to award cumulative milestone points.
export const STAGE_ORDER: Stage[] = ["group", "r32", "r16", "qf", "sf", "final", "champion"];

// All 48 teams: code -> { name, group }
export const TEAMS: Record<string, { name: string; group: string }> = {
  MEX: { name: "Mexico", group: "A" }, KOR: { name: "South Korea", group: "A" }, CZE: { name: "Czech Republic", group: "A" }, RSA: { name: "South Africa", group: "A" },
  SUI: { name: "Switzerland", group: "B" }, CAN: { name: "Canada", group: "B" }, QAT: { name: "Qatar", group: "B" }, BIH: { name: "Bosnia & Herzegovina", group: "B" },
  SCO: { name: "Scotland", group: "C" }, MAR: { name: "Morocco", group: "C" }, BRA: { name: "Brazil", group: "C" }, HAI: { name: "Haiti", group: "C" },
  USA: { name: "United States", group: "D" }, AUS: { name: "Australia", group: "D" }, TUR: { name: "Turkey", group: "D" }, PAR: { name: "Paraguay", group: "D" },
  GER: { name: "Germany", group: "E" }, CIV: { name: "Ivory Coast", group: "E" }, ECU: { name: "Ecuador", group: "E" }, CUW: { name: "Curacao", group: "E" },
  SWE: { name: "Sweden", group: "F" }, JPN: { name: "Japan", group: "F" }, NED: { name: "Netherlands", group: "F" }, TUN: { name: "Tunisia", group: "F" },
  BEL: { name: "Belgium", group: "G" }, EGY: { name: "Egypt", group: "G" }, IRN: { name: "Iran", group: "G" }, NZL: { name: "New Zealand", group: "G" },
  ESP: { name: "Spain", group: "H" }, CPV: { name: "Cape Verde", group: "H" }, URU: { name: "Uruguay", group: "H" }, KSA: { name: "Saudi Arabia", group: "H" },
  FRA: { name: "France", group: "I" }, SEN: { name: "Senegal", group: "I" }, IRQ: { name: "Iraq", group: "I" }, NOR: { name: "Norway", group: "I" },
  ARG: { name: "Argentina", group: "J" }, ALG: { name: "Algeria", group: "J" }, AUT: { name: "Austria", group: "J" }, JOR: { name: "Jordan", group: "J" },
  POR: { name: "Portugal", group: "K" }, COD: { name: "DR Congo", group: "K" }, UZB: { name: "Uzbekistan", group: "K" }, COL: { name: "Colombia", group: "K" },
  ENG: { name: "England", group: "L" }, CRO: { name: "Croatia", group: "L" }, GHA: { name: "Ghana", group: "L" }, PAN: { name: "Panama", group: "L" },
};

// Manager -> drafted team codes (8 each, snake draft, 48 total).
export const ROSTERS: Record<string, string[]> = {
  "The Prince Who Was Promised": ["GER", "BEL", "CIV", "USA", "GHA", "PAN", "QAT", "JOR"],
  "Keith": ["ENG", "NED", "CRO", "MEX", "PAR", "SWE", "BIH", "COD"],
  "Ram": ["ESP", "MAR", "COL", "IRN", "AUS", "CZE", "TUN", "CPV"],
  "Chailuv": ["BRA", "POR", "SEN", "ECU", "ALG", "SCO", "RSA", "IRQ"],
  "Vini Vidi Vici": ["FRA", "TUR", "JPN", "KOR", "AUT", "KSA", "NZL", "HAI"],
  "Karan": ["ARG", "NOR", "SUI", "URU", "CAN", "EGY", "UZB", "CUW"],
};

// Group-stage match results. Add one object per completed group game.
// home/away order doesn't matter for scoring. Pre-seeded with the 13 games played as of June 15, 2026.
export const groupMatches: { a: string; sa: number; b: string; sb: number }[] = [
  { a: "MEX", sa: 2, b: "RSA", sb: 0 },
  { a: "KOR", sa: 2, b: "CZE", sb: 1 },
  { a: "CAN", sa: 1, b: "BIH", sb: 1 },
  { a: "QAT", sa: 1, b: "SUI", sb: 1 },
  { a: "BRA", sa: 1, b: "MAR", sb: 1 },
  { a: "HAI", sa: 0, b: "SCO", sb: 1 },
  { a: "USA", sa: 4, b: "PAR", sb: 1 },
  { a: "AUS", sa: 2, b: "TUR", sb: 0 },
  { a: "GER", sa: 7, b: "CUW", sb: 1 },
  { a: "CIV", sa: 1, b: "ECU", sb: 0 },
  { a: "NED", sa: 2, b: "JPN", sb: 2 },
  { a: "SWE", sa: 5, b: "TUN", sb: 1 },
  { a: "ESP", sa: 0, b: "CPV", sb: 0 },
  // June 15 — Groups G and H wrapped up their opening matches (all draws, no win points).
  { a: "BEL", sa: 1, b: "EGY", sb: 1 },
  { a: "KSA", sa: 1, b: "URU", sb: 1 },
  { a: "IRN", sa: 2, b: "NZL", sb: 2 },
  // June 16 — Group I and J openers; France, Norway, and Argentina pick up wins.
  { a: "FRA", sa: 3, b: "SEN", sb: 1 },
  { a: "NOR", sa: 4, b: "IRQ", sb: 1 },
  { a: "ARG", sa: 3, b: "ALG", sb: 0 },
  // June 16 — Austria close out Group J's opening round.
  { a: "AUT", sa: 3, b: "JOR", sb: 1 },
  // June 15 — Groups K and L played their openers (logged a day late).
  { a: "POR", sa: 1, b: "COD", sb: 1 },
  { a: "UZB", sa: 1, b: "COL", sb: 3 },
  { a: "ENG", sa: 4, b: "CRO", sb: 2 },
  { a: "GHA", sa: 1, b: "PAN", sb: 0 },
];

// Per-team tournament status. Update as groups finalize and knockout rounds complete.
// wonGroup: did they finish 1st in their group? reached: furthest stage reached.
// Default everyone to reached "group" / wonGroup false. No groups have finished yet.
export const teamStatus: Record<string, { wonGroup: boolean; reached: Stage }> = Object.fromEntries(
  Object.keys(TEAMS).map((code) => [code, { wonGroup: false, reached: "group" as Stage }])
);
