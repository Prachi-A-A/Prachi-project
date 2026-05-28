import { sql } from "@vercel/postgres";

export type LeaderRow = {
  email: string;
  name: string;
  best_score: number;
  best_solved: number;
  plays: number;
};

export async function ensureSchema() {
  await sql`
    CREATE TABLE IF NOT EXISTS scores (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL,
      name TEXT NOT NULL,
      score INTEGER NOT NULL CHECK (score >= 0 AND score <= 1000),
      words_solved INTEGER NOT NULL CHECK (words_solved >= 0 AND words_solved <= 50),
      played_at TIMESTAMP DEFAULT NOW()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_scores_score ON scores(score DESC);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_scores_email ON scores(email);`;
}

export async function insertScore(opts: {
  email: string;
  name: string;
  score: number;
  wordsSolved: number;
}) {
  const { email, name, score, wordsSolved } = opts;
  await sql`
    INSERT INTO scores (email, name, score, words_solved)
    VALUES (${email}, ${name}, ${score}, ${wordsSolved});
  `;
}

export async function fetchLeaderboard(limit = 100): Promise<LeaderRow[]> {
  const { rows } = await sql<LeaderRow>`
    SELECT
      email,
      (array_agg(name ORDER BY played_at DESC))[1] AS name,
      MAX(score) AS best_score,
      MAX(words_solved) AS best_solved,
      COUNT(*)::int AS plays
    FROM scores
    GROUP BY email
    ORDER BY best_score DESC, best_solved DESC
    LIMIT ${limit};
  `;
  return rows;
}

export async function fetchRankFor(email: string): Promise<{ rank: number; bestScore: number; plays: number } | null> {
  const { rows } = await sql<{ rank: number; best_score: number; plays: number }>`
    WITH per_user AS (
      SELECT email, MAX(score) AS best_score, COUNT(*)::int AS plays
      FROM scores
      GROUP BY email
    ),
    ranked AS (
      SELECT email, best_score, plays,
             RANK() OVER (ORDER BY best_score DESC) AS rank
      FROM per_user
    )
    SELECT rank::int AS rank, best_score, plays FROM ranked WHERE email = ${email};
  `;
  if (rows.length === 0) return null;
  return { rank: rows[0].rank, bestScore: rows[0].best_score, plays: rows[0].plays };
}

/* ---------- Trivia (Two Truths & One Lie) ---------- */

export type TriviaLeaderRow = {
  email: string;
  name: string;
  best_score: number;
  best_correct: number;
  plays: number;
};

export async function ensureTriviaSchema() {
  await sql`
    CREATE TABLE IF NOT EXISTS trivia_scores (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL,
      name TEXT NOT NULL,
      score INTEGER NOT NULL CHECK (score >= 0 AND score <= 200),
      correct_count INTEGER NOT NULL CHECK (correct_count >= 0 AND correct_count <= 12),
      questions_answered INTEGER NOT NULL CHECK (questions_answered >= 0 AND questions_answered <= 12),
      played_at TIMESTAMP DEFAULT NOW()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_trivia_scores_score ON trivia_scores(score DESC);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_trivia_scores_email ON trivia_scores(email);`;
}

export async function insertTriviaScore(opts: {
  email: string;
  name: string;
  score: number;
  correctCount: number;
  questionsAnswered: number;
}) {
  const { email, name, score, correctCount, questionsAnswered } = opts;
  await sql`
    INSERT INTO trivia_scores (email, name, score, correct_count, questions_answered)
    VALUES (${email}, ${name}, ${score}, ${correctCount}, ${questionsAnswered});
  `;
}

export async function fetchTriviaLeaderboard(limit = 100): Promise<TriviaLeaderRow[]> {
  const { rows } = await sql<TriviaLeaderRow>`
    SELECT
      email,
      (array_agg(name ORDER BY played_at DESC))[1] AS name,
      MAX(score) AS best_score,
      MAX(correct_count) AS best_correct,
      COUNT(*)::int AS plays
    FROM trivia_scores
    GROUP BY email
    ORDER BY best_score DESC, best_correct DESC
    LIMIT ${limit};
  `;
  return rows;
}

export async function fetchTriviaRankFor(email: string): Promise<{ rank: number; bestScore: number; plays: number } | null> {
  const { rows } = await sql<{ rank: number; best_score: number; plays: number }>`
    WITH per_user AS (
      SELECT email, MAX(score) AS best_score, COUNT(*)::int AS plays
      FROM trivia_scores
      GROUP BY email
    ),
    ranked AS (
      SELECT email, best_score, plays,
             RANK() OVER (ORDER BY best_score DESC) AS rank
      FROM per_user
    )
    SELECT rank::int AS rank, best_score, plays FROM ranked WHERE email = ${email};
  `;
  if (rows.length === 0) return null;
  return { rank: rows[0].rank, bestScore: rows[0].best_score, plays: rows[0].plays };
}
