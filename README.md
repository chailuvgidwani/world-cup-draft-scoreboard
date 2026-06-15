# World Cup Draft Scoreboard

Live standings for a 6-manager fantasy draft of the **2026 FIFA World Cup**.

There is **no database and no login**. All league state lives in a single file —
[`lib/data.ts`](lib/data.ts) — and the page computes standings from it at build /
render time. The site is read-only and public. To update results, the
commissioner edits `lib/data.ts` and pushes to GitHub, which triggers a Vercel
redeploy.

Built with **Next.js (App Router) + TypeScript + Tailwind CSS**. No API routes,
no data store, deploys on Vercel's free Hobby tier with zero config.

## Run locally

```bash
npm install
npm run dev      # http://localhost:3000
```

Build a production bundle:

```bash
npm run build
npm run start
```

## How scoring works

Points accumulate per drafted country across the tournament:

| Event | Points |
| --- | --- |
| Group-stage win (per win) | +2 |
| Win your group (finish 1st) | +1 bonus |
| Advance to Round of 32 | +3 |
| Reach Round of 16 | +2 |
| Reach Quarterfinal | +3 |
| Reach Semifinal | +4 |
| Reach Final | +5 |
| Win the World Cup | +8 |

Knockout points are **cumulative**: a team that reaches the Quarterfinal earns
+3 (R32) +2 (R16) +3 (QF) = **+8** in milestone points, plus the group-winner
bonus if applicable, plus its group-stage win points. A champion banks
+3+2+3+4+5+8 = **+25** in milestone points on top of group points.

A manager's total is the sum of their 8 teams' points. All of this is computed
in [`lib/scoring.ts`](lib/scoring.ts) from the raw data — you never edit scores
by hand.

## Updating results (commissioner workflow)

Everything you change lives in [`lib/data.ts`](lib/data.ts).

### 1. Log a completed group game

Add one object to `groupMatches`. Order of `a` / `b` doesn't matter for scoring.

```ts
export const groupMatches = [
  // ...existing games...
  { a: "ESP", sa: 3, b: "URU", sb: 1 },
];
```

Win points are derived automatically (+2 per win; draws and losses score 0).

### 2. Finalize a group / advance teams through the knockouts

Update `teamStatus`. By default every team is `{ wonGroup: false, reached: "group" }`.
Override only the teams whose status changed. For example, once Group A finishes
and teams advance:

```ts
export const teamStatus = {
  ...Object.fromEntries(
    Object.keys(TEAMS).map((code) => [code, { wonGroup: false, reached: "group" as Stage }])
  ),
  // Group A finished — Mexico won it and advanced; South Korea advanced as runner-up.
  MEX: { wonGroup: true, reached: "r32" },
  KOR: { wonGroup: false, reached: "r32" },
};
```

Set `reached` to the **furthest** stage a team has played into:
`"group" | "r32" | "r16" | "qf" | "sf" | "final" | "champion"`. The cumulative
milestone points are filled in for you.

### 3. Push

```bash
git add lib/data.ts
git commit -m "Update results"
git push
```

Vercel redeploys automatically and the standings update.

## Deploy to Vercel

1. Push this folder to a GitHub repository.
2. In Vercel, **Add New → Project** and import that repo.
3. Framework preset auto-detects **Next.js** — no environment variables, no
   settings to change. Click **Deploy**.

Every push to the default branch triggers a fresh deploy.
