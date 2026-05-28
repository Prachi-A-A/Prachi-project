import { fetchLeaderboard, fetchRankFor, type LeaderRow } from "@/lib/db";
import { auth } from "@/lib/auth";

export default async function Leaderboard() {
  let rows: LeaderRow[] = [];
  let myRank: number | null = null;
  let myScore: number | null = null;
  let myEmail: string | null = null;
  try {
    rows = await fetchLeaderboard(100);
    const session = await auth();
    if (session?.user?.email) {
      myEmail = session.user.email;
      const me = await fetchRankFor(session.user.email);
      if (me) {
        myRank = me.rank;
        myScore = me.bestScore;
      }
    }
  } catch (e) {
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
        <span className="count">{rows.length} player{rows.length === 1 ? "" : "s"}</span>
      </div>
      {rows.length === 0 ? (
        <div className="leaderboard-empty">
          No scores yet. Be the first to play.
        </div>
      ) : (
        <div className="leaderboard-list">
          {rows.map((row, i) => {
            const isMe = myEmail === row.email;
            const rank = i + 1;
            return (
              <div className={`leader-row ${isMe ? "me" : ""}`} key={row.email}>
                <div className="leader-rank">#{rank}</div>
                <div>
                  <div className="leader-name">{row.name}{isMe ? " (you)" : ""}</div>
                  <span className="leader-meta">
                    {row.best_solved}/12 solved · {row.plays} play{row.plays === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="leader-score">{row.best_score}</div>
              </div>
            );
          })}
        </div>
      )}
      {myRank && myEmail && !rows.slice(0, 100).some((r) => r.email === myEmail) && (
        <div style={{ padding: "16px 24px", borderTop: "1px solid var(--neutral-200)", background: "rgba(255, 98, 23, 0.04)" }}>
          <div style={{ fontSize: 11, color: "var(--neutral-500)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>YOUR BEST</div>
          <div style={{ fontWeight: 700, color: "var(--navy)" }}>
            #{myRank} · {myScore} pts
          </div>
        </div>
      )}
    </aside>
  );
}
