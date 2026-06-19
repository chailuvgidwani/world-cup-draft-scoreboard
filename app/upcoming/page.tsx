import { upcomingByDay, type Fixture } from "@/lib/scoring";
import { flagFor } from "@/lib/flags";
import { Nav } from "../Nav";

export const metadata = {
  title: "Upcoming — World Cup Draft Scoreboard",
  description: "Scheduled fixtures and the manager matchups for each game.",
};

function FixtureCard({ f }: { f: Fixture }) {
  return (
    <li className="rounded-xl bg-slate-800/40 px-3 py-3">
      <div className="flex items-stretch gap-2">
        {/* Home team + owner */}
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <span className="text-xl leading-none" aria-hidden>
            {flagFor(f.a)}
          </span>
          <div className="min-w-0">
            <div className="truncate font-medium text-slate-100">{f.aName}</div>
            <div className="truncate text-xs font-medium text-emerald-300/90">
              {f.aOwner ?? "—"}
            </div>
          </div>
        </div>

        <span className="shrink-0 self-center text-xs font-semibold uppercase tracking-wide text-slate-500">
          vs
        </span>

        {/* Away team + owner (mirrored) */}
        <div className="flex min-w-0 flex-1 items-center justify-end gap-2.5 text-right">
          <div className="min-w-0">
            <div className="truncate font-medium text-slate-100">{f.bName}</div>
            <div className="truncate text-xs font-medium text-emerald-300/90">
              {f.bOwner ?? "—"}
            </div>
          </div>
          <span className="text-xl leading-none" aria-hidden>
            {flagFor(f.b)}
          </span>
        </div>
      </div>
      <div className="mt-2 text-center text-[10px] uppercase tracking-wide text-slate-600">
        Group {f.group}
      </div>
    </li>
  );
}

export default function UpcomingPage() {
  const days = upcomingByDay();

  return (
    <main className="mx-auto w-full max-w-xl px-4 pb-16 pt-8 sm:pt-12">
      <header className="mb-6 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">
          Upcoming
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Scheduled fixtures and who&apos;s facing off
        </p>
      </header>

      <Nav active="upcoming" />

      {days.length === 0 ? (
        <p className="mt-10 text-center text-sm text-slate-500">
          No scheduled fixtures left — every logged game has been played.
        </p>
      ) : (
        <div className="space-y-6">
          {days.map((day) => (
            <section key={day.date}>
              <h2 className="mb-2 px-1 text-sm font-semibold uppercase tracking-wide text-slate-400">
                {day.label}
              </h2>
              <ul className="space-y-2">
                {day.fixtures.map((f, i) => (
                  <FixtureCard key={`${f.a}-${f.b}-${i}`} f={f} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <p className="mt-8 text-center text-xs leading-relaxed text-slate-600">
        Each manager&apos;s drafted teams are shown under the country. A fixture
        drops off this list once its result is logged.
      </p>
    </main>
  );
}
