"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { flagFor } from "@/lib/flags";
import { resolveBracket, normalizePicks, pairKey, type Picks } from "@/lib/bracketLogic";
import type { BracketData, BracketMatch } from "@/lib/scoring";

type BoardRow = {
  player: string;
  submitted: boolean;
  score: number;
  champion: string | null;
  updatedAt: string | null;
};

const ROUNDS = [
  { round: "r32", label: "Round of 32" },
  { round: "r16", label: "Round of 16" },
  { round: "qf", label: "Quarterfinals" },
  { round: "sf", label: "Semifinals" },
  { round: "final", label: "Final" },
] as const;

export function Challenge({ data }: { data: BracketData }) {
  const teamInfo = useMemo(() => {
    const m: Record<string, (typeof data.teams)[number]> = {};
    for (const t of data.teams) m[t.code] = t;
    return m;
  }, [data.teams]);
  const resultByPair = useMemo(
    () => new Map(data.results.map((r) => [pairKey(r.a, r.b), r.winner])),
    [data.results],
  );

  const [board, setBoard] = useState<BoardRow[] | null>(null);
  const refreshBoard = useCallback(async () => {
    try {
      const r = await fetch("/api/challenge/board", { cache: "no-store" });
      const j = await r.json();
      setBoard(j.board ?? []);
    } catch {
      setBoard([]);
    }
  }, []);
  useEffect(() => {
    refreshBoard();
  }, [refreshBoard]);

  const [password, setPassword] = useState("");
  const [player, setPlayer] = useState<string | null>(null);
  const [picks, setPicks] = useState<Picks>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function unlock(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/challenge/me", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password: password.trim() }),
      });
      if (!r.ok) {
        setError("That password didn't match. Check with the commissioner.");
      } else {
        const j = await r.json();
        setPlayer(j.player);
        setPicks(normalizePicks(data.matches, resultByPair, j.picks ?? {}));
      }
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function submit() {
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const r = await fetch("/api/challenge/submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password: password.trim(), picks }),
      });
      if (!r.ok) setError("Submit failed. Try again.");
      else {
        setSaved(true);
        refreshBoard();
      }
    } catch {
      setError("Submit failed. Try again.");
    } finally {
      setBusy(false);
    }
  }

  const state = useMemo(
    () => resolveBracket(data.matches, resultByPair, picks),
    [data.matches, resultByPair, picks],
  );
  const pick = (id: string, team: string) => {
    setSaved(false);
    setPicks((prev) => normalizePicks(data.matches, resultByPair, { ...prev, [id]: team }));
  };
  const decided = data.matches.filter((m) => state.winner[m.id]).length;
  const champion = state.winner["104"];
  const champInfo = champion ? teamInfo[champion] : undefined;

  const captureRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  async function exportPng() {
    if (!captureRef.current) return;
    setExporting(true);
    try {
      const url = await toPng(captureRef.current, {
        backgroundColor: "#020617",
        pixelRatio: 2,
        cacheBust: true,
      });
      const a = document.createElement("a");
      a.href = url;
      a.download = `${player ?? "my"}-bracket.png`;
      a.click();
    } catch {
      setError("Couldn't make the image. Try again.");
    } finally {
      setExporting(false);
    }
  }

  function Slot({ matchId, team, pickable }: { matchId: string; team: string | null; pickable: boolean }) {
    const t = team ? teamInfo[team] : undefined;
    const isWinner = !!team && state.winner[matchId] === team;
    const locked = state.locked.has(matchId);
    return (
      <button
        type="button"
        disabled={!team || !pickable}
        onClick={() => team && pick(matchId, team)}
        className={`flex w-full items-center gap-2 px-2.5 py-1.5 text-left transition-colors ${
          isWinner ? "bg-emerald-400/15" : "enabled:hover:bg-white/5"
        } disabled:cursor-default`}
      >
        <span className="text-base leading-none" aria-hidden>
          {team ? flagFor(team) : "—"}
        </span>
        <span className="min-w-0 flex-1">
          <span
            className={`block truncate text-sm ${
              isWinner ? "font-semibold text-emerald-200" : team ? "text-slate-100" : "text-slate-600"
            }`}
          >
            {t ? t.name : "TBD"}
          </span>
          {t && <span className="block truncate text-[11px] text-slate-500">{t.ownerLabel}</span>}
        </span>
        {isWinner && (
          <span className="shrink-0 text-xs text-emerald-300" aria-hidden>
            {locked ? "🔒" : "✓"}
          </span>
        )}
      </button>
    );
  }

  function MatchCard({ m }: { m: BracketMatch }) {
    const [a, b] = state.part[m.id];
    const pickable = !!a && !!b && !state.locked.has(m.id);
    return (
      <li className="overflow-hidden rounded-xl border border-slate-700/50 bg-slate-900/40">
        <Slot matchId={m.id} team={a} pickable={pickable} />
        <div className="border-t border-white/5" />
        <Slot matchId={m.id} team={b} pickable={pickable} />
      </li>
    );
  }

  return (
    <div>
      {/* Leaderboard */}
      <section className="mb-6 rounded-2xl border border-slate-700/50 bg-slate-900/40 p-3">
        <h2 className="mb-2 px-1 text-sm font-semibold uppercase tracking-wide text-slate-300">
          Challenge leaderboard
        </h2>
        {board === null ? (
          <p className="px-2 py-3 text-sm text-slate-500">Loading…</p>
        ) : (
          <ol className="space-y-1">
            {board.map((row, i) => {
              const champ = row.champion ? teamInfo[row.champion] : undefined;
              return (
                <li
                  key={row.player}
                  className="flex items-center gap-3 rounded-lg px-2 py-1.5 odd:bg-white/[0.02]"
                >
                  <span className="w-5 shrink-0 text-center text-sm font-bold tabular-nums text-slate-500">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-slate-100">{row.player}</div>
                    <div className="truncate text-[11px] text-slate-500">
                      {row.submitted
                        ? champ
                          ? `Picks ${champ.name} ${flagFor(row.champion!)}`
                          : "Submitted"
                        : "Not submitted yet"}
                    </div>
                  </div>
                  {row.submitted ? (
                    <span className="shrink-0 text-base font-extrabold tabular-nums text-white">
                      {row.score}
                    </span>
                  ) : (
                    <span className="shrink-0 text-xs text-slate-600">—</span>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </section>

      {/* Auth / builder */}
      {!player ? (
        <form
          onSubmit={unlock}
          className="rounded-2xl border border-slate-700/50 bg-slate-900/40 p-4"
        >
          <label className="block text-sm font-medium text-slate-200">
            Enter your password to build your bracket
          </label>
          <p className="mt-1 text-xs text-slate-500">
            The commissioner sent you a private password.
          </p>
          <div className="mt-3 flex gap-2">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="min-w-0 flex-1 rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
            />
            <button
              type="submit"
              disabled={busy || !password.trim()}
              className="shrink-0 rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 transition-opacity disabled:opacity-50"
            >
              {busy ? "…" : "Unlock"}
            </button>
          </div>
          {error && <p className="mt-2 text-xs text-rose-400">{error}</p>}
        </form>
      ) : (
        <div>
          <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-700/50 bg-slate-900/40 p-3">
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-slate-100">
                {player}&apos;s bracket
              </div>
              <div className="text-xs text-slate-500">
                {decided}/{data.matches.length} picked
                {champInfo ? ` · 🏆 ${champInfo.name}` : ""}
              </div>
            </div>
            <button
              onClick={exportPng}
              disabled={exporting}
              className="rounded-full border border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors enabled:hover:bg-white/5 disabled:opacity-50"
            >
              {exporting ? "Saving…" : "Export PNG"}
            </button>
            <button
              onClick={submit}
              disabled={busy}
              className="rounded-full bg-emerald-400 px-4 py-1.5 text-xs font-bold text-slate-950 transition-opacity disabled:opacity-50"
            >
              {saved ? "Submitted ✓" : busy ? "…" : "Submit"}
            </button>
          </div>
          {error && <p className="mb-3 px-1 text-xs text-rose-400">{error}</p>}

          <div ref={captureRef} className="bg-slate-950 p-1">
            <div className="px-1 pb-3 pt-1 text-center">
              <div className="text-sm font-bold text-white">{player}&apos;s Bracket</div>
              <div className="text-xs text-amber-300">
                {champInfo ? `🏆 ${champInfo.name}` : "World Cup Draft Challenge"}
              </div>
            </div>
            <div className="space-y-6">
              {ROUNDS.map(({ round, label }) => (
                <section key={round}>
                  <h3 className="mb-2 px-1 text-sm font-semibold uppercase tracking-wide text-slate-400">
                    {label}
                  </h3>
                  <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {data.matches
                      .filter((m) => m.round === round)
                      .map((m) => (
                        <MatchCard key={m.id} m={m} />
                      ))}
                  </ul>
                </section>
              ))}
            </div>
          </div>

          <p className="mt-6 text-center text-xs leading-relaxed text-slate-600">
            Tap a team to advance it. Submit to lock in your entry (you can resubmit
            to change it until games are played). Export a PNG to share in the chat.
          </p>
        </div>
      )}
    </div>
  );
}
