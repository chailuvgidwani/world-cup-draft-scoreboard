import Link from "next/link";

const TABS = [
  { href: "/", key: "standings", label: "Standings" },
  { href: "/upcoming", key: "upcoming", label: "Upcoming" },
  { href: "/results", key: "results", label: "Results" },
] as const;

// Pill tab-switcher shared by the Standings, Upcoming, and Results pages.
export function Nav({ active }: { active: "standings" | "upcoming" | "results" }) {
  return (
    <nav className="mx-auto mb-6 flex max-w-sm gap-1 rounded-full border border-slate-800 bg-slate-900/50 p-1">
      {TABS.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          className={`flex-1 rounded-full px-3 py-1.5 text-center text-sm font-medium transition-colors ${
            active === tab.key
              ? "bg-slate-100 text-slate-900"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
