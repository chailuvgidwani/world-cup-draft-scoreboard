import {
  matchesByGroup,
  statusAwards,
  knockoutResultsByRound,
  tournamentSummary,
  ownerOf,
  STAGE_SHORT,
  type ResultRow,
} from "@/lib/scoring";
import { flagFor } from "@/lib/flags";
import { Nav } from "../Nav";

export const metadata = {
  title: "Results — World Cup Draft Scoreboard",
  description: "Every match and award factored into the draft standings.",
};

function ScoreRow({
  code,
  name,
  owner,
  score,
  win,
  draw,
  gain,
}: {
  code: string;
  name: string;
  owner: string | null;
  score: number;
  win: boolean;
  draw: boolean;
  gain: number;
}) {
  const tone = win
    ? "text-emerald-300"
    : draw
      ? "text-slate-200"
      : "text-slate-400";
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="text-xl leading-none" aria-hidden>
          {flagFor(code)}
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className={`truncate ${win ? "font-semibold" : ""} ${tone}`}>
              {name}
            </span>
            {win && (
              <span className="shrink-0 rounded bg-emerald-400/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-300">
                +{gain}
              </span>
            )}
          </div>
          {owner && (
            <div className="truncate text-xs text-slate-500">{owner}</div>
          )}
        </div>
      </div>
      <span className={`shrink-0 text-lg font-bold tabular-nums ${tone}`}>
        {score}
      </span>
    </div>
  );
}

// Points the winner banks: +2 for a group win, or the milestone gained by
// advancing in a knockout round (R32 win → reach R16 = +2, … final win = +8).
const KO_GAIN: Record<string, number> = { r32: 2, r16: 3, qf: 4, sf: 5, final: 8 };

function MatchCard({ m, round }: { m: ResultRow; round?: string }) {
  const draw = m.winner === null;
  const gain = round ? (KO_GAIN[round] ?? 0) : 2;
  return (
    <li className="rounded-xl bg-slate-800/40 px-3 py-2">
      <ScoreRow
        code={m.a}
        name={m.aName}
        owner={ownerOf(m.a)}
        score={m.sa}
        win={m.winner === m.a}
        draw={draw}
        gain={gain}
      />
      <div className="my-1 border-t border-white/5" />
      <ScoreRow
        code={m.b}
        name={m.bName}
        owner={ownerOf(m.b)}
        score={m.sb}
        win={m.winner === m.b}
        draw={draw}
        gain={gain}
      />
    </li>
  );
}

export default function ResultsPage() {
  const groups = matchesByGroup();
  const awards = statusAwards();
  const knockouts = knockoutResultsByRound();
  const summary = tournamentSummary();

  return (
    <main className="mx-auto w-full max-w-xl px-4 pb-16 pt-8 sm:pt-12">
      <header className="mb-6 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">
          Results
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Every game and award factored into the standings
        </p>
      </header>

      <Nav active="results" />

      <p className="mb-5 text-center text-xs uppercase tracking-wide text-slate-500">
        {summary.matchesPlayed} of {summary.totalGroupGames} group matches logged
        {!summary.groupStageComplete &&
          ` · ${summary.totalGroupGames - summary.matchesPlayed} to play`}
      </p>

      {knockouts.length > 0 && (
        <div className="mb-6 space-y-6">
          {knockouts.map(({ round, label, matches }) => (
            <section key={round}>
              <h2 className="mb-2 px-1 text-sm font-semibold uppercase tracking-wide text-emerald-300/80">
                {label}
              </h2>
              <ul className="space-y-2">
                {matches.map((m, i) => (
                  <MatchCard key={`${m.a}-${m.b}-${i}`} m={m} round={round} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <div className="space-y-6">
        {groups.map(({ group, matches }) => (
          <section key={group}>
            <h2 className="mb-2 px-1 text-sm font-semibold uppercase tracking-wide text-slate-400">
              Group {group}
            </h2>
            <ul className="space-y-2">
              {matches.map((m, i) => (
                <MatchCard key={`${m.a}-${m.b}-${i}`} m={m} />
              ))}
            </ul>
          </section>
        ))}
      </div>

      {awards.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-2 px-1 text-sm font-semibold uppercase tracking-wide text-slate-400">
            Group winners &amp; advancement
          </h2>
          <ul className="space-y-2">
            {awards.map((a) => {
              const parts: string[] = [];
              if (a.wonGroup) parts.push(`Won group +${a.groupWinnerBonus}`);
              for (const ms of a.milestones)
                parts.push(`${STAGE_SHORT[ms.stage]} +${ms.points}`);
              return (
                <li
                  key={a.code}
                  className="flex items-center gap-3 rounded-xl bg-slate-800/40 px-3 py-2.5"
                >
                  <span className="text-xl leading-none" aria-hidden>
                    {flagFor(a.code)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium text-slate-100">
                        {a.name}
                      </span>
                      <span className="shrink-0 text-xs text-slate-500">
                        Group {a.group}
                      </span>
                    </div>
                    <div className="mt-0.5 truncate text-xs text-slate-400">
                      {parts.join(" · ")}
                    </div>
                  </div>
                  <span className="shrink-0 text-base font-bold tabular-nums text-emerald-300">
                    +{a.total}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <p className="mt-8 text-center text-xs leading-relaxed text-slate-600">
        Group win = +2 each. Draws and losses score 0. Group-winner and
        advancement points are shown above. See the Standings tab for the full
        scoring breakdown.
      </p>
    </main>
  );
}
