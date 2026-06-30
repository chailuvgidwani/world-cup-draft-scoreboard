// Server-only: bracket-challenge storage, per-player auth, and scoring.
// Storage uses Upstash Redis when configured (Vercel), else an in-memory map for
// local dev. Passwords live in the CHALLENGE_PASSWORDS env var (kept out of the repo).
import { Redis } from "@upstash/redis";
import { ROSTERS, MANAGER_NAMES, type Stage } from "./data";
import { bracketData } from "./scoring";
import {
  resolveBracket,
  normalizePicks,
  reachedFromState,
  scorePrediction,
  pairKey,
  type Picks,
} from "./bracketLogic";

export type Submission = { player: string; picks: Picks; updatedAt: string };

// The challenge players are the six league managers (by display name).
export function challengePlayers(): string[] {
  return Object.keys(ROSTERS).map((m) => MANAGER_NAMES[m] ?? m);
}

// player -> password. From CHALLENGE_PASSWORDS (JSON) in production; a trivial
// name-based fallback in dev so the flow is testable without env setup.
function passwordMap(): Record<string, string> {
  const raw = process.env.CHALLENGE_PASSWORDS;
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      /* malformed env — fall through */
    }
  }
  if (process.env.NODE_ENV !== "production") {
    const m: Record<string, string> = {};
    for (const p of challengePlayers()) m[p] = p.toLowerCase().replace(/\s+/g, "");
    return m;
  }
  return {};
}

export function playerForPassword(pw: string | undefined): string | null {
  if (!pw) return null;
  for (const [player, pass] of Object.entries(passwordMap())) {
    if (pass === pw) return player;
  }
  return null;
}

// ---- storage ----
// Dev/local fallback only (production uses Redis). Backed by globalThis so it's
// shared across route-handler module instances within the single dev process.
const memory: Map<string, Submission> = ((
  globalThis as typeof globalThis & { __wcChallenge?: Map<string, Submission> }
).__wcChallenge ??= new Map<string, Submission>());
const KEY = "wc-bracket-challenge"; // redis hash: player -> Submission

function redis(): Redis | null {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? new Redis({ url, token }) : null;
}

export async function saveSubmission(player: string, picks: Picks): Promise<void> {
  // Validate/clean against the real bracket before storing.
  const { matches, results } = bracketData();
  const resultByPair = new Map(results.map((r) => [pairKey(r.a, r.b), r.winner]));
  const clean = normalizePicks(matches, resultByPair, picks ?? {});
  const sub: Submission = { player, picks: clean, updatedAt: new Date().toISOString() };
  const r = redis();
  if (r) await r.hset(KEY, { [player]: sub });
  else memory.set(player, sub);
}

export async function getSubmission(player: string): Promise<Submission | null> {
  const r = redis();
  if (r) return (await r.hget<Submission>(KEY, player)) ?? null;
  return memory.get(player) ?? null;
}

async function allSubmissions(): Promise<Submission[]> {
  const r = redis();
  if (r) {
    const all = await r.hgetall<Record<string, Submission>>(KEY);
    return all ? Object.values(all) : [];
  }
  return [...memory.values()];
}

export type BoardRow = {
  player: string;
  submitted: boolean;
  score: number;
  champion: string | null; // their predicted champion (team code)
  updatedAt: string | null;
};

// Manual commissioner adjustments to challenge scores (player display name -> delta).
// Chailuv: -1 — a R32 result was pushed after he'd locked in his pick but before the
// others submitted, so his bracket banked a point the late submitters' (now-locked)
// brackets couldn't register. Removed to keep it fair. (2026-06-30)
const SCORE_ADJUSTMENTS: Record<string, number> = {
  Chailuv: -1,
};

// Leaderboard: every player, their submission status, predicted champion, and
// score so far (correct advancement predictions vs. actual knockout results).
export async function challengeBoard(): Promise<BoardRow[]> {
  const { matches, results } = bracketData();
  const resultByPair = new Map(results.map((r) => [pairKey(r.a, r.b), r.winner]));
  const actual = reachedFromState(matches, resolveBracket(matches, resultByPair, {}));

  const subs = new Map((await allSubmissions()).map((s) => [s.player, s]));

  return challengePlayers()
    .map((player): BoardRow => {
      const sub = subs.get(player);
      if (!sub) return { player, submitted: false, score: 0, champion: null, updatedAt: null };
      const predState = resolveBracket(matches, new Map(), sub.picks);
      const predicted: Record<string, Stage> = reachedFromState(matches, predState);
      return {
        player,
        submitted: true,
        score: scorePrediction(predicted, actual) + (SCORE_ADJUSTMENTS[player] ?? 0),
        champion: predState.winner["104"] ?? null,
        updatedAt: sub.updatedAt,
      };
    })
    .sort((a, b) => b.score - a.score || Number(b.submitted) - Number(a.submitted) || a.player.localeCompare(b.player));
}
