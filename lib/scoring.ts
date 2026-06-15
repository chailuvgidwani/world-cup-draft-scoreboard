import {
  SCORING,
  STAGE_ORDER,
  TEAMS,
  ROSTERS,
  groupMatches,
  teamStatus,
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
  phase: Stage;
  phaseLabel: string;
};

// A one-line read on where the tournament is: how many group games are logged
// and the furthest stage any team has reached.
export function tournamentSummary(): TournamentSummary {
  const matchesPlayed = groupMatches.length;
  let furthestIdx = 0;
  for (const status of Object.values(teamStatus)) {
    const idx = STAGE_ORDER.indexOf(status.reached);
    if (idx > furthestIdx) furthestIdx = idx;
  }
  const phase = STAGE_ORDER[furthestIdx];
  return { matchesPlayed, phase, phaseLabel: STAGE_LABELS[phase] };
}
