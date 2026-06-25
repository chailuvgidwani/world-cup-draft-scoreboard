"use client";

import { useMemo, useState } from "react";
import { SCORING, STAGE_ORDER, type Stage } from "@/lib/data";
import { flagFor } from "@/lib/flags";
import type { ScenarioTeam } from "@/lib/scoring";

// How each stage shows in the picker. "group" means "didn't make the knockouts".
const STAGE_LABEL: Record<Stage, string> = {
  group: "Out",
  r32: "R32",
  r16: "R16",
  qf: "QF",
  sf: "SF",
  final: "Final",
  champion: "Champion",
};

// Real bracket capacity for each knockout round (used for the realism counters).
const ROUNDS: { stage: Exclude<Stage, "group">; cap: number; label: string }[] = [
  { stage: "r32", cap: 32, label: "R32" },
  { stage: "r16", cap: 16, label: "R16" },
  { stage: "qf", cap: 8, label: "QF" },
  { stage: "sf", cap: 4, label: "SF" },
  { stage: "final", cap: 2, label: "Final" },
  { stage: "champion", cap: 1, label: "🏆" },
];

function milestonePoints(reached: Stage): number {
  const idx = STAGE_ORDER.indexOf(reached);
  let pts = 0;
  for (let i = 1; i <= idx; i++) {
    pts += SCORING.milestones[STAGE_ORDER[i] as Exclude<Stage, "group">];
  }
  return pts;
}

function teamPoints(t: ScenarioTeam, reached: Stage): number {
  return t.groupWinPoints + t.wonGroupBonus + milestonePoints(reached);
}

export function Scenarios({ teams }: { teams: ScenarioTeam[] }) {
  const [picks, setPicks] = useState<Record<string, Stage>>(() =>
    Object.fromEntries(teams.map((t) => [t.code, t.reached])),
  );

  const reached = (code: string) =>
    picks[code] ?? teams.find((t) => t.code === code)?.reached ?? "group";

  // Teams grouped by manager, sorted so each manager's deepest projected teams lead.
  const byManager = useMemo(() => {
    const map: Record<string, ScenarioTeam[]> = {};
    for (const t of teams) (map[t.manager] ??= []).push(t);
    return map;
  }, [teams]);

  // Live standings: current vs projected total per manager.
  const standings = useMemo(() => {
    const cur: Record<string, number> = {};
    const proj: Record<string, number> = {};
    for (const t of teams) {
      cur[t.manager] = (cur[t.manager] ?? 0) + teamPoints(t, t.reached);
      proj[t.manager] = (proj[t.manager] ?? 0) + teamPoints(t, reached(t.code));
    }
    return Object.keys(byManager)
      .map((m) => ({ manager: m, current: cur[m], projected: proj[m], delta: proj[m] - cur[m] }))
      .sort((a, b) => b.projected - a.projected || a.manager.localeCompare(b.manager));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teams, picks, byManager]);

  // How many teams are projected into each knockout round.
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const t of teams) {
      const idx = STAGE_ORDER.indexOf(reached(t.code));
      for (const r of ROUNDS)
        if (idx >= STAGE_ORDER.indexOf(r.stage)) c[r.stage] = (c[r.stage] ?? 0) + 1;
    }
    return c;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teams, picks]);

  // Teams projected to the deep rounds, deepest first — the "bracket" payoff.
  const deepRuns = useMemo(() => {
    const order: Stage[] = ["champion", "final", "sf", "qf"];
    return teams
      .map((t) => ({ t, stage: reached(t.code) }))
      .filter((x) => order.includes(x.stage))
      .sort((a, b) => STAGE_ORDER.indexOf(b.stage) - STAGE_ORDER.indexOf(a.stage) || a.t.name.localeCompare(b.t.name));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teams, picks]);

  function setStage(code: string, stage: Stage) {
    setPicks((prev) => {
      const next = { ...prev, [code]: stage };
      // Only one champion — crowning a new one sends the old one to the final.
      if (stage === "champion")
        for (const t of teams)
          if (t.code !== code && next[t.code] === "champion") next[t.code] = "final";
      return next;
    });
  }

  const reset = () => setPicks(Object.fromEntries(teams.map((t) => [t.code, t.reached])));
  const dirty = teams.some((t) => reached(t.code) !== t.reached);

  return (
    <div>
      {/* Projected standings */}
      <section className="mb-5 rounded-2xl border border-slate-700/50 bg-slate-900/40 p-3">
        <div className="mb-2 flex items-center justify-between px-1">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
            Projected standings
          </h2>
          <button
            onClick={reset}
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

      {/* Round capacity counters */}
      <div className="mb-5 flex flex-wrap justify-center gap-1.5">
        {ROUNDS.map((r) => {
          const n = counts[r.stage] ?? 0;
          const over = n > r.cap;
          return (
            <span
              key={r.stage}
              className={`rounded-full border px-2.5 py-1 text-xs font-medium tabular-nums ${
                over
                  ? "border-amber-400/40 bg-amber-400/10 text-amber-300"
                  : "border-slate-700 bg-slate-900/40 text-slate-400"
              }`}
            >
              {r.label} {n}/{r.cap}
              {over && " ⚠"}
            </span>
          );
        })}
      </div>

      {/* Deep runs (bracket payoff) */}
      {deepRuns.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-2 px-1 text-sm font-semibold uppercase tracking-wide text-slate-400">
            Projected deep runs
          </h2>
          <ul className="space-y-1.5">
            {deepRuns.map(({ t, stage }) => (
              <li
                key={t.code}
                className="flex items-center gap-2.5 rounded-xl bg-slate-800/40 px-3 py-2"
              >
                <span className="text-xl leading-none" aria-hidden>
                  {flagFor(t.code)}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-100">
                  {t.name}{" "}
                  <span className="text-xs font-normal text-slate-500">· {t.ownerLabel}</span>
                </span>
                <span
                  className={`shrink-0 rounded px-1.5 py-0.5 text-[11px] font-bold ${
                    stage === "champion"
                      ? "bg-amber-400 text-slate-950"
                      : "bg-emerald-400/15 text-emerald-300"
                  }`}
                >
                  {stage === "champion" ? "🏆 Champion" : STAGE_LABEL[stage]}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Per-manager controls */}
      <h2 className="mb-2 px-1 text-sm font-semibold uppercase tracking-wide text-slate-400">
        Play it out
      </h2>
      <p className="mb-3 px-1 text-xs leading-relaxed text-slate-500">
        For each team still alive, pick how far it goes. Points update live above.
        Teams already out are locked.
      </p>
      <div className="space-y-2">
        {standings.map((s) => {
          const roster = byManager[s.manager] ?? [];
          return (
            <details
              key={s.manager}
              className="overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-900/40"
            >
              <summary className="flex cursor-pointer select-none items-center gap-3 px-4 py-3 active:bg-white/5">
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-100">
                  {s.manager}
                </span>
                {s.delta > 0 && (
                  <span className="shrink-0 text-xs font-semibold text-emerald-300">
                    +{s.delta}
                  </span>
                )}
                <span className="shrink-0 text-sm font-bold tabular-nums text-white">
                  {s.projected}
                </span>
              </summary>
              <ul className="space-y-1.5 border-t border-white/5 px-3 py-3">
                {roster.map((t) => {
                  const floorIdx = STAGE_ORDER.indexOf(t.reached);
                  const options = STAGE_ORDER.slice(floorIdx);
                  return (
                    <li
                      key={t.code}
                      className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2 ${
                        t.eliminated ? "bg-slate-800/20 opacity-60" : "bg-slate-800/40"
                      }`}
                    >
                      <span className="text-lg leading-none" aria-hidden>
                        {flagFor(t.code)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-slate-100">
                          {t.name}
                        </div>
                        <div className="text-[11px] text-slate-500">Group {t.group}</div>
                      </div>
                      {t.eliminated ? (
                        <span className="shrink-0 rounded bg-slate-700/50 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                          Out
                        </span>
                      ) : (
                        <select
                          value={reached(t.code)}
                          onChange={(e) => setStage(t.code, e.target.value as Stage)}
                          className="shrink-0 rounded-lg border border-slate-600 bg-slate-800 px-2 py-1.5 text-sm font-medium text-slate-100 focus:border-emerald-400 focus:outline-none"
                          aria-label={`How far does ${t.name} go?`}
                        >
                          {options.map((st) => (
                            <option key={st} value={st}>
                              {STAGE_LABEL[st]}
                            </option>
                          ))}
                        </select>
                      )}
                    </li>
                  );
                })}
              </ul>
            </details>
          );
        })}
      </div>
    </div>
  );
}
