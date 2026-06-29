import { bracketData } from "@/lib/scoring";
import { Nav } from "../Nav";
import { Challenge } from "../Challenge";

export const metadata = {
  title: "Bracket Challenge — World Cup Draft Scoreboard",
  description: "Submit your knockout bracket with your password and share it.",
};

export default function ChallengePage() {
  const data = bracketData();

  return (
    <main className="mx-auto w-full max-w-xl px-4 pb-16 pt-8 sm:pt-12">
      <header className="mb-6 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">
          Bracket Challenge
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Predict the knockouts, submit, and share your card
        </p>
      </header>

      <Nav active="challenge" />

      <Challenge data={data} />
    </main>
  );
}
