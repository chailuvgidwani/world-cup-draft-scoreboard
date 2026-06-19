import {
  SCORING,
  STAGE_ORDER,
  TEAMS,
  ROSTERS,
  MANAGER_NAMES,
  groupMatches,
  teamStatus,
  upcomingMatches,
  type Stage,
} from "./data";

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
};

export type ManagerScore = {
  rank: number;
  manager: string;
  total: number;
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

function scoreTeam(code: string, stats: Record<string, GroupStat>): TeamScore {
  const team = TEAMS[code];
  const status = teamStatus[code] ?? { wonGroup: false, reached: "group" as Stage };
  const stat = stats[code] ?? { played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0 };

  const groupWinPoints = stat.wins * SCORING.groupWin;
  const groupWinnerBonus = status.wonGroup ? SCORING.groupWinnerBonus : 0;
  const milestones = milestonesFor(status.reached);
  const milestonePoints = milestones.reduce((sum, m) => sum + m.points, 0);

  return {
    code,
    name: team?.name ?? code,
    group: team?.group ?? "?",
    stat,
    groupWinPoints,
    wonGroup: status.wonGroup,
    groupWinnerBonus,
    reached: status.reached,
    milestones,
    milestonePoints,
    total: groupWinPoints + groupWinnerBonus + milestonePoints,
  };
}

// Compute the full leaderboard: managers sorted by total points (desc), with
// shared ranks for ties, and each manager's teams sorted by points (desc).
export function computeStandings(): ManagerScore[] {
  const stats = computeGroupStats();

  const unranked = Object.entries(ROSTERS).map(([manager, codes]) => {
    const teams = codes
      .map((code) => scoreTeam(code, stats))
      .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
    const total = teams.reduce((sum, t) => sum + t.total, 0);
    return { manager, total, teams };
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
    for (const status of Object.values(teamStatus)) {
      const idx = STAGE_ORDER.indexOf(status.reached);
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
  group: string;
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

// Scheduled fixtures that haven't been played yet (no matching result in
// groupMatches), grouped by day in chronological order.
export function upcomingByDay(): FixtureDay[] {
  const played = new Set(groupMatches.map((m) => pairKey(m.a, m.b)));
  const byDate: Record<string, Fixture[]> = {};

  for (const f of upcomingMatches) {
    if (played.has(pairKey(f.a, f.b))) continue;
    (byDate[f.date] ??= []).push({
      a: f.a,
      aName: TEAMS[f.a]?.name ?? f.a,
      aOwner: ownerOf(f.a),
      b: f.b,
      bName: TEAMS[f.b]?.name ?? f.b,
      bOwner: ownerOf(f.b),
      group: TEAMS[f.a]?.group ?? "?",
    });
  }

  return Object.keys(byDate)
    .sort()
    .map((date) => ({ date, label: formatDay(date), fixtures: byDate[date] }));
}
