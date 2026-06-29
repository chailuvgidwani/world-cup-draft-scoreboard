import { NextResponse } from "next/server";
import { playerForPassword, saveSubmission } from "@/lib/challenge";

export const dynamic = "force-dynamic";

// Submit (or update) your bracket. Auth by password; picks are validated/cleaned
// against the real bracket before storing.
export async function POST(req: Request) {
  const { password, picks } = (await req.json().catch(() => ({}))) as {
    password?: string;
    picks?: Record<string, string>;
  };
  const player = playerForPassword(password);
  if (!player) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }
  if (!picks || typeof picks !== "object") {
    return NextResponse.json({ error: "Missing picks" }, { status: 400 });
  }
  await saveSubmission(player, picks);
  return NextResponse.json({ ok: true });
}
