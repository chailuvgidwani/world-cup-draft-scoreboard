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

// Real-name labels for managers whose roster name is a team name. Shown on the
// Upcoming and Results views so people can tell who's playing whom. Managers not
// listed here are displayed by their roster name as-is.
export const MANAGER_NAMES: Record<string, string> = {
  "Vini Vidi Vici": "Pranav",
  "The Prince Who Was Promised": "Ethan",
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
  // June 18 (Matchday 2) — Groups A and B. Mexico clinch Group A; Canada and Switzerland also win.
  { a: "MEX", sa: 1, b: "KOR", sb: 0 },
  { a: "CZE", sa: 1, b: "RSA", sb: 1 },
  { a: "SUI", sa: 4, b: "BIH", sb: 1 },
  { a: "CAN", sa: 6, b: "QAT", sb: 0 },
  // June 19 — Matchday 2, Groups C & D. Morocco, Brazil, USA, and Paraguay win.
  { a: "SCO", sa: 0, b: "MAR", sb: 1 },
  { a: "BRA", sa: 3, b: "HAI", sb: 0 },
  { a: "USA", sa: 2, b: "AUS", sb: 0 },
  { a: "TUR", sa: 0, b: "PAR", sb: 1 },
  // June 20 — Matchday 2, Group F. Netherlands rout Sweden (Tunisia–Japan still to come).
  { a: "NED", sa: 5, b: "SWE", sb: 1 },
  // June 20 — Matchday 2, Group E. Germany see off Ivory Coast; Ecuador–Curacao goalless.
  { a: "GER", sa: 2, b: "CIV", sb: 1 },
  { a: "ECU", sa: 0, b: "CUW", sb: 0 },
  // June 20 — Group F. Japan thump Tunisia (now eliminated).
  { a: "JPN", sa: 4, b: "TUN", sb: 0 },
  // June 21 — Matchday 2, Groups G & H.
  { a: "EGY", sa: 3, b: "NZL", sb: 1 },
  { a: "BEL", sa: 0, b: "IRN", sb: 0 },
  { a: "ESP", sa: 4, b: "KSA", sb: 0 },
  { a: "URU", sa: 2, b: "CPV", sb: 2 },
  // June 22 — Matchday 2, Groups I & J.
  { a: "FRA", sa: 3, b: "IRQ", sb: 0 },
  { a: "ARG", sa: 2, b: "AUT", sb: 0 },
  // June 22 — Norway beat Senegal to complete Group I; Norway and France both go through.
  { a: "NOR", sa: 3, b: "SEN", sb: 2 },
  // June 23 — Matchday 2 wraps: Algeria edge Jordan (Group J), Portugal rout Uzbekistan
  // (Group K), England held by Ghana (Group L).
  { a: "ALG", sa: 2, b: "JOR", sb: 1 },
  { a: "POR", sa: 5, b: "UZB", sb: 0 },
  { a: "ENG", sa: 0, b: "GHA", sb: 0 },
  // June 23 — Colombia (Group K) and Croatia (Group L) win to finish matchday 2 league-wide.
  { a: "COL", sa: 1, b: "COD", sb: 0 },
  { a: "CRO", sa: 1, b: "PAN", sb: 0 },
  // June 24-25 — Matchday 3 begins; Groups A, B and C wrap up.
  { a: "MEX", sa: 3, b: "CZE", sb: 0 },
  { a: "RSA", sa: 1, b: "KOR", sb: 0 },
  { a: "SUI", sa: 2, b: "CAN", sb: 1 },
  { a: "BIH", sa: 3, b: "QAT", sb: 1 },
  { a: "BRA", sa: 3, b: "SCO", sb: 0 },
  { a: "MAR", sa: 4, b: "HAI", sb: 2 },
  // June 25 — Group E finishes: Ivory Coast beat Curacao; Ecuador stun Germany (Germany still
  // top the group on head-to-head, so they keep 1st).
  { a: "CIV", sa: 2, b: "CUW", sb: 0 },
  { a: "ECU", sa: 2, b: "GER", sb: 1 },
  // June 25-26 — Matchday 3 completes Groups D, F, H and I.
  { a: "TUR", sa: 3, b: "USA", sb: 2 },
  { a: "AUS", sa: 0, b: "PAR", sb: 0 },
  { a: "JPN", sa: 1, b: "SWE", sb: 1 },
  { a: "NED", sa: 3, b: "TUN", sb: 1 },
  { a: "CPV", sa: 0, b: "KSA", sb: 0 },
  { a: "ESP", sa: 1, b: "URU", sb: 0 },
  { a: "FRA", sa: 4, b: "NOR", sb: 1 },
  { a: "SEN", sa: 5, b: "IRQ", sb: 0 },
  // June 27 — Groups G and L finish. Belgium edge Group G on goal difference; England top L.
  { a: "BEL", sa: 5, b: "NZL", sb: 1 },
  { a: "EGY", sa: 1, b: "IRN", sb: 1 },
  { a: "ENG", sa: 2, b: "PAN", sb: 0 },
  { a: "CRO", sa: 2, b: "GHA", sb: 1 },
  // June 27 — Group K finishes: Colombia top the group; DR Congo win to grab a best-third spot.
  { a: "COD", sa: 3, b: "UZB", sb: 1 },
  { a: "POR", sa: 0, b: "COL", sb: 0 },
  // June 27 — Group J finishes the group stage: Argentina win out; Austria edge Algeria for 2nd.
  { a: "ARG", sa: 3, b: "JOR", sb: 1 },
  { a: "ALG", sa: 3, b: "AUT", sb: 3 },
];

// Per-team tournament status. Update as groups finalize and knockout rounds complete.
// wonGroup: did they finish 1st in their group? reached: furthest stage reached.
// Default everyone to reached "group" / wonGroup false. No groups have finished yet.
export const teamStatus: Record<string, { wonGroup: boolean; reached: Stage }> = {
  ...Object.fromEntries(
    Object.keys(TEAMS).map((code) => [code, { wonGroup: false, reached: "group" as Stage }])
  ),
  // June 18 — Mexico clinched 1st in Group A (uncatchable on head-to-head): they won their
  // group (+1) and, since advancement is credited at clinch time, have reached the R32 (+3).
  MEX: { wonGroup: true, reached: "r32" },
  // June 19 — USA clinched 1st in Group D (beat both group rivals, so uncatchable on
  // head-to-head): won their group (+1) and reached the R32 (+3).
  USA: { wonGroup: true, reached: "r32" },
  // June 20 — Germany clinched 1st in Group E (uncatchable on head-to-head over Ivory Coast):
  // won their group (+1) and reached the R32 (+3).
  GER: { wonGroup: true, reached: "r32" },
  // June 26 — France won Group I outright (3 wins, beat Norway on matchday 3): group bonus
  // (+1) on top of R32 (+3).
  FRA: { wonGroup: true, reached: "r32" },
  // June 23 — Group J complete: Argentina clinched 1st (uncatchable on head-to-head over
  // Austria and Algeria), upgrading to group winner (+1) on top of R32 (+3).
  ARG: { wonGroup: true, reached: "r32" },
  // June 22 — Norway also clinched a knockout berth in Group I (level with France on points;
  // 1st is decided when they meet on matchday 3), so R32 advancement (+3) only.
  NOR: { wonGroup: false, reached: "r32" },
  // June 27 — Colombia won Group K (7 pts, drew Portugal on matchday 3 to seal 1st): group
  // bonus (+1) on top of R32 (+3).
  COL: { wonGroup: true, reached: "r32" },
  // June 25 — Groups A, B and C finished. New group winners (bonus + R32): Switzerland (B) and
  // Brazil (C); Mexico (A) was already logged. Other qualifiers reach the R32: South Africa
  // (A, 2nd), Canada (B, 2nd), Bosnia (B, best 3rd), Morocco (C, 2nd).
  RSA: { wonGroup: false, reached: "r32" },
  SUI: { wonGroup: true, reached: "r32" },
  CAN: { wonGroup: false, reached: "r32" },
  BIH: { wonGroup: false, reached: "r32" },
  BRA: { wonGroup: true, reached: "r32" },
  MAR: { wonGroup: false, reached: "r32" },
  // June 25 — Group E done: Germany win the group on head-to-head over Ivory Coast (already
  // logged); Ivory Coast advance as runners-up. Ecuador (3rd, 4 pts) awaits the best-third call.
  CIV: { wonGroup: false, reached: "r32" },
  // June 25-26 — Groups D, F, H, I finished and FIFA confirmed more qualifiers (Wikipedia "(A)").
  // New group winners (bonus + R32): Netherlands (F), Spain (H). Runners-up / best-thirds reach
  // the R32: Australia (D), Paraguay (D, best 3rd), Ecuador (E, best 3rd), Japan (F), Sweden
  // (F, best 3rd), Cape Verde (H). Early clinchers in still-open groups: Egypt (G), Portugal
  // (K), England and Ghana (L).
  AUS: { wonGroup: false, reached: "r32" },
  PAR: { wonGroup: false, reached: "r32" },
  ECU: { wonGroup: false, reached: "r32" },
  NED: { wonGroup: true, reached: "r32" },
  JPN: { wonGroup: false, reached: "r32" },
  SWE: { wonGroup: false, reached: "r32" },
  CPV: { wonGroup: false, reached: "r32" },
  ESP: { wonGroup: true, reached: "r32" },
  EGY: { wonGroup: false, reached: "r32" },
  POR: { wonGroup: false, reached: "r32" },
  GHA: { wonGroup: false, reached: "r32" },
  // June 27 — Groups G and L finished. Belgium won Group G on goal difference (level with Egypt
  // on points); England won Group L; Croatia advanced as the Group L runner-up.
  BEL: { wonGroup: true, reached: "r32" },
  ENG: { wonGroup: true, reached: "r32" },
  CRO: { wonGroup: false, reached: "r32" },
  // June 27 — DR Congo finished 3rd in Group K on 4 pts with the best goal difference of any
  // third-placed team, securing a best-third berth in the R32.
  COD: { wonGroup: false, reached: "r32" },
  // June 27 — Group J wrapped up the group stage and the final R32 bracket is set. Austria
  // advanced as runner-up; Algeria (J) and Senegal (I) took the last two best-third spots.
  // The eliminated thirds were South Korea (A), Scotland (C), Iran (G) and Uruguay (H).
  AUT: { wonGroup: false, reached: "r32" },
  ALG: { wonGroup: false, reached: "r32" },
  SEN: { wonGroup: false, reached: "r32" },
};

// Scheduled group fixtures (date = local kickoff day). The Upcoming view shows
// any of these whose result isn't yet recorded in groupMatches — so once a game
// is logged above it drops off the schedule automatically; no need to delete it
// here. Order within a day doesn't matter.
export const upcomingMatches: { date: string; a: string; b: string }[] = [
  // June 19 — Matchday 2, Groups C & D
  { date: "2026-06-19", a: "BRA", b: "HAI" },
  { date: "2026-06-19", a: "SCO", b: "MAR" },
  { date: "2026-06-19", a: "TUR", b: "PAR" },
  { date: "2026-06-19", a: "USA", b: "AUS" },
  // June 20 — Matchday 2, Groups E & F
  { date: "2026-06-20", a: "GER", b: "CIV" },
  { date: "2026-06-20", a: "ECU", b: "CUW" },
  { date: "2026-06-20", a: "NED", b: "SWE" },
  { date: "2026-06-20", a: "TUN", b: "JPN" },
  // June 21 — Matchday 2, Groups G & H
  { date: "2026-06-21", a: "URU", b: "CPV" },
  { date: "2026-06-21", a: "ESP", b: "KSA" },
  { date: "2026-06-21", a: "BEL", b: "IRN" },
  { date: "2026-06-21", a: "NZL", b: "EGY" },
  // June 22 — Matchday 2, Groups I & J
  { date: "2026-06-22", a: "NOR", b: "SEN" },
  { date: "2026-06-22", a: "FRA", b: "IRQ" },
  { date: "2026-06-22", a: "ARG", b: "AUT" },
  { date: "2026-06-22", a: "JOR", b: "ALG" },
  // June 23 — Matchday 2, Groups K & L
  { date: "2026-06-23", a: "ENG", b: "GHA" },
  { date: "2026-06-23", a: "PAN", b: "CRO" },
  { date: "2026-06-23", a: "POR", b: "UZB" },
  { date: "2026-06-23", a: "COL", b: "COD" },
  // June 24 — Matchday 3, Groups A, B & C
  { date: "2026-06-24", a: "SCO", b: "BRA" },
  { date: "2026-06-24", a: "MAR", b: "HAI" },
  { date: "2026-06-24", a: "SUI", b: "CAN" },
  { date: "2026-06-24", a: "BIH", b: "QAT" },
  { date: "2026-06-24", a: "CZE", b: "MEX" },
  { date: "2026-06-24", a: "RSA", b: "KOR" },
  // June 25 — Matchday 3, Groups D, E & F
  { date: "2026-06-25", a: "CUW", b: "CIV" },
  { date: "2026-06-25", a: "ECU", b: "GER" },
  { date: "2026-06-25", a: "JPN", b: "SWE" },
  { date: "2026-06-25", a: "TUN", b: "NED" },
  { date: "2026-06-25", a: "TUR", b: "USA" },
  { date: "2026-06-25", a: "PAR", b: "AUS" },
  // June 26 — Matchday 3, Groups G, H & I
  { date: "2026-06-26", a: "NOR", b: "FRA" },
  { date: "2026-06-26", a: "SEN", b: "IRQ" },
  { date: "2026-06-26", a: "EGY", b: "IRN" },
  { date: "2026-06-26", a: "NZL", b: "BEL" },
  { date: "2026-06-26", a: "CPV", b: "KSA" },
  { date: "2026-06-26", a: "URU", b: "ESP" },
  // June 27 — Matchday 3, Groups J, K & L
  { date: "2026-06-27", a: "PAN", b: "ENG" },
  { date: "2026-06-27", a: "CRO", b: "GHA" },
  { date: "2026-06-27", a: "ALG", b: "AUT" },
  { date: "2026-06-27", a: "JOR", b: "ARG" },
  { date: "2026-06-27", a: "COL", b: "POR" },
  { date: "2026-06-27", a: "COD", b: "UZB" },
];

// A knockout round (champion is reached by winning the final, so it isn't a round).
export type KnockoutRound = "r32" | "r16" | "qf" | "sf" | "final";

// Scheduled knockout fixtures (date = local kickoff day). Shows in Upcoming until
// the result is logged below. The R32 bracket is set; add R16/QF/SF/Final pairings
// here as each round's teams are known.
export const knockoutFixtures: { id: string; round: KnockoutRound; date: string; a: string; b: string }[] = [
  { id: "73", round: "r32", date: "2026-06-28", a: "RSA", b: "CAN" },
  { id: "74", round: "r32", date: "2026-06-29", a: "GER", b: "PAR" },
  { id: "75", round: "r32", date: "2026-06-29", a: "NED", b: "MAR" },
  { id: "76", round: "r32", date: "2026-06-29", a: "BRA", b: "JPN" },
  { id: "77", round: "r32", date: "2026-06-30", a: "FRA", b: "SWE" },
  { id: "78", round: "r32", date: "2026-06-30", a: "CIV", b: "NOR" },
  { id: "79", round: "r32", date: "2026-06-30", a: "MEX", b: "ECU" },
  { id: "80", round: "r32", date: "2026-07-01", a: "ENG", b: "COD" },
  { id: "81", round: "r32", date: "2026-07-01", a: "USA", b: "BIH" },
  { id: "82", round: "r32", date: "2026-07-01", a: "BEL", b: "SEN" },
  { id: "83", round: "r32", date: "2026-07-02", a: "POR", b: "CRO" },
  { id: "84", round: "r32", date: "2026-07-02", a: "ESP", b: "AUT" },
  { id: "85", round: "r32", date: "2026-07-02", a: "SUI", b: "ALG" },
  { id: "86", round: "r32", date: "2026-07-03", a: "ARG", b: "CPV" },
  { id: "87", round: "r32", date: "2026-07-03", a: "COL", b: "GHA" },
  { id: "88", round: "r32", date: "2026-07-03", a: "AUS", b: "EGY" },
];

// Bracket wiring for the Round of 16 onward: each match is contested by the winners
// of two earlier matches (referenced by id). R32 teams come from knockoutFixtures.
export const BRACKET_TREE: { id: string; round: KnockoutRound; from: [string, string] }[] = [
  { id: "90", round: "r16", from: ["73", "75"] },
  { id: "89", round: "r16", from: ["74", "77"] },
  { id: "91", round: "r16", from: ["76", "78"] },
  { id: "92", round: "r16", from: ["79", "80"] },
  { id: "93", round: "r16", from: ["83", "84"] },
  { id: "94", round: "r16", from: ["81", "82"] },
  { id: "95", round: "r16", from: ["86", "88"] },
  { id: "96", round: "r16", from: ["85", "87"] },
  { id: "97", round: "qf", from: ["89", "90"] },
  { id: "98", round: "qf", from: ["93", "94"] },
  { id: "99", round: "qf", from: ["91", "92"] },
  { id: "100", round: "qf", from: ["95", "96"] },
  { id: "101", round: "sf", from: ["97", "98"] },
  { id: "102", round: "sf", from: ["99", "100"] },
  { id: "104", round: "final", from: ["101", "102"] },
];

// Knockout results. Add one object per completed knockout game; the winner's
// progression and the loser's elimination are derived automatically (no need to
// touch teamStatus). Knockouts can't draw — record the result after extra time /
// penalties (the team that goes through is the winner).
export const knockoutMatches: { round: KnockoutRound; a: string; sa: number; b: string; sb: number }[] = [
  // June 28 — Round of 32. Canada knock out South Africa.
  { round: "r32", a: "CAN", sa: 1, b: "RSA", sb: 0 },
];
