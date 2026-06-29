"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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

  const [exporting, setExporting] = useState(false);

  // Draw a real left-to-right tournament bracket (boxes + connector lines) to a
  // canvas and return a PNG data URL.
  function renderBracketImage(): string {
    const { matches } = data;
    const byId = new Map(matches.map((m) => [m.id, m]));
    const { winner, part } = state;

    // R32 order, top to bottom: in-order traversal from the final.
    const order: string[] = [];
    const dfs = (id: string) => {
      const m = byId.get(id);
      if (!m) return;
      if (m.round === "r32") return void order.push(id);
      if (m.fromA) dfs(m.fromA);
      if (m.fromB) dfs(m.fromB);
    };
    dfs("104");

    const rounds = ["r32", "r16", "qf", "sf", "final"];
    const labels: Record<string, string> = {
      r32: "ROUND OF 32",
      r16: "ROUND OF 16",
      qf: "QUARTERS",
      sf: "SEMIS",
      final: "FINAL",
    };
    const boxW = 168;
    const slotH = 22;
    const boxH = slotH * 2;
    const gapY = 12;
    const colGap = 28;
    const colW = boxW + colGap;
    const padX = 22;
    const padTop = 84;
    const padBottom = 26;
    const colX = (r: string) => padX + rounds.indexOf(r) * colW;

    const yc: Record<string, number> = {};
    order.forEach((id, i) => {
      yc[id] = padTop + i * (boxH + gapY) + boxH / 2;
    });
    for (const r of ["r16", "qf", "sf", "final"]) {
      for (const m of matches.filter((x) => x.round === r)) {
        yc[m.id] = (yc[m.fromA!] + yc[m.fromB!]) / 2;
      }
    }

    const totalH = padTop + order.length * (boxH + gapY) - gapY + padBottom;
    const champX = colX("final") + colW;
    const totalW = champX + boxW + padX;

    const dpr = 2;
    const canvas = document.createElement("canvas");
    canvas.width = totalW * dpr;
    canvas.height = totalH * dpr;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);
    ctx.textBaseline = "middle";

    ctx.fillStyle = "#020617";
    ctx.fillRect(0, 0, totalW, totalH);

    const titleText = `${player}'s Bracket`;
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 24px ui-sans-serif, system-ui, -apple-system, sans-serif";
    ctx.fillText(titleText, padX, 34);
    const titleW = ctx.measureText(titleText).width;
    ctx.fillStyle = champInfo ? "#fbbf24" : "#64748b";
    ctx.font = "15px ui-sans-serif, system-ui, sans-serif";
    ctx.fillText(
      champInfo ? `🏆 Champion: ${champInfo.name}` : "2026 World Cup Draft Challenge",
      padX + titleW + 16,
      35,
    );

    ctx.fillStyle = "#64748b";
    ctx.font = "bold 11px ui-sans-serif, system-ui, sans-serif";
    for (const r of rounds) ctx.fillText(labels[r], colX(r), padTop - 18);
    ctx.fillText("CHAMPION", champX, padTop - 18);

    // connector lines (behind boxes)
    ctx.strokeStyle = "#26344a";
    ctx.lineWidth = 1.5;
    for (const r of ["r16", "qf", "sf", "final"]) {
      for (const m of matches.filter((x) => x.round === r)) {
        const px = colX(r);
        const py = yc[m.id];
        for (const child of [m.fromA!, m.fromB!]) {
          const cx = colX(byId.get(child)!.round) + boxW;
          const cyy = yc[child];
          const midX = px - colGap / 2;
          ctx.beginPath();
          ctx.moveTo(cx, cyy);
          ctx.lineTo(midX, cyy);
          ctx.lineTo(midX, py);
          ctx.lineTo(px, py);
          ctx.stroke();
        }
      }
    }
    ctx.beginPath();
    ctx.moveTo(colX("final") + boxW, yc["104"]);
    ctx.lineTo(champX, yc["104"]);
    ctx.stroke();

    const drawSlot = (x: number, y: number, team: string | null, win: boolean) => {
      ctx.fillStyle = win ? "rgba(16,185,129,0.18)" : "#0b1220";
      ctx.fillRect(x, y, boxW, slotH);
      ctx.strokeStyle = "#1e293b";
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, boxW, slotH);
      const t = team ? teamInfo[team] : null;
      ctx.fillStyle = win ? "#6ee7b7" : team ? "#e2e8f0" : "#475569";
      ctx.font = `${win ? "bold " : ""}12.5px ui-sans-serif, system-ui, sans-serif`;
      ctx.save();
      ctx.beginPath();
      ctx.rect(x + 7, y, boxW - 14, slotH);
      ctx.clip();
      ctx.fillText(t ? `${flagFor(team!)}  ${t.name}` : "—", x + 8, y + slotH / 2 + 1);
      ctx.restore();
    };
    for (const m of matches) {
      const x = colX(m.round);
      const y = yc[m.id] - boxH / 2;
      const [a, b] = part[m.id];
      drawSlot(x, y, a, !!a && winner[m.id] === a);
      drawSlot(x, y + slotH, b, !!b && winner[m.id] === b);
    }
    if (champion && champInfo) {
      const y = yc["104"] - slotH / 2;
      ctx.fillStyle = "rgba(251,191,36,0.18)";
      ctx.fillRect(champX, y, boxW, slotH);
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(champX, y, boxW, slotH);
      ctx.fillStyle = "#fde68a";
      ctx.font = "bold 12.5px ui-sans-serif, system-ui, sans-serif";
      ctx.save();
      ctx.beginPath();
      ctx.rect(champX + 7, y, boxW - 14, slotH);
      ctx.clip();
      ctx.fillText(`🏆 ${champInfo.name}`, champX + 8, y + slotH / 2 + 1);
      ctx.restore();
    }
    return canvas.toDataURL("image/png");
  }

  function exportPng() {
    setExporting(true);
    try {
      const a = document.createElement("a");
      a.href = renderBracketImage();
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

          <p className="mt-6 text-center text-xs leading-relaxed text-slate-600">
            Tap a team to advance it. Submit to lock in your entry (you can resubmit
            to change it until games are played). Export PNG saves a bracket image
            to share in the chat.
          </p>
        </div>
      )}
    </div>
  );
}
