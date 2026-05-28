"use client";

import { useEffect, useState } from "react";

type LeaderRow = {
  email: string;
  name: string;
  best_score: number;
  best_correct: number;
  plays: number;
};

type Me = { rank: number; bestScore: number; plays: number } | null;

type Props = {
  myEmail: string | null;
  pollMs?: number;
};

export default function TriviaLeaderboard({ myEmail, pollMs = 5000 }: Props) {
  const [rows, setRows] = useState<LeaderRow[]>([]);
  const [me, setMe] = useState<Me>(null);
  const [loaded, setLoaded] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/trivia-scores", { cache: "no-store" });
        if (!res.ok) throw new Error("fetch_failed");
        const data = await res.json();
        if (cancelled) return;
        setRows(data.top ?? []);
        setMe(data.me ?? null);
        setErr(null);
      } catch (e) {
        if (!cancelled) setErr(String((e as Error).message ?? e));
      } finally {
        if (!cancelled) setLoaded(true);
      }
    }
    load();
    const t = setInterval(load, pollMs);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [pollMs]);

  if (err && !loaded) {
    return (
      <aside className="leaderboard">
        <div className="leaderboard-header">
          <h2>Leaderboard</h2>
        </div>
        <div className="leaderboard-empty">
          Database not initialized yet — first score will set it up.
        </div>
      </aside>
    );
  }

  return (
    <aside className="leaderboard">
      <div className="leaderboard-header">
        <h2>Leaderboard</h2>
        <span className="count">
          {rows.length} player{rows.length === 1 ? "" : "s"}
        </span>
      </div>
      {rows.length === 0 ? (
        <div className="leaderboard-empty">No scores yet. Be the first to play.</div>
      ) : (
        <div className="leaderboard-list">
          {rows.map((row, i) => {
            const isMe = myEmail === row.email;
            const rank = i + 1;
            return (
              <div className={`leader-row ${isMe ? "me" : ""}`} key={row.email}>
                <div className="leader-rank">#{rank}</div>
                <div>
                  <div className="leader-name">
                    {row.name}
                    {isMe ? " (you)" : ""}
                  </div>
                  <span className="leader-meta">
                    {row.best_correct}/12 caught · {row.plays} play
                    {row.plays === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="leader-score">{row.best_score}</div>
              </div>
            );
          })}
        </div>
      )}
      {me &&
        myEmail &&
        !rows.slice(0, 100).some((r) => r.email === myEmail) && (
          <div
            style={{
              padding: "16px 24px",
              borderTop: "1px solid var(--neutral-200)",
              background: "rgba(255, 98, 23, 0.04)",
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: "var(--neutral-500)",
                textTransform: "uppercase",
                letterSpacing: 1,
                marginBottom: 4,
              }}
            >
              YOUR BEST
            </div>
            <div style={{ fontWeight: 700, color: "var(--navy)" }}>
              #{me.rank} · {me.bestScore} pts
            </div>
          </div>
        )}
    </aside>
  );
}
