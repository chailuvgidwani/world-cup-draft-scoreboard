import { bracketData } from "@/lib/scoring";
import { Nav } from "../Nav";
import { Bracket } from "../Bracket";

export const metadata = {
  title: "Bracket — World Cup Draft Scoreboard",
  description: "Click through the knockout bracket and see the points table react.",
};

export default function BracketPage() {
  const data = bracketData();

  return (
    <main className="mx-auto w-full max-w-xl px-4 pb-16 pt-8 sm:pt-12">
      <header className="mb-6 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Bracket</h1>
        <p className="mt-2 text-sm text-slate-400">
          Pick the knockouts and watch the table move
        </p>
      </header>

      <Nav active="bracket" />

      <Bracket data={data} />
    </main>
  );
}
