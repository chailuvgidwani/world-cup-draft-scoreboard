// Pure bracket math shared by the client (Bracket/Challenge) and the server
// (submission validation + challenge scoring). No React, no server-only imports.
import { SCORING, STAGE_ORDER, type Stage } from "./data";
import type { BracketMatch } from "./scoring";

export type Picks = Record<string, string>;
export type BracketState = {
  part: Record<string, [string | null, string | null]>;
  winner: Record<string, string | null>;
  locked: Set<string>;
};

export const pairKey = (a: string, b: string) => [a, b].sort().join("-");

// Resolve every match's participants and winner given real results + user picks.
export function resolveBracket(
  matches: BracketMatch[],
  resultByPair: Map<string, string>,
  picks: Picks,
): BracketState {
  const part: BracketState["part"] = {};
  const winner: BracketState["winner"] = {};
  const locked = new Set<string>();
  for (const m of matches) {
    const a = m.fromA ? (winner[m.fromA] ?? null) : m.aTeam;
    const b = m.fromB ? (winner[m.fromB] ?? null) : m.bTeam;
    part[m.id] = [a, b];
    let w: string | null = null;
    if (a && b) {
      const real = resultByPair.get(pairKey(a, b));
      if (real) {
        w = real;
        locked.add(m.id);
      } else if (picks[m.id] === a || picks[m.id] === b) {
        w = picks[m.id];
      }
    }
    winner[m.id] = w;
  }
  return { part, winner, locked };
}

// Drop picks that are no longer one of their match's participants (cascades up).
export function normalizePicks(
  matches: BracketMatch[],
  resultByPair: Map<string, string>,
  picks: Picks,
): Picks {
  const next: Picks = { ...picks };
  for (;;) {
    const { part, locked } = resolveBracket(matches, resultByPair, next);
    let changed = false;
    for (const m of matches) {
      if (locked.has(m.id)) continue;
      const p = next[m.id];
      if (p && p !== part[m.id][0] && p !== part[m.id][1]) {
        delete next[m.id];
        changed = true;
      }
    }
    if (!changed) return next;
  }
}

export function milestonePoints(stage: Stage): number {
  const idx = STAGE_ORDER.indexOf(stage);
  let pts = 0;
  for (let i = 1; i <= idx; i++) {
    pts += SCORING.milestones[STAGE_ORDER[i] as Exclude<Stage, "group">];
  }
  return pts;
}

export const deeper = (a: Stage, b: Stage): Stage =>
  STAGE_ORDER.indexOf(a) >= STAGE_ORDER.indexOf(b) ? a : b;

// Furthest stage each team reaches under a resolved bracket.
export function reachedFromState(
  matches: BracketMatch[],
  state: BracketState,
): Record<string, Stage> {
  const reached: Record<string, Stage> = {};
  for (const m of matches) {
    for (const t of state.part[m.id]) {
      if (t) reached[t] = deeper(reached[t] ?? "r32", m.round);
    }
  }
  const champ = state.winner["104"];
  if (champ) reached[champ] = "champion";
  return reached;
}

// Challenge scoring: points for correctly predicting a team would reach a round,
// doubling each round. Only counts rounds that have actually been played.
const ROUND_PTS: Partial<Record<Stage, number>> = {
  r16: 1,
  qf: 2,
  sf: 4,
  final: 8,
  champion: 16,
};

export function scorePrediction(
  predicted: Record<string, Stage>,
  actual: Record<string, Stage>,
): number {
  let score = 0;
  for (const [team, stage] of Object.entries(actual)) {
    const actualIdx = STAGE_ORDER.indexOf(stage);
    const predIdx = STAGE_ORDER.indexOf(predicted[team] ?? "r32");
    for (const [s, pts] of Object.entries(ROUND_PTS)) {
      const sIdx = STAGE_ORDER.indexOf(s as Stage);
      if (actualIdx >= sIdx && predIdx >= sIdx) score += pts!;
    }
  }
  return score;
}
