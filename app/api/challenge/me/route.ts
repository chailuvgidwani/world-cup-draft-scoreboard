import { NextResponse } from "next/server";
import { playerForPassword, getSubmission } from "@/lib/challenge";

export const dynamic = "force-dynamic";

// Unlock with a password: returns who you are and your existing picks (if any).
export async function POST(req: Request) {
  const { password } = (await req.json().catch(() => ({}))) as { password?: string };
  const player = playerForPassword(password);
  if (!player) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }
  const sub = await getSubmission(player);
  return NextResponse.json({ player, picks: sub?.picks ?? {}, updatedAt: sub?.updatedAt ?? null });
}
