"use client";

import { useMemo, useState } from "react";
import { SCORING, STAGE_ORDER, type Stage } from "@/lib/data";
import { flagFor } from "@/lib/flags";
import type { BracketData, BracketMatch } from "@/lib/scoring";

const ROUNDS: { round: Stage; label: string }[] = [
  { round: "r32", label: "Round of 32" },
  { round: "r16", label: "Round of 16" },
  { round: "qf", label: "Quarterfinals" },
  { round: "sf", label: "Semifinals" },
  { round: "final", label: "Final" },
];

const pk = (a: string, b: string) => [a, b].sort().join("-");

function milestone(stage: Stage): number {
  const idx = STAGE_ORDER.indexOf(stage);
  let pts = 0;
  for (let i = 1; i <= idx; i++) {
    pts += SCORING.milestones[STAGE_ORDER[i] as Exclude<Stage, "group">];
  }
  return pts;
}

const deeper = (a: Stage, b: Stage): Stage =>
  STAGE_ORDER.indexOf(a) >= STAGE_ORDER.indexOf(b) ? a : b;

export function Bracket({ data }: { data: BracketData }) {
  const { matches, teams, results } = data;

  const resultByPair = useMemo(() => {
    const m = new Map<string, string>();
    for (const r of results) m.set(pk(r.a, r.b), r.winner);
    return m;
  }, [results]);

  const teamInfo = useMemo(() => {
    const m: Record<string, (typeof teams)[number]> = {};
    for (const t of teams) m[t.code] = t;
    return m;
  }, [teams]);

  // Resolve every match's two participants and winner, given the user's picks.
  // Real results lock a match; otherwise the user's pick (if still valid) wins.
  const resolve = (picks: Record<string, string>) => {
    const part: Record<string, [string | null, string | null]> = {};
    const winner: Record<string, string | null> = {};
    const locked = new Set<string>();
    for (const m of matches) {
      const a = m.fromA ? (winner[m.fromA] ?? null) : m.aTeam;
      const b = m.fromB ? (winner[m.fromB] ?? null) : m.bTeam;
      part[m.id] = [a, b];
      let w: string | null = null;
      if (a && b) {
        const real = resultByPair.get(pk(a, b));
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
  };

  // Drop any pick that's no longer one of its match's participants (cascades up).
  const normalize = (picks: Record<string, string>) => {
    const next = { ...picks };
    for (;;) {
      const { part, locked } = resolve(next);
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
  };

  const [picks, setPicks] = useState<Record<string, string>>({});

  const state = useMemo(() => resolve(picks), [picks]); // eslint-disable-line react-hooks/exhaustive-deps
  const baseline = useMemo(() => resolve({}), []); // eslint-disable-line react-hooks/exhaustive-deps

  // Furthest stage each bracket team reaches under a given resolution.
  const reachedUnder = (res: ReturnType<typeof resolve>) => {
    const reached: Record<string, Stage> = {};
    for (const m of matches) {
      for (const t of res.part[m.id]) {
        if (t) reached[t] = deeper(reached[t] ?? "r32", m.round);
      }
    }
    const champ = res.winner["104"];
    if (champ) reached[champ] = "champion";
    return reached;
  };

  const standings = useMemo(() => {
    const reachedNow = reachedUnder(state);
    const reachedBase = reachedUnder(baseline);
    const total = (reached: Record<string, Stage>) => {
      const t: Record<string, number> = {};
      for (const tm of teams) {
        let pts = tm.fixedPoints;
        if (tm.inBracket) pts += milestone(reached[tm.code] ?? "r32");
        t[tm.manager] = (t[tm.manager] ?? 0) + pts;
      }
      return t;
    };
    const proj = total(reachedNow);
    const base = total(reachedBase);
    return data.managers
      .map((m) => ({ manager: m, projected: proj[m], delta: proj[m] - base[m] }))
      .sort((a, b) => b.projected - a.projected || a.manager.localeCompare(b.manager));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, baseline, teams]);

  const pick = (matchId: string, team: string) =>
    setPicks((prev) => normalize({ ...prev, [matchId]: team }));
  const dirty = Object.keys(picks).length > 0;
  const champion = state.winner["104"];

  function Slot({
    matchId,
    team,
    isWinner,
    locked,
    pickable,
  }: {
    matchId: string;
    team: string | null;
    isWinner: boolean;
    locked: boolean;
    pickable: boolean;
  }) {
    const t = team ? teamInfo[team] : undefined;
    return (
      <button
        type="button"
        disabled={!team || !pickable}
        onClick={() => team && pick(matchId, team)}
        className={`flex w-full items-center gap-2 px-2.5 py-1.5 text-left transition-colors ${
          isWinner ? "bg-emerald-400/15" : "enabled:hover:bg-white/5"
        } disabled:cursor-default`}
      >
        <span className="text-base leading-none" aria-hidden>
          {team ? flagFor(team) : "—"}
        </span>
        <span className="min-w-0 flex-1">
          <span
            className={`block truncate text-sm ${
              isWinner ? "font-semibold text-emerald-200" : team ? "text-slate-100" : "text-slate-600"
            }`}
          >
            {t ? t.name : "TBD"}
          </span>
          {t && (
            <span className="block truncate text-[11px] text-slate-500">{t.ownerLabel}</span>
          )}
        </span>
        {isWinner && (
          <span className="shrink-0 text-xs text-emerald-300" aria-hidden>
            {locked ? "🔒" : "✓"}
          </span>
        )}
      </button>
    );
  }

  function MatchCard({ m }: { m: BracketMatch }) {
    const [a, b] = state.part[m.id];
    const w = state.winner[m.id];
    const locked = state.locked.has(m.id);
    const pickable = !!a && !!b && !locked;
    return (
      <li className="overflow-hidden rounded-xl border border-slate-700/50 bg-slate-900/40">
        <Slot matchId={m.id} team={a} isWinner={!!w && w === a} locked={locked} pickable={pickable} />
        <div className="border-t border-white/5" />
        <Slot matchId={m.id} team={b} isWinner={!!w && w === b} locked={locked} pickable={pickable} />
      </li>
    );
  }

  const champInfo = champion ? teamInfo[champion] : undefined;

  return (
    <div>
      {/* Projected standings */}
      <section className="mb-5 rounded-2xl border border-slate-700/50 bg-slate-900/40 p-3">
        <div className="mb-2 flex items-center justify-between px-1">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
            If it played out this way
          </h2>
          <button
            onClick={() => setPicks({})}
            disabled={!dirty}
            className="rounded-full border border-slate-700 px-3 py-1 text-xs font-medium text-slate-300 transition-colors enabled:hover:bg-white/5 disabled:opacity-40"
          >
            Reset
          </button>
        </div>
        <ol className="space-y-1">
          {standings.map((s, i) => (
            <li
              key={s.manager}
              className="flex items-center gap-3 rounded-lg px-2 py-1.5 odd:bg-white/[0.02]"
            >
              <span className="w-5 shrink-0 text-center text-sm font-bold tabular-nums text-slate-500">
                {i + 1}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-100">
                {s.manager}
              </span>
              {s.delta > 0 && (
                <span className="shrink-0 rounded bg-emerald-400/15 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-emerald-300">
                  +{s.delta}
                </span>
              )}
              <span className="w-8 shrink-0 text-right text-base font-extrabold tabular-nums text-white">
                {s.projected}
              </span>
            </li>
          ))}
        </ol>
      </section>

      {/* Champion */}
      <section className="mb-6 rounded-2xl border border-amber-400/40 bg-gradient-to-b from-amber-500/10 to-slate-900/40 px-4 py-3 text-center">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-amber-300/80">
          🏆 Your champion
        </div>
        {champInfo ? (
          <div className="mt-1">
            <span className="text-lg" aria-hidden>
              {flagFor(champion!)}
            </span>{" "}
            <span className="text-lg font-extrabold text-white">{champInfo.name}</span>
            <span className="ml-1 text-sm text-slate-400">· {champInfo.ownerLabel}</span>
          </div>
        ) : (
          <div className="mt-1 text-sm text-slate-500">
            Pick your way through to crown one
          </div>
        )}
      </section>

      {/* Rounds */}
      <div className="space-y-6">
        {ROUNDS.map(({ round, label }) => {
          const roundMatches = matches.filter((m) => m.round === round);
          return (
            <section key={round}>
              <h2 className="mb-2 px-1 text-sm font-semibold uppercase tracking-wide text-slate-400">
                {label}
              </h2>
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {roundMatches.map((m) => (
                  <MatchCard key={m.id} m={m} />
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      <p className="mt-8 text-center text-xs leading-relaxed text-slate-600">
        Tap a team to send it through. Real results are locked (🔒); pick the rest
        all the way to the final. Nothing here changes the live standings.
      </p>
    </div>
  );
}
