import { scenarioTeams } from "@/lib/scoring";
import { Nav } from "../Nav";
import { Scenarios } from "../Scenarios";

export const metadata = {
  title: "Scenarios — World Cup Draft Scoreboard",
  description: "Play out the rest of the tournament and see the points table react.",
};

export default function ScenariosPage() {
  const teams = scenarioTeams();

  return (
    <main className="mx-auto w-full max-w-xl px-4 pb-16 pt-8 sm:pt-12">
      <header className="mb-6 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Scenarios</h1>
        <p className="mt-2 text-sm text-slate-400">
          Play out the rest of the way and watch the table move
        </p>
      </header>

      <Nav active="scenarios" />

      <Scenarios teams={teams} />

      <p className="mt-8 text-center text-xs leading-relaxed text-slate-600">
        Projections only — nothing here changes the real standings. Group results
        so far are locked in; you choose every knockout outcome from here. More
        teams unlock as the group stage finishes.
      </p>
    </main>
  );
}
