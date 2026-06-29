import Link from "next/link";

const TABS = [
  { href: "/", key: "standings", label: "Standings" },
  { href: "/upcoming", key: "upcoming", label: "Upcoming" },
  { href: "/results", key: "results", label: "Results" },
  { href: "/bracket", key: "bracket", label: "Bracket" },
  { href: "/challenge", key: "challenge", label: "Challenge" },
] as const;

export type NavKey = (typeof TABS)[number]["key"];

// Pill tab-switcher shared across pages. Scrolls horizontally when the tabs
// overflow (e.g. on narrow phones).
export function Nav({ active }: { active: NavKey }) {
  return (
    <nav className="mb-6 flex gap-1 overflow-x-auto rounded-full border border-slate-800 bg-slate-900/50 p-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {TABS.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-center text-[13px] font-medium transition-colors ${
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
