// One-time DB setup. Run after Vercel Postgres is provisioned.
// Usage: vercel env pull .env.local && node scripts/init-db.mjs

import { sql } from "@vercel/postgres";

async function main() {
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
  console.log("✓ schema ready");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
