import Link from "next/link";

// Pill tab-switcher shared by the Standings and Results pages.
export function Nav({ active }: { active: "standings" | "results" }) {
  const base =
    "flex-1 rounded-full px-4 py-1.5 text-center text-sm font-medium transition-colors";
  const on = "bg-slate-100 text-slate-900";
  const off = "text-slate-400 hover:text-slate-200";
  return (
    <nav className="mx-auto mb-6 flex max-w-xs gap-1 rounded-full border border-slate-800 bg-slate-900/50 p-1">
      <Link href="/" className={`${base} ${active === "standings" ? on : off}`}>
        Standings
      </Link>
      <Link href="/results" className={`${base} ${active === "results" ? on : off}`}>
        Results
      </Link>
    </nav>
  );
}
