import {
  SCORING,
  STAGE_ORDER,
  TEAMS,
  ROSTERS,
  MANAGER_NAMES,
  groupMatches,
  teamStatus,
  upcomingMatches,
  knockoutFixtures,
  knockoutMatches,
  BRACKET_TREE,
  type Stage,
  type KnockoutRound,
} from "./data";

// Knockout winner: decided by the 90'/extra-time score, falling back to the
// penalty-shootout tally (pa/pb) when level. Null only if truly undecided.
export function koWinner(m: {
  a: string;
  sa: number;
  b: string;
  sb: number;
  pa?: number;
  pb?: number;
}): string | null {
  if (m.sa > m.sb) return m.a;
  if (m.sb > m.sa) return m.b;
  if (m.pa != null && m.pb != null) {
    if (m.pa > m.pb) return m.a;
    if (m.pb > m.pa) return m.b;
  }
  return null;
}

// The stage a team reaches by WINNING a knockout match in the given round.
const ROUND_ADVANCES_TO: Record<KnockoutRound, Stage> = {
  r32: "r16",
  r16: "qf",
  qf: "sf",
  sf: "final",
  final: "champion",
};

// Fold the knockout results into each team's effective furthest stage and the set
// of teams knocked out. Group qualification sets the starting `reached` (group or
// r32); winning a knockout match bumps it; losing one eliminates the team.
function knockoutState(): {
  reached: Record<string, Stage>;
  knockedOut: Set<string>;
} {
  const reached: Record<string, Stage> = {};
  for (const [code, st] of Object.entries(teamStatus)) reached[code] = st.reached;
  const knockedOut = new Set<string>();
  for (const m of knockoutMatches) {
    const winner = koWinner(m);
    const loser = winner === m.a ? m.b : winner === m.b ? m.a : null;
    if (winner) {
      const next = ROUND_ADVANCES_TO[m.round];
      if (STAGE_ORDER.indexOf(next) > STAGE_ORDER.indexOf(reached[winner] ?? "group")) {
        reached[winner] = next;
      }
    }
    if (loser) knockedOut.add(loser);
  }
  return { reached, knockedOut };
}

// Human-readable labels for each stage.
export const STAGE_LABELS: Record<Stage, string> = {
  group: "Group Stage",
  r32: "Round of 32",
  r16: "Round of 16",
  qf: "Quarterfinal",
  sf: "Semifinal",
  final: "Final",
  champion: "Champion",
};

// Short labels for compact badges.
export const STAGE_SHORT: Record<Stage, string> = {
  group: "Groups",
  r32: "R32",
  r16: "R16",
  qf: "QF",
  sf: "SF",
  final: "Final",
  champion: "Champion",
};

// Rows for the "How scoring works" legend, derived from the SCORING constants.
export const SCORING_HELP: { label: string; value: string }[] = [
  { label: "Group-stage win", value: `+${SCORING.groupWin}` },
  { label: "Win your group", value: `+${SCORING.groupWinnerBonus}` },
  { label: "Reach Round of 32", value: `+${SCORING.milestones.r32}` },
  { label: "Reach Round of 16", value: `+${SCORING.milestones.r16}` },
  { label: "Reach Quarterfinal", value: `+${SCORING.milestones.qf}` },
  { label: "Reach Semifinal", value: `+${SCORING.milestones.sf}` },
  { label: "Reach Final", value: `+${SCORING.milestones.final}` },
  { label: "Win the World Cup", value: `+${SCORING.milestones.champion}` },
];

export type GroupStat = {
  played: number;
  wins: number;
  draws: number;
  losses: number;
  gf: number;
  ga: number;
};

export type Milestone = { stage: Exclude<Stage, "group">; points: number };

export type TeamScore = {
  code: string;
  name: string;
  group: string;
  stat: GroupStat;
  groupWinPoints: number;
  wonGroup: boolean;
  groupWinnerBonus: number;
  reached: Stage;
  milestones: Milestone[];
  milestonePoints: number;
  total: number;
  eliminated: boolean; // true once the team can score no more points
  maxGroupPoints: number; // best-case group-stage points (win out + group title if still open)
};

export type ManagerScore = {
  rank: number;
  manager: string;
  total: number;
  maxTotal: number; // ceiling: sum of every team's best-case final total
  teams: TeamScore[];
};

// Aggregate every team's group-stage record from the raw match list.
function computeGroupStats(): Record<string, GroupStat> {
  const stats: Record<string, GroupStat> = {};
  for (const code of Object.keys(TEAMS)) {
    stats[code] = { played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0 };
  }
  for (const m of groupMatches) {
    const a = stats[m.a];
    const b = stats[m.b];
    if (!a || !b) continue;
    a.played++;
    b.played++;
    a.gf += m.sa;
    a.ga += m.sb;
    b.gf += m.sb;
    b.ga += m.sa;
    if (m.sa > m.sb) {
      a.wins++;
      b.losses++;
    } else if (m.sb > m.sa) {
      b.wins++;
      a.losses++;
    } else {
      a.draws++;
      b.draws++;
    }
  }
  return stats;
}

// Cumulative milestone points: a team banks the points for every knockout stage
// up to and including the furthest stage it reached.
function milestonesFor(reached: Stage): Milestone[] {
  const reachedIdx = STAGE_ORDER.indexOf(reached);
  const out: Milestone[] = [];
  for (let i = 1; i <= reachedIdx; i++) {
    const stage = STAGE_ORDER[i];
    if (stage === "group") continue;
    const key = stage as Exclude<Stage, "group">;
    out.push({ stage: key, points: SCORING.milestones[key] });
  }
  return out;
}

function milestonePointsFor(reached: Stage): number {
  return milestonesFor(reached).reduce((sum, m) => sum + m.points, 0);
}

// How many group games each group has logged (a group is complete at 6).
function groupGameCounts(): Record<string, number> {
  const gamesByGroup: Record<string, number> = {};
  for (const m of groupMatches) {
    const g = TEAMS[m.a]?.group;
    if (g) gamesByGroup[g] = (gamesByGroup[g] ?? 0) + 1;
  }
  return gamesByGroup;
}

function scoreTeam(
  code: string,
  stats: Record<string, GroupStat>,
  gamesByGroup: Record<string, number>,
  reachedMap: Record<string, Stage>,
  knockedOut: Set<string>,
): TeamScore {
  const team = TEAMS[code];
  const status = teamStatus[code] ?? { wonGroup: false, reached: "group" as Stage };
  const stat = stats[code] ?? { played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0 };
  const group = team?.group ?? "?";
  const reached = reachedMap[code] ?? status.reached; // includes knockout progression

  const groupWinPoints = stat.wins * SCORING.groupWin;
  const groupWinnerBonus = status.wonGroup ? SCORING.groupWinnerBonus : 0;
  const milestones = milestonesFor(reached);
  const milestonePoints = milestones.reduce((sum, m) => sum + m.points, 0);

  // Best-case group-stage points: win every remaining group game, plus the group
  // title if the group is still open. A team is out if it lost a knockout match, or
  // its group finished and it never reached the knockouts.
  const groupComplete = (gamesByGroup[group] ?? 0) >= 6;
  const eliminated =
    knockedOut.has(code) || (groupComplete && status.reached === "group");
  const remainingGroupGames = Math.max(0, 3 - stat.played);
  const maxGroupWinnerBonus = status.wonGroup
    ? SCORING.groupWinnerBonus
    : groupComplete
      ? 0
      : SCORING.groupWinnerBonus;
  const maxGroupPoints =
    (stat.wins + remainingGroupGames) * SCORING.groupWin + maxGroupWinnerBonus;

  return {
    code,
    name: team?.name ?? code,
    group,
    stat,
    groupWinPoints,
    wonGroup: status.wonGroup,
    groupWinnerBonus,
    reached,
    milestones,
    milestonePoints,
    total: groupWinPoints + groupWinnerBonus + milestonePoints,
    eliminated,
    maxGroupPoints,
  };
}

// Knockout milestone values awarded by bracket depth, deepest first, with real
// capacity: 1 champion (25), 1 other finalist (17), 2 semifinalists (12), 4
// quarterfinalists (8), 8 round-of-16 (5), 16 round-of-32 (3). A manager's max
// assumes their surviving teams take the deepest still-available slots.
const KO_SLOTS: number[] = [
  milestonePointsFor("champion"),
  milestonePointsFor("final"),
  ...Array<number>(2).fill(milestonePointsFor("sf")),
  ...Array<number>(4).fill(milestonePointsFor("qf")),
  ...Array<number>(8).fill(milestonePointsFor("r16")),
  ...Array<number>(16).fill(milestonePointsFor("r32")),
];

// Compute the full leaderboard: managers sorted by total points (desc), with
// shared ranks for ties, and each manager's teams sorted by points (desc).
export function computeStandings(): ManagerScore[] {
  const stats = computeGroupStats();
  const gamesByGroup = groupGameCounts();
  const { reached, knockedOut } = knockoutState();

  const unranked = Object.entries(ROSTERS).map(([manager, codes]) => {
    const teams = codes
      .map((code) => scoreTeam(code, stats, gamesByGroup, reached, knockedOut))
      .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
    const total = teams.reduce((sum, t) => sum + t.total, 0);
    // Ceiling: eliminated teams keep what they've banked; surviving teams win out
    // in their groups and fill the deepest available knockout slots.
    const alive = teams.filter((t) => !t.eliminated);
    const eliminatedPoints = teams
      .filter((t) => t.eliminated)
      .reduce((sum, t) => sum + t.total, 0);
    const groupCeiling = alive.reduce((sum, t) => sum + t.maxGroupPoints, 0);
    const koCeiling = KO_SLOTS.slice(0, alive.length).reduce((sum, v) => sum + v, 0);
    const maxTotal = eliminatedPoints + groupCeiling + koCeiling;
    return { manager, total, maxTotal, teams };
  });

  unranked.sort((a, b) => b.total - a.total || a.manager.localeCompare(b.manager));

  let lastTotal: number | null = null;
  let lastRank = 0;
  return unranked.map((m, i) => {
    const rank = lastTotal !== null && m.total === lastTotal ? lastRank : i + 1;
    lastTotal = m.total;
    lastRank = rank;
    return { rank, ...m };
  });
}

export type TournamentSummary = {
  matchesPlayed: number;
  totalGroupGames: number;
  groupStageComplete: boolean;
  phase: Stage;
  phaseLabel: string;
};

// Total group-stage games implied by the group sizes. Each group is a round-robin,
// so a group of n teams plays n*(n-1)/2 games.
function totalGroupGames(): number {
  const sizes: Record<string, number> = {};
  for (const { group } of Object.values(TEAMS)) sizes[group] = (sizes[group] ?? 0) + 1;
  return Object.values(sizes).reduce((sum, n) => sum + (n * (n - 1)) / 2, 0);
}

// A one-line read on where the tournament is. While the group stage is still in
// progress we report "Group Stage" even if a team has already clinched a knockout
// berth — only once every group game is logged does the phase advance to the
// deepest stage any team has reached.
export function tournamentSummary(): TournamentSummary {
  const matchesPlayed = groupMatches.length;
  const total = totalGroupGames();
  const groupStageComplete = matchesPlayed >= total;

  let phase: Stage = "group";
  if (groupStageComplete) {
    let furthestIdx = 0;
    for (const r of Object.values(knockoutState().reached)) {
      const idx = STAGE_ORDER.indexOf(r);
      if (idx > furthestIdx) furthestIdx = idx;
    }
    phase = STAGE_ORDER[furthestIdx];
  }

  return {
    matchesPlayed,
    totalGroupGames: total,
    groupStageComplete,
    phase,
    phaseLabel: STAGE_LABELS[phase],
  };
}

// ---- Results view -------------------------------------------------------

export type ResultRow = {
  a: string;
  aName: string;
  b: string;
  bName: string;
  sa: number;
  sb: number;
  pa?: number; // penalty-shootout goals (knockout draws decided on penalties)
  pb?: number;
  winner: string | null; // team code of the winner, or null for a draw
};

// Every logged group game, grouped by group letter (A–L), in the order entered.
export function matchesByGroup(): { group: string; matches: ResultRow[] }[] {
  const byGroup: Record<string, ResultRow[]> = {};
  for (const m of groupMatches) {
    const group = TEAMS[m.a]?.group ?? "?";
    (byGroup[group] ??= []).push({
      a: m.a,
      aName: TEAMS[m.a]?.name ?? m.a,
      b: m.b,
      bName: TEAMS[m.b]?.name ?? m.b,
      sa: m.sa,
      sb: m.sb,
      winner: m.sa > m.sb ? m.a : m.sb > m.sa ? m.b : null,
    });
  }
  return Object.keys(byGroup)
    .sort()
    .map((group) => ({ group, matches: byGroup[group] }));
}

// ---- Managers & ownership ----------------------------------------------

// team code -> roster (manager) name that drafted it.
const OWNER_BY_CODE: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const [manager, codes] of Object.entries(ROSTERS)) {
    for (const code of codes) map[code] = manager;
  }
  return map;
})();

// The display label for a manager (real name if one is set, else the roster name).
export function managerDisplay(manager: string): string {
  return MANAGER_NAMES[manager] ?? manager;
}

// The display name of whoever drafted a given team (null if undrafted).
export function ownerOf(code: string): string | null {
  const manager = OWNER_BY_CODE[code];
  return manager ? managerDisplay(manager) : null;
}

export type StatusAward = {
  code: string;
  name: string;
  group: string;
  wonGroup: boolean;
  groupWinnerBonus: number;
  reached: Stage;
  milestones: Milestone[];
  total: number;
};

// Teams whose tournament status contributes points beyond their group-game wins:
// group winners (+1) and any knockout advancement reached so far.
export function statusAwards(): StatusAward[] {
  const out: StatusAward[] = [];
  for (const [code, st] of Object.entries(teamStatus)) {
    if (!st.wonGroup && st.reached === "group") continue;
    const milestones = milestonesFor(st.reached);
    const groupWinnerBonus = st.wonGroup ? SCORING.groupWinnerBonus : 0;
    const milestonePoints = milestones.reduce((sum, m) => sum + m.points, 0);
    out.push({
      code,
      name: TEAMS[code]?.name ?? code,
      group: TEAMS[code]?.group ?? "?",
      wonGroup: st.wonGroup,
      groupWinnerBonus,
      reached: st.reached,
      milestones,
      total: groupWinnerBonus + milestonePoints,
    });
  }
  return out.sort((a, b) => a.group.localeCompare(b.group) || a.name.localeCompare(b.name));
}

// ---- Upcoming fixtures --------------------------------------------------

export type Fixture = {
  a: string;
  aName: string;
  aOwner: string | null;
  b: string;
  bName: string;
  bOwner: string | null;
  stageLabel: string; // "Group A" or a knockout round, e.g. "Round of 32"
};

export type FixtureDay = {
  date: string; // ISO yyyy-mm-dd
  label: string; // e.g. "Friday, June 19"
  fixtures: Fixture[];
};

// Unordered key for a team pairing, so a logged result matches its schedule
// entry regardless of home/away order.
function pairKey(a: string, b: string): string {
  return [a, b].sort().join("-");
}

// Format an ISO date as a weekday + month + day label, pinned to UTC so a fixed
// date string never shifts across timezones at build time.
function formatDay(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

// Scheduled fixtures still to be played (group + knockout), grouped by day in
// chronological order. A fixture drops off once its result is logged.
export function upcomingByDay(): FixtureDay[] {
  const playedGroup = new Set(groupMatches.map((m) => pairKey(m.a, m.b)));
  const playedKO = new Set(knockoutMatches.map((m) => pairKey(m.a, m.b)));
  const byDate: Record<string, Fixture[]> = {};

  const add = (date: string, a: string, b: string, stageLabel: string) => {
    (byDate[date] ??= []).push({
      a,
      aName: TEAMS[a]?.name ?? a,
      aOwner: ownerOf(a),
      b,
      bName: TEAMS[b]?.name ?? b,
      bOwner: ownerOf(b),
      stageLabel,
    });
  };

  for (const f of upcomingMatches) {
    if (playedGroup.has(pairKey(f.a, f.b))) continue;
    add(f.date, f.a, f.b, `Group ${TEAMS[f.a]?.group ?? "?"}`);
  }
  for (const f of knockoutFixtures) {
    if (playedKO.has(pairKey(f.a, f.b))) continue;
    add(f.date, f.a, f.b, STAGE_LABELS[f.round]);
  }

  return Object.keys(byDate)
    .sort()
    .map((date) => ({ date, label: formatDay(date), fixtures: byDate[date] }));
}

// ---- Clickable bracket --------------------------------------------------

export type BracketTeam = {
  code: string;
  name: string;
  manager: string; // roster (manager) name
  ownerLabel: string; // display name (real name where set)
  fixedPoints: number; // group-stage win points + group-winner bonus (bracket-independent)
  inBracket: boolean; // is one of the 32 R32 qualifiers
};

export type BracketMatch = {
  id: string;
  round: KnockoutRound;
  // R32 matches carry their two teams; later matches reference the feeder match ids.
  aTeam: string | null;
  bTeam: string | null;
  fromA: string | null;
  fromB: string | null;
};

export type BracketData = {
  managers: string[];
  teams: BracketTeam[];
  matches: BracketMatch[]; // ordered so every feeder appears before the match it feeds
  results: { a: string; b: string; winner: string }[]; // locked actual knockout results
};

// Everything the clickable bracket needs: the match tree, each team's fixed
// (group-stage) points and owner, and any real knockout results to lock in.
export function bracketData(): BracketData {
  const stats = computeGroupStats();

  const ownerByCode: Record<string, string> = {};
  for (const [manager, codes] of Object.entries(ROSTERS))
    for (const code of codes) ownerByCode[code] = manager;

  const r32 = new Set<string>();
  for (const f of knockoutFixtures)
    if (f.round === "r32") {
      r32.add(f.a);
      r32.add(f.b);
    }

  const teams: BracketTeam[] = Object.entries(TEAMS).map(([code, t]) => {
    const st = teamStatus[code] ?? { wonGroup: false, reached: "group" as Stage };
    const manager = ownerByCode[code] ?? "—";
    const groupWinPoints = (stats[code]?.wins ?? 0) * SCORING.groupWin;
    const bonus = st.wonGroup ? SCORING.groupWinnerBonus : 0;
    return {
      code,
      name: t.name,
      manager,
      ownerLabel: MANAGER_NAMES[manager] ?? manager,
      fixedPoints: groupWinPoints + bonus,
      inBracket: r32.has(code),
    };
  });

  const matches: BracketMatch[] = [];
  for (const f of knockoutFixtures)
    if (f.round === "r32")
      matches.push({ id: f.id, round: "r32", aTeam: f.a, bTeam: f.b, fromA: null, fromB: null });
  for (const m of BRACKET_TREE)
    matches.push({
      id: m.id,
      round: m.round,
      aTeam: null,
      bTeam: null,
      fromA: m.from[0],
      fromB: m.from[1],
    });

  const results = knockoutMatches.map((m) => ({
    a: m.a,
    b: m.b,
    winner: koWinner(m) ?? m.a,
  }));

  return { managers: Object.keys(ROSTERS), teams, matches, results };
}

// ---- Knockout results (for the Results tab) -----------------------------

export type KnockoutResultRow = ResultRow & { round: KnockoutRound };

// Logged knockout games grouped by round (deepest-played first hidden; shown in
// bracket order), each with winner and owners.
export function knockoutResultsByRound(): {
  round: KnockoutRound;
  label: string;
  matches: KnockoutResultRow[];
}[] {
  const byRound: Record<string, KnockoutResultRow[]> = {};
  for (const m of knockoutMatches) {
    (byRound[m.round] ??= []).push({
      round: m.round,
      a: m.a,
      aName: TEAMS[m.a]?.name ?? m.a,
      b: m.b,
      bName: TEAMS[m.b]?.name ?? m.b,
      sa: m.sa,
      sb: m.sb,
      pa: m.pa,
      pb: m.pb,
      winner: koWinner(m),
    });
  }
  const order: KnockoutRound[] = ["r32", "r16", "qf", "sf", "final"];
  return order
    .filter((r) => byRound[r])
    .map((r) => ({ round: r, label: STAGE_LABELS[r], matches: byRound[r] }));
}
