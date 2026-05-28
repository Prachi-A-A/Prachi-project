import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ensureSchema, insertScore, fetchLeaderboard, fetchRankFor } from "@/lib/db";

const TOTAL_WORDS = 12;
const MAX_PER_WORD = 16; // 10 base + up to 6 time bonus

export async function GET() {
  try {
    await ensureSchema();
    const session = await auth();
    const top = await fetchLeaderboard(100);
    const me = session?.user?.email
      ? await fetchRankFor(session.user.email)
      : null;
    return NextResponse.json({ top, me });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "db_error";
    return NextResponse.json(
      { error: "db_unavailable", detail: msg, top: [], me: null },
      { status: 503 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  await ensureSchema();

  const body = await req.json().catch(() => null);
  const score = Number(body?.score);
  const wordsSolved = Number(body?.wordsSolved);

  if (
    !Number.isInteger(score) ||
    !Number.isInteger(wordsSolved) ||
    score < 0 ||
    wordsSolved < 0 ||
    wordsSolved > TOTAL_WORDS ||
    score > TOTAL_WORDS * MAX_PER_WORD
  ) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  // Loose sanity: solved words give +10 base, max 6 bonus per word.
  // Score should not exceed wordsSolved * 16.
  if (score > wordsSolved * MAX_PER_WORD) {
    return NextResponse.json({ error: "score_exceeds_solved" }, { status: 400 });
  }

  try {
    await insertScore({
      email: session.user.email,
      name: session.user.name ?? session.user.email,
      score,
      wordsSolved,
    });
    const me = await fetchRankFor(session.user.email);
    return NextResponse.json({ ok: true, me });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "db_error";
    // Local dev without a database connection lands here. Surface it cleanly.
    return NextResponse.json(
      { error: "db_unavailable", detail: msg },
      { status: 503 }
    );
  }
}
