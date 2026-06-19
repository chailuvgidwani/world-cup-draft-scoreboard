import {
  computeStandings,
  tournamentSummary,
  STAGE_SHORT,
  SCORING_HELP,
  type TeamScore,
  type ManagerScore,
} from "@/lib/scoring";
import { flagFor } from "@/lib/flags";

const RANK_STYLES: Record<
  number,
  { ring: string; badge: string; medal: string }
> = {
  1: {
    ring: "border-amber-400/40 bg-gradient-to-b from-amber-500/10 to-slate-900/40",
    badge: "bg-amber-400 text-slate-950",
    medal: "🥇",
  },
  2: {
    ring: "border-slate-300/30 bg-gradient-to-b from-slate-300/10 to-slate-900/40",
    badge: "bg-slate-200 text-slate-950",
    medal: "🥈",
  },
  3: {
    ring: "border-orange-400/30 bg-gradient-to-b from-orange-500/10 to-slate-900/40",
    badge: "bg-orange-400 text-slate-950",
    medal: "🥉",
  },
};

function record(team: TeamScore): string {
  const { wins, draws, losses, played } = team.stat;
  if (played === 0) return "—";
  return `${wins}W ${draws}D ${losses}L`;
}

function TeamRow({ team }: { team: TeamScore }) {
  const beyondGroup = team.reached !== "group";
  return (
    <li className="flex items-center gap-3 rounded-xl bg-slate-800/40 px-3 py-2.5">
      <span className="text-2xl leading-none" aria-hidden>
        {flagFor(team.code)}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium text-slate-100">
            {team.name}
          </span>
          {team.wonGroup && (
            <span className="shrink-0 rounded bg-amber-400/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-300">
              Group winner
            </span>
          )}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-400">
          <span>Group {team.group}</span>
          <span aria-hidden>·</span>
          <span>{record(team)}</span>
          {beyondGroup && (
            <>
              <span aria-hidden>·</span>
              <span className="rounded bg-emerald-400/15 px-1.5 py-0.5 font-semibold text-emerald-300">
                {STAGE_SHORT[team.reached]}
              </span>
            </>
          )}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div className="text-base font-bold tabular-nums text-emerald-300">
          {team.total}
        </div>
        <div className="text-[10px] uppercase tracking-wide text-slate-500">
          pts
        </div>
      </div>
    </li>
  );
}

function ManagerCard({
  m,
  leaderTotal,
}: {
  m: ManagerScore;
  leaderTotal: number;
}) {
  const style = RANK_STYLES[m.rank];
  const gap = leaderTotal - m.total;
  return (
    <details
      open={m.rank === 1}
      className={`group overflow-hidden rounded-2xl border ${
        style?.ring ?? "border-slate-700/50 bg-slate-900/40"
      } shadow-lg shadow-black/20 backdrop-blur-sm`}
    >
      <summary className="flex cursor-pointer select-none items-center gap-3 px-4 py-3.5 active:bg-white/5">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-extrabold tabular-nums ${
            style?.badge ?? "bg-slate-700 text-slate-200"
          }`}
        >
          {style?.medal ?? m.rank}
        </span>
        <div className="min-w-0 flex-1">
          <div className="line-clamp-2 text-base font-semibold leading-tight text-slate-50">
            {m.manager}
          </div>
          <div className="text-xs text-slate-400">
            {m.rank === 1 ? "Leading" : gap === 0 ? "Tied for 1st" : `${gap} behind`}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-2xl font-extrabold leading-none tabular-nums text-white">
            {m.total}
          </div>
          <div className="text-[10px] uppercase tracking-wide text-slate-400">
            points
          </div>
        </div>
        <svg
          className="chevron h-5 w-5 shrink-0 text-slate-500 transition-transform duration-200"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </summary>
      <div className="border-t border-white/5 px-3 pb-3 pt-3">
        <ul className="space-y-1.5">
          {m.teams.map((team) => (
            <TeamRow key={team.code} team={team} />
          ))}
        </ul>
      </div>
    </details>
  );
}

export default function Home() {
  const standings = computeStandings();
  const summary = tournamentSummary();
  const leaderTotal = standings[0]?.total ?? 0;

  return (
    <main className="mx-auto w-full max-w-xl px-4 pb-16 pt-8 sm:pt-12">
      <header className="mb-6 text-center">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          2026 FIFA World Cup
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          World Cup Draft
          <span className="block bg-gradient-to-r from-emerald-300 to-sky-300 bg-clip-text text-transparent">
            Scoreboard
          </span>
        </h1>
        <p className="mt-3 text-sm text-slate-400">
          {summary.groupStageComplete ? (
            <>{summary.phaseLabel}</>
          ) : (
            <>
              Group Stage · {summary.matchesPlayed} of {summary.totalGroupGames}{" "}
              group matches logged
            </>
          )}
        </p>
      </header>

      <section aria-label="Standings" className="space-y-3">
        {standings.map((m) => (
          <ManagerCard key={m.manager} m={m} leaderTotal={leaderTotal} />
        ))}
      </section>

      <details className="mt-6 rounded-2xl border border-slate-700/50 bg-slate-900/40 backdrop-blur-sm">
        <summary className="flex cursor-pointer select-none items-center gap-2 px-4 py-3 text-sm font-semibold text-slate-200 active:bg-white/5">
          <svg
            className="chevron h-4 w-4 text-slate-500 transition-transform duration-200"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
          How scoring works
        </summary>
        <ul className="space-y-2 border-t border-white/5 px-4 py-4 text-sm text-slate-300">
          {SCORING_HELP.map((row) => (
            <li key={row.label} className="flex items-baseline justify-between gap-4">
              <span className="text-slate-300">{row.label}</span>
              <span className="shrink-0 font-bold tabular-nums text-emerald-300">
                {row.value}
              </span>
            </li>
          ))}
          <li className="border-t border-white/5 pt-3 text-xs leading-relaxed text-slate-500">
            Knockout points are cumulative — reaching the Quarterfinal banks R32
            (+3), R16 (+2) and QF (+3) for +8, on top of group-stage win points
            and any group-winner bonus.
          </li>
        </ul>
      </details>

      <footer className="mt-8 text-center text-xs text-slate-600">
        Updated by the commissioner. Standings recompute on each deploy.
      </footer>
    </main>
  );
}
