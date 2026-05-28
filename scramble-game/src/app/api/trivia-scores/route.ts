import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  ensureTriviaSchema,
  insertTriviaScore,
  fetchTriviaLeaderboard,
  fetchTriviaRankFor,
} from "@/lib/db";
import { TOTAL_QUESTIONS, MAX_PER_QUESTION } from "@/lib/trivia-questions";

export async function GET() {
  await ensureTriviaSchema();
  const session = await auth();
  const top = await fetchTriviaLeaderboard(100);
  const me = session?.user?.email
    ? await fetchTriviaRankFor(session.user.email)
    : null;
  return NextResponse.json({ top, me });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  await ensureTriviaSchema();

  const body = await req.json().catch(() => null);
  const score = Number(body?.score);
  const correctCount = Number(body?.correctCount);
  const questionsAnswered = Number(body?.questionsAnswered);

  if (
    !Number.isInteger(score) ||
    !Number.isInteger(correctCount) ||
    !Number.isInteger(questionsAnswered) ||
    score < 0 ||
    correctCount < 0 ||
    questionsAnswered < 0 ||
    correctCount > TOTAL_QUESTIONS ||
    questionsAnswered > TOTAL_QUESTIONS ||
    correctCount > questionsAnswered ||
    score > TOTAL_QUESTIONS * MAX_PER_QUESTION
  ) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  if (score > correctCount * MAX_PER_QUESTION) {
    return NextResponse.json({ error: "score_exceeds_correct" }, { status: 400 });
  }

  await insertTriviaScore({
    email: session.user.email,
    name: session.user.name ?? session.user.email,
    score,
    correctCount,
    questionsAnswered,
  });

  const me = await fetchTriviaRankFor(session.user.email);
  return NextResponse.json({ ok: true, me });
}
