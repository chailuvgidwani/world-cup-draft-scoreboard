import { NextResponse } from "next/server";
import { challengeBoard } from "@/lib/challenge";

export const dynamic = "force-dynamic";

// Public leaderboard: who has submitted, predicted champion, and score so far.
export async function GET() {
  return NextResponse.json({ board: await challengeBoard() });
}
